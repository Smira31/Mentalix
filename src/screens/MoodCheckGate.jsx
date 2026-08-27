import { useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import { Face, SCALE_STEPS } from './CheckIn'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { writeMoodDraft, markMoodCheckShown } from '../lib/moodCheckDraft'

const MOOD_STEP = SCALE_STEPS[0]

/*
 * MXL-MOOD-CHECK-001 — быстрый mood-check при запуске (идея 12,
 * ROADMAP.md), opt-in через тумблер в Settings.
 *
 * Тот же fullscreen-контракт, что у AppLock/CheckIn (портал в body,
 * см. src/lib/fullscreenSurface.js) — это гейт поверх остального UI
 * в App.jsx, ДО монтирования Today, а не шаг внутри CheckIn.jsx.
 *
 * Это не второй чек-ин: выбор настроения только пишется черновиком
 * (writeMoodDraft) для CheckIn.jsx и никогда не уходит на бэкенд
 * напрямую — иначе фиктивный чек-ин молча подменил бы собой
 * настоящий (см. Today.jsx todayState). onDismiss просто прячет
 * гейт — реальные данные сохраняет обычный CheckIn.jsx позже.
 */
export default function MoodCheckGate({ onDismiss }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [pickedLevel, setPickedLevel] = useState(null)

  function pick(level) {
    if (pickedLevel) return

    platform.haptic('light')
    setPickedLevel(level)

    writeMoodDraft(level)
    markMoodCheckShown()

    setTimeout(onDismiss, 280)
  }

  function skip() {
    platform.haptic('light')
    markMoodCheckShown()
    onDismiss()
  }

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center justify-end px-5`}>
        <button
          type="button"
          onClick={skip}
          className="text-[13px] font-semibold text-muted bg-transparent border-0"
        >
          Пропустить
        </button>
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} items-center justify-center px-6 text-center`}>
        <h2 className="font-display text-[22px] text-cream leading-tight">{MOOD_STEP.title}</h2>
        <p className="text-[13px] text-muted mt-2 mb-9">{MOOD_STEP.hint}</p>

        <div className="flex items-end justify-center gap-3 w-full max-w-sm">
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => pick(level)}
              disabled={pickedLevel !== null && pickedLevel !== level}
              className="flex flex-col items-center gap-2 border-0 bg-transparent active:scale-90 transition-transform flex-1 disabled:opacity-40"
            >
              <Face level={level} active={pickedLevel === level} />
              <span
                className={`text-[10px] font-semibold leading-tight text-center ${
                  pickedLevel === level ? 'text-gold' : 'text-faint'
                }`}
              >
                {MOOD_STEP.labels[level - 1]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
