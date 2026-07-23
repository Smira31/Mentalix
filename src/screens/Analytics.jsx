import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { BarChart3, Shield, Sparkles } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell,
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
                  tick={{ fill: 'rgba(243,233,221,0.4)', fontSize: 11, fontFamily: 'Manrope' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(243,233,221,0.04)' }}
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
                <Bar dataKey="count" radius={[5, 5, 5, 5]} fill="#B8952E" />
                <Bar dataKey="breaks" radius={[5, 5, 5, 5]} fill="#C18D52" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
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

export default function Analytics({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.analytics.get(user.id, 14)
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>
  if (!data) return <p className="text-cream/40 text-sm px-6">Не удалось загрузить аналитику</p>

  const rituals = data.rituals || []
  const ascezas = data.ascezas || []
  const hasData = rituals.length > 0 || ascezas.length > 0

  if (!hasData) return <EmptyAnalytics />

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