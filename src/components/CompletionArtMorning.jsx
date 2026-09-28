/*
 * Утренняя иллюстрация экрана завершения в стиле Stoic:
 * белый плоский силуэт (--c-text), детали вырезаны фоном (--c-bg),
 * без контуров и градиентов. Восходящее солнце — полукруг над ровной
 * линией горизонта, 7 каплевидных лучей веером, рядом маленькая птица.
 * Тот же размер и место, что у прежней иллюстрации (100×120).
 */

// 7 лучей веером над солнцем, основание у верхней дуги, кончик наружу.
const RAY_ANGLES = [-60, -40, -20, 0, 20, 40, 60]

export default function CompletionArtMorning() {
  return (
    <svg className="mx-completion__art" viewBox="0 0 100 120" aria-hidden="true">
      <g fill="rgb(var(--c-text))">
        {RAY_ANGLES.map(angle => {
          const rad = (angle * Math.PI) / 180
          const bx = 50 + 30 * Math.sin(rad)
          const by = 88 - 30 * Math.cos(rad)
          return (
            <g key={angle} transform={`translate(${bx} ${by}) rotate(${angle})`}>
              <path d="M0,0 C5,-2 5,-9 0,-12 C-5,-9 -5,-2 0,0 Z" />
            </g>
          )
        })}
        {/* Солнце-полукруг, плоской стороной на горизонте */}
        <path d="M22,88 A28,28 0 0 1 78,88 Z" />
        {/* Ровная линия горизонта — заполненная полоса земли */}
        <rect x="0" y="88" width="100" height="32" />
        {/* Маленькая простая птица-силуэт рядом */}
        <g transform="translate(64 24)">
          <path d="M0,0 C2,-3 4,-3 6,0 C8,-3 10,-3 12,0 C10,1.5 8,1.5 6,0 C4,1.5 2,1.5 0,0 Z" />
        </g>
      </g>
    </svg>
  )
}
