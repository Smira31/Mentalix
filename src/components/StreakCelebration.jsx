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
 * Экран серии после чек-ина. Оболочка общая с финалом чек-ина (тот же шелл,
 * та же полоса шапки .mx-finale-header-slot и та же нижняя полоса с кнопкой),
 * поэтому при переходе не двигаются края экрана и главное действие.
 * Внутри — своя компактная композиция: иллюстрация → заголовок серии →
 * короткое пояснение → дни. Полосы финала (резерв блока отзывов) не
 * наследуются: у серии нет ни плашки даты, ни плиток оценки.
 */
export default function StreakCelebration({ streak, days = [], onDone }) {
  // Экран серии без полей ввода: высота от layout-вьюпорта, иначе
  // закрытие клавиатуры после финала чек-ина сдвигает весь экран.
  const { style } = useFullscreenSurface({ keyboardStrategy: 'stable' })
  const { title, note } = streakCelebrationCopy(streak)

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
      <section className="mx-streak-stage" data-testid="streak-celebration-stage">
        <div className="mx-streak-stage__art">
          <StreakFlower streak={streak} size={148} className="mx-streak-celebration__flower" />
        </div>
        <h1 className="mx-streak-celebration__title" data-testid="streak-celebration-text">
          {title}
        </h1>
        <p className="mx-streak-celebration__note" data-testid="streak-celebration-note">
          {note}
        </p>
        {days.length > 0 && (
          <ol
            className="mx-streak-celebration__days"
            data-testid="streak-celebration-days"
            data-days={days.length}
          >
            {days.map(day => (
              <li key={day.key} data-state={day.state}>
                {/* 'unknown' (день без записи) остаётся без значка: ни
                    галочки — это не «выполнено», ни пропуска — история
                    могла не дойти. */}
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
      <WebActionBar
        action={{ text: 'Отлично!', testId: 'streak-celebration-done', onClick: onDone }}
        className="mx-completion-action"
      />
    </div>,
    getFullscreenPortalTarget()
  )
}
