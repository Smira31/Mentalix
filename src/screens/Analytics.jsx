import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { pluralize } from '../lib/pluralize'
import { useTabRefresh, useTabReset } from '../lib/tabRefresh'
import {
  ANALYTICS_CARDS,
  readCardPreferences,
  writeCardPreferences,
} from './progress/analyticsCardPreferences'
import { sanitizeTrendsData } from '../lib/trendsDataSanitizer'
import { loadIndependentSources, SOURCE_STATES } from '../lib/pathDataLoader'
import { api } from '../lib/api'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import '../components/ui-lab/ProgressRedesignExperiment.css'
import './Analytics.css'
import ProgressHistory from './progress/ProgressHistory'
import ScreenBack from '../components/ScreenBack'
import DemoTelegramHeader from '../components/DemoTelegramHeader'
import './progress/ProgressScreen.css'
import './progress/ProgressAnalytics.css'
import {
  ANALYTICS_GRANULARITIES,
  getGranularity,
  getPeriodWindow,
  isoDate,
  sliceCheckinsByPeriod,
  formatPeriodRange,
  periodName,
} from './progress/progressAnalyticsPeriods'
import { ProgressGlassMenu, ProgressGlassMenuItem } from '../components/ProgressGlassMenu'
import MilestoneProgress from './progress/MilestoneProgress'
import { countActiveDays } from './progress/weeklySummary'
import { Eye, SlidersHorizontal } from 'lucide-react'

const CALENDAR_WEEKDAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В']

/** Минимальное число чек-инов для выводов (используется insightDigest, surpriseInsight). */
export const MIN_CHECKINS = 5

/* ── Склонение существительных (обёртка над pluralize) ── */
function formatDays(n) {
  return `${n} ${pluralize(n, ['день', 'дня', 'дней'])}`
}

/* ── Выводы (исправление склонения A5) ── */

const MIN_GROUP = 3

function average(values) {
  if (!values.length) return null
  return values.reduce((acc, value) => acc + value, 0) / values.length
}

function pick(list, field) {
  return list.map(item => item?.[field]).filter(value => typeof value === 'number')
}

function compareGroups({ withGroup, withoutGroup, field, threshold, build }) {
  const withValues = pick(withGroup, field)
  const withoutValues = pick(withoutGroup, field)
  if (withValues.length < MIN_GROUP || withoutValues.length < MIN_GROUP) return null

  const a = average(withValues)
  const b = average(withoutValues)
  if (a === null || b === null) return null

  const delta = a - b
  if (Math.abs(delta) < threshold) return null

  return {
    text: build(delta, a, b),
    weight: Math.abs(delta),
    direction: delta > 0 ? 'up' : 'down',
  }
}

const WEEKDAY_FULL = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среду',
  'четверг',
  'пятницу',
  'субботу',
]

export function deriveConclusions(checkins, data, streak = null) {
  const list = Array.isArray(checkins) ? checkins : []
  const found = []

  const closed = list.filter(c => c.review_completed_at)
  const notClosed = list.filter(c => !c.review_completed_at)

  const anxiety = compareGroups({
    withGroup: notClosed,
    withoutGroup: closed,
    field: 'anxiety',
    threshold: 0.6,
    build: delta =>
      delta > 0
        ? 'В этой выборке тревога чаще отмечалась в дни без завершённого вечернего разбора.'
        : 'В этой выборке тревога чаще отмечалась в дни с завершённым вечерним разбором — возможно, это были более тяжёлые дни.',
  })
  if (anxiety) found.push(anxiety)

  const mood = compareGroups({
    withGroup: closed,
    withoutGroup: notClosed,
    field: 'mood',
    threshold: 0.5,
    build: delta =>
      delta > 0
        ? 'В этой выборке настроение было выше в дни с завершённым вечерним разбором.'
        : 'В этой выборке настроение было ниже в дни с завершённым вечерним разбором — такие дни могли быть сложнее.',
  })
  if (mood) found.push(mood)

  const energetic = list.filter(c => c.energy >= 4)
  const tired = list.filter(c => c.energy <= 2)
  const focus = compareGroups({
    withGroup: energetic,
    withoutGroup: tired,
    field: 'focus',
    threshold: 0.7,
    build: delta =>
      delta > 0
        ? 'В этой выборке более высокая энергия чаще совпадала с более высокой собранностью.'
        : 'В этой выборке энергия и собранность заметно не различались между группами.',
  })
  if (focus) found.push(focus)

  // 5. Срывы аскез и день недели
  const activity = data?.daily_activity || []
  const breakDays = activity.filter(d => d.breaks > 0)
  if (breakDays.length >= 3) {
    const byWeekday = {}
    for (const day of breakDays) {
      const index = new Date(day.date + 'T00:00:00').getDay()
      byWeekday[index] = (byWeekday[index] || 0) + 1
    }
    const [topIndex, topCount] = Object.entries(byWeekday).sort((a, b) => b[1] - a[1])[0]
    if (topCount / breakDays.length >= 0.5) {
      found.push({
        text: `Больше половины срывов приходится на ${WEEKDAY_FULL[topIndex]}.`,
        weight: 0.9,
        direction: 'down',
      })
    }
  }

  // Серия приходит только с сервера: история чек-инов не отражает все активности.
  if (streak >= 3) {
    found.push({
      text: `${streak} ${pluralize(streak, ['день', 'дня', 'дней'])} в серии — она держится прямо сейчас.`,
      weight: 0.8,
      direction: 'up',
    })
  }

  found.sort((a, b) => b.weight - a.weight)
  return found
}

/* ── Элементы §5.5 ── */

function SectionLabel({ children }) {
  return (
    <h3 className="mx-progress-section-label font-label" data-testid="progress-section-label">
      {children}
    </h3>
  )
}

const CardActions = createContext(null)

function CardShell({ title, subtitle, children, testId }) {
  const actions = useContext(CardActions)
  const menuOpen = actions?.openId === actions?.id
  return (
    <article className="mx-progress-card" data-testid={testId}>
      <div className="mx-progress-card__head">
        <h4 className="mx-progress-card__title">{title}</h4>
        {subtitle && <p className="mx-progress-card__subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <>
          <button
            type="button"
            className="mx-progress-card__menu"
            aria-label={`Меню графика: ${title}`}
            aria-expanded={menuOpen}
            onClick={() => actions.setOpenId(menuOpen ? null : actions.id)}
          >
            …
          </button>
          {menuOpen && (
            <ProgressGlassMenu
              role="menu"
              aria-label={`Действия: ${title}`}
              style={{ position: 'absolute', top: '44px', right: '12px' }}
            >
              <ProgressGlassMenuItem
                icon={Eye}
                label="Скрыть этот график"
                onClick={() => actions.hide(actions.id)}
              />
            </ProgressGlassMenu>
          )}
        </>
      )}
      {children}
    </article>
  )
}

function CardEmpty({ hint }) {
  return (
    <div className="mx-progress-card__empty">
      <div className="mx-progress-card__empty-ring" aria-hidden="true" />
      <span className="mx-progress-card__empty-title">Пока нет данных</span>
      {hint && <span className="mx-progress-card__empty-hint">{hint}</span>}
    </div>
  )
}

const MOOD_SCALE_LABELS = ['Тяжко', 'Так себе', 'Нормально', 'Хорошо', 'Отлично']

function MoodScaleCard({ user, onSaved }) {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handlePick(level) {
    if (saving) return
    setSelected(level)
    setSaving(true)
    setSaved(false)
    try {
      await api.moodPractices.create({ mood: level })
      setSaved(true)
      platform.haptic('light')
      if (typeof onSaved === 'function') onSaved()
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Ошибка сети — не блокируем UI, пользователь видит выбор
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="mx-progress-mood-card"
      aria-labelledby="progress-mood-card-title"
      data-testid="progress-mood-card"
    >
      <h2 id="progress-mood-card-title" className="mx-progress-mood-card__title">
        Как ты сейчас?
      </h2>
      <p className="mx-progress-mood-card__hint">
        Отметь настроение — точка появится в календаре и истории
      </p>
      <div className="mx-progress-mood-card__scale" role="radiogroup" aria-label="Как ты сейчас?">
        {MOOD_SCALE_LABELS.map((label, level) => {
          const value = level + 1
          const isSelected = selected === value
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${value}: ${label}`}
              data-testid={`progress-mood-option-${value}`}
              className={`mx-progress-mood-card__option${isSelected ? ' is-selected' : ''}`}
              onClick={() => handlePick(value)}
              disabled={saving}
            >
              <span className="mx-progress-mood-card__circle">
                <span className="mx-progress-mood-card__inner" />
              </span>
              <span className="mx-progress-mood-card__label">{label}</span>
            </button>
          )
        })}
      </div>
      {saved && (
        <p className="mx-progress-mood-card__saved" role="status">
          Отметка сохранена
        </p>
      )}
    </section>
  )
}

function moodColor(level) {
  if (!level) return 'rgb(var(--c-card3, 46 46 46))'
  const palette = ['#6A6A6A', '#8A8A8A', '#B0B0B0', '#D0D0D0', '#E6E6E6']
  return palette[Math.min(Math.max(level, 1), 5) - 1]
}

/* ── Календарь настроения (неделя) / Распределение (месяц/год) ── */

function MoodCalendarCard({ periodCheckins, granularity, window, onOpenFull }) {
  const moodByDate = new Map(periodCheckins.map(item => [item.date, item.mood]))

  if (granularity === 'week') {
    const cells = CALENDAR_WEEKDAYS.map((wd, i) => {
      const day = new Date(window.start)
      day.setDate(window.start.getDate() + i)
      const date = isoDate(day)
      const mood = moodByDate.get(date)
      return { wd, date, mood, day: day.getDate() }
    })
    return (
      <CardShell
        title="Календарь настроения"
        subtitle="Дни с настроением"
        testId="progress-mood-calendar"
      >
        <div className="mx-progress-mood-calendar">
          <div className="mx-progress-mood-calendar__week">
            {cells.map(c => (
              <div className="mx-progress-mood-calendar__cell" key={c.date}>
                <span
                  className="mx-progress-mood-calendar__dot"
                  style={c.mood ? { background: moodColor(c.mood) } : undefined}
                />
                <span className="mx-progress-mood-calendar__wd">{c.wd}</span>
              </div>
            ))}
          </div>
          <div className="mx-progress-mood-calendar__line" aria-hidden="true" />
          <button type="button" className="mx-progress-mood-calendar__all" onClick={onOpenFull}>
            Все дни ›
          </button>
        </div>
      </CardShell>
    )
  }

  // month / year — распределение настроения (столбики)
  const counts = [0, 0, 0, 0, 0]
  for (const c of periodCheckins) {
    if (Number.isInteger(c.mood) && c.mood >= 1 && c.mood <= 5) counts[c.mood - 1]++
  }
  const max = Math.max(1, ...counts)
  const total = counts.reduce((s, n) => s + n, 0)

  return (
    <CardShell
      title="Распределение настроения"
      subtitle="За период"
      testId="progress-mood-calendar"
    >
      {total > 0 ? (
        <div className="mx-progress-mood-distribution">
          {counts.map((count, i) => (
            <div className="mx-progress-mood-distribution__bar" key={i}>
              <div
                className="mx-progress-mood-distribution__fill"
                style={{ height: `${(count / max) * 100}%`, background: moodColor(i + 1) }}
              />
              <span className="mx-progress-mood-distribution__label">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <CardEmpty hint="Отметь, как ты, — здесь появятся столбики" />
      )}
    </CardShell>
  )
}

/* ── Главные эмоции (кольцо, серверный расчёт) ── */

function EmotionsRing({ influences }) {
  const topEmotions = influences?.top_emotions || []
  const enoughData = influences?.enough_data !== false
  const daysWithData = influences?.days_with_data || 0
  const palette = ['#EDBD60', '#6FB7E0', '#B0B0B0', '#6A6A6A', '#8A8A8A']

  if (!enoughData || topEmotions.length === 0) {
    const remaining = Math.max(1, 3 - daysWithData)
    return (
      <CardShell title="Главные эмоции" subtitle="За период" testId="progress-emotions">
        <div className="mx-progress-practices__empty">
          <div className="mx-progress-practices__empty-ring" aria-hidden="true" />
          <div className="mx-progress-practices__empty-text">
            <span className="mx-progress-practices__empty-dot" aria-hidden="true" />
            <span className="mx-progress-practices__empty-title">Пока нет данных</span>
            <span className="mx-progress-practices__empty-hint">
              Отметь, как ты, ещё {formatDays(remaining)} — здесь появятся эмоции
            </span>
          </div>
        </div>
      </CardShell>
    )
  }

  const total = topEmotions.reduce((s, e) => s + e.count, 0)
  const emotions = topEmotions.slice(0, 5)

  const segments = emotions.reduce(
    (acc, item) => {
      const dash = (item.count / total) * 100
      const seg = { key: item.emotion, dash, offset: -acc.offset }
      return { offset: acc.offset + dash, list: [...acc.list, seg] }
    },
    { offset: 0, list: [] }
  ).list

  return (
    <CardShell title="Главные эмоции" subtitle="За период" testId="progress-emotions">
      <div className="mx-progress-emotions">
        <div className="mx-progress-emotions__ring">
          <svg viewBox="0 0 36 36" aria-label={`${total} отметок эмоций`}>
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="rgb(var(--c-card3, 46 46 46))"
              strokeWidth="3"
            />
            {segments.map((seg, i) => (
              <circle
                key={seg.key}
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={palette[i % palette.length]}
                strokeWidth="3"
                strokeDasharray={`${seg.dash} ${100 - seg.dash}`}
                strokeDashoffset={seg.offset}
              />
            ))}
          </svg>
          <span className="mx-progress-emotions__ring-value">{total}</span>
        </div>
        <div className="mx-progress-emotions__legend">
          {emotions.map((item, i) => (
            <div className="mx-progress-emotions__row" key={item.emotion}>
              <span
                className="mx-progress-emotions__dot"
                style={{ background: palette[i % palette.length] }}
              />
              <span className="mx-progress-emotions__name">{item.emotion}</span>
              <span className="mx-progress-emotions__count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

/* ── Что поднимает / Что опускает (серверный расчёт) ── */

function InfluencesCard({ direction, influences }) {
  const title = direction === 'up' ? 'Что тебя поднимает' : 'Что тебя опускает'
  const items = direction === 'up' ? influences?.lifts || [] : influences?.drags || []
  const enoughData = influences?.enough_data !== false
  const daysWithData = influences?.days_with_data || 0

  if (!enoughData || items.length === 0) {
    const remaining = Math.max(1, 3 - daysWithData)
    return (
      <CardShell
        title={title}
        subtitle="Из твоих отметок"
        testId={`progress-conclusions-${direction}`}
      >
        <div className="mx-progress-influences__empty">
          <span className="mx-progress-influences__empty-title">Пока нет данных</span>
          <span className="mx-progress-influences__empty-hint">
            Отметь, как ты, ещё {formatDays(remaining)} — здесь появятся выводы
          </span>
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell
      title={title}
      subtitle="Из твоих отметок"
      testId={`progress-conclusions-${direction}`}
    >
      <div className="mx-progress-conclusions">
        {items.slice(0, 3).map((item, i) => (
          <div key={i}>
            <p className="mx-progress-conclusion__text mx-type-insight">{item.factor}</p>
            <p className="mx-progress-conclusion__hint">
              в {formatDays(item.days)} настроение {direction === 'up' ? 'выше' : 'ниже'} на{' '}
              {Math.abs(item.delta).toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

/* ── Твои практики (Упражнения) ── */

function PracticesCard({ analyticsData, isCurrentPeriod }) {
  const rituals = analyticsData?.rituals || []
  const ascezas = analyticsData?.ascezas || []
  const items = [
    ...rituals.map(r => ({ name: r.name, kind: 'ritual', streak: r.completion_rate })),
    ...ascezas.map(a => ({ name: a.name, kind: 'asceza', streak: a.held_days })),
  ].slice(0, 4)

  if (!isCurrentPeriod || items.length === 0) {
    return (
      <CardShell title="Твои практики" subtitle="За текущий период" testId="progress-practices">
        <div className="mx-progress-practices__empty">
          <div className="mx-progress-practices__empty-ring" aria-hidden="true" />
          <div className="mx-progress-practices__empty-text">
            <span className="mx-progress-practices__empty-dot" aria-hidden="true" />
            <span className="mx-progress-practices__empty-title">Пока нет данных</span>
            <span className="mx-progress-practices__empty-hint">
              Отмечай практики и чек-ины — здесь появится кольцо
            </span>
          </div>
        </div>
      </CardShell>
    )
  }

  const total = items.length
  const palette = ['#EDBD60', '#6FB7E0', '#B0B0B0', '#6A6A6A']
  const dash = 100 / total
  const segments = items.map((item, i) => ({
    key: item.name,
    color: palette[i % palette.length],
    offset: -i * dash,
  }))

  return (
    <CardShell title="Твои практики" subtitle="За текущий период" testId="progress-practices">
      <div className="mx-progress-practices">
        <div className="mx-progress-practices__ring">
          <svg viewBox="0 0 36 36" aria-label="Частые практики">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="rgb(var(--c-card3, 46 46 46))"
              strokeWidth="3"
            />
            {segments.map(seg => (
              <circle
                key={seg.key}
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={seg.color}
                strokeWidth="3"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={seg.offset}
              />
            ))}
          </svg>
          <span className="mx-progress-practices__ring-value">{total}</span>
        </div>
        <div className="mx-progress-practices__legend">
          {items.map((item, i) => (
            <div className="mx-progress-practices__row" key={item.name}>
              <span
                className="mx-progress-practices__dot"
                style={{ background: palette[i % palette.length] }}
              />
              <span className="mx-progress-practices__name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

/* ── Полный календарь настроения ── */

function FullCalendar({ poolCheckins, onBack }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - 89)
  const moodByDate = new Map(poolCheckins.map(item => [item.date, item.mood]))

  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - ((start.getDay() + 6) % 7))

  const weeks = []
  const cursor = new Date(gridStart)
  let lastMonth = -1
  while (cursor <= today) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor)
      d.setDate(cursor.getDate() + i)
      week.push(d)
    }
    weeks.push(week)
    cursor.setDate(cursor.getDate() + 7)
  }

  return (
    <div className="mx-progress-full-calendar" data-testid="progress-full-calendar">
      <ScreenBack onBack={onBack} testId="progress-full-calendar-back" />
      <h2 className="mx-progress-full-calendar__title">календарь настроения.</h2>
      <p className="mx-progress-full-calendar__subtext">Одна точка — один день</p>
      <div className="mx-progress-full-calendar__grid">
        {weeks.map((week, wi) => {
          const firstDay = week[0]
          const m = firstDay.getMonth()
          const showMonth = m !== lastMonth
          lastMonth = m
          return (
            <div key={wi} style={{ display: 'contents' }}>
              {showMonth && (
                <div className="mx-progress-full-calendar__month">
                  {new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(firstDay)}
                </div>
              )}
              {week.map(d => {
                const date = isoDate(d)
                const mood = moodByDate.get(date)
                const future = d > today
                return (
                  <div className="mx-progress-full-calendar__cell" key={date}>
                    {!future && (
                      <span
                        className="mx-progress-full-calendar__dot"
                        style={mood ? { background: moodColor(mood) } : undefined}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Полноэкранный слой «Настроить» (A7: заменяет шторку «Порядок графиков») ── */

function CustomizeLayer({ preferences, onToggle, onClose }) {
  const sections = [...new Set(ANALYTICS_CARDS.map(c => c.section))]

  useBackButton(() => {
    platform.haptic('light')
    onClose()
  })

  return (
    <div className="mx-progress-customize" data-testid="progress-customize">
      <h2 className="mx-progress-customize__title">настроить.</h2>
      <p className="mx-progress-customize__subtext">Что показывать в аналитике</p>
      {sections.map(section => (
        <div className="mx-progress-customize__section" key={section}>
          <SectionLabel>{section}</SectionLabel>
          <div className="mx-progress-customize__group">
            {ANALYTICS_CARDS.filter(c => c.section === section).map(card => {
              const visible = !preferences.hidden.includes(card.id)
              return (
                <label className="mx-progress-customize__row" key={card.id}>
                  <span>{card.title}</span>
                  <span className="mx-progress-customize__toggle">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => onToggle(card.id)}
                      aria-label={`Показывать: ${card.title}`}
                    />
                    <span aria-hidden="true" />
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/*
 * Состояние сворачивания нижней навигации живёт внутри BottomNavigation и
 * публикуется классом mx-nav-collapsed на <html> (без setState в App).
 * Раньше здесь был MutationObserver + setState на каждое сворачивание —
 * теперь CSS читает класс напрямую (ProgressAnalytics.css), без ре-рендеров.
 */

/* ── Нижняя пилюля периода ── */

function BottomPeriodPill({ granularity, offset, onPrev, onNext, canNext }) {
  const window = getPeriodWindow(granularity, offset)
  return (
    <div className="mx-progress-bottom-pill-wrapper" data-testid="progress-bottom-pill">
      <div className="mx-progress-bottom-pill">
        <button
          type="button"
          className="mx-progress-bottom-pill__arrow"
          aria-label="Предыдущий период"
          onClick={onPrev}
        >
          ‹
        </button>
        <span className="mx-progress-bottom-pill__label">
          <span className="mx-progress-bottom-pill__name">{periodName(granularity, offset)}</span>
          <span className="mx-progress-bottom-pill__range">
            {formatPeriodRange(window, granularity)}
          </span>
        </span>
        <button
          type="button"
          className="mx-progress-bottom-pill__arrow"
          aria-label="Следующий период"
          onClick={onNext}
          disabled={!canNext}
        >
          ›
        </button>
      </div>
    </div>
  )
}

const PROGRESS_SEGMENT_KEY = 'mx-progress-segment'

export default function Analytics({
  active = true,
  user,
  onGoCheckin,
  onRedo,
  onRedoReview,
  onStartMood,
  onOpenNotifications,
  historyTrigger = 0,
}) {
  const rootRef = useRef(null)
  const moodCardRef = useRef(null)
  const scrollPositions = useRef({ analytics: 0, history: 0 })
  const skipScrollRestore = useRef(true)

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(PROGRESS_SEGMENT_KEY)
      return saved === 'history' ? 'history' : 'analytics'
    } catch {
      return 'analytics'
    }
  })

  const [granularity, setGranularity] = useState('week')
  const [offset, setOffset] = useState(0)
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const [view, setView] = useState('analytics') // 'analytics' | 'calendar' | 'customize'
  const [cardPreferences, setCardPreferences] = useState(readCardPreferences)
  const [openCardMenu, setOpenCardMenu] = useState(null)

  useEffect(() => {
    writeCardPreferences(cardPreferences)
  }, [cardPreferences])

  function toggleCard(id) {
    setCardPreferences(previous => ({
      ...previous,
      hidden: previous.hidden.includes(id)
        ? previous.hidden.filter(item => item !== id)
        : [...previous.hidden, id],
    }))
    setOpenCardMenu(null)
  }

  const [poolCheckins, setPoolCheckins] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [influencesData, setInfluencesData] = useState(null)
  const [sourceResult, setSourceResult] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(Boolean(user))
  const sourceResultRef = useRef(null)
  const retryFailedSourcesRef = useRef(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Тихий фоновый рефетч при возврате на вкладку или из фона —
  // перезапускает эффекты загрузки без показа loading.
  useTabRefresh('trends', () => setReloadKey(k => k + 1))

  // Повторный тап по активной вкладке «Прогресс» — сброс на главный экран
  useTabReset('trends', () => {
    setView('analytics')
    setPeriodMenuOpen(false)
    setOpenCardMenu(null)
  })

  const gran = getGranularity(granularity)

  useEffect(() => {
    try {
      sessionStorage.setItem(PROGRESS_SEGMENT_KEY, activeTab)
    } catch {
      /* sessionStorage может быть недоступен */
    }
  }, [activeTab])

  useEffect(() => {
    if (historyTrigger > 0 && activeTab !== 'history') {
      saveScroll()
      setActiveTab('history')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyTrigger])

  useEffect(() => {
    if (skipScrollRestore.current) {
      skipScrollRestore.current = false
      return
    }
    const scrollRoot = rootRef.current?.closest('.mx-app-scroll-root')
    if (scrollRoot) {
      scrollRoot.scrollTop = scrollPositions.current[activeTab] || 0
    }
  }, [activeTab])

  function saveScroll() {
    const scrollRoot = rootRef.current?.closest('.mx-app-scroll-root')
    if (scrollRoot) {
      scrollPositions.current[activeTab] = scrollRoot.scrollTop
    }
  }

  function handleSegmentClick(next) {
    if (next === activeTab) return
    saveScroll()
    setActiveTab(next)
  }

  // Data: pool checkins (90d) + analytics aggregate
  useEffect(() => {
    if (!user) return

    let active = true
    const previous = retryFailedSourcesRef.current ? sourceResultRef.current : null
    retryFailedSourcesRef.current = false
    loadIndependentSources(
      {
        analytics: () => api.analytics.get(user.id, gran.days),
        checkins: () => api.checkin.history(user.id, 90),
      },
      previous ? { previous, only: previous.failed } : undefined
    )
      .then(result => {
        if (!active) return
        sourceResultRef.current = result
        setSourceResult(result)
        if (result.data.analytics) {
          setAnalyticsData(sanitizeTrendsData({ analytics: result.data.analytics }).analytics)
        }
        if (Array.isArray(result.data.checkins)) {
          setPoolCheckins(sanitizeTrendsData({ checkins: result.data.checkins }).checkins)
        }
      })
      .catch(error => {
        console.error(error)
      })
      .finally(() => {
        if (active) setSourceLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, granularity, reloadKey])

  // Server-side influences (emotions, lifts, drags) — mentalix-bot #99.
  useEffect(() => {
    if (!user) return
    let active = true
    api.analytics
      .influences(user.id, granularity, offset)
      .then(data => {
        if (active) setInfluencesData(data)
      })
      .catch(() => {
        if (active) setInfluencesData(null)
      })
    return () => {
      active = false
    }
  }, [user, granularity, offset, reloadKey])

  const window = useMemo(() => getPeriodWindow(granularity, offset), [granularity, offset])
  const periodCheckins = useMemo(
    () => sliceCheckinsByPeriod(poolCheckins, window),
    [poolCheckins, window]
  )

  const safeData = analyticsData || {
    period_days: gran.days,
    rituals: [],
    ascezas: [],
    insights: [],
    observations: [],
    daily_activity: [],
  }
  const analyticsState = sourceResult?.states?.analytics
  const checkinsState = sourceResult?.states?.checkins
  const analyticsError =
    !sourceLoading && analyticsState && analyticsState !== SOURCE_STATES.success
  const analyticsAuth = analyticsState === SOURCE_STATES.auth
  const checkinsFailed = !sourceLoading && checkinsState && checkinsState !== SOURCE_STATES.success
  const isCurrentPeriod = offset === 0

  // Число РАЗНЫХ дней с активностью за всё время — для вех дней.
  // Не календарные дни с первой записи: иначе один заход месяц назад давал бы «30 дней».
  const totalDays = useMemo(() => countActiveDays(poolCheckins), [poolCheckins])

  function handlePrev() {
    setOffset(o => o + 1)
    setView('analytics')
  }
  function handleNext() {
    setOffset(o => Math.max(0, o - 1))
  }
  function selectGranularity(id) {
    if (id !== granularity) setSourceLoading(true)
    setGranularity(id)
    setOffset(0)
    setPeriodMenuOpen(false)
  }

  function retryFailedSources() {
    retryFailedSourcesRef.current = true
    setSourceLoading(true)
    setReloadKey(value => value + 1)
  }

  function handleStartMood(level) {
    try {
      sessionStorage.setItem('mx-mood-practice-initial', String(level))
    } catch {
      /* */
    }
    if (typeof onStartMood === 'function') onStartMood(level)
    else if (typeof onGoCheckin === 'function') onGoCheckin()
  }

  const cards = {
    calendar: (
      <MoodCalendarCard
        periodCheckins={periodCheckins}
        granularity={granularity}
        window={window}
        onOpenFull={() => setView('calendar')}
      />
    ),
    emotions: <EmotionsRing influences={influencesData} />,
    up: <InfluencesCard direction="up" influences={influencesData} />,
    down: <InfluencesCard direction="down" influences={influencesData} />,
    practices: <PracticesCard analyticsData={safeData} isCurrentPeriod={isCurrentPeriod} />,
  }

  return (
    <div
      ref={rootRef}
      className="mx-progress-redesign mx-progress-redesign--live mx-type-page w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in"
    >
      <div className="mx-progress-segment-bar">
        <DemoTelegramHeader active={active}>
          <div className="mx-progress-segment-row">
            <div
              className="mx-progress-segment"
              role="tablist"
              aria-label="Прогресс: Аналитика и История"
            >
              <button
                type="button"
                role="tab"
                data-testid="progress-tab-analytics"
                aria-selected={activeTab === 'analytics'}
                onClick={() => handleSegmentClick('analytics')}
              >
                Аналитика
              </button>
              <button
                type="button"
                role="tab"
                data-testid="progress-tab-history"
                aria-selected={activeTab === 'history'}
                onClick={() => handleSegmentClick('history')}
              >
                История
              </button>
            </div>
          </div>
        </DemoTelegramHeader>
        <div className="mx-progress-actions-row" data-testid="progress-actions-row">
          {activeTab === 'analytics' && (
            <button
              type="button"
              className="mx-progress-period-trigger"
              data-testid="progress-period-trigger"
              aria-expanded={periodMenuOpen}
              aria-controls="progress-period-menu"
              onClick={() => setPeriodMenuOpen(v => !v)}
            >
              {gran.label}
              <span className="mx-progress-period-trigger__chevron" aria-hidden="true">
                ⌄
              </span>
            </button>
          )}
          {activeTab === 'analytics' && periodMenuOpen && (
            <ProgressGlassMenu
              id="progress-period-menu"
              role="menu"
              aria-label="Период аналитики"
              style={{ position: 'absolute', right: 16, top: '100%' }}
            >
              {ANALYTICS_GRANULARITIES.map(g => (
                <ProgressGlassMenuItem
                  key={g.id}
                  label={g.label}
                  role="menuitemradio"
                  selected={granularity === g.id}
                  onClick={() => selectGranularity(g.id)}
                />
              ))}
            </ProgressGlassMenu>
          )}
        </div>
      </div>

      {activeTab === 'analytics' && view === 'calendar' && (
        <FullCalendar poolCheckins={poolCheckins} onBack={() => setView('analytics')} />
      )}

      {activeTab === 'analytics' && view === 'customize' && (
        <CustomizeLayer
          preferences={cardPreferences}
          onToggle={toggleCard}
          onClose={() => setView('analytics')}
        />
      )}

      {activeTab === 'analytics' && view === 'analytics' && (
        <>
          <header className="mx-progress-analytics">
            <h1 className="mx-progress-analytics__title font-display">аналитика.</h1>
            <p className="mx-progress-analytics__subtext">
              Здесь видно, как меняется твоё настроение за неделю
            </p>
          </header>

          <div ref={moodCardRef}>
            <MoodScaleCard user={user} onSaved={() => setReloadKey(k => k + 1)} />
          </div>

          {analyticsError && (
            <div role="alert" className="mx-progress-redesign__status-note">
              {analyticsAuth
                ? 'Статистика требует повторной авторизации.'
                : 'Статистика временно недоступна.'}
              <button type="button" onClick={retryFailedSources}>
                Повторить
              </button>
            </div>
          )}
          {checkinsFailed && !analyticsError && (
            <p className="mx-progress-redesign__status-note" role="status">
              История чек-инов временно недоступна; остальные показатели продолжают работать.
              <button type="button" onClick={retryFailedSources}>
                Повторить
              </button>
            </p>
          )}

          {/* Вехи дней показываем всегда — новичку они нужнее всего.
              Прогресс несёт веха, отметку — карточка «Как ты сейчас?» выше. */}
          <MilestoneProgress totalDays={totalDays} />

          {cardPreferences.order.filter(
            id => !cardPreferences.hidden.includes(id) && ANALYTICS_CARDS.some(c => c.id === id)
          ).length === 0 ? (
            <div className="mx-progress-card__empty" data-testid="progress-all-charts-hidden">
              <div className="mx-progress-card__empty-ring" aria-hidden="true" />
              <span className="mx-progress-card__empty-title">Все графики скрыты</span>
              <span className="mx-progress-card__empty-hint">
                Включи графики, чтобы снова видеть аналитику
              </span>
              <button
                type="button"
                className="mx-progress-need-data__remind"
                data-testid="progress-customize-empty-trigger"
                onClick={() => setView('customize')}
              >
                Настроить
              </button>
            </div>
          ) : (
            cardPreferences.order
              .filter(
                id => !cardPreferences.hidden.includes(id) && ANALYTICS_CARDS.some(c => c.id === id)
              )
              .map((id, index, visible) => {
                const card = ANALYTICS_CARDS.find(item => item.id === id)
                const previous = ANALYTICS_CARDS.find(item => item.id === visible[index - 1])
                return (
                  <div key={id}>
                    {card.section !== previous?.section && (
                      <SectionLabel>{card.section}</SectionLabel>
                    )}
                    <CardActions.Provider
                      value={{
                        id,
                        openId: openCardMenu,
                        setOpenId: setOpenCardMenu,
                        hide: toggleCard,
                      }}
                    >
                      {cards[id]}
                    </CardActions.Provider>
                  </div>
                )
              })
          )}

          {/* Пилюля «Настроить» в потоке контента */}
          <button
            type="button"
            className="mx-progress-customize-pill"
            data-testid="progress-customize-pill"
            onClick={() => setView('customize')}
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" /> Настроить
          </button>

          <div className="mx-progress-analytics__bottom-spacer" />
        </>
      )}

      {activeTab === 'analytics' && view === 'analytics' && (
        <BottomPeriodPill
          granularity={granularity}
          offset={offset}
          onPrev={handlePrev}
          onNext={handleNext}
          canNext={offset > 0}
        />
      )}

      {activeTab === 'history' && (
        <ProgressHistory
          user={user}
          onGoCheckin={onGoCheckin}
          onRedo={onRedo}
          onRedoReview={onRedoReview}
          reloadKey={reloadKey}
        />
      )}
    </div>
  )
}
