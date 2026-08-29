import { useEffect, useState, useRef } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { invalidateTodayData } from '../lib/todayDataCache'
import { invalidatePracticesData } from '../lib/practicesDataCache'
import { createPortal } from 'react-dom'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import SemanticGlyph, { semanticKindForRitual } from '../components/SemanticGlyph'
import StreakBar from '../components/StreakBar'
import EmptyState from '../components/EmptyState'
import BackButton from '../components/BackButton'
import WebActionBar from '../components/WebActionBar'
import { useMainButton } from '../platform/telegram.hooks'
import { isLinkedWebWriteBlocked } from '../lib/webAuthLimits'
import '../components/practices/SceneLayout.css'

/*
 * Карточка занимает всё, что осталось между шапкой экрана и
 * нижней навигацией — через flex (RITUALS_ROOT_CLASS/TRACK_CLASS
 * ниже), а не подсчётом пикселей: App.jsx уже владеет верхним и
 * нижним отступом экрана (см. контракт в App.jsx), пересчитывать
 * их здесь через 100dvh было хрупко и разъезжалось на реальных
 * устройствах — та же природа бага, что была в CreateRitualScreen.
 * min/max оставлены как есть: нижний предел — чтобы карточка не
 * сжималась в тесноте, верхний — чтобы на широком экране Telegram
 * Desktop она не растягивалась до нечитаемых пропорций.
 */
const EMPTY_DRAFT = {
  name: '',
  category: 'psycho',
  goal: '',
  min_version: '',
  optimal_version: '',
  skip_consequence: '',
}

function RitualCard({ ritual, onLog, onDelete }) {
  const level = ritual.today_level
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [streakBump, setStreakBump] = useState(false)

  function handleLog(lvl) {
    const wasUnset = !level
    platform.haptic('medium')
    if (wasUnset) {
      platform.haptic('success')
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
      className={`practice-motion-card practice-detail-card relative rounded-[28px] overflow-y-auto overscroll-contain border flex flex-col shrink-0 snap-center w-[84%] p-5 ${
        celebrate ? 'animate-glow-pulse' : ''
      } ${level ? 'bg-gold/10 border-gold/30' : 'bg-emerald border-cream/12'}`}
    >
      {/* серия — вверху, там её ищут глазами первой */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <StreakBar streak={ritual.streak} freezes={ritual.freezes} bump={streakBump} />

        <span className="flex items-center gap-2 shrink-0">
          {confirming ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => {
                  platform.haptic('rigid')
                  onDelete(ritual.id)
                }}
                className="practice-scene__choice text-[10px] px-2 py-0.5 rounded bg-cream/15 text-cream"
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
              className="practice-scene__choice text-faint text-base leading-none px-1"
            >
              ×
            </span>
          )}
        </span>
      </div>

      {/*
       * Верхняя треть — рисунок. Мотив угадывается по названию
       * ритуала, поэтому новый ритуал получает свою картинку
       * сразу, без правок в базе.
       */}
      <div
        className={`-mx-5 basis-1/3 shrink-0 min-h-0 mt-3 bg-artbed border-y border-cream/[0.06] mx-practice-detail-art ${
          level ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <SemanticGlyph kind={semanticKindForRitual(ritual.name)} className="w-full h-full" />
      </div>

      {/* название и смысл */}
      <div className="mt-4">
        <h3 className="font-display text-[18px] text-cream leading-tight">{ritual.name}</h3>

        {ritual.goal && (
          <p className="text-[13px] text-muted leading-relaxed mt-3">{ritual.goal}</p>
        )}
      </div>

      {/* уровни */}
      <div className="flex flex-col gap-3 pt-5 mt-auto">
        {ritual.min_version && (
          <button
            onClick={() => handleLog('min')}
            className={`practice-scene__choice w-full text-left rounded-[20px] px-4 py-3 border-0 ${
              level === 'min' ? 'bg-cream/15' : 'bg-cream/5'
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                level === 'min' ? 'text-cream' : 'text-muted'
              }`}
            >
              Минимум
            </div>
            <div
              className={`text-[12px] leading-snug ${
                level === 'min' ? 'text-cream' : 'text-muted'
              }`}
            >
              {ritual.min_version}
            </div>
          </button>
        )}

        {ritual.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`practice-scene__choice w-full text-left rounded-[20px] px-4 py-3 border-0 ${
              level === 'optimal' ? 'bg-gold' : 'bg-cream/5'
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                level === 'optimal' ? 'text-emerald-deep/70' : 'text-muted'
              }`}
            >
              Оптимум
            </div>
            <div
              className={`text-[12px] leading-snug ${
                level === 'optimal' ? 'text-emerald-deep' : 'text-muted'
              }`}
            >
              {ritual.optimal_version}
            </div>
          </button>
        )}

        {!ritual.min_version && !ritual.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`practice-scene__choice w-full py-3.5 rounded-full text-[13px] font-bold border-0 ${
              level ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted'
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
  const [error, setError] = useState(null)

  function set(field) {
    return e => setDraft(d => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const result = await onCreate(draft)
      if (result?.error === 'linked_web_blocked') {
        setError(
          'Открой Mentalix в Telegram, чтобы создать ритуал — привязанному аккаунту это пока доступно только там.'
        )
      } else if (!result) {
        setError('Не получилось создать ритуал. Проверь соединение и попробуй ещё раз.')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-emerald border border-cream/10 rounded-2xl px-4 py-3.5 text-[16px] text-cream placeholder-muted outline-none focus:border-gold/50 transition-colors'

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

  const webAction = {
    text: saving ? 'Сохраняю...' : 'Создать ритуал',
    onClick: submit,
    disabled: !draft.name.trim() || saving,
  }

  /*
   * Создание ритуала — форма с клавиатурой, поэтому живёт по
   * общему fullscreen-контракту: занимает весь экран целиком.
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
              новый ритуал.
            </h2>
          </div>

          <div className="practice-form__fields mb-5">
            <input
              value={draft.name}
              onChange={set('name')}
              placeholder="Название ритуала"
              className={inputCls}
            />
            <input
              value={draft.goal}
              onChange={set('goal')}
              placeholder="Почему это важно для тебя"
              className={inputCls}
            />
            <input
              value={draft.min_version}
              onChange={set('min_version')}
              placeholder="Меньше нельзя"
              className={inputCls}
            />
            <input
              value={draft.optimal_version}
              onChange={set('optimal_version')}
              placeholder="На полную"
              className={inputCls}
            />
            <input
              value={draft.skip_consequence}
              onChange={set('skip_consequence')}
              placeholder="Цена пропуска"
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
    api.rituals
      .list(user.id)
      .then(setRituals)
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  async function logRitual(ritualId, level) {
    try {
      const updated = await api.rituals.log(ritualId, user.id, level)
      setRituals(prev =>
        prev.map(r =>
          r.id === ritualId
            ? {
                ...r,
                streak: updated.streak,
                freezes: updated.freezes,
                today_level: updated.today_level,
              }
            : r
        )
      )
      invalidateTodayData(user.id)
      invalidatePracticesData(user.id)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function createRitual(draft) {
    try {
      const ritual = await api.rituals.create(user.id, draft)
      setRituals(prev => [...prev, ritual])
      setShowCreate(false)
      return ritual
    } catch (e) {
      console.error(e)
      if (isLinkedWebWriteBlocked(user, e)) return { error: 'linked_web_blocked' }
      return null
    }
  }

  async function deleteRitual(ritualId) {
    try {
      await api.rituals.remove(ritualId)
      setRituals(prev => prev.filter(r => r.id !== ritualId))
    } catch (e) {
      console.error(e)
    }
  }

  const doneCount = rituals.filter(r => r.today_level).length

  if (showCreate) {
    return <CreateRitualScreen onCreate={createRitual} onCancel={() => setShowCreate(false)} />
  }

  return (
    <div className="w-full max-w-md px-5 animate-fade-in flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <BackButton onClick={onBack} />
        <h2 className="font-display text-[20px] text-cream lowercase">ритуалы.</h2>
      </div>

      <p className="text-[12px] text-muted mb-4 px-1 shrink-0">
        {rituals.length > 0
          ? `${doneCount} из ${rituals.length} закрыто сегодня`
          : 'обряды, что держат твой день'}
      </p>

      {loading ? (
        <p className="text-muted text-[13px]">Загрузка...</p>
      ) : rituals.length === 0 ? (
        <EmptyState
          className="mb-4"
          glyph={
            <div className="w-full h-[150px] max-w-[220px] mx-auto mb-3">
              <SemanticGlyph kind="ritual" className="w-full h-full" />
            </div>
          }
        >
          <h3 className="font-display text-[16px] text-cream mb-1">Ритуалов пока нет</h3>
          <p className="text-[13px] text-muted mb-4 leading-relaxed">
            Ритуал — это обряд, который держит твой день. Создай первый.
          </p>
          <button onClick={() => setShowCreate(true)} className="cta-pill px-9 py-3.5 text-[13px]">
            Создать ритуал
          </button>
        </EmptyState>
      ) : (
        <>
          <div
            ref={trackRef}
            onScroll={syncActive}
            className="flex gap-3 -mx-5 px-5 pb-1 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [&::-webkit-scrollbar]:hidden flex-1 min-h-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {rituals.map(r => (
              <RitualCard key={r.id} ritual={r} onLog={logRitual} onDelete={deleteRitual} />
            ))}

            {/* последней карточкой — создание нового */}
            <button
              onClick={() => {
                platform.haptic('light')
                setShowCreate(true)
              }}
              className="practice-motion-card practice-detail-card shrink-0 snap-center w-[84%] rounded-[28px] border border-dashed border-cream/15 bg-transparent flex flex-col items-center justify-center gap-2"
            >
              <span className="text-[22px] text-faint leading-none">+</span>
              <span className="text-[13px] text-muted font-semibold">Новый ритуал</span>
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mt-3 shrink-0">
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
