import { createPortal } from 'react-dom'
import { useBackButton } from '../../platform/telegram.hooks'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  getFullscreenPortalTarget,
} from '../../lib/fullscreenSurface'
import PracticeWeek from './PracticeWeek'
import './PracticeMilestone.css'

/*
 * Веха серии (3 / 7 / 21 / 30 дней) — отдельный полноэкранный экран,
 * а не карточка: круг с числом дней, капсом название практики,
 * крупное «3 дня.», одна фраза о ступени, неделя кружками
 * и белая кнопка «Готово».
 *
 * Экран ждёт решения человека: автоскрытия нет, закрывает «Готово»,
 * системный «Назад» или свайп.
 */
export default function PracticeMilestone({ streak, dayLabel, phrase, name, onDone }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  useBackButton(onDone)

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
          {name && <p className="mx-practice-milestone-screen__name">{name}</p>}
          <p className="mx-practice-milestone-screen__days" data-testid="practice-milestone-days">
            {dayLabel}
          </p>
          {phrase && <p className="mx-practice-milestone-screen__phrase">{phrase}</p>}
          <PracticeWeek streak={streak} />
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
