import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { MotifArt } from '../components/Motif'
import { BarChart3, Shield, Sparkles } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell,
  LineChart, Line, YAxis,
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
    <div className="w-full max-w-md px-5 animate-fade-in">
      <h2 className="font-display text-2xl text-cream mb-1">Аналитика</h2>
      <p className="text-[11px] text-cream/40 mb-8">за последние дни</p>

      <div className="rounded-[24px] bg-emerald p-8 text-center">
        <MotifArt name="lestnica" size={120} className="mx-auto mb-3" />
        <h3 className="font-display text-lg text-cream mb-2">Пока нечего показать</h3>
        <p className="font-body text-sm text-cream/50 leading-relaxed">
          Отмечай ритуалы и аскезы хотя бы несколько дней — и здесь появятся закономерности,
          которые сам не замечаешь.
        </p>
      </div>
    </div>
  )
}

function WeekChart({ dailyActivity }) {
  const last7 = dailyActivity.slice(-7)
  const todayIso = new Date().toISOString().slice(0, 10)

  const chartData = last7.map((d) => {
    const jsDate = new Date(d.date + 'T00:00:00')
    return {
      ...d,
      label: WEEKDAY_LABELS[jsDate.getDay()],
      isToday: d.date === todayIso,
    }
  })

  const hasAny = chartData.some((d) => d.count > 0 || d.breaks > 0)

  return (
    <div className="rounded-[24px] bg-emerald-light/15 border border-cream/15 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] text-cream/60">За неделю</h4>
        <span className="text-[11px] text-cream/40">по дням</span>
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
                  tick={(props) => {
                    const { x, y, payload, index } = props
                    const isToday = chartData[index]?.isToday
                    return (
                      <text
                        x={x}
                        y={y + 12}
                        textAnchor="middle"
                        fill={isToday ? 'rgb(var(--c-text))' : 'rgb(var(--c-text) / 0.4)'}
                        fontSize={11}
                        fontFamily="Manrope"
                        fontWeight={isToday ? 600 : 400}
                      >
                        {payload.value}
                      </text>
                    )
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--c-text) / 0.05)' }}
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
            <span className="flex items-center gap-1.5 text-[11px] text-cream/50">
              <span className="w-2 h-2 rounded-full bg-mint" /> сегодня
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-cream/50">
              <span className="w-2 h-2 rounded-full bg-gold" /> ритуалы
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-cream/50">
              <span className="w-2 h-2 rounded-full bg-cream/30" /> срывы
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-cream/35 py-8 text-center leading-relaxed">
          За эту неделю пока нет отметок.<br />Начни отмечаться — здесь появится картина дней.
        </p>
      )}
    </div>
  )
}

function RitualBar({ ritual }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-cream/70 mb-1">
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
        <span className="text-cream/80">
          {asceza.name}
          <span className="text-cream/35 ml-1.5">{CATEGORY_LABELS[asceza.category] || ''}</span>
        </span>
        <span className="font-mono text-mint whitespace-nowrap">🛡 {asceza.streak}</span>
      </div>
      <div className="h-2 rounded-full bg-emerald-deep overflow-hidden">
        <div
          className="h-full bg-mint transition-all duration-700 ease-out"
          style={{ width: `${asceza.clean_rate}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-cream/35 mt-1">
        <span>чистых дней: {asceza.held_days}</span>
        {asceza.breaks > 0 && <span className="text-cognac/70">срывов: {asceza.breaks}</span>}
      </div>
    </div>
  )
}

const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']

// ── настроение по чек-инам: линия за 14 дней ──
function MoodTrend({ checkins, onGoCheckin }) {
  if (!checkins || checkins.length === 0) {
    return (
      <div className="rounded-[24px] bg-emerald-light/15 border border-cream/10 p-6 text-center mb-6">
        <h3 className="font-display text-[17px] text-cream mb-1.5">Как ты сейчас?</h3>
        <p className="text-[13px] text-cream/45 leading-snug mb-4">
          Пройди первый чек-ин — и здесь появится
          <br />линия твоего настроения
        </p>
        <button
          onClick={onGoCheckin}
          className="cta-pill text-[14px] px-8 py-3"
        >
          Пройти чек-ин
        </button>
      </div>
    )
  }

  const chartData = checkins.map((c) => {
    const d = new Date(c.date + 'T00:00:00')
    return { label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`, mood: c.mood, energy: c.energy }
  })
  const last = checkins[checkins.length - 1]
  const avgMood = (checkins.reduce((s, c) => s + c.mood, 0) / checkins.length).toFixed(1)

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm text-cream/80">Настроение</h3>
        <span className="text-[11px] text-cream/40">в среднем {avgMood}/5</span>
      </div>
      <div className="rounded-[24px] bg-emerald-light/15 border border-cream/10 p-4">
        {checkins.length >= 2 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -28 }}>
              <XAxis dataKey="label" tick={{ fill: 'rgb(var(--c-text) / 0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tick={{ fill: 'rgb(var(--c-text) / 0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgb(var(--c-card2))', border: '1px solid rgb(var(--c-border))', borderRadius: 12, fontSize: 12, color: 'rgb(var(--c-text))' }}
                labelStyle={{ color: 'rgb(var(--c-text) / 0.6)' }}
                formatter={(v, name) => [v + '/5', name === 'mood' ? 'настроение' : 'энергия']}
              />
              <Line type="monotone" dataKey="mood" stroke="rgb(217,180,91)" strokeWidth={2.5} dot={{ r: 3, fill: 'rgb(217,180,91)' }} />
              <Line type="monotone" dataKey="energy" stroke="rgb(var(--c-text) / 0.3)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[13px] text-cream/45 text-center py-4">
            Первая точка есть — сегодня: {MOOD_WORDS[(last.mood || 3) - 1]}.
            <br />Ещё пара дней, и появится линия.
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
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  if (top.length === 0) return null
  const max = top[0][1]

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm text-cream/80">Частые чувства</h3>
        <span className="text-[11px] text-cream/40">за 14 дней</span>
      </div>
      <div className="rounded-[24px] bg-emerald-light/15 border border-cream/10 p-4 flex flex-wrap gap-2">
        {top.map(([name, n]) => (
          <span
            key={name}
            className={[
              'px-3.5 py-2 rounded-full font-semibold',
              n === max ? 'bg-gold/20 text-gold' : 'bg-cream/5 text-cream/60',
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
const MIN_CHECKINS = 5


function average(values) {
  if (!values.length) return null

  const sum = values.reduce(
    (acc, value) => acc + value,
    0,
  )

  return sum / values.length
}


function pick(list, field) {
  return list
    .map((item) => item?.[field])
    .filter(
      (value) =>
        typeof value === 'number',
    )
}


// Сравнение среднего значения поля в двух группах дней.
function compareGroups({
  withGroup,
  withoutGroup,
  field,
  threshold,
  build,
}) {
  if (
    withGroup.length < MIN_GROUP
    || withoutGroup.length < MIN_GROUP
  ) {
    return null
  }

  const a = average(pick(withGroup, field))
  const b = average(pick(withoutGroup, field))

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


function deriveConclusions(checkins, data) {
  const list = Array.isArray(checkins) ? checkins : []
  const found = []

  const closed = list.filter((c) => c.review_completed_at)
  const notClosed = list.filter((c) => !c.review_completed_at)

  // 1. Вечерний разбор и тревога
  const anxiety = compareGroups({
    withGroup: notClosed,
    withoutGroup: closed,
    field: 'anxiety',
    threshold: 0.6,
    build: (delta) =>
      delta > 0
        ? 'Тревога выше в дни, которые ты не закрываешь вечерним разбором.'
        : 'Тревога выше в дни, которые ты разбираешь вечером — возможно, разбор попадает именно на тяжёлые дни.',
  })

  if (anxiety) found.push(anxiety)


  // 2. Вечерний разбор и настроение следующего дня
  const mood = compareGroups({
    withGroup: closed,
    withoutGroup: notClosed,
    field: 'mood',
    threshold: 0.5,
    build: (delta) =>
      delta > 0
        ? 'В закрытые дни настроение держится заметно выше, чем в брошенные.'
        : 'Настроение в закрытые дни ниже — ты чаще доводишь до разбора трудные дни.',
  })

  if (mood) found.push(mood)


  // 3. Энергия и собранность
  const energetic = list.filter((c) => c.energy >= 4)
  const tired = list.filter((c) => c.energy <= 2)

  const focus = compareGroups({
    withGroup: energetic,
    withoutGroup: tired,
    field: 'focus',
    threshold: 0.7,
    build: (delta) =>
      delta > 0
        ? 'Собранность идёт следом за энергией: в дни с силами ты заметно собраннее.'
        : 'Собранность не зависит от энергии — в уставшие дни ты собран не меньше.',
  })

  if (focus) found.push(focus)


  // 4. Тренд настроения внутри периода
  if (list.length >= MIN_CHECKINS * 2) {
    const half = Math.floor(list.length / 2)

    const early = average(pick(list.slice(0, half), 'mood'))
    const late = average(pick(list.slice(half), 'mood'))

    if (
      early !== null
      && late !== null
      && Math.abs(late - early) >= 0.5
    ) {
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
  const breakDays = activity.filter((d) => d.breaks > 0)

  if (breakDays.length >= 3) {
    const byWeekday = {}

    for (const day of breakDays) {
      const index = new Date(day.date + 'T00:00:00').getDay()

      byWeekday[index] = (byWeekday[index] || 0) + 1
    }

    const [topIndex, topCount] =
      Object.entries(byWeekday)
        .sort((a, b) => b[1] - a[1])[0]

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
      <div className="text-[10px] text-cream/35 leading-none mb-1.5">
        {label}
      </div>

      <div className="font-display text-[18px] font-bold text-gold leading-none">
        {value}
      </div>
    </div>
  )
}


export default function Analytics({ user, onGoCheckin }) {
  const [data, setData] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.analytics.get(user.id, 14),
      api.checkin.history(user.id, 14).catch(() => []),
    ])
      .then(([d, c]) => { setData(d); setCheckins(c || []) })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>
  if (!data) return <p className="text-cream/40 text-sm px-6">Не удалось загрузить аналитику</p>

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

  const conclusions = deriveConclusions(checkins, data)
  const [lead, ...rest] = conclusions

  const enough = checkins.length >= MIN_CHECKINS

  const round = (values) => {
    const value = average(pick(checkins, values))

    return value === null ? '—' : value.toFixed(1)
  }

  return (
    <div className="w-full max-w-md px-5 animate-fade-in">
      <h2 className="font-display text-[34px] text-cream lowercase mt-4 mb-1">
        аналитика.
      </h2>

      <p className="text-[12px] text-cream/35 mb-7">
        за последние {data.period_days} дней
      </p>


      {/* ── Главный вывод ── */}

      <div className="text-[11px] text-cream/30 font-semibold uppercase tracking-[0.14em] mb-2.5">
        Главное
      </div>

      {lead ? (
        <p className="font-display text-[21px] text-cream leading-[1.3] mb-6">
          {lead.text}
        </p>
      ) : (
        <p className="font-display text-[19px] text-cream/70 leading-[1.35] mb-6">
          {enough
            ? 'Устойчивых закономерностей пока не видно. Это нормально: они проявляются на большем отрезке.'
            : `Данных пока мало. Нужно хотя бы ${MIN_CHECKINS} чек-инов, чтобы говорить о закономерностях, а не о совпадениях.`}
        </p>
      )}


      {/* ── Остальные закономерности ── */}

      {rest.length > 0 && (
        <div className="space-y-2 mb-7">
          {rest.map((item, index) => (
            <div
              key={index}
              className="rounded-[20px] bg-emerald border border-cream/10 px-4 py-3.5"
            >
              <p className="text-[14px] text-cream/70 leading-snug">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}


      {/* ── Инсайты бэкенда ── */}

      {data.insights?.length > 0 && (
        <>
          <div className="text-[11px] text-cream/30 font-semibold uppercase tracking-[0.14em] mb-2.5">
            Замечено системой
          </div>

          <div className="space-y-2 mb-7">
            {data.insights.map((text, i) => (
              <div
                key={i}
                className="rounded-[20px] border border-gold/25 bg-emerald px-4 py-3.5 text-[14px] text-cream/80 leading-snug"
              >
                {text}
              </div>
            ))}
          </div>
        </>
      )}


      {/* ── Цифры ── */}

      <div className="text-[11px] text-cream/30 font-semibold uppercase tracking-[0.14em] mb-2.5">
        Цифры
      </div>

      <div className="flex gap-2 mb-3">
        <Metric label="настроение" value={round('mood')} />
        <Metric label="энергия" value={round('energy')} />
        <Metric label="тревога" value={round('anxiety')} />
        <Metric label="фокус" value={round('focus')} />
      </div>

      <div className="flex gap-2 mb-8">
        {rituals.length > 0 && (
          <Metric label="ритуалы выполнены" value={`${avgRituals}%`} />
        )}

        {ascezas.length > 0 && (
          <Metric label="аскезы удержаны" value={`${avgClean}%`} />
        )}
      </div>


      {/* ── Данные ── */}

      <div className="text-[11px] text-cream/30 font-semibold uppercase tracking-[0.14em] mb-2.5">
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
          <h3 className="text-sm text-cream/80 mb-2">Аскезы</h3>
          <div className="rounded-xl border border-cream/15 bg-emerald-light/15 p-4 mb-6">
            {ascezas.map((a) => (
              <AscezaRow key={a.id} asceza={a} />
            ))}
          </div>
        </>
      )}

      {rituals.length > 0 && (
        <>
          <h3 className="text-sm text-cream/80 mb-2">Ритуалы</h3>
          <div className="rounded-xl border border-cream/15 bg-emerald-light/15 p-4">
            {rituals.map((r) => (
              <RitualBar key={r.id} ritual={r} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
