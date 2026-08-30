import { useEffect, useState, useRef } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { invalidateTodayData } from '../lib/todayDataCache'
import { invalidatePracticesData } from '../lib/practicesDataCache'
import BackButton from '../components/BackButton'
import WebActionBar from '../components/WebActionBar'
import { useMainButton, useBackButton } from '../platform/telegram.hooks'
import {
  isLinkedWebWriteBlocked,
  LINKED_WEB_WRITE_NOTICE,
} from '../lib/webAuthLimits'
import '../components/practices/SceneLayout.css'
import { createPortal } from 'react-dom'
import { useVisualViewportHeight } from '../lib/visualViewport'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import SemanticGlyph, { semanticKindForAsceza } from '../components/SemanticGlyph'
import EmptyState from '../components/EmptyState'
import StreakBar from '../components/StreakBar'
import { Shield, ShieldOff, Cigarette, Brain, Users, Smartphone, Cookie, X } from 'lucide-react'

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

const BREAK_TRIGGERS = ['Стресс', 'Скука', 'Усталость', 'Тревога', 'Компания', 'Импульс', 'Другое']

function categoryMeta(key) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[1]
}

const EMPTY_DRAFT = {
  name: '',
  category: 'psycho',
  reason: '',
  trigger: '',
  replacement: '',
  relapse_cost: '',
}

function BreakContextSheet({ asceza, onSave, onClose }) {
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const viewportHeight = useVisualViewportHeight()

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
      const result = await onSave(asceza.id, 'broke', trigger, note.trim() || null)
      if (result?.error === 'linked_web_blocked') {
        setError(LINKED_WEB_WRITE_NOTICE)
        return
      }

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

      <div
        className="relative z-10 w-full max-w-sm max-h-[88dvh] rounded-t-[32px] bg-emerald border border-cream/10 px-5 pt-3 pb-8 animate-fade-in flex flex-col overflow-hidden"
        style={viewportHeight ? { maxHeight: `min(88dvh, ${viewportHeight}px)` } : undefined}
      >
        <div className="shrink-0 w-10 h-1 rounded-full bg-cream/20 mx-auto mb-5" />

        <div className="shrink-0 flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
              Аскеза
            </p>

            <h2 className="font-display text-[22px] leading-tight text-cream">Что произошло?</h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="practice-scene__choice w-10 h-10 rounded-full bg-cream/5 border-0 flex items-center justify-center shrink-0"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        <div className="practice-sheet__body">
          <p className="text-[12px] text-muted leading-relaxed mb-5">
            Ты сорвался с «{asceza.name}». Не ругаем себя — фиксируем контекст, чтобы Mentalix смог
            увидеть закономерность.
          </p>

          <p className="text-[11px] text-muted mb-2">Что сильнее всего повлияло?</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {BREAK_TRIGGERS.map(item => {
              const active = trigger === item

              return (
                <button
                  key={item}
                  onClick={() => {
                    platform.haptic('light')
                    setTrigger(item)
                  }}
                  className={`practice-scene__choice py-3 px-3 rounded-2xl border text-[12px] font-semibold ${
                    active
                      ? 'bg-gold text-emerald-deep border-gold'
                      : 'bg-cream/5 text-muted border-cream/10'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>

          <label className="block text-[11px] text-muted mb-2">Хочешь добавить пару слов?</label>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Например: вернулся после тяжёлого дня и автоматически открыл Reels"
            className="w-full resize-none bg-black/20 border border-cream/10 rounded-2xl px-4 py-3 text-[16px] leading-relaxed text-cream placeholder-muted outline-none focus:border-gold/50 transition-colors"
          />

          {asceza.replacement && (
            <div className="mt-4 rounded-2xl bg-mint/5 border border-mint/10 px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Ты заранее выбрал замену</p>

              <p className="text-[13px] text-cream">{asceza.replacement}</p>
            </div>
          )}

          {error && <p role="alert" className="text-[12px] text-amber-200 mt-3 leading-relaxed">{error}</p>}

          <button
            onClick={submit}
            disabled={!trigger || saving}
            className="cta-pill w-full py-4 text-[16px] mt-5 disabled:opacity-35"
          >
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </button>

          <p className="text-[11px] text-center text-faint mt-3">Срыв — это данные, а не провал.</p>
        </div>
      </div>
    </div>,
    document.body
  )
}

function AscezaCard({ asceza, onLog, onBreak, onDelete }) {
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
      className={`practice-motion-card practice-detail-card relative rounded-[28px] overflow-y-auto overscroll-contain shrink-0 snap-center w-[84%] border p-5 flex flex-col ${
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
                className="practice-scene__choice text-[10px] px-2 py-0.5 rounded border border-cream/20 bg-cream/5 text-muted"
              >
                Удалить
              </button>

              <button
                onClick={() => setConfirming(false)}
                className="practice-scene__choice text-[10px] px-2 py-0.5 rounded border border-cream/20 text-muted"
              >
                Отмена
              </button>
            </span>
          ) : (
            <span
              onClick={() => setConfirming(true)}
              className="practice-scene__choice text-faint text-[13px] leading-none px-1"
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
        className={`-mx-5 basis-1/3 shrink-0 min-h-0 mt-3 bg-artbed border-y border-cream/[0.06] mx-practice-detail-art ${
          status === 'held' ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <SemanticGlyph kind={semanticKindForAsceza(asceza)} className="w-full h-full" />
      </div>

      <div className="mt-4">
        <div className="font-display text-[18px] text-cream leading-tight">{asceza.name}</div>

        <div className="text-[10px] text-muted mb-3">{meta.label}</div>

        {asceza.reason && <p className="text-[11px] text-muted mb-2">{asceza.reason}</p>}

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleHeld}
            className={`practice-scene__choice flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 flex items-center justify-center gap-1.5 ${
              status === 'held' ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted'
            }`}
          >
            <Shield size={13} />
            Удержался
          </button>

          <button
            onClick={handleBroke}
            className={`practice-scene__choice flex-1 py-2.5 rounded-full text-[12px] font-semibold border-0 flex items-center justify-center gap-1.5 ${
              status === 'broke' ? 'bg-cream/15 text-cream' : 'bg-cream/5 text-muted'
            }`}
          >
            <ShieldOff size={13} />
            Сорвался
          </button>
        </div>

        {status === 'broke' && asceza.today_break_trigger && (
          <p className="text-[11px] text-muted mt-3">Причина: {asceza.today_break_trigger}</p>
        )}

        {status === 'broke' && asceza.today_break_note && (
          <p className="text-[11px] text-muted mt-1 leading-relaxed">{asceza.today_break_note}</p>
        )}

        {status === 'broke' && asceza.replacement && (
          <p className="text-[11px] text-muted mt-2">Замена: {asceza.replacement}</p>
        )}

        {!status && asceza.trigger && (
          <p className="text-[11px] text-faint mt-2 italic">Триггер: {asceza.trigger}</p>
        )}
      </div>
    </div>
  )
}

function CreateAscezaScreen({ onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return e => {
      setDraft(current => ({
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
  async function submit() {
    if (!draft.name.trim() || saving) return

    setSaving(true)
    setError(null)

    try {
      const result = await onCreate(draft)
      if (result?.error === 'linked_web_blocked') {
        setError(
          'Открой Mentalix в Telegram, чтобы принять аскезу — привязанному аккаунту это пока доступно только там.'
        )
      } else if (!result) {
        setError('Не получилось сохранить аскезу. Проверь соединение и попробуй ещё раз.')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-emerald border border-cream/10 rounded-2xl px-4 py-3.5 text-[16px] text-cream placeholder-muted outline-none focus:border-gold/50 transition-colors'

  useMainButton({
    text: saving ? 'Сохраняю...' : 'Принять аскезу',
    onClick: submit,
    enabled: Boolean(draft.name.trim()) && !saving,
    loading: saving,
  })

  const webAction = {
    text: saving ? 'Сохраняю...' : 'Принять аскезу',
    onClick: submit,
    disabled: !draft.name.trim() || saving,
  }

  /*
   * Создание аскезы — сфокусированный сценарий с формой и
   * клавиатурой, поэтому живёт по общему fullscreen-контракту:
   * занимает весь экран и не борется с нижней навигацией.
   */
  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} px-5`}>
        <div className="w-full max-w-md mx-auto">
          <BackButton onClick={onCancel} />
        </div>
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} practice-form__scroll`}>
        <div className="practice-form__inner w-full max-w-md mx-auto px-5 flex flex-col">
          <div className="mb-8">
            <h2 className="font-display text-[24px] font-semibold text-cream lowercase">
              новая аскеза.
            </h2>
          </div>

          <div className="practice-form__fields mb-5">
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
            <input
              value={draft.relapse_cost}
              onChange={set('relapse_cost')}
              placeholder="Цена срыва"
              className={inputCls}
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-red-300 leading-relaxed mb-2">
              {error}
            </p>
          )}
        </div>
      </div>
      <WebActionBar action={webAction} />
    </div>,
    document.body
  )
}

export default function Ascezas({ user, onBack }) {
  const [ascezas, setAscezas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const [breakTarget, setBreakTarget] = useState(null)

  const [active, setActive] = useState(0)
  const [writeError, setWriteError] = useState(null)

  const trackRef = useRef(null)

  useEffect(() => {
    if (!user) return

    api.ascezas
      .list(user.id)
      .then(setAscezas)
      .catch(error => {
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

  async function logAsceza(ascezaId, status, breakTrigger = null, breakNote = null) {
    try {
      const updated = await api.ascezas.log(ascezaId, user.id, status, breakTrigger, breakNote)
      setWriteError(null)

      setAscezas(previous =>
        previous.map(asceza =>
          asceza.id === ascezaId
            ? {
                ...asceza,
                streak: updated.streak,
                total_days: updated.total_days,
                breaks: updated.breaks,
                today_status: updated.today_status,
                today_break_trigger: updated.today_break_trigger,
                today_break_note: updated.today_break_note,
              }
            : asceza
        )
      )
      invalidateTodayData(user.id)
      invalidatePracticesData(user.id)
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) {
        setWriteError(LINKED_WEB_WRITE_NOTICE)
        return { error: 'linked_web_blocked' }
      }
      throw error
    }
  }

  async function createAsceza(draft) {
    try {
      const asceza = await api.ascezas.create(user.id, draft)

      setAscezas(previous => [...previous, asceza])
      setShowCreate(false)
      return asceza
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) return { error: 'linked_web_blocked' }
      return null
    }
  }

  async function deleteAsceza(ascezaId) {
    try {
      await api.ascezas.remove(ascezaId)

      setAscezas(previous => previous.filter(asceza => asceza.id !== ascezaId))
      setWriteError(null)
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) setWriteError(LINKED_WEB_WRITE_NOTICE)
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
    return <CreateAscezaScreen onCreate={createAsceza} onCancel={() => setShowCreate(false)} />
  }

  const heldToday = ascezas.filter(asceza => asceza.today_status === 'held').length

  const total = ascezas.length

  return (
    <>
      <div className="w-full max-w-md px-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <BackButton onClick={onBack} />

          <h2 className="font-display text-[20px] text-cream lowercase">аскезы.</h2>
        </div>

        <p className="text-[12px] text-muted mb-5 px-1">
          {total > 0 ? `${heldToday} из ${total} удержано сегодня` : 'от чего ты отказываешься'}
        </p>

        {writeError && <p role="alert" className="text-[12px] text-amber-200 mb-4 px-1 leading-relaxed">{writeError}</p>}

        {loading ? (
          <p className="text-muted text-[13px]">Загрузка...</p>
        ) : ascezas.length === 0 ? (
          <EmptyState
            glyph={
              <div className="w-full h-[150px] max-w-[220px] mx-auto mb-3">
                <SemanticGlyph kind="asceza" className="w-full h-full" />
              </div>
            }
            className="mb-4"
          >
            <h3 className="font-display text-[16px] text-cream mb-1">Аскез пока нет</h3>

            <p className="text-[13px] text-muted mb-4 leading-relaxed">
              Аскеза — сознательный отказ. Выбери одну вредную привычку и назови её честно.
            </p>

            <button
              onClick={() => setShowCreate(true)}
              className="cta-pill px-9 py-3.5 text-[13px]"
            >
              Принять аскезу
            </button>
          </EmptyState>
        ) : (
          <>
            <div
              ref={trackRef}
              onScroll={syncActive}
              className="flex gap-3 -mx-5 px-5 pb-1 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {ascezas.map(asceza => (
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
                className="practice-motion-card practice-detail-card shrink-0 snap-center w-[84%] rounded-[28px] border border-dashed border-cream/15 bg-transparent flex flex-col items-center justify-center gap-2"
              >
                <span className="text-[22px] text-faint leading-none">+</span>
                <span className="text-[13px] text-muted font-semibold">Новая аскеза</span>
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
