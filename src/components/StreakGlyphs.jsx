import { STREAK_PETALS, litStreakPetals } from '../lib/streakCelebration'
import './StreakGlyphs.css'

/*
 * Значки серии Mentalix — только SVG: тонкие линии, без заливок
 * (огонёк), без свечения, тени и emoji.
 *
 * Цветок: замеры Stoic — верхняя миндалина 16×27 с острыми концами,
 * четыре полумесяца той же длины (≈30 по дуге) наклонены на +5°,
 * зазоры между лепестками 4.7–6.6, в центре пусто (⌀12),
 * общий размер цветка ≈61×65 при viewBox 66.
 * Геометрия не меняется — меняется только число светлых лепестков.
 */
const ALMOND_PATH =
  'M33 0C28.6 5.2 25 10.2 25 13.5C25 16.8 28.6 21.8 33 27C37.4 21.8 41 16.8 41 13.5C41 10.2 37.4 5.2 33 0Z'
const CRESCENT_PATH =
  'M33 27C39.8 24.4 44 19.6 45.3 12.4C46.3 8.3 46.3 5.3 46.8 2.6C44.8 5.7 43.2 10.2 42.2 14.4C40.9 19.1 36.3 23.4 33 27Z'
const PETAL_TILT = 5

/* Цветок из пяти отдельных лепестков: светлые — дни серии в текущем
 * круге из пяти, тёмные — оставшиеся. Центр пустой (негативное
 * пространство), поэтому ни круга, ни заливки в середине нет. */
export function StreakFlower({ streak = 0, size = 66, className = '', testId = 'streak-petals' }) {
  const lit = litStreakPetals(streak)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 66 66"
      aria-hidden="true"
      focusable="false"
      className={`mx-streak-flower ${className}`.trim()}
      data-testid={testId}
      data-lit={lit}
    >
      <g transform="translate(-2.9 0.5)">
        {Array.from({ length: STREAK_PETALS }, (_, index) => (
          <path
            key={index}
            d={index === 0 ? ALMOND_PATH : CRESCENT_PATH}
            transform={`rotate(${index * (360 / STREAK_PETALS) + (index ? PETAL_TILT : 0)} 33 33)`}
            className={[
              'mx-streak-flower__petal',
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
