import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import {
  AreaChart, Area, XAxis, ResponsiveContainer, Tooltip,
} from 'recharts'

// Кольцевая шкала с делениями — единый визуальный приём для всего приложения
function TickGauge({ value, max, sublabel, size = 150 }) {
  const percent = Math.max(0, Math.min(1, value / max))
  const totalTicks = 40
  const filledTicks = Math.round(percent * totalTicks)
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        {Array.from({ length: totalTicks }).map((_, i) => {
          const angle = (i / totalTicks) * 360
          const isFilled = i < filledTicks
          const rad = ((angle - 90) * Math.PI) / 180
          const x1 = 100 + 80 * Math.cos(rad)
          const y1 = 100 + 80 * Math.sin(rad)
          const x2 = 100 + 92 * Math.cos(rad)
          const y2 = 100 + 92 * Math.sin(rad)
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isFilled ? '#C9A227' : 'rgba(243,233,221,0.12)'}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="text-center">
        <div className="font-display text-3xl text-cream">{value}%</div>
        <div className="font-body text-xs text-cream/50 mt-1">{sublabel}</div>
      </div>
    </div>
  )
}

function MoodAnxietyChart({ checkins }) {
  const chartData = checkins.map((c, i) => ({
    idx: i + 1,
    mood: c.mood,
    anxiety: c.anxiety,
  }))

  return (
    <div className="rounded-[24px] bg-emerald-light/15 border border-cream/15 p-4">
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-[11px] text-cream/60">
          <span className="w-2 h-2 rounded-full bg-gold" /> Настроение
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-cream/60">
          <span className="w-2 h-2 rounded-full bg-cognac" /> Тревога
        </span>
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A227" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="anxietyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A85C32" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#A85C32" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="idx"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(243,233,221,0.35)', fontSize: 10, fontFamily: 'Manrope' }}
            />
            <Tooltip
              contentStyle={{
                background: '#16332E',
                border: '1px solid rgba(243,233,221,0.15)',
                borderRadius: 12,
                fontFamily: 'Manrope',
                fontSize: 12,
              }}
              labelStyle={{ color: '#F3E9DD' }}
            />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="#C9A227"
              strokeWidth={2}
              fill="url(#moodFill)"
              dot={{ r: 2.5, fill: '#C9A227', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="anxiety"
              stroke="#A85C32"
              strokeWidth={2}
              fill="url(#anxietyFill)"
              dot={{ r: 2.5, fill: '#A85C32', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function HabitBar({ habit }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-cream/70 mb-1">
        <span>{habit.name}</span>
        <span className="font-mono text-gold">{habit.completion_rate}%</span>
      </div>
      <div className="h-2 rounded-full bg-emerald-deep overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-700 ease-out"
          style={{ width: `${habit.completion_rate}%` }}
        />
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

  const avgCompletion = data.habits.length
    ? Math.round(data.habits.reduce((sum, h) => sum + h.completion_rate, 0) / data.habits.length)
    : 0

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <h2 className="font-display text-lg mb-1 text-cream/90">Аналитика</h2>
      <p className="text-[11px] text-cream/40 mb-5">за последние {data.period_days} дней</p>

      {data.habits.length > 0 && (
        <div className="rounded-[28px] bg-emerald-light/20 border border-cream/10 p-6 mb-6 flex justify-center">
          <TickGauge value={avgCompletion} max={100} sublabel="среднее выполнение привычек" />
        </div>
      )}

      <h3 className="text-sm text-cream/80 mb-2">Инсайты</h3>
      <div className="space-y-2 mb-6">
        {data.insights.map((text, i) => (
          <div
            key={i}
            className="rounded-xl border border-gold/30 bg-emerald-light/20 px-4 py-3 text-sm text-cream/90"
          >
            {text}
          </div>
        ))}
      </div>

      {data.checkins.length > 0 && (
        <>
          <h3 className="text-sm text-cream/80 mb-2">Динамика</h3>
          <div className="mb-6">
            <MoodAnxietyChart checkins={data.checkins} />
          </div>
        </>
      )}

      {data.habits.length > 0 && (
        <>
          <h3 className="text-sm text-cream/80 mb-2">Привычки</h3>
          <div className="rounded-xl border border-cream/15 bg-emerald-light/15 p-4">
            {data.habits.map((h) => (
              <HabitBar key={h.id} habit={h} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}