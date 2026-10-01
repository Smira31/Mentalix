import { createPortal } from 'react-dom'
import { useBackButton } from '../../platform/telegram.hooks'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  getFullscreenPortalTarget,
} from '../../lib/fullscreenSurface'
import './PracticeMilestone.css'

/*
 * Веха серии (3 / 7 / 21 / 30 дней) — отдельный полноэкранный экран,
 * а не карточка: круг с числом дней, подпись «7 дней.», одна фраза
 * о ступени, неделя кружками и белая кнопка «Готово».
 *
 * Экран ждёт решения человека: автоскрытия нет, закрывает «Готово»,
 * системный «Назад» или свайп.
 */
export default function PracticeMilestone({ streak, dayLabel, phrase, name, onDone }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  useBackButton(onDone)

  const weekDots = 7
  const filledDots = Math.min(streak, weekDots)

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-practice-milestone-screen`}
      style={surfaceStyle}
      role="status"
      data-testid="practice-milestone"
    >
      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="my-auto w-full max-w-md mx-auto px-[var(--mx-screen-x)] mx-practice-milestone-screen__body">
          <div className="mx-practice-milestone-screen__circle" data-testid="practice-milestone-count">
            {streak}
          </div>
          <p className="mx-practice-milestone-screen__days">{dayLabel}</p>
          {phrase && <p className="mx-practice-milestone-screen__phrase">{phrase}</p>}
          {name && <p className="mx-practice-milestone-screen__name">{name}</p>}
          <div className="mx-practice-milestone-screen__week" aria-hidden="true">
            {Array.from({ length: weekDots }, (_, index) => (
              <span
                key={index}
                className={`mx-practice-milestone-screen__dot${index < filledDots ? ' is-on' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-[var(--mx-screen-x)] pb-4">
        <div className="w-full max-w-md mx-auto">
          <button
            type="button"
            className="mx-practice-milestone-screen__done"
            data-testid="practice-milestone-done"
            onClick={onDone}
          >
            Готово
          </button>
        </div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
