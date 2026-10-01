/*
 * Иллюстрация стартового экрана Следопыта («Когда неясно, с чего начать»).
 * Стиль Stoic: крупные плоские залитые светлые фигуры, детали — тёмные прорези.
 * Фонарь + солнце-звезда лучами + извилистая лента-тропа.
 * Тот же размер (100×120) и место, что у картинки на экране завершения чек-ина.
 */
export default function TrackerArtStart({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ── Солнце-звезда с лучами ── */}
      <g fill="rgb(var(--c-text))">
        <circle cx="72" cy="24" r="12" />
        {/* 8 лучей-треугольников */}
        <path d="M72 4 L75 12 L69 12 Z" />
        <path d="M72 44 L75 36 L69 36 Z" />
        <path d="M52 24 L60 21 L60 27 Z" />
        <path d="M92 24 L84 21 L84 27 Z" />
        <path d="M58 10 L64 16 L60 20 Z" />
        <path d="M86 38 L80 32 L84 28 Z" />
        <path d="M86 10 L80 16 L84 20 Z" />
        <path d="M58 38 L64 32 L60 28 Z" />
      </g>
      {/* Тёмный серповидный вырез внутри солнца */}
      <circle cx="77" cy="21" r="9" fill="rgb(var(--c-bg))" />

      {/* ── Фонарь ── */}
      <g fill="rgb(var(--c-text))">
        {/* Крыша-трапеция */}
        <path d="M22 54 L40 42 L58 54 L54 58 L26 58 Z" />
        {/* Корпус */}
        <rect x="26" y="58" width="28" height="30" rx="3" />
        {/* Основание */}
        <rect x="20" y="88" width="40" height="7" rx="3" />
        {/* Дужка-ручка */}
        <path
          d="M36 42 Q40 36 44 42"
          fill="none"
          stroke="rgb(var(--c-text))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      {/* Тёмное окно-прорезь внутри фонаря */}
      <rect x="33" y="64" width="14" height="18" rx="3" fill="rgb(var(--c-bg))" />
      {/* Тонкая тёмная перекладина окна */}
      <rect x="33" y="72" width="14" height="2" fill="rgb(var(--c-bg))" />

      {/* ── Извилистая лента-тропа (холм-подножие) ── */}
      <path
        d="M0 114
           C14 106 18 100 30 102
           C42 104 36 94 50 96
           C62 98 56 90 70 92
           C82 94 76 86 90 88
           L100 88 L100 120 L0 120 Z"
        fill="rgb(var(--c-text))"
      />
      {/* Тёмная извилистая тропа-прорезь на холме */}
      <path
        d="M8 112 C18 108 20 104 28 106 C36 108 32 102 40 104 C48 106 42 98 50 100"
        fill="none"
        stroke="rgb(var(--c-bg))"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
