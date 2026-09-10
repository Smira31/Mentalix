import { useEffect, useState } from 'react'
import { fetchTrendsData, peekTrendsData, peekTrendsSnapshot } from '../lib/trendsDataCache'
import { ANALYTICS_PERIODS } from '../lib/trendsDataSanitizer'
import { toLocalCalendarDate } from '../lib/dateTimezonePolicy'
import { selectDescriptiveInsights } from '../lib/descriptiveInsights'
import { api } from '../lib/api'
import '../components/ui-lab/ProgressRedesignExperiment.css'
import './Analytics.css'

const PROGRESS_LAYOUT_V2_ENABLED = import.meta.env.VITE_PROGRESS_LAYOUT_V2 === 'true'

const CALENDAR_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function SectionHeading({ eyebrow, title, id, meta }) {
  return (
    <div className="mx-progress-redesign__section-head">
      <div>
        <span className="font-label">{eyebrow}</span>
        {!PROGRESS_LAYOUT_V2_ENABLED && title && <h3 id={id}>{title}</h3>}
      </div>
      {meta && <small>{meta}</small>}
    </div>
  )
}

function chartGeometry(checkins) {
  const validPoints = checkins.filter(item => Number.isInteger(item?.mood))
  const points = PROGRESS_LAYOUT_V2_ENABLED ? validPoints : validPoints.slice(-30)
  if (points.length < 2) return { points, polyline: '' }

  return {
    points,
    polyline: points
      .map((item, index) => {
        const x = 2 + (index / (points.length - 1)) * 296
        const y = 132 - ((item.mood - 1) / 4) * 118
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' '),
  }
}

function MoodTrend({ checkins, loading, error, onRetry, onGoCheckin, period }) {
  const { points, polyline } = chartGeometry(checkins)
  const avgMood = average(points.map(item => item.mood))
  const axisDates = points.length
    ? [points[0], points[Math.floor((points.length - 1) / 2)], points[points.length - 1]]
    : []

  return (
    <section className="mx-progress-redesign__hero" aria-labelledby="progress-mood-title">
      <div className="mx-progress-redesign__hero-copy">
        <span id="progress-mood-title">Среднее настроение · {period} дней</span>
        <div>
          <strong>{avgMood === null ? '—' : avgMood.toFixed(1)}</strong>
          <small>/ 5</small>
        </div>
        <p>
          {points.length >= 2
            ? 'Линия показывает только твои сохранённые check-in за выбранный период.'
            : 'Ещё несколько спокойных отметок — и здесь станет виден твой ритм.'}
        </p>
      </div>

      <div className="mx-progress-redesign__chart">
        {loading ? (
          <div className="mx-progress-redesign__chart-skeleton" aria-label="Загрузка прогресса" />
        ) : error ? (
          <div className="mx-progress-redesign__chart-message" role="alert">
            <strong>Не удалось загрузить прогресс</strong>
            <span>Проверь соединение и попробуй ещё раз.</span>
            <button type="button" onClick={onRetry}>
              Повторить
            </button>
          </div>
        ) : points.length < 2 ? (
          <div className="mx-progress-redesign__chart-message">
            <strong>{points.length ? 'Первая точка уже есть' : 'Начни с одной отметки'}</strong>
            <span>
              {points.length
                ? 'После следующего check-in появится первая линия.'
                : 'Check-in занимает меньше минуты и запускает личную историю прогресса.'}
            </span>
            <button type="button" onClick={onGoCheckin}>
              Пройти check-in
            </button>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 300 142" role="img" aria-label="График настроения">
              <path
                className="mx-progress-redesign__chart-grid"
                d="M2 14H298 M2 73H298 M2 132H298"
              />
              <polyline className="mx-progress-redesign__chart-line" points={polyline} />
              {points.map((item, index) => {
                const x = 2 + (index / (points.length - 1)) * 296
                const y = 132 - ((item.mood - 1) / 4) * 118
                return <circle key={item.date} cx={x} cy={y} r="3.2" />
              })}
            </svg>
            <div className="mx-progress-redesign__chart-axis">
              {axisDates.map(item => (
                <span key={item.date}>{formatSourceDate(item.date)}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

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
        {PROGRESS_LAYOUT_V2_ENABLED && <h3 id="progress-observations-title">Что повторяется</h3>}
        <span>Данные собираются</span>
        <strong>Пока недостаточно отметок для наблюдения.</strong>
        <p>Продолжай в своём темпе — вывод появится только при достаточной выборке.</p>
      </article>
    )
  }

  return (
    <article
      className="mx-progress-redesign__observation mx-type-insight"
      data-primary-observation="true"
    >
      {PROGRESS_LAYOUT_V2_ENABLED && <h3 id="progress-observations-title">Что повторяется</h3>}
      <span>Главное наблюдение</span>
      <strong>{observation.text}</strong>
      <ObservationEvidence
        observation={observation}
        preserveLegacyEmptyCaveat={!PROGRESS_LAYOUT_V2_ENABLED}
      />
    </article>
  )
}

function ObservationRail({ observations, insightsEnabled, preferenceError }) {
  const secondary = observations.slice(1, 3)

  return (
    <section
      className="mx-progress-redesign__section"
      aria-labelledby="progress-observations-title"
    >
      <SectionHeading
        eyebrow="Наблюдения"
        title="Что повторяется"
        meta={`${Math.max(observations.length, 1)} / 3`}
        id="progress-observations-title"
      />
      <div className="mx-progress-redesign__rail">
        {insightsEnabled ? (
          <>
            <PrimaryObservationCard observation={observations[0] ?? null} />
            {secondary.map((observation, index) => (
              <article
                className="mx-progress-redesign__observation"
                key={`${observation.text}-${index}`}
              >
                <span>Ещё одно наблюдение</span>
                <strong>{observation.text}</strong>
                {PROGRESS_LAYOUT_V2_ENABLED ? (
                  <ObservationEvidence observation={observation} />
                ) : (
                  <p className="mx-progress-redesign__caveat">{observation.caveat}</p>
                )}
              </article>
            ))}
          </>
        ) : (
          <article className="mx-progress-redesign__observation" role="status">
            <span>Скрыто в настройках</span>
            <strong>Персональные наблюдения сейчас не показываются.</strong>
            <p>
              Персональные описательные наблюдения скрыты. Твои сохранённые данные и обычные цифры
              ниже не удалены. Включить наблюдения можно в настройках.
            </p>
          </article>
        )}
      </div>
      <p className="mx-progress-redesign__caveat">
        Это описательные наблюдения по доступным отметкам, а не диагнозы и не доказанные причины;
        они также не являются прогнозами.
      </p>
      {preferenceError && <p className="mx-progress-redesign__status-note">{preferenceError}</p>}
    </section>
  )
}

function ActivityCalendar({ checkins, dailyActivity, period }) {
  const todayIso = toLocalCalendarDate()
  const today = new Date(`${todayIso}T00:00:00`)
  const periodStart = new Date(today)
  periodStart.setDate(periodStart.getDate() - period + 1)
  const firstAllowedMonth = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1)
  const lastAllowedMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [monthCursor, setMonthCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  useEffect(() => {
    if (!PROGRESS_LAYOUT_V2_ENABLED) return
    setMonthCursor(value => {
      if (value < firstAllowedMonth) return firstAllowedMonth
      if (value > lastAllowedMonth) return lastAllowedMonth
      return value
    })
  }, [period, firstAllowedMonth.getTime(), lastAllowedMonth.getTime()])
  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const activeDates = new Set([
    ...checkins.map(item => item.date),
    ...dailyActivity
      .filter(item => item.count > 0 || item.breaks > 0 || item.held_ascezas > 0)
      .map(item => item.date),
  ])
  const moodByDate = new Map(checkins.map(item => [item.date, item.mood]))
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
    monthCursor
  )
  const isBeforePeriod = PROGRESS_LAYOUT_V2_ENABLED && monthCursor <= firstAllowedMonth
  const isCurrentMonth = PROGRESS_LAYOUT_V2_ENABLED
    ? monthCursor >= lastAllowedMonth
    : year === today.getFullYear() && month === today.getMonth()
  const hasActiveDatesInMonth = [...activeDates].some(date =>
    date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`)
  )

  return (
    <section className="mx-progress-redesign__section" aria-labelledby="progress-calendar-title">
      <div className="mx-progress-redesign__section-head">
        <div>
          <span className="font-label">Данные</span>
          {!PROGRESS_LAYOUT_V2_ENABLED && <h3 id="progress-calendar-title">Календарь</h3>}
        </div>
        <div className="mx-progress-redesign__month-nav">
          <button
            type="button"
            aria-label="Предыдущий месяц"
            disabled={isBeforePeriod}
            onClick={() =>
              setMonthCursor(value => new Date(value.getFullYear(), value.getMonth() - 1, 1))
            }
          >
            ‹
          </button>
          <small>{monthLabel}</small>
          <button
            type="button"
            aria-label="Следующий месяц"
            disabled={isCurrentMonth}
            onClick={() =>
              setMonthCursor(value => new Date(value.getFullYear(), value.getMonth() + 1, 1))
            }
          >
            ›
          </button>
        </div>
      </div>
      <div className="mx-progress-redesign__calendar-card">
        {PROGRESS_LAYOUT_V2_ENABLED && <h3 id="progress-calendar-title">Календарь</h3>}
        <div className="mx-progress-redesign__weekdays">
          {CALENDAR_WEEKDAYS.map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mx-progress-redesign__calendar">
          {cells.map((day, index) => {
            if (!day) return <i aria-hidden="true" key={`blank-${index}`} data-empty="true" />
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const active = activeDates.has(date)
            return (
              <i
                key={date}
                aria-label={`${day}, ${active ? 'есть отметка' : 'нет отметки'}`}
                data-day={day}
                data-filled={active}
                data-tone={moodByDate.get(date) ?? 0}
              />
            )
          })}
        </div>
        <p>
          {PROGRESS_LAYOUT_V2_ENABLED
            ? hasActiveDatesInMonth
              ? 'Отмеченные дни складываются в общий ритм.'
              : 'В этом месяце пока нет отметок.'
            : activeDates.size
              ? 'Отмеченные дни складываются в общий ритм.'
              : 'Здесь появятся дни с отметками.'}
        </p>
      </div>
    </section>
  )
}

function EmotionCloud({ checkins }) {
  const counts = new Map()
  for (const checkin of checkins) {
    if (checkin.emotion) counts.set(checkin.emotion, (counts.get(checkin.emotion) || 0) + 1)
  }
  const emotions = [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4)
  const total = PROGRESS_LAYOUT_V2_ENABLED
    ? [...counts.values()].reduce((sum, count) => sum + count, 0)
    : emotions.reduce((sum, [, count]) => sum + count, 0)

  return (
    <section className="mx-progress-redesign__section" aria-labelledby="progress-emotions-title">
      <SectionHeading eyebrow="Цифры" title="Эмоции" id="progress-emotions-title" />
      <div className="mx-progress-redesign__emotion-card">
        {PROGRESS_LAYOUT_V2_ENABLED && <h3 id="progress-emotions-title">Эмоции</h3>}
        <div className="mx-progress-redesign__emotion-ring" aria-label={`${total} отметок эмоций`}>
          <span>{total || '—'}</span>
          <small>отметки</small>
        </div>
        <div className="mx-progress-redesign__emotion-list">
          {(emotions.length ? emotions : [['пока нет данных', 0]]).map(([name, count], index) => (
            <div key={name} data-tone={index === 0 ? 'high' : 'middle'}>
              <i />
              <span>{name}</span>
              <small>{count || '—'}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
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

function average(values) {
  if (!values.length) return null

  const sum = values.reduce((acc, value) => acc + value, 0)

  return sum / values.length
}

function pick(list, field) {
  return list.map(item => item?.[field]).filter(value => typeof value === 'number')
}

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
      })
    }
  }

  // 6. Серия закрытых дней
  const streak = currentStreak(list)

  if (streak >= 3) {
    found.push({
      text: `${streak} закрытых дня подряд — серия держится прямо сейчас.`,
      weight: 0.8,
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

function Metric({ label, value, note, progress, children }) {
  return (
    <article
      className={PROGRESS_LAYOUT_V2_ENABLED ? 'mx-progress-redesign__activity-card' : undefined}
      data-progress-label={PROGRESS_LAYOUT_V2_ENABLED ? value : undefined}
    >
      <span>{label}</span>
      <strong className="font-display">{value}</strong>
      <small>{note}</small>
      {!PROGRESS_LAYOUT_V2_ENABLED && (
        <i aria-hidden="true">
          <b style={{ width: `${Math.max(4, Math.min(progress || 0, 100))}%` }} />
        </i>
      )}
      {children}
    </article>
  )
}

export default function Analytics({ user, onGoCheckin }) {
  const [initialTrendsState] = useState(() => {
    if (!user) return null

    const memoryData = peekTrendsData(user.id, 14)
    if (memoryData !== null) return { data: memoryData, shouldRefresh: false }

    const snapshotData = peekTrendsSnapshot(user.id, 14)
    return { data: snapshotData, shouldRefresh: snapshotData !== null }
  })
  const initialTrendsSnapshot = initialTrendsState?.data ?? null
  const [data, setData] = useState(() => initialTrendsSnapshot?.analytics ?? null)
  const [checkins, setCheckins] = useState(() => initialTrendsSnapshot?.checkins ?? [])
  const [days, setDays] = useState(14)
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const [loading, setLoading] = useState(() => initialTrendsSnapshot === null)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [insightsEnabled, setInsightsEnabled] = useState(true)
  const [insightsPreferenceError, setInsightsPreferenceError] = useState('')

  useEffect(() => {
    if (!user) return

    let active = true
    fetchTrendsData(user.id, days, {
      force: days !== 14 || initialTrendsState?.shouldRefresh === true || reloadKey > 0,
    })
      .then(({ analytics, checkins }) => {
        if (!active) return

        setData(analytics)
        setCheckins(checkins || [])
      })
      .catch(error => {
        console.error(error)
        if (!active) return
        setData(null)
        setCheckins([])
        setLoadError('Не удалось загрузить прогресс')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, days, initialTrendsState, reloadKey])

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
          setInsightsPreferenceError(
            'Не удалось проверить настройку видимости. Наблюдения показаны по умолчанию.'
          )
        }
      })

    return () => {
      active = false
    }
  }, [user])

  const safeData = data || {
    period_days: days,
    rituals: [],
    ascezas: [],
    insights: [],
    observations: [],
    daily_activity: [],
  }
  const rituals = safeData.rituals || []
  const ascezas = safeData.ascezas || []

  const avgRituals = rituals.length
    ? Math.round(rituals.reduce((s, r) => s + r.completion_rate, 0) / rituals.length)
    : 0
  const avgClean = ascezas.length
    ? Math.round(ascezas.reduce((s, a) => s + a.clean_rate, 0) / ascezas.length)
    : 0

  const descriptiveBackendInsights = selectDescriptiveInsights(safeData.insights)
  const backendObservations = Array.isArray(safeData.observations)
    ? safeData.observations.slice(0, 3)
    : []
  const observations =
    backendObservations.length > 0
      ? backendObservations
      : descriptiveBackendInsights.map(text => ({
          text,
          sampleSize: null,
          sourceDates: [],
          caveat: 'Это описание доступных данных, а не диагноз и не доказательство причины.',
        }))

  const score = field => average(pick(checkins, field))
  const scoreLabel = field => {
    const value = score(field)

    return value === null ? '—' : value.toFixed(1)
  }
  const scoreProgress = field => {
    const value = score(field)
    return value === null ? 0 : (value / 5) * 100
  }

  return (
    <div
      className={`mx-progress-redesign mx-progress-redesign--live mx-type-page w-full max-w-md px-5 animate-fade-in${
        PROGRESS_LAYOUT_V2_ENABLED ? ' mx-progress-layout-v2' : ''
      }`}
    >
      <header className="mx-progress-redesign__header">
        <h2 className="mx-type-analytics-heading">прогресс.</h2>
        {PROGRESS_LAYOUT_V2_ENABLED ? (
          <div className="mx-progress-layout-v2__period-control">
            <button
              type="button"
              className="mx-progress-layout-v2__period-trigger mx-type-control"
              aria-expanded={periodMenuOpen}
              aria-controls="progress-period-menu"
              onClick={() => setPeriodMenuOpen(value => !value)}
            >
              {days} дней
              <span aria-hidden="true">⌄</span>
            </button>
            {periodMenuOpen && (
              <div
                id="progress-period-menu"
                className="mx-progress-layout-v2__period-menu"
                role="menu"
                aria-label="Период аналитики"
              >
                {ANALYTICS_PERIODS.map(period => (
                  <button
                    key={period}
                    type="button"
                    role="menuitemradio"
                    aria-checked={days === period}
                    onClick={() => {
                      if (days !== period) {
                        setLoading(true)
                        setLoadError('')
                        setDays(period)
                      }
                      setPeriodMenuOpen(false)
                    }}
                  >
                    <span>{period} дней</span>
                    {days === period && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span>{days} дней</span>
        )}
      </header>

      {!PROGRESS_LAYOUT_V2_ENABLED && (
        <div className="mx-progress-redesign__periods" aria-label="Период аналитики">
          {ANALYTICS_PERIODS.map(period => (
            <button
              key={period}
              type="button"
              onClick={() => {
                if (days !== period) {
                  setLoading(true)
                  setLoadError('')
                  setDays(period)
                }
              }}
              aria-pressed={days === period}
            >
              {period} дней
            </button>
          ))}
        </div>
      )}

      <MoodTrend
        checkins={checkins}
        loading={loading}
        error={loadError}
        onRetry={() => {
          setLoading(true)
          setLoadError('')
          setReloadKey(value => value + 1)
        }}
        onGoCheckin={onGoCheckin}
        period={safeData.period_days}
      />

      {!loading && !loadError && (
        <>
          <ObservationRail
            observations={observations}
            insightsEnabled={insightsEnabled}
            preferenceError={insightsPreferenceError}
          />
          <ActivityCalendar
            checkins={checkins}
            dailyActivity={safeData.daily_activity || []}
            period={safeData.period_days}
          />
          <EmotionCloud checkins={checkins} />

          <section
            className="mx-progress-redesign__section"
            aria-labelledby="progress-activities-title"
          >
            <SectionHeading
              eyebrow="По существующим данным"
              title="Активности"
              meta="4"
              id="progress-activities-title"
            />
            <div className="mx-progress-redesign__activities">
              {PROGRESS_LAYOUT_V2_ENABLED && <h3 id="progress-activities-title">Активности</h3>}
              <Metric
                label="Ритуалы"
                value={rituals.length ? `${avgRituals}%` : '—'}
                note={rituals.length ? `${rituals.length} активных` : 'данные ещё собираются'}
                progress={avgRituals}
              >
                {rituals.length > 0 && (
                  <details>
                    <summary>Показать ритуалы</summary>
                    {rituals.map(ritual => (
                      <p key={ritual.id}>
                        <span>{ritual.name}</span>
                        <b>{ritual.completion_rate}%</b>
                      </p>
                    ))}
                  </details>
                )}
              </Metric>
              <Metric
                label="Аскезы"
                value={ascezas.length ? `${avgClean}%` : '—'}
                note={ascezas.length ? `${ascezas.length} активных` : 'данные ещё собираются'}
                progress={avgClean}
              >
                {ascezas.length > 0 && (
                  <details>
                    <summary>Показать аскезы</summary>
                    {ascezas.map(asceza => (
                      <p key={asceza.id}>
                        <span>{asceza.name}</span>
                        <b>{asceza.clean_rate}%</b>
                      </p>
                    ))}
                  </details>
                )}
              </Metric>
              <Metric
                label="Энергия"
                value={scoreLabel('energy')}
                note="среднее по check-in"
                progress={scoreProgress('energy')}
              />
              <Metric
                label="Фокус"
                value={scoreLabel('focus')}
                note="среднее по check-in"
                progress={scoreProgress('focus')}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
