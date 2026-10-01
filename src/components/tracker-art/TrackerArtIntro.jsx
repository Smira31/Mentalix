/*
 * Иллюстрация стартового экрана Следопыта:
 * развилка тропы с фонарём. Тонкие светлые линии, монохром, без заливок.
 */
export default function TrackerArtIntro({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 112"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Земля */}
      <path
        d="M6 96 Q80 92 154 96"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Главная тропа снизу к развилке */}
      <path
        d="M80 100 L80 74"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Левая ветка */}
      <path
        d="M80 74 C64 66 48 58 32 48"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Правая ветка */}
      <path
        d="M80 74 C96 66 112 58 128 48"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Столб фонаря */}
      <path
        d="M80 74 L80 38"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Корпус фонаря */}
      <path
        d="M72 38 L72 28 L88 28 L88 38 Z"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Крышка фонаря */}
      <path
        d="M74 28 L86 28 M80 24 L80 28"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Петля наверху */}
      <path
        d="M77 24 Q80 19 83 24"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Лучи света */}
      <path
        d="M66 33 L58 29 M69 25 L63 19 M80 22 L80 15 M91 25 L97 19 M94 33 L102 29"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Камни/трава у тропы */}
      <path
        d="M38 92 L41 88 M54 94 L57 90 M102 94 L105 90 M120 92 L123 88"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  )
}
