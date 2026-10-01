import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import JournalTextarea from '../components/JournalTextarea'
import { RoundBackButton } from '../components/NestedScreenHeader'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import {
  useVisualViewportGeometry,
  getKeyboardViewportHeight,
  isTelegramRuntime,
} from '../lib/visualViewport'
import { readCachedDailyThought, saveDailyThought } from '../lib/dailyThoughtStorage'
import { todayKey } from '../lib/journalStorage'

import './DailyThoughtInput.css'

/*
 * ЭКРАН ВВОДА «ТВОЯ МЫСЛЬ» — как день темы в «Теме недели»:
 * поле без рамки, клавиатура сразу, круглая кнопка отправки.
 *
 * Сохраняется на сервере записью /quotes с tag='thought:YYYY-MM-DD'
 * (см. dailyThoughtStorage.js); из localStorage только подставляется
 * уже записанная мысль, пока список не обновлён с сервера.
 */
export default function DailyThoughtInput({ date, user, onClose, onSaved }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const viewportGeometry = useVisualViewportGeometry()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    const existing = readCachedDailyThought(date || todayKey(), user?.id)
    if (existing?.text) setText(existing.text)
  }, [date, user?.id])

  const hasText = text.trim().length > 0

  async function handleSave() {
    if (!hasText || saving) return
    setSaving(true)
    try {
      await saveDailyThought({
        date: date || todayKey(),
        text: text.trim(),
        userId: user?.id,
      })
      platform.haptic('success')
      onSaved?.()
    } catch {
      platform.haptic('error')
    } finally {
      setSaving(false)
    }
  }

  const keyboardOpen =
    typeof window !== 'undefined' &&
    viewportGeometry?.height !== null &&
    viewportGeometry?.height !== undefined &&
    window.innerHeight - viewportGeometry.height > 80

  const keyboardViewportHeight = getKeyboardViewportHeight({
    isTelegram: isTelegramRuntime(),
    stableHeight: viewportGeometry?.stableHeight,
    visualHeight: viewportGeometry?.height,
  })

  const roundButtonStyle = keyboardOpen
    ? { top: `${keyboardViewportHeight + (viewportGeometry?.offsetTop || 0) - 76}px`, bottom: 'auto' }
    : undefined

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <RoundBackButton onClick={onClose} testId="daily-thought-input-back" />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] pt-2 pb-6 flex flex-col min-h-full">
          <div className="text-left" data-testid="daily-thought-input-content">
            <div className="mb-2 font-label text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
              ТВОЯ МЫСЛЬ
            </div>
            <h3 className="font-display text-[20px] font-bold leading-[1.16] text-cream">
              Что ты об этом думаешь?
            </h3>
            <p className="mt-3 border-l border-gold pl-4 text-[16px] font-normal leading-relaxed text-muted">
              Можно своими словами — или свою фразу на день.
            </p>
          </div>

          <JournalTextarea
            value={text}
            onChange={setText}
            placeholder="Записать мысль..."
            ariaLabel="Мысль дня"
            testId="daily-thought-input-field"
            submitTestId="daily-thought-input-submit"
            className="mt-6 flex-1"
            editorClassName="!text-[16px] font-normal pb-16"
            formatting={false}
            floatingToolbar={false}
            writingCanvas={false}
            autoFocus
            onSubmit={handleSave}
            submitLabel="Сохранить мысль"
            submitDisabled={!hasText}
            submitLoading={saving}
          />
        </div>
      </div>

      <button
        type="button"
        aria-label={hasText ? 'Сохранить мысль' : undefined}
        data-testid="daily-thought-input-round"
        onClick={hasText ? handleSave : onClose}
        disabled={saving}
        className="mx-daily-thought-input__round flex h-11 w-11 items-center justify-center rounded-full bg-[#efefef] text-[22px] font-semibold text-[#111] transition-transform active:scale-95"
        style={roundButtonStyle}
      >
        {hasText ? '›' : '✕'}
      </button>
    </div>,
    document.body
  )
}
