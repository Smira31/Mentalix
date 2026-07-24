import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Achievements from './Achievements'
import { Flame, CalendarDays, Target, ListChecks, Info, Bell } from 'lucide-react'

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-emerald-light/20 px-4 py-4">
      <Icon size={18} className="text-gold mb-2" strokeWidth={1.75} />
      <div className="font-mono text-xl text-cream">{value}</div>
      <div className="text-[11px] text-cream/50 mt-0.5">{label}</div>
    </div>
  )
}

function ReminderSettings({ user }) {
  const [enabled, setEnabled] = useState(false)
  const [hour, setHour] = useState(20)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    let alive = true
    api.profile
      .getSettings(user.id)
      .then((s) => {
        if (!alive) return
        setEnabled(!!s.reminder_enabled)
        setHour(typeof s.reminder_hour === 'number' ? s.reminder_hour : 20)
      })
      .catch((e) => {
        console.error('settings load failed', e)
        if (alive) setFailed(true)
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [user])

  async function persist(nextEnabled, nextHour) {
    setSaving(true)
    try {
      await api.profile.saveSettings(user.id, {
        reminder_enabled: nextEnabled,
        reminder_hour: nextHour,
      })
    } catch (e) {
      console.error('settings save failed', e)
    } finally {
      setSaving(false)
    }
  }

  function toggle() {
    const next = !enabled
    setEnabled(next)
    persist(next, hour)
  }

  function changeHour(e) {
    const next = Number(e.target.value)
    setHour(next)
    persist(enabled, next)
  }

  if (!ready) {
    return (
      <p className="text-cream/30 text-xs text-center mb-6">Загрузка настроек…</p>
    )
  }

  if (failed) {
    return (
      <div className="rounded-[24px] border border-cognac/30 bg-emerald-light/15 p-4 mb-6">
        <p className="text-xs text-cream/50">
          Не удалось загрузить настройки напоминаний. Попробуй обновить приложение позже.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-cream/10 bg-emerald-light/15 p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-light/40 flex items-center justify-center shrink-0">
          <Bell size={16} className="text-gold" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-cream/90">Напоминания</p>
          <p className="text-[11px] text-cream/40">Ежедневный пинг от бота</p>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          aria-pressed={enabled}
          className={[
            'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0',
            enabled ? 'bg-gold' : 'bg-emerald-light/60',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 w-5 h-5 rounded-full bg-cream transition-all duration-200',
              enabled ? 'left-6' : 'left-1',
            ].join(' ')}
          />
        </button>
      </div>

      {enabled && (
        <div className="flex items-center justify-between pl-12">
          <span className="text-xs text-cream/50">Время</span>
          <select
            value={hour}
            onChange={changeHour}
            disabled={saving}
            className="bg-emerald-light/40 text-cream text-sm rounded-lg px-3 py-1.5 outline-none"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
      )}
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
      <div className="flex flex-col items-center mb-6 pt-2">
        <div className="w-24 h-24 rounded-full border border-gold bg-emerald-light/20 flex items-center justify-center mb-4">
          <span className="font-display text-3xl text-gold">
            {user.first_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <h2 className="font-display text-2xl text-cream/90">{user.first_name}</h2>
        {user.username && <p className="text-xs text-cream/40 mt-1">@{user.username}</p>}
      </div>

      {loading && <p className="text-cream/40 text-sm text-center">Загрузка статистики...</p>}

      {!loading && stats && (
        <>
          <h3 className="text-sm text-cream/80 mb-2">Статистика</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatCard icon={CalendarDays} value={stats.days_active} label="дней в системе" />
            <StatCard icon={Flame} value={stats.best_streak} label="лучшая серия" />
            <StatCard icon={ListChecks} value={stats.total_habits} label="активных привычек" />
            <StatCard icon={Target} value={stats.total_goals} label="активных целей" />
          </div>
          <p className="text-[11px] text-cream/35 text-center mb-6">
            {stats.total_checkins} чек-инов сохранено всего
          </p>
        </>
      )}

      <Achievements user={user} />

      <h3 className="text-sm text-cream/80 mb-2">Настройки</h3>
      <ReminderSettings user={user} />

      <h3 className="text-sm text-cream/80 mb-2">О системе</h3>
      <div className="rounded-[24px] border border-cream/10 bg-emerald-light/15 p-4 flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-light/40 flex items-center justify-center shrink-0">
          <Info size={16} className="text-gold" strokeWidth={1.75} />
        </div>
        <p className="text-xs text-cream/50 leading-relaxed">
          Менталикс — система, а не мотивация. Все данные хранятся на твоём собственном сервере
          и никуда не передаются, кроме запросов к Mentalix при общении в чате.
        </p>
      </div>
    </div>
  )
}