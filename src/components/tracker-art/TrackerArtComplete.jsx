/*
 * Иллюстрация финального экрана Следопыта / «Записи».
 * Стиль Stoic: залитая «планета»-холм с воткнутым флажком
 * и кольцом-орбитой из следов. Тот же размер (100×120), что у арт-завершения.
 */
export default function TrackerArtComplete({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ── Кольцо-орбита (тонкая залитая дорожка) ── */}
      <ellipse
        cx="50"
        cy="72"
        rx="42"
        ry="14"
        fill="none"
        stroke="rgb(var(--c-text))"
        strokeWidth="4"
        opacity="0.35"
      />

      {/* ── Следы-точки на орбите ── */}
      <g fill="rgb(var(--c-text))">
        <ellipse cx="14" cy="74" rx="2.5" ry="4" />
        <ellipse cx="86" cy="74" rx="2.5" ry="4" />
        <ellipse cx="30" cy="64" rx="2.5" ry="4" />
        <ellipse cx="70" cy="64" rx="2.5" ry="4" />
        <ellipse cx="42" cy="60" rx="2" ry="3" />
        <ellipse cx="58" cy="60" rx="2" ry="3" />
      </g>

      {/* ── Планета-холм (залитый купол) ── */}
      <path
        d="M18 90 A32 32 0 0 1 82 90 L82 120 L18 120 Z"
        fill="rgb(var(--c-text))"
      />

      {/* ── Флажок на холме ── */}
      <g fill="rgb(var(--c-text))">
        {/* Древко */}
        <rect x="48" y="32" width="3.5" height="40" rx="1" />
        {/* Флажок-треугольник */}
        <path d="M51.5 34 L68 38 L60 44 L51.5 44 Z" />
      </g>

      {/* Тёмные детали на планете ── */}
      <g fill="rgb(var(--c-bg))">
        {/* Кратер-прорезь */}
        <ellipse cx="38" cy="100" rx="5" ry="2.5" />
        <ellipse cx="62" cy="106" rx="4" ry="2" />
      </g>

      {/* Тёмная тень-прорезь под флажком */}
      <rect x="46" y="68" width="8" height="3" rx="1.5" fill="rgb(var(--c-bg))" />
    </svg>
  )
}
