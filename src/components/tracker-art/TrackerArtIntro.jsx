/*
 * Иллюстрация вступления «Записи» («Когда непонятно, что делать»).
 * Стиль Stoic: крупные плоские залитые светлые фигуры, детали — тёмные прорези.
 * Развилка тропы с фонарём. Тот же размер (100×120), что у арт-завершения.
 */
export default function TrackerArtIntro({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ── Два расходящихся холма-тропы ── */}
      <g fill="rgb(var(--c-text))">
        {/* Левая тропа */}
        <path d="M0 120 L0 92 C18 86 26 78 38 64 L44 70 C30 84 22 92 12 100 L12 120 Z" />
        {/* Правая тропа */}
        <path d="M100 120 L100 92 C82 86 74 78 62 64 L56 70 C70 84 78 92 88 100 L88 120 Z" />
        /* Центральный клин-разделитель (нижний) */
        <path d="M44 70 L50 64 L56 70 L56 120 L44 120 Z" />
      </g>
      {/* Тёмные прорези-следы на левой тропе */}
      <g fill="rgb(var(--c-bg))">
        <ellipse cx="20" cy="96" rx="2" ry="3.5" />
        <ellipse cx="24" cy="102" rx="2" ry="3.5" />
        <ellipse cx="16" cy="102" rx="2" ry="3.5" />
      </g>
      {/* Тёмные прорези-следы на правой тропе */}
      <g fill="rgb(var(--c-bg))">
        <ellipse cx="80" cy="96" rx="2" ry="3.5" />
        <ellipse cx="84" cy="102" rx="2" ry="3.5" />
        <ellipse cx="76" cy="102" rx="2" ry="3.5" />
      </g>

      {/* ── Фонарь на развилке ── */}
      <g fill="rgb(var(--c-text))">
        {/* Крыша */}
        <path d="M38 48 L50 36 L62 48 L58 52 L42 52 Z" />
        {/* Корпус */}
        <rect x="42" y="52" width="16" height="20" rx="2" />
        {/* Основание-постамент */}
        <path d="M36 72 L68 72 L64 80 L40 80 Z" />
        {/* Столб */}
        <rect x="48" y="80" width="4" height="6" />
        {/* Дужка */}
        <path
          d="M46 36 Q50 30 54 36"
          fill="none"
          stroke="rgb(var(--c-text))"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      {/* Тёмное окно фонаря */}
      <rect x="46" y="56" width="8" height="12" rx="2" fill="rgb(var(--c-bg))" />
      {/* Тёмная перекладина окна */}
      <rect x="46" y="61" width="8" height="1.5" fill="rgb(var(--c-bg))" />
    </svg>
  )
}
