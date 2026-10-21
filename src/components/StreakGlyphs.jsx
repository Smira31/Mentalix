import { STREAK_PETALS, litStreakPetals } from '../lib/streakCelebration'
import './StreakGlyphs.css'

/*
 * Значки серии Mentalix — только SVG: тонкие линии, без заливок
 * (огонёк), без свечения, тени и emoji.
 *
 * Цветок: пять одинаковых миндалевидных лепестков (как в референсе Stoic —
 * вытянутая миндалина с острыми концами), повёрнутых на 72° вокруг центра.
 * Узкий конец лепестка у центра (радиус 12 — пустое отверстие ⌀24), широкий
 * снаружи (радиус 46.6): зазор между соседними лепестками ≈15°, поэтому
 * лепестки читаются по отдельности, а не сливаются в кляксу.
 * Геометрия одна для всех состояний — меняется только число светлых лепестков.
 */
const PETAL_PATH =
  'M50 38C57.6 30.8 61.2 25.6 61.2 21C61.2 13.8 56.2 8 50 3.4C43.8 8 38.8 13.8 38.8 21C38.8 25.6 42.4 30.8 50 38Z'

/* Цветок из пяти отдельных лепестков: светлые — дни серии в текущем
 * круге из пяти, тёмные — оставшиеся. Центр пустой (негативное
 * пространство), поэтому ни круга, ни заливки в середине нет. */
export function StreakFlower({ streak = 0, size = 100, className = '', testId = 'streak-petals' }) {
  const lit = litStreakPetals(streak)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={`mx-streak-flower ${className}`.trim()}
      data-testid={testId}
      data-lit={lit}
    >
      {Array.from({ length: STREAK_PETALS }, (_, index) => (
        <path
          key={index}
          d={PETAL_PATH}
          transform={`rotate(${index * (360 / STREAK_PETALS)} 50 50)`}
          className={[
            'mx-streak-flower__petal',
            index < lit ? 'is-lit' : '',
            index === lit - 1 ? 'is-new' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </svg>
  )
}

/*
 * Огонёк серии: светлый тонкий контур — внешнее пламя и внутренний
 * язычок. Обе линии без заливки, свечения и тени; толщина задана
 * атрибутом, поэтому правило не зависит от внешнего CSS.
 */
export function StreakFlame({ size = 17, className = '', testId }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 28) / 24)}
      viewBox="0 0 24 28"
      aria-hidden="true"
      focusable="false"
      className={`mx-streak-flame ${className}`.trim()}
      data-testid={testId}
    >
      <path
        d="M13.8 1.8c.5 4.1-2.4 5.8-3.7 8.3C8.8 7.7 9.2 5.5 9.2 4 5.3 7.1 3.6 11 4.1 15.2c.6 5.5 4.3 9 8.3 9 4.7 0 8.1-3.5 8.1-8.2 0-4.7-3.1-8.7-6.7-14.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 13.2c1.9 2.3 2.7 3.5 2.7 5.2 0 1.9-1.2 3.4-3.1 3.4-1.7 0-2.9-1.3-2.9-3.2 0-1.6 1.1-3 3.3-5.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
