import { useEffect, useState } from 'react'
import { api } from '../lib/api'
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

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
        checked ? 'bg-gold justify-end' : 'bg-emerald-light/50 justify-start'
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-emerald-deep" />
    </button>
  )
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function ReminderSettings({ user }) {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    api.profile.getSettings(user.id).then(setSettings).catch((e) => console.error(e))
  }, [user])

  async function update(patch) {
    const next = { ...settings, ...patch }
    setSettings(next)
    setSaving(true)
    try {
      await api.profile.updateSettings(user.id, next)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return null

  const moscowHour = (settings.reminder_hour + 3) % 24

  return (
    <div className="rounded-[24px] border border-cream/10 bg-emerald-light/15 p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-light/40 flex items-center justify-center shrink-0">
          <Bell size={16} className="text-gold" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="text-sm text-cream">Напоминание</div>
          <div className="text-xs text-cream/45">Если не отметился к этому часу</div>
        </div>
        <Toggle
          checked={settings.reminder_enabled}
          onChange={(v) => update({ reminder_enabled: v })}
        />
      </div>

      {settings.reminder_enabled && (
        <div className="flex items-center justify-between pt-3 border-t border-cream/10">
          <span className="text-xs text-cream/50">Время (по Мск {moscowHour}:00)</span>
          <select
            value={settings.reminder_hour}
            onChange={(e) => update({ reminder_hour: Number(e.target.value) })}
            disabled={saving}
            className="bg-emerald-deep border border-cream/15 rounded-lg px-2 py-1 text-sm text-cream outline-none focus:border-gold"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00 UTC
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
