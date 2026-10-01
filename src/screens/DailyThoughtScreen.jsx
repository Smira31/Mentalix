import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import ScreenBack from '../components/ScreenBack'
import {
  useFullscreenSurface,
  getFullscreenPortalTarget,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { EDGE_WIDTH } from '../lib/gestures/swipeThresholds'
import { MENTOR_PERSONA_KEY, MENTOR_DRAFT_KEY } from './mentalix/personas'
import { getDailyThoughtForDate } from '../data/dailyThoughts'
import { toLocalCalendarDate } from '../lib/dateTimezonePolicy'
import {
  THOUGHT_KIND,
  SAVED_KIND,
  loadDailyItems,
  migrateLocalDailyItems,
  readCachedDailyItems,
  saveSavedQuote,
} from '../lib/dailyThoughtStorage'
import DailyThoughtInput from './DailyThoughtInput'
import MyThoughtsScreen from './MyThoughtsScreen'

import './DailyThoughtScreen.css'

const MONTHS_GEN = [
  'ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ',
  'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ',
]
const MAX_DAYS_BACK = 30
const SWIPE_THRESHOLD = 50
/* Порог и пауза колеса: один жест — один день, без «прокрутки» на двадцать. */
const WHEEL_STEP = 12
const WHEEL_COOLDOWN = 450
const HINT_DAYS = 5

function dateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

function dateOffsetStr(offset) {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return toLocalCalendarDate(d)
}

/*
 * Экран «Мысль дня» — Stoic-формат.
 *
 * Свайп влево — прошлые дни (до 30), вправо — обратно к сегодня.
 * Жест слушается и на тач-экране, и мышью/колесом: в превью это
 * обычный браузер, где touch-событий нет вовсе.
 * Под цитатой — своя мысль за этот день, если записана.
 * «Обсудить» — третья текстовая кнопка рядом с «Сохранить» и «Копировать»;
 * собственное «…» в шапке убрано как дублирующее «•••» Telegram.
 */
export default function DailyThoughtScreen({ thought, onClose, onGoMentor, user }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [offset, setOffset] = useState(0)
  const [view, setView] = useState('main')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hintHidden, setHintHidden] = useState(false)
  const [items, setItems] = useState(() => readCachedDailyItems(user?.id))
  const touchStart = useRef(null)
  const mouseStart = useRef(null)
  const wheelAt = useRef(0)

  const currentDate = useMemo(() => dateOffsetStr(offset), [offset])
  const currentThought = useMemo(
    () => getDailyThoughtForDate(currentDate),
    [currentDate]
  )
  /*
   * localStorage — кэш: первый рендер показывает то, что уже есть.
   * Следом (и однократно) — перенос прежних локальных мыслей на сервер
   * и обновление списка с сервера.
   */
  useEffect(() => {
    if (!user?.id) return

    let alive = true

    migrateLocalDailyItems(user.id)
      .then(() => loadDailyItems(user.id))
      .then(next => {
        if (alive) setItems(next)
      })
      .catch(console.error)

    return () => {
      alive = false
    }
  }, [user?.id])

  const myThought = useMemo(
    () => items.find(item => item.kind === THOUGHT_KIND && item.date === currentDate) || null,
    [items, currentDate]
  )
  const allThoughtsCount = useMemo(
    () => items.filter(item => item.kind === THOUGHT_KIND).length,
    [items]
  )

  // Проверяем, сохранена ли цитата при открытии дня
  const quoteAlreadySaved = useMemo(
    () => items.some(item => item.kind === SAVED_KIND && item.date === currentDate),
    [items, currentDate]
  )

  function navigateToMentor(persona) {
    try {
      sessionStorage.setItem(MENTOR_PERSONA_KEY, persona)
      sessionStorage.setItem(MENTOR_DRAFT_KEY, currentThought?.text || '')
    } catch {
      /* sessionStorage unavailable */
    }
    onGoMentor?.()
  }

  function handleWrite() {
    platform.haptic('light')
    setView('input')
  }

  function handleDiscuss() {
    platform.haptic('light')
    navigateToMentor('kompas')
  }

  function handleCopy() {
    platform.haptic('light')
    const text = currentThought?.text || ''
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveQuote() {
    platform.haptic('light')
    try {
      const next = await saveSavedQuote({
        date: currentDate,
        text: currentThought?.text || '',
        userId: user?.id,
      })
      setItems(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      platform.haptic('error')
      console.error(error)
    }
  }

  function handleMyThoughts() {
    platform.haptic('light')
    setView('myThoughts')
  }

  function handleInputSaved() {
    setView('main')
    if (!user?.id) return
    loadDailyItems(user.id).then(setItems).catch(console.error)
  }

  // ── Свайп между днями: тач, мышь, колесо ──
  function shiftDays(step) {
    const next = Math.min(Math.max(offset + step, 0), MAX_DAYS_BACK)
    if (next === offset) return
    platform.haptic('light')
    setHintHidden(true)
    setOffset(next)
  }

  function handleSwipe(dx, dy, startX = Number.POSITIVE_INFINITY) {
    // Не ломаем edge-swipe-back от левого края
    if (startX <= EDGE_WIDTH) return
    if (Math.abs(dx) < Math.abs(dy)) return // вертикальный жест — не наш
    if (Math.abs(dx) < SWIPE_THRESHOLD) return
    // Влево — прошлый день, вправо — обратно к сегодня.
    shiftDays(dx < 0 ? 1 : -1)
  }

  function onTouchStart(e) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e) {
    const start = touchStart.current
    if (!start) return
    touchStart.current = null
    const t = e.changedTouches[0]
    handleSwipe(t.clientX - start.x, t.clientY - start.y, start.x)
  }

  function onMouseDown(e) {
    if (e.button !== 0) return
    mouseStart.current = { x: e.clientX, y: e.clientY }
  }

  function onMouseUp(e) {
    const start = mouseStart.current
    if (!start) return
    mouseStart.current = null
    handleSwipe(e.clientX - start.x, e.clientY - start.y, start.x)
  }

  function onWheel(e) {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(delta) < WHEEL_STEP) return

    const now = Date.now()
    if (now - wheelAt.current < WHEEL_COOLDOWN) return
    wheelAt.current = now

    shiftDays(delta > 0 ? 1 : -1)
  }

  // ── Подэкраны ──
  if (view === 'input') {
    return (
      <DailyThoughtInput
        date={currentDate}
        user={user}
        onClose={() => setView('main')}
        onSaved={handleInputSaved}
      />
    )
  }

  if (view === 'myThoughts') {
    return (
      <MyThoughtsScreen
        user={user}
        onClose={() => setView('main')}
        onEditThought={() => setView('main')}
      />
    )
  }

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-daily-thought`}
      style={surfaceStyle}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={() => {
        mouseStart.current = null
      }}
      onWheel={onWheel}
    >
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <ScreenBack onBack={onClose} testId="daily-thought-back" />
      </div>

      <div
        className={`${FULLSCREEN_SCROLL_CLASS} items-center justify-center px-5`}
        key={offset}
      >
        <span className="mx-daily-thought__label" data-testid="daily-thought-date-label">
          {dateLabel(currentDate)} · МЫСЛЬ ДНЯ
        </span>
        <p className="mx-daily-thought__text" data-testid="daily-thought-quote">
          {currentThought?.text}
        </p>

        {myThought && (
          <div className="mx-daily-thought__my-thought" data-testid="daily-thought-my-thought">
            <p>{myThought.text}</p>
          </div>
        )}
      </div>

      <div className="mx-daily-thought__actions shrink-0 px-5 pb-7">
        <button
          type="button"
          data-testid="daily-thought-write"
          className="mx-daily-thought__pill"
          onClick={handleWrite}
        >
          {myThought ? 'Изменить мысль' : 'Записать мысль'}
        </button>

        <div className="mx-daily-thought__row">
          <button
            type="button"
            data-testid="daily-thought-save"
            className="mx-daily-thought__text-btn"
            onClick={handleSaveQuote}
          >
            {saved || quoteAlreadySaved ? 'Сохранено ✓' : 'Сохранить'}
          </button>
          <span className="mx-daily-thought__dot" aria-hidden="true">·</span>
          <button
            type="button"
            data-testid="daily-thought-copy"
            className="mx-daily-thought__text-btn"
            onClick={handleCopy}
          >
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <span className="mx-daily-thought__dot" aria-hidden="true">·</span>
          <button
            type="button"
            data-testid="daily-thought-discuss"
            className="mx-daily-thought__text-btn"
            onClick={handleDiscuss}
          >
            Обсудить
          </button>
        </div>

        {!hintHidden && offset < HINT_DAYS && (
          <div className="mx-daily-thought__swipe-hint" data-testid="daily-thought-swipe-hint">
            {offset === 0 && <span className="mx-daily-thought__hint-text">‹ вчера</span>}
            <span className="mx-daily-thought__hint-dots" aria-hidden="true">
              {Array.from({ length: HINT_DAYS }).map((_, index) => (
                <span
                  key={index}
                  className={`mx-daily-thought__hint-dot${
                    index === offset ? ' mx-daily-thought__hint-dot--active' : ''
                  }`}
                />
              ))}
            </span>
          </div>
        )}

        {allThoughtsCount > 0 && (
          <button
            type="button"
            data-testid="daily-thought-my-thoughts-link"
            className="mx-daily-thought__my-link"
            onClick={handleMyThoughts}
          >
            Мои мысли · {allThoughtsCount} ›
          </button>
        )}
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
