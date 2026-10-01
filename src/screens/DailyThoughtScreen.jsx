import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import ScreenBack from '../components/ScreenBack'
import { MoreHorizontal, MessageCircle } from 'lucide-react'
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
  readDailyThought,
  readAllDailyThoughts,
  saveSavedQuote,
  isQuoteSaved,
} from '../lib/dailyThoughtStorage'
import DailyThoughtInput from './DailyThoughtInput'
import MyThoughtsScreen from './MyThoughtsScreen'
import { ProgressGlassMenu, ProgressGlassMenuItem } from '../components/ProgressGlassMenu'

import './DailyThoughtScreen.css'

const MONTHS_GEN = [
  'ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ',
  'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ',
]
const MAX_DAYS_BACK = 30
const SWIPE_THRESHOLD = 50

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
 * Под цитатой — своя мысль за этот день, если записана.
 * «Обсудить с Наставником» — в стеклянном меню «…» справа сверху.
 */
export default function DailyThoughtScreen({ thought, onClose, onGoMentor, user }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [offset, setOffset] = useState(0)
  const [view, setView] = useState('main')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [thoughtTick, setThoughtTick] = useState(0)
  const touchStart = useRef(null)

  const currentDate = useMemo(() => dateOffsetStr(offset), [offset])
  const currentThought = useMemo(
    () => getDailyThoughtForDate(currentDate),
    [currentDate]
  )
  const myThought = useMemo(
    () => readDailyThought(currentDate, user?.id),
    [currentDate, user?.id, thoughtTick, view]
  )
  const allThoughtsCount = useMemo(
    () => readAllDailyThoughts(user?.id).length,
    [user?.id, thoughtTick, view]
  )

  // Проверяем, сохранена ли цитата при открытии дня
  const quoteAlreadySaved = useMemo(
    () => isQuoteSaved(currentDate, currentThought?.key, user?.id),
    [currentDate, currentThought?.key, user?.id, view]
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
    setMenuOpen(false)
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

  function handleSaveQuote() {
    platform.haptic('light')
    saveSavedQuote({
      date: currentDate,
      text: currentThought?.text || '',
      quoteKey: currentThought?.key,
      userId: user?.id,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleMyThoughts() {
    platform.haptic('light')
    setView('myThoughts')
  }

  function handleInputSaved() {
    setThoughtTick(t => t + 1)
    setView('main')
  }

  // ── Свайп между днями ──
  function onTouchStart(e) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e) {
    const start = touchStart.current
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    touchStart.current = null

    // Не ломаем edge-swipe-back от левого края
    if (start.x <= EDGE_WIDTH) return

    if (Math.abs(dx) < Math.abs(dy)) return // вертикальный свайп — не наш
    if (Math.abs(dx) < SWIPE_THRESHOLD) return

    if (dx < 0) {
      // свайп влево — прошлый день
      setOffset(o => Math.min(o + 1, MAX_DAYS_BACK))
    } else {
      // свайп вправо — к сегодня
      setOffset(o => Math.max(o - 1, 0))
    }
    platform.haptic('light')
  }

  // ── Подэкраны ──
  if (view === 'input') {
    return (
      <DailyThoughtInput
        date={currentDate}
        quoteKey={currentThought?.key}
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

  const isToday = offset === 0

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-daily-thought`}
      style={surfaceStyle}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <ScreenBack onBack={onClose} testId="daily-thought-back" />
        <div className="relative ml-auto">
          <button
            type="button"
            aria-label="Действия"
            data-testid="daily-thought-menu-button"
            className="mx-daily-thought__menu-btn"
            onClick={() => setMenuOpen(o => !o)}
          >
            <MoreHorizontal size={22} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1">
              <ProgressGlassMenu>
                <ProgressGlassMenuItem
                  icon={MessageCircle}
                  label="Обсудить с Наставником"
                  testId="daily-thought-discuss"
                  onClick={handleDiscuss}
                />
              </ProgressGlassMenu>
            </div>
          )}
        </div>
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
        </div>

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
