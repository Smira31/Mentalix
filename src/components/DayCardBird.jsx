/**
 * Минималистичная птица-силуэт для завершённой карточки дня (§5.1, тип A).
 * Утро — птица смотрит вправо, точка-глаз, клюв вверх.
 * Вечер — птица смотрит влево, закрытый глаз, клюв вниз.
 * Сидит на горизонтальной линии (рисуется CSS ::before контейнера).
 */
export default function DayCardBird({ facing = 'right' }) {
  if (facing === 'left') {
    return (
      <svg
        className="mx-day-card-bird"
        viewBox="0 0 80 60"
        fill="none"
        aria-hidden="true"
        draggable="false"
      >
        <ellipse cx="48" cy="47" rx="20" ry="13" fill="currentColor" />
        <circle cx="30" cy="33" r="8" fill="currentColor" />
        <path d="M22 35 L12 38 L22 32 Z" fill="currentColor" />
        <path
          className="mx-day-card-bird__eye"
          d="M27 31 Q30 34 33 31"
          fill="none"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg
      className="mx-day-card-bird"
      viewBox="0 0 80 60"
      fill="none"
      aria-hidden="true"
      draggable="false"
    >
      <ellipse cx="32" cy="47" rx="20" ry="13" fill="currentColor" />
      <circle cx="50" cy="33" r="8" fill="currentColor" />
      <path d="M58 31 L68 28 L58 34 Z" fill="currentColor" />
      <circle className="mx-day-card-bird__eye" cx="52" cy="31" r="1.2" />
    </svg>
  )
}
