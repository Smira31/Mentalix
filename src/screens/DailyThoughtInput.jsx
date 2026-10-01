import { useEffect, useRef, useState } from 'react'

import { platform } from '../platform'
import JournalTextarea from '../components/JournalTextarea'
import Screen from '../components/Screen'
import CapsLabel from '../components/ui/CapsLabel'
import {
  useVisualViewportGeometry,
  getKeyboardViewportHeight,
  isTelegramRuntime,
} from '../lib/visualViewport'
import { readCachedDailyThought, saveDailyThought } from '../lib/dailyThoughtStorage'
import { todayKey } from '../lib/journalStorage'
import { getDailyThoughtForDate } from '../data/dailyThoughts'

/*
 * ЭКРАН ВВОДА «ТВОЯ МЫСЛЬ» — как день темы в «Теме недели»:
 * поле без рамки, клавиатура сразу, круглая кнопка отправки.
 *
 * Переведён на <Screen> + детали (CapsLabel).
 * Вид и поведение не изменились.
 *
 * Сохраняется на сервере записью /quotes с tag='thought:YYYY-MM-DD'
 * (см. dailyThoughtStorage.js); из localStorage только подставляется
 * уже записанная мысль, пока список не обновлён с сервера.
 */
export default function DailyThoughtInput({ date, user, onClose, onSaved }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  const viewportGeometry = useVisualViewportGeometry()
  const keyboardOpen =
    viewportGeometry?.height != null &&
    typeof window !== 'undefined' &&
    window.innerHeight - viewportGeometry.height > 80

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    const existing = readCachedDailyThought(date || todayKey(), user?.id)
    if (existing?.text) setText(existing.text)
  }, [date, user?.id])

  const hasText = text.trim().length > 0
  const quoteOfDay = date ? getDailyThoughtForDate(date) : null

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

  const keyboardViewportHeight = getKeyboardViewportHeight({
    isTelegram: isTelegramRuntime(),
    stableHeight: viewportGeometry?.stableHeight,
    visualHeight: viewportGeometry?.height,
  })

  const roundButtonStyle = keyboardOpen
    ? {
        position: 'fixed',
        top: `${(keyboardViewportHeight ?? viewportGeometry?.height) + (viewportGeometry?.offsetTop || 0) - 56}px`,
        right: '16px',
        bottom: 'auto',
        zIndex: 71,
      }
    : {
        position: 'fixed',
        bottom: 'calc(var(--app-safe-bottom) + 16px)',
        right: '16px',
        zIndex: 71,
      }

  return (
    <Screen
      onBack={onClose}
      backTestId="daily-thought-input-back"
      fullFrame
    >
      <div className="text-left" data-testid="daily-thought-input-content">
        <CapsLabel className="mb-2 text-gold">ТВОЯ МЫСЛЬ</CapsLabel>
        {quoteOfDay?.text && (
          <p
            className="mb-3 text-[13px] italic leading-snug text-muted line-clamp-2"
            data-testid="daily-thought-input-quote"
          >
            {quoteOfDay.text}
          </p>
        )}
        <h3 className="font-display text-[24px] font-bold leading-[1.15] text-cream">
          Что ты об этом думаешь?
        </h3>
        <p className="mt-3 border-l border-gold pl-4 text-[16px] font-normal leading-relaxed text-muted">
          Можно своими словами — или свою фразу на день.
        </p>
      </div>

      <JournalTextarea
        value={text}
        onChange={setText}
        placeholder="Начни писать…"
        ariaLabel="Мысль дня"
        testId="daily-thought-input-field"
        submitTestId="daily-thought-input-submit"
        className="mt-7 flex-1"
        editorClassName="!leading-[1.5] font-normal pb-16"
        formatting={false}
        floatingToolbar={false}
        writingCanvas={false}
        autoFocus
        onSubmit={handleSave}
        submitLabel="Сохранить мысль"
        submitDisabled={!hasText}
        submitLoading={saving}
      />

      <button
        type="button"
        aria-label={hasText ? 'Сохранить мысль' : undefined}
        data-testid="daily-thought-input-round"
        onClick={hasText ? handleSave : onClose}
        disabled={saving}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efefef] text-[22px] font-semibold text-[#111] transition-transform active:scale-95"
        style={roundButtonStyle}
      >
        {hasText ? '✓' : '✕'}
      </button>
    </Screen>
  )
}
