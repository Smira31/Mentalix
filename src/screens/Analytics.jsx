import { useEffect, useMemo, useRef, useState } from 'react'
import { sanitizeTrendsData } from '../lib/trendsDataSanitizer'
import { loadIndependentSources, SOURCE_STATES } from '../lib/pathDataLoader'
import { selectDescriptiveInsights } from '../lib/descriptiveInsights'
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

function average(values) {
  if (!values.length) return null

  const sum = values.reduce((acc, value) => acc + value, 0)

  return sum / values.length
}

function pick(list, field) {
  return list.map(item => item?.[field]).filter(value => typeof value === 'number')
}

// ============================================================
// ВЫВОДЫ
//
// Аналитика Mentalix отвечает на вопрос «что со мной
// происходит», а не «вот твои данные». Поэтому закономерности
// считаются здесь, на клиенте, по явным правилам — без сети
// и без модели, которая может придумать связь, которой нет.
//
// Каждое правило обязано выполнить три условия:
//   1. в обеих сравниваемых группах достаточно дней;
//   2. разница превышает порог, а не тонет в шуме;
//   3. формулировка говорит о наблюдении, а не о причине.
//
// Если ни одно правило не сработало — мы прямо говорим, что
// данных мало. Придумывать вывод, чтобы заполнить экран, хуже,
// чем честно промолчать.
// ============================================================

const MIN_GROUP = 3
export const MIN_CHECKINS = 5

// Сравнение среднего значения поля в двух группах дней.
function compareGroups({ withGroup, withoutGroup, field, threshold, build }) {
  // Группы считаются по числу валидных числовых значений, а не по числу
  // неполных записей. Иначе один score мог бы выглядеть как достаточная выборка.
  const withValues = pick(withGroup, field)
  const withoutValues = pick(withoutGroup, field)
  if (withValues.length < MIN_GROUP || withoutValues.length < MIN_GROUP) {
    return null
  }

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

function currentStreak(checkins) {
  let streak = 0

  for (let i = checkins.length - 1; i >= 0; i -= 1) {
    if (!checkins[i]?.review_completed_at) break

    streak += 1
  }

  return streak
}

export function deriveConclusions(checkins, data) {
  const list = Array.isArray(checkins) ? checkins : []
  const found = []

  const closed = list.filter(c => c.review_completed_at)
  const notClosed = list.filter(c => !c.review_completed_at)

  // 1. Вечерний разбор и тревога
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

  // 2. Вечерний разбор и настроение следующего дня
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

  // 3. Энергия и собранность
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

  // 4. Тренд настроения внутри периода
  if (list.length >= MIN_CHECKINS * 2) {
    const half = Math.floor(list.length / 2)

    const early = average(pick(list.slice(0, half), 'mood'))
    const late = average(pick(list.slice(half), 'mood'))

    if (early !== null && late !== null && Math.abs(late - early) >= 0.5) {
      found.push({
        text:
          late > early
            ? 'Во второй половине периода настроение выше, чем в первой.'
            : 'Во второй половине периода настроение ниже, чем в первой.',
        weight: Math.abs(late - early),
        direction: late > early ? 'up' : 'down',
      })
    }
  }

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
        text: `Больше половины срывов приходится на один день недели — ${WEEKDAY_FULL[topIndex]}.`,
        weight: 0.9,
        direction: 'down',
      })
    }
  }

  // 6. Серия закрытых дней
  const streak = currentStreak(list)

  if (streak >= 3) {
    found.push({
      text: `${streak} закрытых дня подряд — серия держится прямо сейчас.`,
      weight: 0.8,
      direction: 'up',
    })
  }

  found.sort((a, b) => b.weight - a.weight)

  return found
}

function formatSourceDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date)
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

/* ── Элементы §5.5 ── */

function SectionLabel({ children }) {
  return (
    <h3 className="mx-progress-section-label font-label" data-testid="progress-section-label">
      {children}
    </h3>
  )
}

function CardShell({ title, subtitle, menu, children, testId }) {
  return (
    <article className="mx-progress-card" data-testid={testId}>
      <div className="mx-progress-card__head">
        <h4 className="mx-progress-card__title">{title}</h4>
        {subtitle && <p className="mx-progress-card__subtitle">{subtitle}</p>}
      </div>
      {menu}
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

function MoodCard({ onStartMood, onGoCheckin }) {
  function handleFace(level) {
    if (typeof onStartMood === 'function') onStartMood(level)
    else if (typeof onGoCheckin === 'function') onGoCheckin()
  }

  return (
    <section className="mx-progress-mood-card" aria-labelledby="progress-mood-card-title">
      <h2 id="progress-mood-card-title" className="mx-progress-mood-card__title">
        Как ты себя чувствуешь?
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

function NeedDataPlaque({ checkinsCount, onRemind }) {
  const remaining = Math.max(0, MIN_CHECKINS - checkinsCount)
  if (remaining <= 0) return null

  // Ряд кружков-дней: сделанные (с галочкой) + оставшиеся
  const done = Math.min(checkinsCount, MIN_CHECKINS)
  const cells = Array.from({ length: MIN_CHECKINS }, (_, i) => i < done)

  return (
    <section className="mx-progress-need-data" aria-labelledby="progress-need-data-title">
      <h2 id="progress-need-data-title" className="mx-progress-need-data__title">
        Нужны записи ещё за {remaining} {remaining === 1 ? 'день' : remaining < 5 ? 'дня' : 'дней'}, чтобы показать выводы
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
  // 1 — тяжёлый (приглушенный), 5 — светлый
  if (!level) return 'rgb(var(--c-card3, 46 46 46))'
  const palette = ['#6A6A6A', '#8A8A8A', '#B0B0B0', '#D0D0D0', '#E6E6E6']
  return palette[Math.min(Math.max(level, 1), 5) - 1]
}

function PracticesRing({ analyticsData, isCurrentPeriod }) {
  const rituals = analyticsData?.rituals || []
  const ascezas = analyticsData?.ascezas || []
  const items = [
    ...rituals.map(r => ({ name: r.name, kind: 'ritual' })),
    ...ascezas.map(a => ({ name: a.name, kind: 'asceza' })),
  ].slice(0, 4)

  if (!isCurrentPeriod || items.length === 0) {
    return (
      <CardShell title="Твои частые практики" subtitle="За текущий период" testId="progress-practices">
        <CardEmpty hint="Отмечай практики и чек-ины — здесь появится кольцо частых активностей" />
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
    <CardShell title="Твои частые практики" subtitle="За текущий период" testId="progress-practices">
      <div className="mx-progress-practices">
        <div className="mx-progress-practices__ring">
          <svg viewBox="0 0 36 36" aria-label="Частые практики">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--c-card3, 46 46 46))" strokeWidth="3" />
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
              <span className="mx-progress-practices__dot" style={{ background: palette[i % palette.length] }} />
              <span className="mx-progress-practices__name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

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

  // month / year — сетка месяца
  const ref = window.start
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <CardShell title="Календарь настроения" subtitle="Дни с настроением" testId="progress-mood-calendar">
      <div className="mx-progress-mood-calendar">
        <div className="mx-progress-mood-calendar__month">
          {cells.map((day, i) => {
            if (!day) return <span key={`b-${i}`} className="mx-progress-mood-calendar__month-cell" />
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const mood = moodByDate.get(date)
            return (
              <span className="mx-progress-mood-calendar__month-cell" key={date}>
                <span
                  className="mx-progress-mood-calendar__month-dot"
                  style={mood ? { background: moodColor(mood) } : undefined}
                />
              </span>
            )
          })}
        </div>
        <button type="button" className="mx-progress-mood-calendar__all" onClick={onOpenFull}>
          Все дни ›
        </button>
      </div>
    </CardShell>
  )
}

function trendGeometry(checkins) {
  const valid = checkins.filter(item => Number.isInteger(item?.mood))
  if (valid.length < 2) return { points: [], polyline: '' }
  const points = valid
  return {
    points,
    polyline: points
      .map((item, index) => {
        const x = 2 + (index / (points.length - 1)) * 296
        const y = 56 - ((item.mood - 1) / 4) * 44
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' '),
  }
}

function MoodTrendCard({ periodCheckins, prevCheckins }) {
  const cur = trendGeometry(periodCheckins)
  const prev = trendGeometry(prevCheckins)
  const hasData = cur.points.length >= 2 || prev.points.length >= 2

  return (
    <CardShell title="Настроение" subtitle="Этот период / прошлый период" testId="progress-mood-trend">
      {hasData ? (
        <div className="mx-progress-mood-trend">
          <svg className="mx-progress-mood-trend__chart" viewBox="0 0 300 64" role="img" aria-label="График настроения">
            <path className="mx-progress-redesign__chart-grid" d="M2 12H298 M2 56H298" />
            {prev.polyline && (
              <polyline
                className="mx-progress-redesign__chart-line"
                points={prev.polyline}
                style={{ opacity: 0.4 }}
              />
            )}
            {cur.polyline && (
              <polyline className="mx-progress-redesign__chart-line" points={cur.polyline} />
            )}
          </svg>
          <div className="mx-progress-mood-trend__axis">
            <span>Прошлый</span>
            <span>Этот</span>
          </div>
        </div>
      ) : (
        <CardEmpty hint="Добавь несколько отметок настроения — здесь появится линия" />
      )}
    </CardShell>
  )
}

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
      <CardShell title="Частые эмоции" subtitle="За период" testId="progress-emotions">
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
    <CardShell title="Частые эмоции" subtitle="За период" testId="progress-emotions">
      <div className="mx-progress-emotions">
        <div className="mx-progress-emotions__ring">
          <svg viewBox="0 0 36 36" aria-label={`${total} отметок эмоций`}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--c-card3, 46 46 46))" strokeWidth="3" />
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

function ConclusionsCard({ direction, conclusions }) {
  const title = direction === 'up' ? 'Что тебя поднимает' : 'Что тянет вниз'
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

/* ── Наблюдения (контракт: видимость, evidence, safety caveat) ── */

function ObservationEvidence({ observation, preserveLegacyEmptyCaveat = false }) {
  return (
    <div>
      {typeof observation.sampleSize === 'number' && observation.sampleSize > 0 && (
        <p>
          Основа: {observation.sampleSize} {observation.sampleSize === 1 ? 'наблюдение' : 'отметок'}
        </p>
      )}
      {observation.sourceDates?.length > 0 && (
        <details>
          <summary>Даты в основе наблюдения</summary>
          <p>{observation.sourceDates.map(formatSourceDate).join(' · ')}</p>
        </details>
      )}
      {(observation.caveat || preserveLegacyEmptyCaveat) && (
        <p className="mx-progress-redesign__caveat">{observation.caveat}</p>
      )}
    </div>
  )
}

function PrimaryObservationCard({ observation }) {
  if (!observation) {
    return (
      <article className="mx-progress-redesign__observation">
        <span>Пока мало данных</span>
        <strong>Добавь ещё несколько отметок.</strong>
        <p>Тогда здесь появится первое наблюдение.</p>
      </article>
    )
  }

  return (
    <article
      className="mx-progress-redesign__observation mx-type-insight"
      data-primary-observation="true"
    >
      <span>Главное наблюдение</span>
      <strong>{observation.text}</strong>
      <ObservationEvidence observation={observation} />
    </article>
  )
}

function ObservationRail({ observations, insightsEnabled, preferenceError }) {
  const secondary = observations.slice(1, 3)

  return (
    <CardShell title="Что повторяется" subtitle="Наблюдения" testId="progress-observations">
      <div className="mx-progress-redesign__rail">
        {insightsEnabled ? (
          <>
            <PrimaryObservationCard observation={observations[0] ?? null} />
            {secondary.map((observation, index) => (
              <article
                className="mx-progress-redesign__observation mx-type-insight"
                key={`${observation.text}-${index}`}
              >
                <span>Ещё одно наблюдение</span>
                <strong>{observation.text}</strong>
                <ObservationEvidence observation={observation} />
              </article>
            ))}
          </>
        ) : (
          <article className="mx-progress-redesign__observation" role="status">
            <span>Скрыто в настройках</span>
            <strong>Персональные описательные наблюдения скрыты. Твои сохранённые данные и обычные цифры ниже не удалены.</strong>
            <p>
              Персональные описательные наблюдения скрыты. Твои сохранённые данные и обычные цифры ниже не удалены.
              Включить наблюдения можно в настройках.
            </p>
          </article>
        )}
      </div>
      <p className="mx-progress-redesign__caveat">
        Это описание твоих отметок — не диагнозы и не доказанные причины, не прогноз.
      </p>
      {preferenceError && <p className="mx-progress-redesign__status-note">{preferenceError}</p>}
    </CardShell>
  )
}

/* ── Полный календарь настроения ── */

function FullCalendar({ poolCheckins, onBack }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 90 дней назад → сегодня, новые недели сверху
  const start = new Date(today)
  start.setDate(today.getDate() - 89)
  const moodByDate = new Map(poolCheckins.map(item => [item.date, item.mood]))

  // Выравниваем на понедельник
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

/* ── Нижняя пилюля периода ── */

function BottomPeriodPill({ granularity, offset, onPrev, onNext, canNext }) {
  const window = getPeriodWindow(granularity, offset)
  return (
    <div className="mx-progress-bottom-pill" data-testid="progress-bottom-pill">
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
  const [view, setView] = useState('analytics') // 'analytics' | 'calendar'

  const [poolCheckins, setPoolCheckins] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [sourceResult, setSourceResult] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(Boolean(user))
  const sourceResultRef = useRef(null)
  const retryFailedSourcesRef = useRef(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [insightsEnabled, setInsightsEnabled] = useState(true)
  const [insightsPreferenceError, setInsightsPreferenceError] = useState('')

  const gran = getGranularity(granularity)

  // Persist segment choice in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(PROGRESS_SEGMENT_KEY, activeTab)
    } catch {
      /* sessionStorage может быть недоступен (приватный режим) */
    }
  }, [activeTab])

  // External trigger: onOpenHistory switches to History segment
  useEffect(() => {
    if (historyTrigger > 0) {
      saveScroll()
      setActiveTab('history')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyTrigger])

  // Restore scroll position after tab switch
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

  // Data: pool checkins (90d) + analytics aggregate (granularity days)
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

  // Insights visibility preference
  useEffect(() => {
    if (!user) return

    let active = true
    api.profile
      .getSettings(user.id)
      .then(settings => {
        if (active) setInsightsEnabled(settings?.insights_enabled !== false)
      })
      .catch(() => {
        if (active) {
          setInsightsEnabled(true)
          setInsightsPreferenceError('Наблюдения показаны по умолчанию.')
        }
      })

    return () => {
      active = false
    }
  }, [user])

  const window = useMemo(() => getPeriodWindow(granularity, offset), [granularity, offset])
  const prevWindow = useMemo(
    () => getPeriodWindow(granularity, offset + 1),
    [granularity, offset]
  )
  const periodCheckins = useMemo(
    () => sliceCheckinsByPeriod(poolCheckins, window),
    [poolCheckins, window]
  )
  const prevCheckins = useMemo(
    () => sliceCheckinsByPeriod(poolCheckins, prevWindow),
    [poolCheckins, prevWindow]
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
  const checkinsFailed =
    !sourceLoading && checkinsState && checkinsState !== SOURCE_STATES.success
  const isCurrentPeriod = offset === 0

  const descriptiveBackendInsights = selectDescriptiveInsights(safeData.insights)
  const backendObservations = Array.isArray(safeData.observations) ? safeData.observations.slice(0, 3) : []
  const observations =
    backendObservations.length > 0
      ? backendObservations
      : descriptiveBackendInsights.map(text => ({
          text,
          sampleSize: null,
          sourceDates: [],
          caveat: 'Это описание доступных данных, а не диагноз и не доказательство причины.',
        }))

  const conclusions = deriveConclusions(periodCheckins, safeData)
  const hasPeriodData = periodCheckins.length > 0
  const showNeedData = periodCheckins.length < MIN_CHECKINS

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

      {activeTab === 'analytics' && view === 'analytics' && (
        <>
          <header className="mx-progress-analytics">
            <h1 className="mx-progress-analytics__title font-display">аналитика.</h1>
            <p className="mx-progress-analytics__subtext">
              Здесь видно, как меняется твоё настроение за {gran.word}
              {!hasPeriodData && (
                <span className="mx-progress-analytics__subtext-empty"> · Пока данных нет</span>
              )}
            </p>
          </header>

          <MoodCard onStartMood={onStartMood} onGoCheckin={onGoCheckin} />

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

          {showNeedData && (
            <NeedDataPlaque checkinsCount={periodCheckins.length} onRemind={onOpenNotifications} />
          )}

          <SectionLabel>Общее</SectionLabel>
          <PracticesRing analyticsData={safeData} isCurrentPeriod={isCurrentPeriod} />
          <MoodCalendarCard
            periodCheckins={periodCheckins}
            granularity={granularity}
            window={window}
            onOpenFull={() => setView('calendar')}
          />
          <MoodTrendCard periodCheckins={periodCheckins} prevCheckins={prevCheckins} />

          <SectionLabel>Эмоции</SectionLabel>
          <EmotionsRing periodCheckins={periodCheckins} />
          <ConclusionsCard direction="up" conclusions={conclusions} />
          <ConclusionsCard direction="down" conclusions={conclusions} />
          <ObservationRail
            observations={observations}
            insightsEnabled={insightsEnabled}
            preferenceError={insightsPreferenceError}
          />

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
        />
      )}
    </div>
  )
}
