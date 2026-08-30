import { useEffect, useState } from 'react'
import { fetchTrendsData, peekTrendsData, peekTrendsSnapshot } from '../lib/trendsDataCache'
import { ANALYTICS_PERIODS } from '../lib/trendsDataSanitizer'
import { toLocalCalendarDate } from '../lib/dateTimezonePolicy'
import { selectDescriptiveInsights } from '../lib/descriptiveInsights'
import { api } from '../lib/api'
import { MotifArt } from '../components/Motif'
import EmptyState from '../components/EmptyState'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  YAxis,
} from 'recharts'

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const CATEGORY_LABELS = {
  physio: 'физиология',
  psycho: 'психология',
  social: 'поведение',
  digital: 'цифровое',
  food: 'пищевое',
}

function EmptyAnalytics() {
  return (
    <div className="mx-type-page w-full max-w-md px-5 animate-fade-in">
      <h2 className="font-display text-2xl text-cream mb-1">Аналитика</h2>
      <p className="text-[11px] text-muted mb-8">за последние дни</p>

      <EmptyState glyph={<MotifArt name="lestnica" size={120} className="mx-auto mb-3" />}>
        <h3 className="font-display text-lg text-cream mb-2">Пока нечего показать</h3>
        <p className="font-body text-sm text-muted leading-relaxed">
          Отмечай ритуалы и аскезы хотя бы несколько дней — и здесь появятся закономерности, которые
          сам не замечаешь.
        </p>
      </EmptyState>
    </div>
  )
}

function WeekChart({ dailyActivity }) {
  const last7 = dailyActivity.slice(-7)
  const todayIso = toLocalCalendarDate()

  const chartData = last7.map(d => {
    const jsDate = new Date(d.date + 'T00:00:00')
    return {
      ...d,
      label: WEEKDAY_LABELS[jsDate.getDay()],
      isToday: d.date === todayIso,
    }
  })

  const hasAny = chartData.some(d => d.count > 0 || d.breaks > 0)

  return (
    <div className="rounded-[24px] bg-emerald-light/15 border border-cream/15 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] text-muted">За неделю</h4>
        <span className="text-[11px] text-muted">по дням</span>
      </div>

      {hasAny ? (
        <>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={14} barGap={3}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={props => {
                    const { x, y, payload, index } = props
                    const isToday = chartData[index]?.isToday
                    return (
                      <text
                        x={x}
                        y={y + 12}
                        textAnchor="middle"
                        fill={isToday ? 'rgb(var(--c-text))' : 'rgb(var(--c-text) / 0.4)'}
                        fontSize={11}
                        fontFamily="Onest"
                        fontWeight={isToday ? 600 : 400}
                      >
                        {payload.value}
                      </text>
                    )
                  }}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: 'rgb(var(--c-card2))',
                    border: '1px solid rgb(var(--c-border))',
                    borderRadius: 12,
                    fontFamily: 'Onest',
                    fontSize: 12,
                    color: 'rgb(var(--c-text))',
                  }}
                  itemStyle={{ color: 'rgb(var(--c-text) / 0.7)' }}
                  labelStyle={{ color: 'rgb(var(--c-text))' }}
                  formatter={(value, name) => [value, name === 'count' ? 'ритуалов' : 'срывов']}
                />
                <Bar dataKey="count" radius={[5, 5, 5, 5]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.isToday ? 'rgb(var(--c-text))' : 'rgb(var(--c-gold))'} />
                  ))}
                </Bar>
                <Bar dataKey="breaks" radius={[5, 5, 5, 5]} fill="rgb(var(--c-text) / 0.3)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="w-2 h-2 rounded-full bg-mint" /> сегодня
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="w-2 h-2 rounded-full bg-gold" /> ритуалы
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="w-2 h-2 rounded-full bg-cream/30" /> срывы
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-faint py-8 text-center leading-relaxed">
          За эту неделю пока нет отметок.
          <br />
          Начни отмечаться — здесь появится картина дней.
        </p>
      )}
    </div>
  )
}

function RitualBar({ ritual }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{ritual.name}</span>
        <span className="font-mono text-gold">{ritual.completion_rate}%</span>
      </div>
      <div className="h-2 rounded-full bg-emerald-deep overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-700 ease-out"
          style={{ width: `${ritual.completion_rate}%` }}
        />
      </div>
    </div>
  )
}

function AscezaRow({ asceza }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="text-cream">
          {asceza.name}
          <span className="text-faint ml-1.5">{CATEGORY_LABELS[asceza.category] || ''}</span>
        </span>
        <span className="font-mono text-mint whitespace-nowrap">серия {asceza.streak}</span>
      </div>
      <div className="h-2 rounded-full bg-emerald-deep overflow-hidden">
        <div
          className="h-full bg-mint transition-all duration-700 ease-out"
          style={{ width: `${asceza.clean_rate}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-faint mt-1">
        <span>чистых дней: {asceza.held_days}</span>
        {asceza.breaks > 0 && <span className="text-cognac/70">срывов: {asceza.breaks}</span>}
      </div>
    </div>
  )
}

const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']

// ── настроение по чек-инам: линия за 14 дней ──
function MoodTrend({ checkins, onGoCheckin }) {
  // Cache уже отбрасывает outliers; эта граница дополнительно защищает UI,
  // если компонент когда-либо получит данные из другого источника.
  const scoredCheckins = (Array.isArray(checkins) ? checkins : []).filter(
    checkin => Number.isInteger(checkin?.mood) && checkin.mood >= 1 && checkin.mood <= 5
  )
  if (scoredCheckins.length === 0) {
    return (
      <EmptyState className="border border-cream/10 !bg-emerald-light/15 !p-6 mb-6">
        <h3 className="font-display text-[17px] text-cream mb-1.5">Как ты сейчас?</h3>
        <p className="text-[13px] text-muted leading-snug mb-4">
          Пройди первый чек-ин — и здесь появится
          <br />
          линия твоего настроения
        </p>
        <button onClick={onGoCheckin} className="cta-pill text-[14px] px-8 py-3">
          Пройти чек-ин
        </button>
      </EmptyState>
    )
  }

  const chartData = scoredCheckins.map(c => {
    const d = new Date(c.date + 'T00:00:00')
    return {
      label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`,
      mood: c.mood,
      energy: c.energy,
    }
  })
  const last = scoredCheckins[scoredCheckins.length - 1]
  const avgMood = (
    scoredCheckins.reduce((sum, checkin) => sum + checkin.mood, 0) / scoredCheckins.length
  ).toFixed(1)

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm text-cream">Настроение</h3>
        <span className="text-[11px] text-muted">в среднем {avgMood}/5</span>
      </div>
      <div className="rounded-[24px] bg-emerald-light/15 border border-cream/10 p-4">
        {scoredCheckins.length >= 2 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -28 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgb(var(--c-text) / 0.35)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 3, 5]}
                tick={{ fill: 'rgb(var(--c-text) / 0.35)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgb(var(--c-card2))',
                  border: '1px solid rgb(var(--c-border))',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'rgb(var(--c-text))',
                }}
                labelStyle={{ color: 'rgb(var(--c-text) / 0.6)' }}
                formatter={(v, name) => [v + '/5', name === 'mood' ? 'настроение' : 'энергия']}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="rgb(94 178 237)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'rgb(217,180,91)' }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="rgb(var(--c-text) / 0.3)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[13px] text-muted text-center py-4">
            Первая точка есть — сегодня: {MOOD_WORDS[(last.mood || 3) - 1]}.
            <br />
            Ещё пара дней, и появится линия.
          </p>
        )}
      </div>
    </div>
  )
}

// ── частые эмоции: что ты называл чаще всего ──
function EmotionCloud({ checkins }) {
  const counts = {}
  for (const c of checkins || []) {
    if (c.emotion) counts[c.emotion] = (counts[c.emotion] || 0) + 1
  }
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  if (top.length === 0) return null
  const max = top[0][1]

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm text-cream">Частые чувства</h3>
        <span className="text-[11px] text-muted">за 14 дней</span>
      </div>
      <div className="rounded-[24px] bg-emerald-light/15 border border-cream/10 p-4 flex flex-wrap gap-2">
        {top.map(([name, n]) => (
          <span
            key={name}
            className={[
              'px-3.5 py-2 rounded-full font-semibold',
              n === max ? 'bg-gold/20 text-gold' : 'bg-cream/5 text-muted',
            ].join(' ')}
            style={{ fontSize: `${12 + (n / max) * 4}px` }}
          >
            {name}
            <span className="opacity-50 ml-1.5 text-[11px]">{n}</span>
          </span>
        ))}
      </div>
    </div>
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

function Metric({ label, value }) {
  return (
    <div className="flex-1 rounded-[18px] bg-emerald border border-cream/10 px-3 py-3">
      <div className="text-[10px] text-faint leading-none mb-1.5">{label}</div>

      <div className="font-display text-[18px] font-bold text-gold leading-none">{value}</div>
    </div>
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
  const [loading, setLoading] = useState(() => initialTrendsSnapshot === null)
  const [insightsEnabled, setInsightsEnabled] = useState(true)
  const [insightsPreferenceError, setInsightsPreferenceError] = useState('')

  useEffect(() => {
    if (!user) return

    let active = true

    fetchTrendsData(user.id, days, {
      force: days !== 14 || initialTrendsState?.shouldRefresh === true,
    })
      .then(({ analytics, checkins }) => {
        if (!active) return

        setData(analytics)
        setCheckins(checkins || [])
      })
      .catch(e => console.error(e))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, days, initialTrendsState])

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

  if (loading) return <p className="text-muted text-sm px-6">Загрузка...</p>
  if (!data) return <p className="text-muted text-sm px-6">Не удалось загрузить аналитику</p>

  const rituals = data.rituals || []
  const ascezas = data.ascezas || []
  const hasData = rituals.length > 0 || ascezas.length > 0

  if (!hasData && checkins.length === 0) {
    return (
      <div className="w-full max-w-md px-5">
        <MoodTrend checkins={[]} onGoCheckin={onGoCheckin} />
        <EmptyAnalytics />
      </div>
    )
  }

  const avgRituals = rituals.length
    ? Math.round(rituals.reduce((s, r) => s + r.completion_rate, 0) / rituals.length)
    : 0
  const avgClean = ascezas.length
    ? Math.round(ascezas.reduce((s, a) => s + a.clean_rate, 0) / ascezas.length)
    : 0

  const descriptiveBackendInsights = selectDescriptiveInsights(data.insights)
  const backendObservations = Array.isArray(data.observations) ? data.observations.slice(0, 3) : []
  const observations =
    backendObservations.length > 0
      ? backendObservations
      : descriptiveBackendInsights.map(text => ({
          text,
          sampleSize: null,
          sourceDates: [],
          caveat: 'Это описание доступных данных, а не диагноз и не доказательство причины.',
        }))

  const round = values => {
    const value = average(pick(checkins, values))

    return value === null ? '—' : value.toFixed(1)
  }

  return (
    <div className="mx-type-page w-full max-w-md px-5 animate-fade-in">
      <h2 className="mx-type-analytics-heading font-display text-[34px] text-cream lowercase mt-4 mb-1">
        аналитика.
      </h2>

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Период аналитики">
        {ANALYTICS_PERIODS.map(period => (
          <button
            key={period}
            type="button"
            onClick={() => {
              if (days !== period) {
                setLoading(true)
                setDays(period)
              }
            }}
            aria-pressed={days === period}
            className={[
              'min-h-9 rounded-full px-3 text-[12px] font-semibold',
              days === period ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted',
            ].join(' ')}
          >
            {period} дней
          </button>
        ))}
      </div>
      <p className="text-[12px] text-faint mb-7">за последние {data.period_days} дней</p>

      <div className="font-label text-[11px] text-faint font-semibold uppercase tracking-[0.14em] mb-2.5">
        Наблюдения
      </div>

      {insightsEnabled ? (
        <>
          {/* Safety invariant: не диагнозы и не доказанные причины. */}
          <p className="text-[12px] text-faint leading-relaxed mb-3">
            Это описательные наблюдения по доступным отметкам, а не диагнозы и не доказанные
            причины; они также не являются прогнозами.
          </p>

          {observations.length > 0 ? (
            <div className="space-y-2 mb-7">
              {observations.map((observation, index) => (
                <div
                  key={`${observation.kind || 'observation'}-${index}`}
                  className="mx-type-insight rounded-[20px] border border-gold/25 bg-emerald px-4 py-3.5"
                >
                  <p className="text-[14px] leading-snug text-cream">{observation.text}</p>
                  {typeof observation.sampleSize === 'number' && observation.sampleSize > 0 && (
                    <p className="mt-2 text-[11px] text-muted">
                      Основа: {observation.sampleSize}{' '}
                      {observation.sampleSize === 1 ? 'наблюдение' : 'отметок'}
                      {observation.sourceDates?.length
                        ? ` · ${observation.sourceDates.length} дат`
                        : ''}
                    </p>
                  )}
                  {observation.sourceDates?.length > 0 && (
                    <details className="mt-2 text-[11px] text-muted">
                      <summary className="cursor-pointer select-none text-gold">
                        Даты в основе наблюдения
                      </summary>
                      <p className="mt-1 leading-relaxed">
                        {observation.sourceDates.map(formatSourceDate).join(' · ')}
                      </p>
                    </details>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-faint">
                    {observation.caveat}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-7 rounded-[20px] bg-emerald px-4 py-3.5 text-[14px] leading-relaxed text-muted">
              Пока недостаточно отметок для наблюдения. Продолжай в своём темпе — данные появятся
              сами.
            </div>
          )}
        </>
      ) : (
        <div
          role="status"
          className="mb-7 rounded-[20px] border border-cream/10 bg-emerald px-4 py-3.5 text-[14px] leading-relaxed text-muted"
        >
          Персональные описательные наблюдения скрыты. Твои сохранённые данные и обычные цифры ниже
          не удалены. Включить наблюдения можно в настройках.
        </div>
      )}
      {insightsPreferenceError && (
        <p role="status" className="-mt-5 mb-7 text-[12px] leading-relaxed text-faint">
          {insightsPreferenceError}
        </p>
      )}

      {/* ── Цифры ── */}

      <div className="font-label text-[11px] text-faint font-semibold uppercase tracking-[0.14em] mb-2.5">
        Цифры
      </div>

      <div className="flex gap-2 mb-3">
        <Metric label="настроение" value={round('mood')} />
        <Metric label="энергия" value={round('energy')} />
        <Metric label="тревога" value={round('anxiety')} />
        <Metric label="фокус" value={round('focus')} />
      </div>

      <div className="flex gap-2 mb-8">
        {rituals.length > 0 && <Metric label="ритуалы выполнены" value={`${avgRituals}%`} />}

        {ascezas.length > 0 && <Metric label="аскезы удержаны" value={`${avgClean}%`} />}
      </div>

      {/* ── Данные ── */}

      <div className="font-label text-[11px] text-faint font-semibold uppercase tracking-[0.14em] mb-2.5">
        Данные
      </div>

      <MoodTrend checkins={checkins} onGoCheckin={onGoCheckin} />

      <EmotionCloud checkins={checkins} />

      {data.daily_activity && data.daily_activity.length > 0 && (
        <div className="mb-6">
          <WeekChart dailyActivity={data.daily_activity} />
        </div>
      )}

      {ascezas.length > 0 && (
        <>
          <h3 className="text-sm text-cream mb-2">Аскезы</h3>
          <div className="rounded-xl border border-cream/15 bg-emerald-light/15 p-4 mb-6">
            {ascezas.map(a => (
              <AscezaRow key={a.id} asceza={a} />
            ))}
          </div>
        </>
      )}

      {rituals.length > 0 && (
        <>
          <h3 className="text-sm text-cream mb-2">Ритуалы</h3>
          <div className="rounded-xl border border-cream/15 bg-emerald-light/15 p-4">
            {rituals.map(r => (
              <RitualBar key={r.id} ritual={r} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
