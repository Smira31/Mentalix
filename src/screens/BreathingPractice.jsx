import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import BackButton from '../components/BackButton'
import SemanticGlyph from '../components/SemanticGlyph'
import {
  useFullscreenSurface,
  getFullscreenPortalTarget,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'

const DURATION = 60
const PHASES = [
  { label: 'вдох', seconds: 4 },
  { label: 'пауза', seconds: 2 },
  { label: 'выдох', seconds: 6 },
  { label: 'пауза', seconds: 2 },
]

function breathLabel(elapsed) {
  let position = elapsed % 14
  for (const phase of PHASES) {
    if (position < phase.seconds) return phase.label
    position -= phase.seconds
  }
  return PHASES[0].label
}

export default function BreathingPractice({ onBack }) {
  const [started, setStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const startedAt = useRef(null)
  const { style } = useFullscreenSurface()

  useEffect(() => {
    if (!started || done) return undefined
    const update = () => {
      if (document.hidden || startedAt.current === null) return
      const next = Math.min(DURATION, Math.floor((Date.now() - startedAt.current) / 1000))
      setElapsed(next)
      if (next >= DURATION) setDone(true)
    }
    const onVisibility = () => {
      if (document.hidden) {
        startedAt.current = null
      } else {
        startedAt.current = Date.now() - elapsed * 1000
      }
    }
    const timer = window.setInterval(update, 200)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [started, done, elapsed])

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={style} data-testid="breathing-practice">
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}>
        <BackButton onClick={onBack} label="Сегодня" />
      </div>
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] min-h-full flex flex-col items-center justify-center gap-8 text-center">
          <span className="text-muted text-[13px]">Практика · 1 минута</span>
          <div className="w-48 h-48" aria-hidden="true">
            <SemanticGlyph kind="breath" animated={started && !done} highlighted={started} />
          </div>
          <h1 className="font-display text-[28px] text-cream">
            {done ? 'Ты вернулся к дыханию' : started ? breathLabel(elapsed) : 'Дыхание'}
          </h1>
          {started && !done && <p className="text-muted">{DURATION - elapsed} сек</p>}
          {done ? (
            <button type="button" data-testid="breathing-done" onClick={onBack} className="cta-pill min-h-14 px-10">
              Готово
            </button>
          ) : started ? (
            <button type="button" data-testid="breathing-finish" onClick={() => setDone(true)} className="text-muted min-h-11 px-6">
              Завершить
            </button>
          ) : (
            <button
              type="button"
              data-testid="breathing-start"
              onClick={() => {
                startedAt.current = Date.now()
                setStarted(true)
              }}
              className="cta-pill min-h-14 px-10"
            >
              Начать
            </button>
          )}
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
