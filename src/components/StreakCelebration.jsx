import { createPortal } from 'react-dom'
import { Check, Flame } from 'lucide-react'
import { platform } from '../platform'
import { useBackButton, useMainButton } from '../platform/telegram.hooks'
import {
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  TG_CONTROLS_HEIGHT,
  getFullscreenPortalTarget,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import { STREAK_PETALS, litStreakPetals, streakCelebrationCopy } from '../lib/streakCelebration'
import WebActionBar from './WebActionBar'
import './CheckInCompletion.css'
import './StreakCelebration.css'

const PETAL_PATH = 'M0 -3C-6 -9 -10 -15 -10 -22A10 10 0 1 1 10 -22C10 -15 6 -9 0 -3Z'

/* Цветок из пяти лепестков-капель: светлые — дни серии в текущем круге. */
function StreakPetals({ streak }) {
  const lit = litStreakPetals(streak)
  return (
    <svg
      width="66"
      height="66"
      viewBox="0 0 66 66"
      aria-hidden="true"
      className="mx-streak-celebration__petals"
      data-testid="streak-petals"
      data-lit={lit}
    >
      <g transform="translate(33 33)">
        {Array.from({ length: STREAK_PETALS }, (_, index) => (
          <path
            key={index}
            d={PETAL_PATH}
            transform={`rotate(${index * (360 / STREAK_PETALS)})`}
            className={[
              'mx-streak-celebration__petal',
              index < lit ? 'is-lit' : '',
              index === lit - 1 ? 'is-new' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </g>
    </svg>
  )
}

export default function StreakCelebration({ streak, days = [], onDone }) {
  const { style, tgFullscreen } = useFullscreenSurface()
  const { title, body } = streakCelebrationCopy(streak)
  const topOffset = tgFullscreen ? TG_CONTROLS_HEIGHT : 0

  useBackButton(() => {
    platform.haptic('light')
    onDone()
  })
  useMainButton({ text: 'Отлично!', onClick: onDone })

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-streak-celebration`}
      style={{ ...style, paddingBottom: 0 }}
      data-testid="streak-celebration"
    >
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <section
          className="mx-streak-celebration__body"
          style={{
            paddingTop: `max(16px, calc(33dvh - 33px - var(--app-safe-top) - ${topOffset}px))`,
          }}
        >
          <StreakPetals streak={streak} />
          <h1 className="mx-streak-celebration__text" data-testid="streak-celebration-text">
            <strong>{title}</strong>
            <span>{body}</span>
          </h1>
          {days.length > 0 && (
            <ol className="mx-streak-celebration__days" data-testid="streak-celebration-days">
              {days.map(day => (
                <li key={day.key} data-state={day.state}>
                  <span className="mx-streak-celebration__dot">
                    {day.state === 'today' ? (
                      <Flame size={18} strokeWidth={2} fill="currentColor" aria-hidden="true" />
                    ) : day.state === 'done' ? (
                      <Check size={18} strokeWidth={3} aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="mx-streak-celebration__day-label">{day.label}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
      <WebActionBar
        action={{ text: 'Отлично!', testId: 'streak-celebration-done', onClick: onDone }}
        className="mx-completion-action"
      />
    </div>,
    getFullscreenPortalTarget()
  )
}
