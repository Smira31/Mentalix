import { useEffect, useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { ArrowLeft, Shield, ShieldOff, Cigarette, Brain, Users, Smartphone, Cookie, GripVertical, Check } from 'lucide-react'

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}
function hapticNotify(type = 'success') {
  WebApp.HapticFeedback?.notificationOccurred(type)
}

const CATEGORIES = [
  { key: 'physio', label: 'Физиология', short: 'Тело', Icon: Cigarette, hint: 'курение, алкоголь, вещества' },
  { key: 'psycho', label: 'Психология', short: 'Психика', Icon: Brain, hint: 'грызть ногти, шопоголизм, жалобы' },
  { key: 'social', label: 'Поведение', short: 'Общение', Icon: Users, hint: 'перебивать, материться, опаздывать' },
  { key: 'digital', label: 'Цифровые', short: 'Экран', Icon: Smartphone, hint: 'думскроллинг, игры, телефон' },
  { key: 'food', label: 'Пищевые', short: 'Еда', Icon: Cookie, hint: 'заедание стресса, сладкое, еда у ТВ' },
]

function categoryMeta(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[1]
}

const EMPTY_DRAFT = {
  name: '', category: 'psycho', reason: '', trigger: '', replacement: '',
}

function AscezaCard({ asceza, onLog, onDelete, dragHandlers, isDragging, isOver }) {
  const status = asceza.today_status
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const meta = categoryMeta(asceza.category)
  const Icon = meta.Icon

  function handleLog(next) {
    const wasUnset = !status
    haptic('medium')
    if (next === 'held' && wasUnset) {
      hapticNotify('success')
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 700)
    }
    if (next === 'broke') hapticNotify('warning')
    onLog(asceza.id, next)
  }

  return (
    <div
      {...dragHandlers}
      className={`rounded-xl border overflow-hidden mb-2 transition-all duration-200 ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${isDragging ? 'opacity-60 scale-[1.03] shadow-lg shadow-black/40 z-10 relative' : ''} ${
        isOver ? 'border-gold border-dashed' : ''
      } ${
        status === 'held'
          ? 'bg-mint/10 border-mint/50'
          : status === 'broke'
          ? 'bg-cognac/15 border-cognac/50'
          : 'bg-emerald-light/30 border-cream/15'
      }`}
    >
      <div className="w-full flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical size={16} className="text-cream/25 shrink-0" />
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-black/20 shrink-0">
            <Icon size={16} className="text-cream" strokeWidth={1.75} />
            {celebrate && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-mint animate-celebrate-pop">
                <Check size={16} className="text-emerald-deep" strokeWidth={3} />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-cream truncate">{asceza.name}</div>
            <div className="text-[10px] text-cream/40">{meta.label}</div>
          </div>
        </div>
        <span className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-mint whitespace-nowrap">🛡 {asceza.streak}</span>
          {confirming ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => { haptic('rigid'); onDelete(asceza.id) }}
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
        {asceza.reason && <p className="text-xs text-cream/45 mb-2">{asceza.reason}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => handleLog('held')}
            className={`flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              status === 'held' ? 'bg-mint border-mint text-emerald-deep' : 'border-cream/20 text-cream/50'
            }`}
          >
            <Shield size={13} /> Удержался
          </button>
          <button
            onClick={() => handleLog('broke')}
            className={`flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              status === 'broke' ? 'bg-cognac border-cognac text-cream' : 'border-cream/20 text-cream/50'
            }`}
          >
            <ShieldOff size={13} /> Сорвался
          </button>
        </div>

        {status === 'broke' && asceza.replacement && (
          <p className="text-xs text-mint/70 mt-2">Замена: {asceza.replacement}</p>
        )}
        {!status && asceza.trigger && (
          <p className="text-xs text-cream/35 mt-2 italic">Триггер: {asceza.trigger}</p>
        )}
      </div>
    </div>
  )
}

function CreateAscezaScreen({ onCreate, onCancel }) {
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
    'w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-3.5 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors'

  const activeCat = categoryMeta(draft.category)

  return (
    <div className="w-full max-w-sm px-5 pb-6 -mt-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-cream/60 text-sm">
          <ArrowLeft size={16} /> Отмена
        </button>
        <h2 className="font-display text-base text-cream/90">Новая аскеза</h2>
      </div>

      <div className="mb-3">
        <p className="text-xs text-cream/50 mb-2">Категория</p>
        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORIES.map((c) => {
            const CIcon = c.Icon
            const active = draft.category === c.key
            return (
              <button
                key={c.key}
                onClick={() => { haptic('light'); setDraft((d) => ({ ...d, category: c.key })) }}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all active:scale-95 ${
                  active ? 'bg-gold/15 border-gold text-gold' : 'bg-emerald-light/20 border-cream/15 text-cream/50'
                }`}
              >
                <CIcon size={17} strokeWidth={1.75} />
                <span className="text-[9px] leading-none">{c.short}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-cream/35 mt-1.5">{activeCat.hint}</p>
      </div>

      <div className="space-y-1.5 mb-4">
        <input value={draft.name} onChange={set('name')} placeholder="От чего отказываешься" className={inputCls} />
        <input value={draft.reason} onChange={set('reason')} placeholder="Зачем — что получишь взамен" className={inputCls} />
        <input value={draft.trigger} onChange={set('trigger')} placeholder="Что провоцирует (триггер)" className={inputCls} />
        <input value={draft.replacement} onChange={set('replacement')} placeholder="Чем заменить в момент тяги" className={inputCls} />
      </div>

      <button
        onClick={submit}
        disabled={!draft.name.trim() || saving}
        className="w-full py-3 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 active:scale-95"
      >
        {saving ? 'Сохраняю...' : 'Принять аскезу'}
      </button>
    </div>
  )
}

export default function Ascezas({ user, onBack }) {
  const [ascezas, setAscezas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const longPressTimer = useRef(null)

  useEffect(() => {
    if (!user) return
    api.ascezas.list(user.id)
      .then(setAscezas)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

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

  async function logAsceza(ascezaId, status) {
    try {
      const updated = await api.ascezas.log(ascezaId, user.id, status)
      setAscezas((prev) => prev.map((a) =>
        a.id === ascezaId
          ? { ...a, streak: updated.streak, total_days: updated.total_days, breaks: updated.breaks, today_status: updated.today_status }
          : a
      ))
    } catch (e) { console.error(e) }
  }

  async function createAsceza(draft) {
    try {
      const asceza = await api.ascezas.create(user.id, draft)
      setAscezas((prev) => [...prev, asceza])
      setShowCreate(false)
    } catch (e) { console.error(e) }
  }

  async function deleteAsceza(ascezaId) {
    try {
      await api.ascezas.remove(ascezaId)
      setAscezas((prev) => prev.filter((a) => a.id !== ascezaId))
    } catch (e) { console.error(e) }
  }

  async function saveOrder(list) {
    try {
      await api.ascezas.reorder(user.id, list.map((a) => a.id))
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
    const card = el?.closest('[data-asceza-index]')
    if (card) {
      const idx = Number(card.getAttribute('data-asceza-index'))
      if (idx !== overIndex) setOverIndex(idx)
    }
  }

  function handleTouchEnd() {
    cancelLongPress()
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const next = [...ascezas]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(overIndex, 0, moved)
      setAscezas(next)
      saveOrder(next)
      hapticNotify('success')
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  if (showCreate) {
    return <CreateAscezaScreen onCreate={createAsceza} onCancel={() => setShowCreate(false)} />
  }

  const heldToday = ascezas.filter((a) => a.today_status === 'held').length
  const total = ascezas.length

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <button onClick={() => { haptic('light'); onBack() }} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Назад
      </button>

      <h2 className="font-display text-2xl text-cream mb-1">Аскезы</h2>
      <p className="text-xs text-cream/40 mb-5">
        {total > 1 ? 'зажми карточку, чтобы поменять порядок' : 'от чего ты отказываешься'}
      </p>

      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-cream/50 mb-1">
            <span>Удержано сегодня</span>
            <span>{heldToday}/{total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-emerald-light/30 overflow-hidden">
            <div
              className="h-full bg-mint transition-all duration-500 ease-out"
              style={{ width: total ? `${(heldToday / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-cream/40 text-sm">Загрузка...</p>
      ) : ascezas.length === 0 ? (
        <div className="rounded-2xl border border-cream/10 bg-emerald-light/15 p-6 text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-light/40 flex items-center justify-center mx-auto mb-3">
            <Shield size={22} className="text-mint" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg text-cream mb-1">Аскез пока нет</h3>
          <p className="text-sm text-cream/50 mb-4 leading-relaxed">
            Аскеза — сознательный отказ. Выбери одну вредную привычку и назови её честно.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-gold text-emerald-deep text-sm font-medium active:scale-95">
            Принять аскезу
          </button>
        </div>
      ) : (
        <>
          <div>
            {ascezas.map((a, i) => (
              <div key={a.id} data-asceza-index={i}>
                <AscezaCard
                  asceza={a}
                  onLog={logAsceza}
                  onDelete={deleteAsceza}
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
            className="w-full py-2.5 rounded-xl border border-cream/20 text-cream/60 text-sm mt-2 active:scale-95">
            + Новая аскеза
          </button>
        </>
      )}
    </div>
  )
}