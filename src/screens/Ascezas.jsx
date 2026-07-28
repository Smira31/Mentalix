import { useEffect, useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { ArtShield } from '../components/Art'
import {
  ArrowLeft,
  Shield,
  ShieldOff,
  Cigarette,
  Brain,
  Users,
  Smartphone,
  Cookie,
  GripVertical,
  Check,
  X,
} from 'lucide-react'


function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}


function hapticNotify(type = 'success') {
  WebApp.HapticFeedback?.notificationOccurred(type)
}


const CATEGORIES = [
  {
    key: 'physio',
    label: 'Физиология',
    short: 'Тело',
    Icon: Cigarette,
    hint: 'курение, алкоголь, вещества',
  },
  {
    key: 'psycho',
    label: 'Психология',
    short: 'Психика',
    Icon: Brain,
    hint: 'грызть ногти, шопоголизм, жалобы',
  },
  {
    key: 'social',
    label: 'Поведение',
    short: 'Общение',
    Icon: Users,
    hint: 'перебивать, материться, опаздывать',
  },
  {
    key: 'digital',
    label: 'Цифровые',
    short: 'Экран',
    Icon: Smartphone,
    hint: 'думскроллинг, игры, телефон',
  },
  {
    key: 'food',
    label: 'Пищевые',
    short: 'Еда',
    Icon: Cookie,
    hint: 'заедание стресса, сладкое, еда у ТВ',
  },
]


const BREAK_TRIGGERS = [
  'Стресс',
  'Скука',
  'Усталость',
  'Тревога',
  'Компания',
  'Импульс',
  'Другое',
]


function categoryMeta(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[1]
}


const EMPTY_DRAFT = {
  name: '',
  category: 'psycho',
  reason: '',
  trigger: '',
  replacement: '',
}


function BreakContextSheet({
  asceza,
  onSave,
  onClose,
}) {
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!trigger || saving) return

    setSaving(true)

    try {
      await onSave(
        asceza.id,
        'broke',
        trigger,
        note.trim() || null,
      )

      hapticNotify('warning')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-black/70 border-0"
      />

      <div className="relative z-10 w-full max-w-sm rounded-t-[32px] bg-emerald border border-cream/10 px-5 pt-3 pb-8 animate-fade-in">
        <div className="w-10 h-1 rounded-full bg-cream/20 mx-auto mb-5" />

        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold/70 mb-2">
              Аскеза
            </p>

            <h2 className="font-display text-[24px] leading-tight text-cream">
              Что произошло?
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-10 h-10 rounded-full bg-cream/5 border-0 flex items-center justify-center shrink-0 active:scale-95"
          >
            <X size={18} className="text-cream/60" />
          </button>
        </div>

        <p className="text-[13px] text-cream/45 leading-relaxed mb-5">
          Ты сорвался с «{asceza.name}». Не ругаем себя — фиксируем контекст,
          чтобы Mentalix смог увидеть закономерность.
        </p>

        <p className="text-xs text-cream/55 mb-2">
          Что сильнее всего повлияло?
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {BREAK_TRIGGERS.map((item) => {
            const active = trigger === item

            return (
              <button
                key={item}
                onClick={() => {
                  haptic('light')
                  setTrigger(item)
                }}
                className={`py-3 px-3 rounded-2xl border text-[13px] font-semibold transition-all active:scale-[0.97] ${
                  active
                    ? 'bg-gold text-emerald-deep border-gold'
                    : 'bg-cream/5 text-cream/60 border-cream/10'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>

        <label className="block text-xs text-cream/55 mb-2">
          Хочешь добавить пару слов?
        </label>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Например: вернулся после тяжёлого дня и автоматически открыл Reels"
          className="w-full resize-none bg-black/20 border border-cream/10 rounded-2xl px-4 py-3 text-[14px] leading-relaxed text-cream placeholder-cream/25 outline-none focus:border-gold/50 transition-colors"
        />

        {asceza.replacement && (
          <div className="mt-4 rounded-2xl bg-mint/5 border border-mint/10 px-4 py-3">
            <p className="text-[11px] text-mint/50 mb-1">
              Ты заранее выбрал замену
            </p>

            <p className="text-[14px] text-mint/85">
              {asceza.replacement}
            </p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!trigger || saving}
          className="cta-pill w-full py-4 text-[16px] mt-5 disabled:opacity-35"
        >
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>

        <p className="text-[11px] text-center text-cream/30 mt-3">
          Срыв — это данные, а не провал.
        </p>
      </div>
    </div>
  )
}


function AscezaCard({
  asceza,
  onLog,
  onBreak,
  onDelete,
  dragHandlers,
  isDragging,
  isOver,
}) {
  const status = asceza.today_status
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const meta = categoryMeta(asceza.category)
  const Icon = meta.Icon

  function handleHeld() {
    const wasUnset = !status

    haptic('medium')

    if (wasUnset) {
      hapticNotify('success')
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 700)
    }

    onLog(asceza.id, 'held')
  }

  function handleBroke() {
    haptic('medium')

    // Если срыв уже отмечен, повторное нажатие снимает отметку,
    // сохраняя прежнее поведение API.
    if (status === 'broke') {
      onLog(asceza.id, 'broke')
      return
    }

    onBreak(asceza)
  }

  return (
    <div
      {...dragHandlers}
      className={`rounded-3xl overflow-hidden mb-3 transition-all duration-200 ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${
        isDragging
          ? 'opacity-60 scale-[1.03] shadow-lg shadow-black/40 z-10 relative'
          : ''
      } ${
        isOver
          ? 'ring-1 ring-gold/60'
          : ''
      } ${
        status === 'held'
          ? 'bg-gold/10'
          : status === 'broke'
            ? 'bg-emerald-light/40'
            : 'bg-emerald'
      }`}
    >
      <div className="w-full flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical
            size={16}
            className="text-cream/25 shrink-0"
          />

          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gold/10 shrink-0">
            <Icon
              size={16}
              className="text-gold"
              strokeWidth={1.75}
            />

            {celebrate && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gold animate-celebrate-pop">
                <Check
                  size={16}
                  className="text-emerald-deep"
                  strokeWidth={3}
                />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-[15px] font-bold text-cream truncate">
              {asceza.name}
            </div>

            <div className="text-[10px] text-cream/40">
              {meta.label}
            </div>
          </div>
        </div>

        <span className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-mint whitespace-nowrap">
            🛡 {asceza.streak}
          </span>

          {confirming ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => {
                  haptic('rigid')
                  onDelete(asceza.id)
                }}
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
        {asceza.reason && (
          <p className="text-xs text-cream/45 mb-2">
            {asceza.reason}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleHeld}
            className={`flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              status === 'held'
                ? 'bg-gold text-emerald-deep'
                : 'bg-cream/5 text-cream/50'
            }`}
          >
            <Shield size={13} />
            Удержался
          </button>

          <button
            onClick={handleBroke}
            className={`flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              status === 'broke'
                ? 'bg-cream/15 text-cream'
                : 'bg-cream/5 text-cream/50'
            }`}
          >
            <ShieldOff size={13} />
            Сорвался
          </button>
        </div>

        {status === 'broke' && asceza.today_break_trigger && (
          <p className="text-xs text-cream/55 mt-3">
            Причина: {asceza.today_break_trigger}
          </p>
        )}

        {status === 'broke' && asceza.today_break_note && (
          <p className="text-xs text-cream/40 mt-1 leading-relaxed">
            {asceza.today_break_note}
          </p>
        )}

        {status === 'broke' && asceza.replacement && (
          <p className="text-xs text-mint/70 mt-2">
            Замена: {asceza.replacement}
          </p>
        )}

        {!status && asceza.trigger && (
          <p className="text-xs text-cream/35 mt-2 italic">
            Триггер: {asceza.trigger}
          </p>
        )}
      </div>
    </div>
  )
}


function CreateAscezaScreen({
  onCreate,
  onCancel,
}) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  function set(field) {
    return (e) => {
      setDraft((current) => ({
        ...current,
        [field]: e.target.value,
      }))
    }
  }

  async function submit() {
    if (!draft.name.trim() || saving) return

    setSaving(true)

    try {
      await onCreate(draft)
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-emerald border border-cream/10 rounded-2xl px-4 py-3.5 text-[15px] text-cream placeholder-cream/30 outline-none focus:border-gold/50 transition-colors'

  const activeCat = categoryMeta(draft.category)

  return (
    <div className="w-full max-w-sm px-5 pb-6 -mt-4">
      <div className="flex items-center gap-3 mb-5 pt-2">
        <button
          onClick={onCancel}
          aria-label="Отмена"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ArrowLeft
            size={18}
            className="text-cream/60"
          />
        </button>

        <h2 className="font-display text-[20px] text-cream lowercase">
          новая аскеза.
        </h2>
      </div>

      <div className="mb-3">
        <p className="text-xs text-cream/50 mb-2">
          Категория
        </p>

        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORIES.map((category) => {
            const CategoryIcon = category.Icon
            const active = draft.category === category.key

            return (
              <button
                key={category.key}
                onClick={() => {
                  haptic('light')

                  setDraft((current) => ({
                    ...current,
                    category: category.key,
                  }))
                }}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-0 transition-all active:scale-95 ${
                  active
                    ? 'bg-gold/15 text-gold'
                    : 'bg-emerald text-cream/40'
                }`}
              >
                <CategoryIcon
                  size={17}
                  strokeWidth={1.75}
                />

                <span className="text-[9px] leading-none">
                  {category.short}
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-[11px] text-cream/35 mt-1.5">
          {activeCat.hint}
        </p>
      </div>

      <div className="space-y-2 mb-5">
        <input
          value={draft.name}
          onChange={set('name')}
          placeholder="От чего отказываешься"
          className={inputCls}
        />

        <input
          value={draft.reason}
          onChange={set('reason')}
          placeholder="Зачем — что получишь взамен"
          className={inputCls}
        />

        <input
          value={draft.trigger}
          onChange={set('trigger')}
          placeholder="Что провоцирует (триггер)"
          className={inputCls}
        />

        <input
          value={draft.replacement}
          onChange={set('replacement')}
          placeholder="Чем заменить в момент тяги"
          className={inputCls}
        />
      </div>

      <button
        onClick={submit}
        disabled={!draft.name.trim() || saving}
        className="cta-pill w-full py-4 text-[16px] disabled:opacity-40"
      >
        {saving
          ? 'Сохраняю...'
          : 'Принять аскезу'}
      </button>
    </div>
  )
}


export default function Ascezas({
  user,
  onBack,
}) {
  const [ascezas, setAscezas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const [breakTarget, setBreakTarget] = useState(null)

  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const longPressTimer = useRef(null)


  useEffect(() => {
    if (!user) return

    api.ascezas
      .list(user.id)
      .then(setAscezas)
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user])


  useEffect(() => {
    if (dragIndex !== null || breakTarget) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    if (dragIndex !== null) {
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.touchAction = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [dragIndex, breakTarget])


  async function logAsceza(
    ascezaId,
    status,
    breakTrigger = null,
    breakNote = null,
  ) {
    try {
      const updated = await api.ascezas.log(
        ascezaId,
        user.id,
        status,
        breakTrigger,
        breakNote,
      )

      setAscezas((previous) =>
        previous.map((asceza) =>
          asceza.id === ascezaId
            ? {
                ...asceza,
                streak: updated.streak,
                total_days: updated.total_days,
                breaks: updated.breaks,
                today_status: updated.today_status,
                today_break_trigger:
                  updated.today_break_trigger,
                today_break_note:
                  updated.today_break_note,
              }
            : asceza,
        ),
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  }


  async function createAsceza(draft) {
    try {
      const asceza = await api.ascezas.create(
        user.id,
        draft,
      )

      setAscezas((previous) => [
        ...previous,
        asceza,
      ])

      setShowCreate(false)
    } catch (error) {
      console.error(error)
    }
  }


  async function deleteAsceza(ascezaId) {
    try {
      await api.ascezas.remove(ascezaId)

      setAscezas((previous) =>
        previous.filter(
          (asceza) => asceza.id !== ascezaId,
        ),
      )
    } catch (error) {
      console.error(error)
    }
  }


  async function saveOrder(list) {
    try {
      await api.ascezas.reorder(
        user.id,
        list.map((asceza) => asceza.id),
      )
    } catch (error) {
      console.error(error)
    }
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


  function handleTouchMove(event) {
    if (dragIndex === null) return

    const touch = event.touches[0]

    const element = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    )

    const card = element?.closest(
      '[data-asceza-index]',
    )

    if (!card) return

    const index = Number(
      card.getAttribute('data-asceza-index'),
    )

    if (index !== overIndex) {
      setOverIndex(index)
    }
  }


  function handleTouchEnd() {
    cancelLongPress()

    if (
      dragIndex !== null
      && overIndex !== null
      && dragIndex !== overIndex
    ) {
      const next = [...ascezas]

      const [moved] = next.splice(
        dragIndex,
        1,
      )

      next.splice(
        overIndex,
        0,
        moved,
      )

      setAscezas(next)
      saveOrder(next)
      hapticNotify('success')
    }

    setDragIndex(null)
    setOverIndex(null)
  }


  if (showCreate) {
    return (
      <CreateAscezaScreen
        onCreate={createAsceza}
        onCancel={() => setShowCreate(false)}
      />
    )
  }


  const heldToday = ascezas.filter(
    (asceza) =>
      asceza.today_status === 'held',
  ).length

  const total = ascezas.length


  return (
    <>
      <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => {
              haptic('light')
              onBack()
            }}
            aria-label="Назад"
            className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
          >
            <ArrowLeft
              size={18}
              className="text-cream/60"
            />
          </button>

          <h2 className="font-display text-[22px] text-cream lowercase">
            аскезы.
          </h2>
        </div>

        <p className="text-[12px] text-cream/40 mb-5 px-1">
          {total > 1
            ? 'зажми карточку, чтобы поменять порядок'
            : 'от чего ты отказываешься'}
        </p>

        {total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-cream/50 mb-1">
              <span>
                Удержано сегодня
              </span>

              <span>
                {heldToday}/{total}
              </span>
            </div>

            <div className="h-1.5 rounded-full bg-cream/10 overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-500 ease-out"
                style={{
                  width: total
                    ? `${(heldToday / total) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-cream/40 text-sm">
            Загрузка...
          </p>
        ) : ascezas.length === 0 ? (
          <div className="rounded-3xl bg-emerald p-8 text-center mb-4">
            <ArtShield
              size={120}
              className="mx-auto mb-3"
            />

            <h3 className="font-display text-lg text-cream mb-1">
              Аскез пока нет
            </h3>

            <p className="text-sm text-cream/50 mb-4 leading-relaxed">
              Аскеза — сознательный отказ.
              Выбери одну вредную привычку
              и назови её честно.
            </p>

            <button
              onClick={() => setShowCreate(true)}
              className="cta-pill px-9 py-3.5 text-[14px]"
            >
              Принять аскезу
            </button>
          </div>
        ) : (
          <>
            <div>
              {ascezas.map((asceza, index) => (
                <div
                  key={asceza.id}
                  data-asceza-index={index}
                >
                  <AscezaCard
                    asceza={asceza}
                    onLog={logAsceza}
                    onBreak={setBreakTarget}
                    onDelete={deleteAsceza}
                    isDragging={
                      dragIndex === index
                    }
                    isOver={
                      dragIndex !== null
                      && overIndex === index
                      && dragIndex !== index
                    }
                    dragHandlers={{
                      onTouchStart: () =>
                        startLongPress(index),
                      onTouchMove:
                        handleTouchMove,
                      onTouchEnd:
                        handleTouchEnd,
                      onTouchCancel:
                        handleTouchEnd,
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                haptic('light')
                setShowCreate(true)
              }}
              className="w-full py-3.5 rounded-full bg-emerald text-cream/60 text-[14px] font-semibold mt-2 active:scale-[0.98] border-0 transition-transform"
            >
              + Новая аскеза
            </button>
          </>
        )}
      </div>

      {breakTarget && (
        <BreakContextSheet
          asceza={breakTarget}
          onSave={logAsceza}
          onClose={() => setBreakTarget(null)}
        />
      )}
    </>
  )
}