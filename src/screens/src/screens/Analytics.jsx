import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function MiniBarRow({ label, data, colorClass }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] text-cream/45 mb-1">{label}</div>
      <div className="flex items-end gap-[3px] h-12">
        {data.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${colorClass}`}
            style={{ height: `${(v / 5) * 100}%`, minHeight: v > 0 ? '3px' : '1px', opacity: v ? 1 : 0.15 }}
          />
        ))}
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

  const moodSeries = data.checkins.map((c) => c.mood)
  const anxietySeries = data.checkins.map((c) => c.anxiety)

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <h2 className="font-display text-lg mb-1 text-cream/90">Аналитика</h2>
      <p className="text-[11px] text-cream/40 mb-5">за последние {data.period_days} дней</p>

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
          <div className="rounded-xl border border-cream/15 bg-emerald-light/15 p-4 mb-6">
            <MiniBarRow label="Настроение" data={moodSeries} colorClass="bg-gold" />
            <MiniBarRow label="Тревога" data={anxietySeries} colorClass="bg-cognac" />
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
