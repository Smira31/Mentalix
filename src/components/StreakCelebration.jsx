import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { platform } from '../platform'
import { useBackButton, useMainButton } from '../platform/telegram.hooks'
import {
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  getFullscreenPortalTarget,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import { streakCelebrationCopy } from '../lib/streakCelebration'
import { StreakFlame, StreakFlower } from './StreakGlyphs'
import WebActionBar from './WebActionBar'
import './CheckInCompletion.css'
import './StreakCelebration.css'

export default function StreakCelebration({ streak, days = [], onDone }) {
  // Экран серии без полей ввода: высота от layout-вьюпорта, иначе
  // закрытие клавиатуры после финала чек-ина сдвигает весь экран.
  const { style } = useFullscreenSurface({ stable: true })
  const { title, body } = streakCelebrationCopy(streak)

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
        {/* Блок центрируется по свободной высоте через margin: auto
            (контракт FULLSCREEN_SCROLL_CLASS): на 360×640 фиксированный
            отступ 33dvh поднимал контент выше области прокрутки и обрезал
            ряд дней. */}
        <section className="mx-streak-celebration__body">
          <StreakFlower streak={streak} className="mx-streak-celebration__petals" />
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
                      <StreakFlame size={16} testId="streak-flame" />
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
