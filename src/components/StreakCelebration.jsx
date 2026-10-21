import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { platform } from '../platform'
import { useBackButton, useMainButton } from '../platform/telegram.hooks'
import {
  FULLSCREEN_SHELL_CLASS,
  getFullscreenPortalTarget,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import { streakCelebrationCopy } from '../lib/streakCelebration'
import { StreakFlame, StreakFlower } from './StreakGlyphs'
import WebActionBar from './WebActionBar'
import './CheckInCompletion.css'
import './StreakCelebration.css'

/*
 * Экран серии после чек-ина. Разметка и классы — те же, что у финала
 * чек-ина (.mx-completion в CheckInCompletion.css): полоса героя, полоса
 * заголовка и нижний блок занимают одни и те же области, поэтому переход
 * «Сохранить и выйти» → серия не двигает сцену, заголовок и пилюлю.
 */
export default function StreakCelebration({ streak, days = [], onDone }) {
  // Экран серии без полей ввода: высота от layout-вьюпорта, иначе
  // закрытие клавиатуры после финала чек-ина сдвигает весь экран.
  const { style } = useFullscreenSurface({ keyboardStrategy: 'stable' })
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
      {/* Пустой слот той же высоты, что у финала (см. .mx-finale-header-slot):
          содержимое обоих экранов начинается на одной линии. */}
      <div className="mx-finale-header-slot" aria-hidden="true" />
      <div className="mx-fullscreen-completion w-full flex-1 min-h-0 flex flex-col overflow-hidden">
        <section className="mx-completion mx-completion--streak">
          <div className="mx-completion__art-wrap">
            <StreakFlower streak={streak} className="mx-streak-celebration__petals" />
          </div>
          <h1
            className="mx-completion__title mx-streak-celebration__text"
            data-testid="streak-celebration-text"
          >
            <strong>{title}</strong>
            <span>{body}</span>
          </h1>
          {/* Нижний блок той же полосы, что плашка и отзыв финала: ряд дней
              встаёт на линию плашки даты. */}
          <div className="mx-completion__meta">
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
          </div>
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
