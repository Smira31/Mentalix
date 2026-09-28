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

/* Замеры Stoic: верхняя миндалина 16×27 с острыми концами, четыре полумесяца
 * той же длины (≈30 по дуге) наклонены на +5°, зазоры между лепестками 4.7–6.6,
 * в центре пусто (⌀12), общий размер цветка ≈61×65 при viewBox 66. */
const ALMOND_PATH = 'M33 0C28.6 5.2 25 10.2 25 13.5C25 16.8 28.6 21.8 33 27C37.4 21.8 41 16.8 41 13.5C41 10.2 37.4 5.2 33 0Z'
const CRESCENT_PATH =
  'M33 27C39.8 24.4 44 19.6 45.3 12.4C46.3 8.3 46.3 5.3 46.8 2.6C44.8 5.7 43.2 10.2 42.2 14.4C40.9 19.1 36.3 23.4 33 27Z'
const PETAL_TILT = 5

/* Цветок из пяти отдельных лепестков (миндалина + 4 полумесяца):
 * светлые — дни серии в текущем круге, тёмные — оставшиеся. */
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
      <g transform="translate(-2.9 0.5)">
        {Array.from({ length: STREAK_PETALS }, (_, index) => (
          <path
            key={index}
            d={index === 0 ? ALMOND_PATH : CRESCENT_PATH}
            transform={`rotate(${index * (360 / STREAK_PETALS) + (index ? PETAL_TILT : 0)} 33 33)`}
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
                      <Flame size={16} strokeWidth={2} fill="currentColor" aria-hidden="true" />
                    ) : day.state === 'done' ? (
                      <Check size={14} strokeWidth={2} aria-hidden="true" />
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
