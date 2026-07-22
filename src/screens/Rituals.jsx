import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { ArrowLeft, Sparkles, Flame, Snowflake, Check } from 'lucide-react'

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}
function hapticNotify(type = 'success') {
  WebApp.HapticFeedback?.notificationOccurred(type)
}

const EMPTY_DRAFT = {
  name: '', goal: '', min_version: '', optimal_version: '', skip_consequence: '',
}

function StreakBadge({ streak, freezes, bump }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`font-mono text-xs text-gold inline-block ${bump ? 'animate-streak-bounce' : ''}`}>🔥 {streak}</span>
      {freezes > 0 && (
        <span className="flex items-center gap-0.5 font-mono text-xs text-mint">
          <Snowflake size={12} strokeWidth={2} /> {freezes}
        </span>
      )}
    </span>
  )
}

function Monogram() {
  return (
    <div className="flex items-center justify-center rounded-full border border-gold text-gold shrink-0 w-6 h-6">
      <span className="font-display text-[10px]">M</span>
    </div>
  )
}

function RitualCard({ ritual, onLog, onDelete }) {
  const level = ritual.today_level
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [streakBump, setStreakBump] = useState(false)

  function handleLog(lvl) {
    const wasUnset = !level
    haptic('medium')
    if (wasUnset) {
      hapticNotify('success')
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 700)
    }
    onLog(ritual.id, lvl)
    setTimeout(() => {
      if (wasUnset) {
        setStreakBump(true)
        setTimeout(() => setStreakBump(false), 500)
      }
    }, 150)
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden mb-2 transition-colors duration-300 ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${level ? 'bg-cognac/15 border-cognac/60' : 'bg-emerald-light/30 border-cream/15'}`}
    >
      <div
        className={`w-full flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-br ${
          level === 'optimal'
            ? 'from-gold/20 to-transparent'
            : level === 'min'
            ? 'from-cognac/20 to-transparent'
            : 'from-cream/5 to-transparent'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-black/20">
            <Sparkles size={16} className="text-cream" strokeWidth={1.75} />
            {celebrate && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-gold animate-celebrate-pop">
                <Check size={16} className="text-emerald-deep" strokeWidth={3} />
              </span>
            )}
          </div>
          <span className="text-sm text-cream">{ritual.name}</span>
        </div>
        <span className="flex items-center gap-2">
          <StreakBadge streak={ritual.streak} freezes={ritual.freezes} bump={streakBump} />
          <Monogram />
          {confirming ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => { haptic('rigid'); onDelete(ritual.id) }}
                className="text-[10px] px-2 py-0.5 rounded bg-red-900/60 text-cream/90 active:scale-90"
              >
                Удалить
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[10px] px-2 py-0.5 rounded border border-cream/20 text-cream/50 active:scale-90"
              >
                Отмена
              </button>
            </span>
          ) : (
            <span
              onClick={() => setConfirming(true)}
              className="text-cream/30 text-sm leading-none px-1 active:scale-90"
            >
              ×
            </span>
          )}
        </span>
      </div>

      <div className="px-4 pb-3">
        {ritual.goal && <p className="text-xs text-cream/45 mb-2">{ritual.goal}</p>}
        <div className="flex gap-2">
          {ritual.min_version && (
            <button
              onClick={() => handleLog('min')}
              className={`flex-1 py-1.5 rounded-lg border text-xs transition-all duration-150 active:scale-95 ${
                level === 'min' ? 'bg-cognac border-cognac text-cream' : 'border-cream/20 text-cream/50'
              }`}
            >
              Минимум{ritual.min_version ? `: ${ritual.min_version}` : ''}
            </button>
          )}
          {ritual.optimal_version && (
            <button
              onClick={() => handleLog('optimal')}
              className={`flex-1 py-1.5 rounded-lg border text-xs transition-all duration-150 active:scale-95 ${
                level === 'optimal' ? 'bg-gold border-gold text-emerald-deep' : 'border-cream/20 text-cream/50'
              }`}
            >
              Оптимум{ritual.optimal_version ? `: ${ritual.optimal_version}` : ''}
            </button>
          )}
          {!ritual.min_version && !ritual.optimal_version && (
            <button
              onClick={() => handleLog('optimal')}
              className={`flex-1 py-1.5 rounded-lg border text-xs transition-all duration-150 active:scale-95 ${
                level ? 'bg-cognac border-cognac text-cream' : 'border-cream/20 text-cream/50'
              }`}
            >
              {level ? 'Сделано' : 'Отметить'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateRitualScreen({ onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  function set(field) {
    return (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    await onCreate(draft)
    setSaving(false)
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Отмена
      </button>
      <h2 className="font-display text-lg mb-4 text-cream/90">Новый ритуал</h2>
      <div className="space-y-2 mb-6">
        <input value={draft.name} onChange={set('name')} placeholder="Название ритуала"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold" />
        <input value={draft.goal} onChange={set('goal')} placeholder="Зачем он нужен"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold" />
        <input value={draft.min_version} onChange={set('min_version')} placeholder="Минимум"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold" />
        <input value={draft.optimal_version} onChange={set('optimal_version')} placeholder="Оптимум"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold" />
        <input value={draft.skip_consequence} onChange={set('skip_consequence')} placeholder="Что теряется при пропуске"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold" />
      </div>
      <button onClick={submit} disabled={!draft.name.trim() || saving}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 active:scale-95">
        {saving ? 'Сохраняю...' : 'Создать ритуал'}
      </button>
    </div>
  )
}

export default function Rituals({ user, onBack }) {
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!user) return
    api.rituals.list(user.id)
      .then(setRituals)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  async function logRitual(ritualId, level) {
    try {
      const updated = await api.rituals.log(ritualId, user.id, level)
      setRituals((prev) => prev.map((r) =>
        r.id === ritualId
          ? { ...r, streak: updated.streak, freezes: updated.freezes, today_level: updated.today_level }
          : r
      ))
    } catch (e) { console.error(e) }
  }

  async function createRitual(draft) {
    try {
      const ritual = await api.rituals.create(user.id, draft)
      setRituals((prev) => [...prev, ritual])
      setShowCreate(false)
    } catch (e) { console.error(e) }
  }

  async function deleteRitual(ritualId) {
    try {
      await api.rituals.remove(ritualId)
      setRituals((prev) => prev.filter((r) => r.id !== ritualId))
    } catch (e) { console.error(e) }
  }

  if (showCreate) {
    return <CreateRitualScreen onCreate={createRitual} onCancel={() => setShowCreate(false)} />
  }

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <button onClick={() => { haptic('light'); onBack() }} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Назад
      </button>

      <h2 className="font-display text-2xl text-cream mb-1">Ритуалы</h2>
      <p className="text-xs text-cream/40 mb-5">твои ежедневные обряды</p>

      {loading ? (
        <p className="text-cream/40 text-sm">Загрузка...</p>
      ) : rituals.length === 0 ? (
        <div className="rounded-2xl border border-cream/10 bg-emerald-light/15 p-6 text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-light/40 flex items-center justify-center mx-auto mb-3">
            <Sparkles size={22} className="text-gold" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg text-cream mb-1">Ритуалов пока нет</h3>
          <p className="text-sm text-cream/50 mb-4 leading-relaxed">
            Ритуал — это обряд, который держит твой день. Создай первый.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-gold text-emerald-deep text-sm font-medium active:scale-95">
            Создать ритуал
          </button>
        </div>
      ) : (
        <>
          {rituals.map((r) => (
            <RitualCard key={r.id} ritual={r} onLog={logRitual} onDelete={deleteRitual} />
          ))}
          <button onClick={() => { haptic('light'); setShowCreate(true) }}
            className="w-full py-2.5 rounded-xl border border-cream/20 text-cream/60 text-sm mt-2 active:scale-95">
            + Новый ритуал
          </button>
        </>
      )}
    </div>
  )
}