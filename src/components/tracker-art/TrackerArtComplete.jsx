/*
 * Иллюстрация финального экрана Следопыта:
 * тропа со следами, ведущая к флажку. Тонкие светлые линии, монохром, без заливок.
 * Тот же размер и место, что у завершения чек-ина (100×120).
 */
export default function TrackerArtComplete({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Земля */}
      <path
        d="M4 108 Q50 104 96 108"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* Извилистая тропа */}
      <path
        d="M16 102 C30 90 24 74 38 64 C52 54 44 40 58 30 C64 24 62 18 68 14"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Следы вдоль тропы */}
      {/* Пара 1 */}
      <ellipse cx="20" cy="94" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />
      <ellipse cx="25" cy="90" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />

      {/* Пара 2 */}
      <ellipse cx="28" cy="74" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />
      <ellipse cx="33" cy="70" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />

      {/* Пара 3 */}
      <ellipse cx="44" cy="54" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />
      <ellipse cx="49" cy="50" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />

      {/* Пара 4 */}
      <ellipse cx="54" cy="34" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />
      <ellipse cx="59" cy="30" rx="1.8" ry="2.8" stroke="rgb(var(--c-line))" strokeWidth="0.9" />

      {/* Древко флажка */}
      <path
        d="M68 14 L68 50"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Флажок */}
      <path
        d="M68 14 L86 18 L78 24 L86 30 L68 26 Z"
        stroke="rgb(var(--c-line))"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Основание древка — небольшой камень */}
      <path
        d="M64 50 L72 50"
        stroke="rgb(var(--c-line-secondary))"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}
