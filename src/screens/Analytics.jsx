import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { currentCheckinStreak } from '../lib/series'
import { pluralize } from '../lib/pluralize'
import {
  ANALYTICS_CARDS,
  readCardPreferences,
  writeCardPreferences,
} from './progress/analyticsCardPreferences'
import { sanitizeTrendsData } from '../lib/trendsDataSanitizer'
import { loadIndependentSources, SOURCE_STATES } from '../lib/pathDataLoader'
import { api } from '../lib/api'
import '../components/ui-lab/ProgressRedesignExperiment.css'
import './Analytics.css'
import ProgressHistory from './progress/ProgressHistory'
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

const CALENDAR_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const MOOD_LABELS = ['Очень тяжело', 'Тяжело', 'Ровно', 'Хорошо', 'Отлично']

/** Минимальное число дней с записями для показа карточек. */
const MIN_DAYS = 2

/** Минимальное число чек-инов для выводов (используется insightDigest, surpriseInsight). */
export const MIN_CHECKINS = 5

function MoodFace({ level }) {
  const mouths = [
    'M9 21.5C11.2 18.4 20.8 18.4 23 21.5',
    'M9.5 20.5C12 19.1 20 19.1 22.5 20.5',
    'M9.5 20H22.5',
    'M9.5 19.5C12 20.9 20 20.9 22.5 19.5',
    'M9 18.5C11.2 21.6 20.8 21.6 23 18.5',
  ]

  return (
    <svg
      className="mx-progress-redesign__mood-face"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="12.5" />
      <circle cx="11.5" cy="13" r="1" className="mx-progress-redesign__mood-eye" />
      <circle cx="20.5" cy="13" r="1" className="mx-progress-redesign__mood-eye" />
      <path d={mouths[level]} />
    </svg>
  )
}

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
  'воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу',
]

export function deriveConclusions(checkins, data, seriesCheckins = checkins) {
  const list = Array.isArray(checkins) ? checkins : []
  const found = []

  const closed = list.filter(c => c.review_completed_at)
  const notClosed = list.filter(c => !c.review_completed_at)

  const anxiety = compareGroups({
    withGroup: notClosed, withoutGroup: closed, field: 'anxiety', threshold: 0.6,
    build: delta => delta > 0
      ? 'В этой выборке тревога чаще отмечалась в дни без завершённого вечернего разбора.'
      : 'В этой выборке тревога чаще отмечалась в дни с завершённым вечерним разбором — возможно, это были более тяжёлые дни.',
  })
  if (anxiety) found.push(anxiety)

  const mood = compareGroups({
    withGroup: closed, withoutGroup: notClosed, field: 'mood', threshold: 0.5,
    build: delta => delta > 0
      ? 'В этой выборке настроение было выше в дни с завершённым вечерним разбором.'
      : 'В этой выборке настроение было ниже в дни с завершённым вечерним разбором — такие дни могли быть сложнее.',
  })
  if (mood) found.push(mood)

  const energetic = list.filter(c => c.energy >= 4)
  const tired = list.filter(c => c.energy <= 2)
  const focus = compareGroups({
    withGroup: energetic, withoutGroup: tired, field: 'focus', threshold: 0.7,
    build: delta => delta > 0
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
        weight: 0.9, direction: 'down',
      })
    }
  }

  // 6. Серия закрытых дней — склонение исправлено (A5)
  const streak = currentCheckinStreak(seriesCheckins)
  if (streak >= 3) {
    found.push({
      text: `${streak} закрытых ${pluralize(streak, ['день', 'дня', 'дней'])} подряд — серия держится прямо сейчас.`,
      weight: 0.8, direction: 'up',
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
            <button
              type="button"
              className="mx-progress-card__hide"
              onClick={() => actions.hide(actions.id)}
            >
              <span aria-hidden="true">👁</span> Скрыть график
            </button>
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

function MoodCard({ onStartMood }) {
  function handleFace(level) {
    if (typeof onStartMood === 'function') onStartMood(level)
  }

  return (
    <section className="mx-progress-mood-card" aria-labelledby="progress-mood-card-title">
      <h2 id="progress-mood-card-title" className="mx-progress-mood-card__title">
        Как ты сейчас?
      </h2>
      <p className="mx-progress-mood-card__hint">
        Отметь настроение — пройди короткую практику
        <br />
        и добавь точку в прогресс
      </p>
      <div className="mx-progress-mood-card__faces" role="group" aria-label="Выбери настроение">
        {MOOD_LABELS.map((label, level) => (
          <button
            key={label}
            type="button"
            className="mx-progress-mood-card__face"
            data-testid={`progress-mood-face-${level + 1}`}
            aria-label={label}
            onClick={() => handleFace(level + 1)}
          >
            <MoodFace level={level} />
          </button>
        ))}
      </div>
    </section>
  )
}

/** Считает уникальные дни с записями (F2: по реальным дням, не чек-инам). */
function countDaysWithRecords(checkins) {
  const dates = new Set()
  for (const c of checkins) {
    if (c?.date) dates.add(c.date)
  }
  return dates.size
}

function NeedDataPlaque({ daysWithRecords, onRemind }) {
  const remaining = Math.max(0, MIN_DAYS - daysWithRecords)
  if (remaining <= 0) return null

  const done = Math.min(daysWithRecords, MIN_DAYS)
  const cells = Array.from({ length: MIN_DAYS }, (_, i) => i < done)

  return (
    <section className="mx-progress-need-data" aria-labelledby="progress-need-data-title">
      <h2 id="progress-need-data-title" className="mx-progress-need-data__title">
        Нужны записи ещё за {formatDays(remaining)}, чтобы показать выводы
      </h2>
      <div className="mx-progress-need-data__days" aria-hidden="true">
        {cells.map((isDone, i) => (
          <span key={i} className={`mx-progress-need-data__day${isDone ? ' mx-progress-need-data__day--done' : ''}`}>
            {isDone ? '✓' : ''}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="mx-progress-need-data__remind"
        data-testid="progress-need-data-remind"
        onClick={typeof onRemind === 'function' ? onRemind : undefined}
      >
        Напомнить
      </button>
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
      <CardShell title="Календарь настроения" subtitle="Дни с настроением" testId="progress-mood-calendar">
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
    <CardShell title="Распределение настроения" subtitle="За период" testId="progress-mood-calendar">
      {total > 0 ? (
        <div className="mx-progress-mood-distribution">
          {counts.map((count, i) => (
            <div className="mx-progress-mood-distribution__bar" key={i}>
              <div className="mx-progress-mood-distribution__fill" style={{ height: `${(count / max) * 100}%`, background: moodColor(i + 1) }} />
              <span className="mx-progress-mood-distribution__label">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <CardEmpty hint="Отметь настроение в чек-ине — здесь появятся столбики" />
      )}
    </CardShell>
  )
}

/* ── Главные эмоции (кольцо) ── */

function EmotionsRing({ periodCheckins }) {
  const counts = new Map()
  for (const c of periodCheckins) {
    if (c.emotion) counts.set(c.emotion, (counts.get(c.emotion) || 0) + 1)
  }
  const emotions = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  const total = [...counts.values()].reduce((s, n) => s + n, 0)
  const palette = ['#EDBD60', '#6FB7E0', '#B0B0B0', '#6A6A6A']

  if (emotions.length === 0) {
    return (
      <CardShell title="Главные эмоции" subtitle="За период" testId="progress-emotions">
        <CardEmpty hint="Отмечай эмоции в чек-ине — здесь появится кольцо" />
      </CardShell>
    )
  }

  const segments = emotions.reduce(
    (acc, [name, count]) => {
      const dash = (count / total) * 100
      const seg = { key: name, dash, offset: -acc.offset }
      return { offset: acc.offset + dash, list: [...acc.list, seg] }
    },
    { offset: 0, list: [] }
  ).list

  return (
    <CardShell title="Главные эмоции" subtitle="За период" testId="progress-emotions">
      <div className="mx-progress-emotions">
        <div className="mx-progress-emotions__ring">
          <svg viewBox="0 0 36 36" aria-label={`${total} отметок эмоций`}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--c-card3, 46 46 46))" strokeWidth="3" />
            {segments.map((seg, i) => (
              <circle
                key={seg.key}
                cx="18" cy="18" r="15.9" fill="none"
                stroke={palette[i % palette.length]} strokeWidth="3"
                strokeDasharray={`${seg.dash} ${100 - seg.dash}`}
                strokeDashoffset={seg.offset}
              />
            ))}
          </svg>
          <span className="mx-progress-emotions__ring-value">{total}</span>
        </div>
        <div className="mx-progress-emotions__legend">
          {emotions.map(([name, count], i) => (
            <div className="mx-progress-emotions__row" key={name}>
              <span className="mx-progress-emotions__dot" style={{ background: palette[i % palette.length] }} />
              <span className="mx-progress-emotions__name">{name}</span>
              <span className="mx-progress-emotions__count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

/* ── Что поднимает / Что опускает ── */

function ConclusionsCard({ direction, conclusions }) {
  const title = direction === 'up' ? 'Что тебя поднимает' : 'Что тебя опускает'
  const items = conclusions.filter(c => c.direction === direction)

  return (
    <CardShell title={title} subtitle="Из твоих отметок" testId={`progress-conclusions-${direction}`}>
      {items.length > 0 ? (
        <div className="mx-progress-conclusions">
          {items.map((c, i) => (
            <div key={i}>
              <p className="mx-progress-conclusion__text">{c.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <CardEmpty hint="Соберётся из отметок нескольких дней" />
      )}
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
        <CardEmpty hint="Отмечай практики и чек-ины — здесь появится кольцо" />
      </CardShell>
    )
  }

  const total = items.length
  const palette = ['#EDBD60', '#6FB7E0', '#B0B0B0', '#6A6A6A']
  const dash = 100 / total
  const segments = items.map((item, i) => ({
    key: item.name, color: palette[i % palette.length], offset: -i * dash,
  }))

  return (
    <CardShell title="Твои практики" subtitle="За текущий период" testId="progress-practices">
      <div className="mx-progress-practices">
        <div className="mx-progress-practices__ring">
          <svg viewBox="0 0 36 36" aria-label="Частые практики">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--c-card3, 46 46 46))" strokeWidth="3" />
            {segments.map(seg => (
              <circle
                key={seg.key}
                cx="18" cy="18" r="15.9" fill="none"
                stroke={seg.color} strokeWidth="3"
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
              <span className="mx-progress-practices__dot" style={{ background: palette[i % palette.length] }} />
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
      <button
        type="button"
        className="mx-progress-entry__back"
        aria-label="Назад"
        data-testid="progress-full-calendar-back"
        onClick={onBack}
      >
        ‹
      </button>
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

  return (
    <div className="mx-progress-customize" data-testid="progress-customize">
      <button
        type="button"
        className="mx-progress-customize__close"
        aria-label="Закрыть настройки графиков"
        data-testid="progress-customize-close"
        onClick={onClose}
      >
        ✕
      </button>
      <h2 className="mx-progress-customize__title">настроить.</h2>
      <p className="mx-progress-customize__subtext">Что показывать в аналитике</p>
      {sections.map(section => (
        <div className="mx-progress-customize__section" key={section}>
          <h3 className="mx-progress-section-label font-label">{section}</h3>
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
      ))}
    </div>
  )
}

/* ── Нижняя пилюля периода ── */

function BottomPeriodPill({ granularity, offset, onPrev, onNext, canNext, hidden }) {
  const window = getPeriodWindow(granularity, offset)
  return (
    <div
      className={`mx-progress-bottom-pill-wrapper${hidden ? ' mx-progress-bottom-pill-wrapper--hidden' : ''}`}
      data-testid="progress-bottom-pill"
    >
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
          <span className="mx-progress-bottom-pill__range">{formatPeriodRange(window, granularity)}</span>
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
  user,
  onGoCheckin,
  onRedo,
  onRedoReview,
  onStartMood,
  onOpenNotifications,
  historyTrigger = 0,
  navCollapsed = false,
}) {
  const rootRef = useRef(null)
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
  const [sourceResult, setSourceResult] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(Boolean(user))
  const sourceResultRef = useRef(null)
  const retryFailedSourcesRef = useRef(false)
  const [reloadKey, setReloadKey] = useState(0)

  const gran = getGranularity(granularity)

  useEffect(() => {
    try {
      sessionStorage.setItem(PROGRESS_SEGMENT_KEY, activeTab)
    } catch { /* sessionStorage может быть недоступен */ }
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
    loadIndependentSources({
      analytics: () => api.analytics.get(user.id, gran.days),
      checkins: () => api.checkin.history(user.id, 90),
    }, previous ? { previous, only: previous.failed } : undefined)
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
      .catch(error => { console.error(error) })
      .finally(() => { if (active) setSourceLoading(false) })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, granularity, reloadKey])

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
  const analyticsError = !sourceLoading && analyticsState && analyticsState !== SOURCE_STATES.success
  const analyticsAuth = analyticsState === SOURCE_STATES.auth
  const checkinsFailed = !sourceLoading && checkinsState && checkinsState !== SOURCE_STATES.success
  const isCurrentPeriod = offset === 0

  const conclusions = deriveConclusions(periodCheckins, safeData, poolCheckins)
  const daysWithRecords = countDaysWithRecords(periodCheckins)
  const showNeedData = daysWithRecords < MIN_DAYS

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
    try { sessionStorage.setItem('mx-mood-practice-initial', String(level)) } catch { /* */ }
    if (typeof onStartMood === 'function') onStartMood(level)
    else if (typeof onGoCheckin === 'function') onGoCheckin()
  }

  const cards = {
    calendar: <MoodCalendarCard periodCheckins={periodCheckins} granularity={granularity} window={window} onOpenFull={() => setView('calendar')} />,
    emotions: <EmotionsRing periodCheckins={periodCheckins} />,
    up: <ConclusionsCard direction="up" conclusions={conclusions} />,
    down: <ConclusionsCard direction="down" conclusions={conclusions} />,
    practices: <PracticesCard analyticsData={safeData} isCurrentPeriod={isCurrentPeriod} />,
  }

  // Нижний отступ: пилюля (50) + панель (53 + 8 offset) + 16 = 127
  const bottomSpacerHeight = 50 + 53 + 8 + 16

  return (
    <div
      ref={rootRef}
      className="mx-progress-redesign mx-progress-redesign--live mx-type-page w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in"
    >
      <div className="mx-progress-segment-bar">
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
            <span className="mx-progress-period-trigger__chevron" aria-hidden="true">⌄</span>
          </button>
        )}
        {activeTab === 'analytics' && periodMenuOpen && (
          <div id="progress-period-menu" className="mx-progress-period-menu" role="menu" aria-label="Период аналитики">
            {ANALYTICS_GRANULARITIES.map(g => (
              <button
                key={g.id}
                type="button"
                className="mx-progress-period-menu__item"
                role="menuitemradio"
                aria-checked={granularity === g.id}
                onClick={() => selectGranularity(g.id)}
              >
                <span>{g.label}</span>
                {granularity === g.id && <span className="mx-progress-period-menu__check" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        )}
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

          <MoodCard onStartMood={handleStartMood} />

          {analyticsError && (
            <div role="alert" className="mx-progress-redesign__status-note">
              {analyticsAuth ? 'Статистика требует повторной авторизации.' : 'Статистика временно недоступна.'}
              <button type="button" onClick={retryFailedSources}>Повторить</button>
            </div>
          )}
          {checkinsFailed && !analyticsError && (
            <p className="mx-progress-redesign__status-note" role="status">
              История чек-инов временно недоступна; остальные показатели продолжают работать.
              <button type="button" onClick={retryFailedSources}>Повторить</button>
            </p>
          )}

          {showNeedData && (
            <NeedDataPlaque daysWithRecords={daysWithRecords} onRemind={onOpenNotifications} />
          )}

          {cardPreferences.order.filter(id => !cardPreferences.hidden.includes(id)).map((id, index, visible) => {
            const card = ANALYTICS_CARDS.find(item => item.id === id)
            const previous = ANALYTICS_CARDS.find(item => item.id === visible[index - 1])
            return (
              <div key={id}>
                {card.section !== previous?.section && <SectionLabel>{card.section}</SectionLabel>}
                <CardActions.Provider value={{ id, openId: openCardMenu, setOpenId: setOpenCardMenu, hide: toggleCard }}>
                  {cards[id]}
                </CardActions.Provider>
              </div>
            )
          })}

          {/* Пилюля «Настроить» в потоке контента */}
          <button
            type="button"
            className="mx-progress-customize-pill"
            data-testid="progress-customize-trigger"
            onClick={() => setView('customize')}
          >
            ✎ Настроить
          </button>

          <div className="mx-progress-analytics__bottom-spacer" style={{ height: `${bottomSpacerHeight}px` }} />
        </>
      )}

      {activeTab === 'analytics' && view === 'analytics' && (
        <BottomPeriodPill
          granularity={granularity}
          offset={offset}
          onPrev={handlePrev}
          onNext={handleNext}
          canNext={offset > 0}
          hidden={navCollapsed}
        />
      )}

      {activeTab === 'history' && (
        <ProgressHistory
          user={user}
          onGoCheckin={onGoCheckin}
          onRedo={onRedo}
          onRedoReview={onRedoReview}
        />
      )}
    </div>
  )
}
