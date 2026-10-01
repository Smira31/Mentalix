import { useState } from 'react'
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
import { MENTOR_PERSONA_KEY, MENTOR_DRAFT_KEY } from './mentalix/personas'

import './DailyThoughtScreen.css'

/*
 * Экран «Мысль дня» — Stoic-формат.
 *
 * Текст мысли уже есть в карточке на «Сегодня» — экран
 * показывает его мгновенно, без загрузки. Три действия:
 * «Записать мысль» (→ diary-персона Следопыт), «Обсудить с
 * Наставником» (→ kompas), «Копировать» (в буфер).
 *
 * Полноэкранный контракт — портал в body, высота из
 * visualViewport, блокировка скролла (useFullscreenSurface).
 */
export default function DailyThoughtScreen({ thought, onClose, onGoMentor }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [copied, setCopied] = useState(false)

  function navigateToMentor(persona) {
    try {
      sessionStorage.setItem(MENTOR_PERSONA_KEY, persona)
      sessionStorage.setItem(MENTOR_DRAFT_KEY, thought?.text || '')
    } catch {
      /* sessionStorage unavailable — chat opens without draft */
    }
    onGoMentor?.()
  }

  function handleWrite() {
    platform.haptic('light')
    navigateToMentor('dnevnik')
  }

  function handleDiscuss() {
    platform.haptic('light')
    navigateToMentor('kompas')
  }

  function handleCopy() {
    platform.haptic('light')
    const text = thought?.text || ''
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-daily-thought`} style={surfaceStyle}>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <ScreenBack onBack={onClose} testId="daily-thought-back" />
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} items-center justify-center px-5`}>
        <span className="mx-daily-thought__label">МЫСЛЬ ДНЯ</span>
        <p className="mx-daily-thought__text">{thought?.text}</p>
      </div>

      <div className="mx-daily-thought__actions shrink-0 px-5 pb-7">
        <button
          type="button"
          data-testid="daily-thought-write"
          className="mx-daily-thought__pill"
          onClick={handleWrite}
        >
          Записать мысль
        </button>
        <button
          type="button"
          data-testid="daily-thought-discuss"
          className="mx-daily-thought__secondary"
          onClick={handleDiscuss}
        >
          Обсудить с Наставником
        </button>
        <button
          type="button"
          data-testid="daily-thought-copy"
          className="mx-daily-thought__secondary"
          onClick={handleCopy}
        >
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
