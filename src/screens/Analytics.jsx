import { useEffect, useState } from 'react'
import { api } from '../lib/api'
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
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <h2 className="font-display text-2xl text-cream mb-1">Аналитика</h2>
      <p className="text-[11px] text-cream/40 mb-8">за последние дни</p>

      <div className="rounded-2xl border border-cream/10 bg-emerald-light/15 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-light/40 flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={26} className="text-gold" strokeWidth={1.5} />
        </div>
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
                        fill={isToday ? '#96CDB0' : 'rgba(243,233,221,0.4)'}
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
                  cursor={{ fill: 'rgba(150,205,176,0.06)' }}
                  contentStyle={{
                    background: '#16332E',
                    border: '1px solid rgba(243,233,221,0.15)',
                    borderRadius: 12,
                    fontFamily: 'Manrope',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#F3E9DD' }}
                  formatter={(value, name) => [value, name === 'count' ? 'ритуалов' : 'срывов']}
                />
                <Bar dataKey="count" radius={[5, 5, 5, 5]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.isToday ? '#96CDB0' : '#B8952E'} />
                  ))}
                </Bar>
                <Bar dataKey="breaks" radius={[5, 5, 5, 5]} fill="#C18D52" />
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
              <span className="w-2 h-2 rounded-full bg-cognac" /> срывы
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
              <XAxis dataKey="label" tick={{ fill: 'rgba(245,245,245,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tick={{ fill: 'rgba(245,245,245,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgb(25,25,27)', border: '1px solid rgba(245,245,245,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: 'rgba(245,245,245,0.5)' }}
                formatter={(v, name) => [v + '/5', name === 'mood' ? 'настроение' : 'энергия']}
              />
              <Line type="monotone" dataKey="mood" stroke="rgb(217,180,91)" strokeWidth={2.5} dot={{ r: 3, fill: 'rgb(217,180,91)' }} />
              <Line type="monotone" dataKey="energy" stroke="rgba(245,245,245,0.3)" strokeWidth={1.5} dot={false} />
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
      <div className="w-full max-w-sm px-6 pb-40">
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

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <h2 className="font-display text-2xl text-cream mb-1">Аналитика</h2>
      <p className="text-[11px] text-cream/40 mb-5">за последние {data.period_days} дней</p>

      <MoodTrend checkins={checkins} onGoCheckin={onGoCheckin} />

      <div className="grid grid-cols-2 gap-3 mb-6">
        {rituals.length > 0 && (
          <div className="rounded-[24px] bg-emerald-light/20 border border-gold/25 p-4 flex flex-col items-center">
            <Sparkles size={16} className="text-gold mb-1" strokeWidth={1.75} />
            <div className="font-display text-2xl text-cream">{avgRituals}%</div>
            <div className="text-[10px] text-cream/50 text-center mt-0.5">ритуалы выполнены</div>
          </div>
        )}
        {ascezas.length > 0 && (
          <div className="rounded-[24px] bg-emerald-light/20 border border-mint/25 p-4 flex flex-col items-center">
            <Shield size={16} className="text-mint mb-1" strokeWidth={1.75} />
            <div className="font-display text-2xl text-cream">{avgClean}%</div>
            <div className="text-[10px] text-cream/50 text-center mt-0.5">аскезы удержаны</div>
          </div>
        )}
      </div>

      <h3 className="text-sm text-cream/80 mb-2">Инсайты</h3>
      <div className="space-y-2 mb-6">
        {data.insights.map((text, i) => (
          <div
            key={i}
            className="rounded-xl border border-gold/30 bg-emerald-light/20 px-4 py-3 text-sm text-cream/90 leading-snug"
          >
            {text}
          </div>
        ))}
      </div>

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