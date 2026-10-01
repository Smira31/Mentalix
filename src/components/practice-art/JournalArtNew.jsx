/*
 * Иллюстрация карточки журнала «Разбери день на части»:
 * тетрадь с пером + дуга дня (солнце → луна) над ней.
 * Тонкие светлые линии, монохром, без заливок.
 */
export default function JournalArtNew({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 112"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Дуга дня */}
      <path
        d="M26 28 Q80 4 134 28"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Солнце слева */}
      <circle cx="26" cy="28" r="4.5" stroke="rgb(var(--c-line))" strokeWidth="1.2" />
      {/* Лучи солнца */}
      <path
        d="M26 19 L26 15 M19 23 L16 20 M19 33 L16 36 M26 37 L26 41 M33 33 L36 36 M33 23 L36 20"
        stroke="rgb(var(--c-line))"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Месяц справа */}
      <path
        d="M140 28 A6 6 0 1 1 134 22 A4.5 4.5 0 1 0 140 28 Z"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Маленькая звезда у месяца */}
      <path
        d="M126 16 L126 12 M124 14 L128 14"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Тетрадь — левая страница */}
      <path
        d="M30 54 L30 96 L78 92 L78 50 Z"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Тетрадь — правая страница */}
      <path
        d="M82 50 L82 92 L130 96 L130 54 Z"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Корешок */}
      <path
        d="M78 50 L78 92 M82 50 L82 92"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Линии текста — левая страница */}
      <path
        d="M38 62 L70 60 M38 68 L68 66 M38 74 L66 72 M38 80 L64 78"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Линии текста — правая страница */}
      <path
        d="M88 60 L122 62 M88 66 L120 68 M88 72 L118 74 M88 78 L116 80"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Перо по диагонали */}
      <path
        d="M104 40 L128 64"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Остриё пера */}
      <path
        d="M104 40 L100 36"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Перо — оперение */}
      <path
        d="M128 64 L132 68"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Перо — декоративная полоска */}
      <path
        d="M114 50 L118 54"
        stroke="rgb(var(--c-line))"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}
