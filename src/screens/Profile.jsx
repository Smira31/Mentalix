import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function StatCard({ value, label }) {
  return (
    <div className="rounded-xl border border-cream/15 bg-emerald-light/20 px-4 py-3 text-center">
      <div className="font-mono text-xl text-gold">{value}</div>
      <div className="text-[11px] text-cream/50 mt-1">{label}</div>
    </div>
  )
}

export default function Profile({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.profile.get(user.id)
      .then(setStats)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full border border-gold flex items-center justify-center mb-3">
          <span className="font-display text-2xl text-gold">
            {user.first_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <h2 className="font-display text-lg text-cream/90">{user.first_name}</h2>
        {user.username && <p className="text-xs text-cream/40">@{user.username}</p>}
      </div>

      {loading && <p className="text-cream/40 text-sm text-center">Загрузка статистики...</p>}

      {!loading && stats && (
        <>
          <h3 className="text-sm text-cream/80 mb-2">Статистика</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <StatCard value={stats.days_active} label="дней в системе" />
            <StatCard value={`🔥 ${stats.best_streak}`} label="лучшая серия" />
            <StatCard value={stats.total_habits} label="активных привычек" />
            <StatCard value={stats.total_goals} label="активных целей" />
          </div>
          <p className="text-[11px] text-cream/35 text-center mb-6">
            {stats.total_checkins} чек-инов сохранено всего
          </p>
        </>
      )}

      <h3 className="text-sm text-cream/80 mb-2">О системе</h3>
      <div className="rounded-xl border border-cream/15 bg-emerald-light/15 p-4 text-xs text-cream/50 leading-relaxed">
        Менталикс — система, а не мотивация. Все данные хранятся на твоём собственном сервере
        и никуда не передаются, кроме запросов к Mentalix при общении в чате.
      </div>
    </div>
  )
}
