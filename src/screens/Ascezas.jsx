import { useEffect, useState, useRef } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import BackButton from '../components/BackButton'
import { useMainButton, useBackButton } from '../platform/telegram.hooks'
import { createPortal } from 'react-dom'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import Motif, { MotifArt, motifForAsceza } from '../components/Motif'
import StreakBar from '../components/StreakBar'
import {
  Shield,
  ShieldOff,
  Cigarette,
  Brain,
  Users,
  Smartphone,
  Cookie,
  X,
} from 'lucide-react'


/*
 * Карточка занимает всё между шапкой экрана и нижней навигацией.
 */
/*
 * Верхний предел обязателен. Высота считается от 100dvh, и на
 * телефоне это даёт ~470px — то, подо что карточка рисовалась.
 * На широком экране Telegram Desktop то же выражение даёт под
 * семьсот, карточка растягивается и рисунок с текстом расползаются.
 * На телефоне min() ничего не меняет: там всегда выигрывает calc.
 */
const CARD_HEIGHT = {
  height:
    'min(560px, calc(100dvh - var(--app-safe-top) - var(--app-safe-bottom) - 290px))',
  minHeight: '380px',
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

  /*
   * Системная «Назад» должна закрывать шторку, а не весь экран
   * аскез: стек в telegram.js держит верхний обработчик, поэтому
   * пока шторка открыта — «назад» принадлежит ей.
   */
  useBackButton(onClose)

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

      platform.haptic('warning')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  /*
   * Портал в body обязателен: контейнер контента в App.jsx несёт
   * остаточный transform от анимации, и `fixed` внутри него
   * якорится к контейнеру, а не к экрану. Шторка вылезала не там,
   * где должна.
   */
  return createPortal(
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
                  platform.haptic('light')
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
          className="w-full resize-none bg-black/20 border border-cream/10 rounded-2xl px-4 py-3 text-[14px] leading-relaxed text-cream placeholder-muted outline-none focus:border-gold/50 transition-colors"
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

        <p className="text-[11px] text-center text-faint mt-3">
          Срыв — это данные, а не провал.
        </p>
      </div>
    </div>,
    document.body,
  )
}


function AscezaCard({
  asceza,
  onLog,
  onBreak,
  onDelete,
}) {
  const status = asceza.today_status
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const meta = categoryMeta(asceza.category)

  function handleHeld() {
    const wasUnset = !status

    platform.haptic('medium')

    if (wasUnset) {
      platform.haptic('success')
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 700)
    }

    onLog(asceza.id, 'held')
  }

  function handleBroke() {
    platform.haptic('medium')

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
      style={CARD_HEIGHT}
      className={`relative rounded-[28px] overflow-y-auto overscroll-contain shrink-0 snap-center w-[84%] border p-5 flex flex-col transition-all duration-200 ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${
        status === 'held'
          ? 'bg-gold/10 border-gold/30'
          : status === 'broke'
            ? 'bg-emerald-light/40 border-cream/12'
            : 'bg-emerald border-cream/12'
      }`}
    >
      {/* серия — вверху, там её ищут глазами первой */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <StreakBar streak={asceza.streak} tone="mint" />

        <span className="flex items-center gap-2 shrink-0">
          {confirming ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => {
                  platform.haptic('rigid')
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
              className="text-faint text-sm leading-none px-1 active:scale-90"
            >
              ×
            </span>
          )}
        </span>
      </div>

      {/*
        * Верхняя треть — рисунок своей категории. Общий жест у
        * всех пяти один: коридор из двух прямых, внутри порядок,
        * снаружи тот же материал в беспорядке.
        */}
      <div
        className={`-mx-5 basis-1/3 shrink-0 min-h-0 mt-3 bg-artbed border-y border-cream/[0.06] ${
          status === 'held' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <Motif name={motifForAsceza(asceza.category)} className="w-full h-full" />
      </div>

      <div className="mt-4">
        <div className="font-display text-[19px] text-cream leading-tight">
          {asceza.name}
        </div>

        <div className="text-[10px] text-muted mb-3">
          {meta.label}
        </div>

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
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {asceza.today_break_note}
          </p>
        )}

        {status === 'broke' && asceza.replacement && (
          <p className="text-xs text-mint/70 mt-2">
            Замена: {asceza.replacement}
          </p>
        )}

        {!status && asceza.trigger && (
          <p className="text-xs text-faint mt-2 italic">
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

  const { style: surfaceStyle } = useFullscreenSurface()

  /*
   * Действие живёт в системной кнопке: она остаётся над
   * клавиатурой, а форма здесь целиком из полей ввода.
   */
  useMainButton({
    text: saving ? 'Сохраняю...' : 'Принять аскезу',
    onClick: submit,
    enabled: Boolean(draft.name.trim()) && !saving,
    loading: saving,
  })


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
    'w-full bg-emerald border border-cream/10 rounded-2xl px-4 py-3.5 text-[15px] text-cream placeholder-muted outline-none focus:border-gold/50 transition-colors'

  const activeCat = categoryMeta(draft.category)

  /*
   * Создание аскезы — сфокусированный сценарий с формой и
   * клавиатурой, поэтому живёт по общему fullscreen-контракту:
   * занимает весь экран и не борется с нижней навигацией.
   */
  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={FULLSCREEN_HEADER_SLOT_CLASS} aria-hidden="true" />

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-5 pb-8 flex flex-col min-h-full justify-center">
      <div className="flex items-center gap-3 mb-5 pt-2">
        <BackButton onClick={onCancel} />

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
                  platform.haptic('light')

                  setDraft((current) => ({
                    ...current,
                    category: category.key,
                  }))
                }}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-0 transition-all active:scale-95 ${
                  active
                    ? 'bg-gold/15 text-gold'
                    : 'bg-emerald text-muted'
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

        <p className="text-[11px] text-faint mt-1.5">
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

        </div>
      </div>
    </div>,
    document.body,
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

  const [active, setActive] = useState(0)
  const trackRef = useRef(null)


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


  /*
   * Пока открыт разбор срыва, страница под ним не скроллится.
   */
  useEffect(() => {
    document.body.style.overflow = breakTarget ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [breakTarget])


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







  function syncActive() {
    const track = trackRef.current
    if (!track) return
    const card = track.firstElementChild
    if (!card) return
    const step = card.offsetWidth + 12
    setActive(Math.round(track.scrollLeft / step))
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
      <div className="w-full max-w-md px-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <BackButton onClick={onBack} />

          <h2 className="font-display text-[22px] text-cream lowercase">
            аскезы.
          </h2>
        </div>

        <p className="text-[12px] text-muted mb-5 px-1">
          {total > 0
            ? `${heldToday} из ${total} удержано сегодня`
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
          <p className="text-muted text-sm">
            Загрузка...
          </p>
        ) : ascezas.length === 0 ? (
          <div className="rounded-3xl bg-emerald p-8 text-center mb-4">
            <MotifArt
              name="povedenie"
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
            <div
              ref={trackRef}
              onScroll={syncActive}
              className="flex gap-3 -mx-5 px-5 pb-1 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {ascezas.map((asceza) => (
                <AscezaCard
                  key={asceza.id}
                  asceza={asceza}
                  onLog={logAsceza}
                  onBreak={setBreakTarget}
                  onDelete={deleteAsceza}
                />
              ))}

              <button
                onClick={() => {
                  platform.haptic('light')
                  setShowCreate(true)
                }}
                style={CARD_HEIGHT}
                className="shrink-0 snap-center w-[84%] rounded-[28px] border border-dashed border-cream/15 bg-transparent flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform"
              >
                <span className="text-[26px] text-faint leading-none">+</span>
                <span className="text-[14px] text-cream/45 font-semibold">Новая аскеза</span>
              </button>
            </div>

            <div className="flex justify-center gap-1.5 mt-3">
              {[...ascezas, null].map((_, index) => (
                <span
                  key={index}
                  className={[
                    'h-[3px] rounded-full transition-all duration-200',
                    index === active ? 'w-5 bg-gold' : 'w-4 bg-cream/15',
                  ].join(' ')}
                />
              ))}
            </div>
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
