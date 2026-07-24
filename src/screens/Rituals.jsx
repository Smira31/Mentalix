import { useEffect, useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { ArrowLeft, Sparkles, Snowflake, Check, GripVertical } from 'lucide-react'

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

function RitualCard({ ritual, onLog, onDelete, dragHandlers, isDragging, isOver }) {
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
      {...dragHandlers}
      className={`rounded-3xl overflow-hidden mb-3 transition-all duration-200 ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${
        isDragging ? 'opacity-60 scale-[1.03] shadow-lg shadow-black/40 z-10 relative' : ''
      } ${
        isOver ? 'ring-1 ring-gold/60' : ''
      } ${level ? 'bg-gold/10' : 'bg-emerald'}`}
    >
      <div
        className="w-full flex items-center justify-between px-4 pt-4 pb-2"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical size={16} className="text-cream/25 shrink-0" />
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gold/10 shrink-0">
            <Sparkles size={16} className="text-gold" strokeWidth={1.75} />
            {celebrate && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gold animate-celebrate-pop">
                <Check size={16} className="text-emerald-deep" strokeWidth={3} />
              </span>
            )}
          </div>
          <span className="text-[15px] font-bold text-cream truncate">{ritual.name}</span>
        </div>
        <span className="flex items-center gap-2 shrink-0">
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

      <div className="px-4 pb-4">
        {ritual.goal && <p className="text-xs text-cream/45 mb-2">{ritual.goal}</p>}
        <div className="flex gap-2">
          {ritual.min_version && (
            <button
              onClick={() => handleLog('min')}
              className={`flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 transition-all duration-150 active:scale-95 ${
                level === 'min' ? 'bg-cream/15 text-cream' : 'bg-cream/5 text-cream/50'
              }`}
            >
              Минимум{ritual.min_version ? `: ${ritual.min_version}` : ''}
            </button>
          )}
          {ritual.optimal_version && (
            <button
              onClick={() => handleLog('optimal')}
              className={`flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 transition-all duration-150 active:scale-95 ${
                level === 'optimal' ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-cream/50'
              }`}
            >
              Оптимум{ritual.optimal_version ? `: ${ritual.optimal_version}` : ''}
            </button>
          )}
          {!ritual.min_version && !ritual.optimal_version && (
            <button
              onClick={() => handleLog('optimal')}
              className={`flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 transition-all duration-150 active:scale-95 ${
                level ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-cream/50'
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

  const inputCls =
    'w-full bg-emerald border border-cream/10 rounded-2xl px-4 py-3.5 text-[15px] text-cream placeholder-cream/30 outline-none focus:border-gold/50 transition-colors'

  return (
    <div className="w-full max-w-sm px-5 pb-6 -mt-6">
      <div className="flex items-center gap-3 mb-5 pt-2">
        <button onClick={onCancel} aria-label="Отмена"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0">
          <ArrowLeft size={18} className="text-cream/60" />
        </button>
        <h2 className="font-display text-[20px] text-cream lowercase">новый ритуал.</h2>
      </div>

      <div className="space-y-2 mb-5">
        <input value={draft.name} onChange={set('name')} placeholder="Название ритуала" className={inputCls} />
        <input value={draft.goal} onChange={set('goal')} placeholder="Зачем он нужен" className={inputCls} />
        <input value={draft.min_version} onChange={set('min_version')} placeholder="Минимум" className={inputCls} />
        <input value={draft.optimal_version} onChange={set('optimal_version')} placeholder="Оптимум" className={inputCls} />
        <input value={draft.skip_consequence} onChange={set('skip_consequence')} placeholder="Что теряется при пропуске" className={inputCls} />
      </div>

      <button
        onClick={submit}
        disabled={!draft.name.trim() || saving}
        className="cta-pill w-full py-4 text-[16px] disabled:opacity-40"
      >
        {saving ? 'Сохраняю...' : 'Создать ритуал'}
      </button>
    </div>
  )
}

export default function Rituals({ user, onBack }) {
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const longPressTimer = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!user) return
    api.rituals.list(user.id)
      .then(setRituals)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  // блокируем скролл страницы, пока тащим
  useEffect(() => {
    if (dragIndex !== null) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [dragIndex])

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

  async function saveOrder(list) {
    try {
      await api.rituals.reorder(user.id, list.map((r) => r.id))
    } catch (e) { console.error(e) }
  }

  function startLongPress(index) {
    longPressTimer.current = setTimeout(() => {
      haptic('medium')
      setDragIndex(index)
    }, 400)
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleTouchMove(e) {
    if (dragIndex === null) return
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const card = el?.closest('[data-ritual-index]')
    if (card) {
      const idx = Number(card.getAttribute('data-ritual-index'))
      if (idx !== overIndex) setOverIndex(idx)
    }
  }

  function handleTouchEnd() {
    cancelLongPress()
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const next = [...rituals]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(overIndex, 0, moved)
      setRituals(next)
      saveOrder(next)
      hapticNotify('success')
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  if (showCreate) {
    return <CreateRitualScreen onCreate={createRitual} onCancel={() => setShowCreate(false)} />
  }

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => { haptic('light'); onBack() }} aria-label="Назад"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0">
          <ArrowLeft size={18} className="text-cream/60" />
        </button>
        <h2 className="font-display text-[22px] text-cream lowercase">ритуалы.</h2>
      </div>
      <p className="text-[12px] text-cream/40 mb-5 px-1">
        {rituals.length > 1 ? 'зажми карточку, чтобы поменять порядок' : 'обряды, что держат твой день'}
      </p>

      {loading ? (
        <p className="text-cream/40 text-sm">Загрузка...</p>
      ) : rituals.length === 0 ? (
        <div className="rounded-3xl bg-emerald p-8 text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-gold" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg text-cream mb-1">Ритуалов пока нет</h3>
          <p className="text-sm text-cream/50 mb-4 leading-relaxed">
            Ритуал — это обряд, который держит твой день. Создай первый.
          </p>
          <button onClick={() => setShowCreate(true)} className="cta-pill px-9 py-3.5 text-[14px]">
            Создать ритуал
          </button>
        </div>
      ) : (
        <>
          <div ref={listRef}>
            {rituals.map((r, i) => (
              <div key={r.id} data-ritual-index={i}>
                <RitualCard
                  ritual={r}
                  onLog={logRitual}
                  onDelete={deleteRitual}
                  isDragging={dragIndex === i}
                  isOver={dragIndex !== null && overIndex === i && dragIndex !== i}
                  dragHandlers={{
                    onTouchStart: () => startLongPress(i),
                    onTouchMove: handleTouchMove,
                    onTouchEnd: handleTouchEnd,
                    onTouchCancel: handleTouchEnd,
                  }}
                />
              </div>
            ))}
          </div>
          <button onClick={() => { haptic('light'); setShowCreate(true) }}
            className="w-full py-3.5 rounded-full bg-emerald text-cream/60 text-[14px] font-semibold mt-2 active:scale-[0.98] border-0 transition-transform">
            + Новый ритуал
          </button>
        </>
      )}
    </div>
  )
}