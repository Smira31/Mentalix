import { useEffect, useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { createPortal } from 'react-dom'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { ArtSprout } from '../components/Art'
import BackButton from '../components/BackButton'
import { useMainButton } from '../lib/telegram'
import { Sparkles, Snowflake, Check } from 'lucide-react'

/*
 * Карточка занимает всё, что осталось между шапкой экрана и
 * нижней навигацией. Вычитаем: контролы Telegram, шапку с
 * кнопкой назад и подписью, точки под лентой, место под меню.
 */
const CARD_HEIGHT = {
  height:
    'calc(100dvh - var(--app-safe-top) - var(--app-safe-bottom) - 290px)',
  minHeight: '380px',
}


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
      className={`rounded-[28px] overflow-y-auto overscroll-contain border flex flex-col justify-center shrink-0 snap-center w-[84%] p-5 transition-all duration-200 ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${level ? 'bg-gold/10 border-gold/30' : 'bg-emerald border-cream/12'}`}
      style={CARD_HEIGHT}
    >
      {/* шапка */}
      <div className="flex items-start justify-between gap-3">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gold/10 shrink-0">
          <Sparkles size={18} className="text-gold" strokeWidth={1.6} />
          {celebrate && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gold animate-celebrate-pop">
              <Check size={18} className="text-emerald-deep" strokeWidth={3} />
            </span>
          )}
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
              className="text-cream/30 text-base leading-none px-1 active:scale-90"
            >
              ×
            </span>
          )}
        </span>
      </div>

      {/* название и смысл */}
      <div className="mt-4">
        <h3 className="font-display text-[20px] text-cream leading-tight">
          {ritual.name}
        </h3>

        {ritual.goal && (
          <p className="text-[14px] text-cream/45 leading-relaxed mt-3">
            {ritual.goal}
          </p>
        )}
      </div>

      {/* уровни */}
      <div className="flex flex-col gap-2 pt-5">
        {ritual.min_version && (
          <button
            onClick={() => handleLog('min')}
            className={`w-full text-left rounded-[20px] px-4 py-3 border-0 transition-all duration-150 active:scale-[0.98] ${
              level === 'min' ? 'bg-cream/15' : 'bg-cream/5'
            }`}
          >
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
              level === 'min' ? 'text-cream' : 'text-cream/40'
            }`}>
              Минимум
            </div>
            <div className={`text-[13px] leading-snug ${
              level === 'min' ? 'text-cream/85' : 'text-cream/55'
            }`}>
              {ritual.min_version}
            </div>
          </button>
        )}

        {ritual.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`w-full text-left rounded-[20px] px-4 py-3 border-0 transition-all duration-150 active:scale-[0.98] ${
              level === 'optimal' ? 'bg-gold' : 'bg-cream/5'
            }`}
          >
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
              level === 'optimal' ? 'text-emerald-deep/70' : 'text-cream/40'
            }`}>
              Оптимум
            </div>
            <div className={`text-[13px] leading-snug ${
              level === 'optimal' ? 'text-emerald-deep' : 'text-cream/55'
            }`}>
              {ritual.optimal_version}
            </div>
          </button>
        )}

        {!ritual.min_version && !ritual.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`w-full py-3.5 rounded-full text-[14px] font-bold border-0 transition-all duration-150 active:scale-95 ${
              level ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-cream/50'
            }`}
          >
            {level ? 'Сделано' : 'Отметить'}
          </button>
        )}
      </div>
    </div>
  )
}


function CreateRitualScreen({ onCreate, onCancel }) {
  const { style: surfaceStyle } = useFullscreenSurface()

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

  /*
   * Действие живёт в системной кнопке: она остаётся над
   * клавиатурой, а форма здесь целиком из полей ввода.
   */
  useMainButton({
    text: saving ? 'Сохраняю...' : 'Создать ритуал',
    onClick: submit,
    enabled: Boolean(draft.name.trim()) && !saving,
    loading: saving,
  })

  /*
   * Создание ритуала — форма с клавиатурой, поэтому живёт по
   * общему fullscreen-контракту: занимает весь экран целиком.
   */
  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={FULLSCREEN_HEADER_SLOT_CLASS} aria-hidden="true" />

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-5 pb-8 flex flex-col min-h-full justify-center">
      <div className="flex items-center gap-3 mb-5 pt-2">
        <BackButton onClick={onCancel} />
        <h2 className="font-display text-[20px] text-cream lowercase">новый ритуал.</h2>
      </div>

      <div className="space-y-2 mb-5">
        <input value={draft.name} onChange={set('name')} placeholder="Название ритуала" className={inputCls} />
        <input value={draft.goal} onChange={set('goal')} placeholder="Зачем он нужен" className={inputCls} />
        <input value={draft.min_version} onChange={set('min_version')} placeholder="Минимум" className={inputCls} />
        <input value={draft.optimal_version} onChange={set('optimal_version')} placeholder="Оптимум" className={inputCls} />
        <input value={draft.skip_consequence} onChange={set('skip_consequence')} placeholder="Что теряется при пропуске" className={inputCls} />
      </div>

        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function Rituals({ user, onBack }) {
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [active, setActive] = useState(0)
  const trackRef = useRef(null)


  /*
   * Перетаскивание карточек для смены порядка убрано вместе с
   * переходом на горизонтальную ленту: удержание с последующим
   * движением пальца конфликтует с самим листанием. Функция
   * api.rituals.reorder на бэкенде осталась — вернуть порядок
   * можно явными кнопками, когда это понадобится.
   */
  function syncActive() {
    const track = trackRef.current
    if (!track) return
    const card = track.firstElementChild
    if (!card) return
    const step = card.offsetWidth + 12
    setActive(Math.round(track.scrollLeft / step))
  }

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

  const doneCount = rituals.filter((r) => r.today_level).length

  if (showCreate) {
    return <CreateRitualScreen onCreate={createRitual} onCancel={() => setShowCreate(false)} />
  }

  return (
    <div className="w-full max-w-md px-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <BackButton onClick={onBack} />
        <h2 className="font-display text-[22px] text-cream lowercase">ритуалы.</h2>
      </div>

      <p className="text-[12px] text-cream/40 mb-4 px-1">
        {rituals.length > 0
          ? `${doneCount} из ${rituals.length} закрыто сегодня`
          : 'обряды, что держат твой день'}
      </p>

      {loading ? (
        <p className="text-cream/40 text-sm">Загрузка...</p>
      ) : rituals.length === 0 ? (
        <div className="rounded-3xl bg-emerald p-8 text-center mb-4">
          <ArtSprout size={120} className="mx-auto mb-3" />
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
          <div
            ref={trackRef}
            onScroll={syncActive}
            className="flex gap-3 -mx-5 px-5 pb-1 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {rituals.map((r) => (
              <RitualCard
                key={r.id}
                ritual={r}
                onLog={logRitual}
                onDelete={deleteRitual}
              />
            ))}

            {/* последней карточкой — создание нового */}
            <button
              onClick={() => { haptic('light'); setShowCreate(true) }}
              style={CARD_HEIGHT}
              className="shrink-0 snap-center w-[84%] rounded-[28px] border border-dashed border-cream/15 bg-transparent flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <span className="text-[26px] text-cream/25 leading-none">+</span>
              <span className="text-[14px] text-cream/45 font-semibold">Новый ритуал</span>
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mt-3">
            {[...rituals, null].map((_, index) => (
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
  )
}