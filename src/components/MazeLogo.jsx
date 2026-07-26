import { useEffect, useRef, useState } from 'react'

// ── Символ Mentalix: лабиринт ──
// Квадратная спираль, по которой золотом заполняется пройденный путь.
// progress 0..1 — сколько лабиринта уже пройдено.
//
// Геометрия: шаг между витками ровно 11 единиц на всех кольцах,
// вход снизу по центру, финиш — в центральной камере.
const MAZE_PATH =
  'M50 98 L13 98 L13 13 L87 13 L87 87 L24 87 L24 24 L76 24 L76 76 L35 76 L35 35 L65 35 L65 65 L46 65 L46 46 L54 46 L54 54'

export default function MazeLogo({
  size = 64,
  progress = 1,
  className = '',
  baseClass = 'text-cream/15',
  trailClass = 'text-gold',
  dotClass = 'fill-gold',
  showDot = true,
}) {
  const p = Math.max(0, Math.min(1, progress))
  const trailRef = useRef(null)
  const [dot, setDot] = useState(null)

  // Точка «ты здесь» едет по маршруту вместе с прогрессом.
  useEffect(() => {
    const path = trailRef.current
    if (!path || typeof path.getTotalLength !== 'function') return
    try {
      const len = path.getTotalLength()
      if (!len) return
      const pt = path.getPointAtLength(len * p)
      setDot({ x: pt.x, y: pt.y })
    } catch {
      // окружение без поддержки SVG-геометрии — просто без точки
    }
  }, [p])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* стены лабиринта */}
      <path
        d={MAZE_PATH}
        stroke="currentColor"
        className={baseClass}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* пройденный путь */}
      <path
        ref={trailRef}
        d={MAZE_PATH}
        pathLength="1"
        stroke="currentColor"
        className={`${trailClass} transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${p} 1`}
      />

      {/* ты — там, докуда дошёл */}
      {showDot && dot && (
        <g className="transition-transform duration-700 ease-out motion-reduce:transition-none">
          <circle cx={dot.x} cy={dot.y} r="8" className={dotClass} opacity="0.14" />
          <circle cx={dot.x} cy={dot.y} r="4" className={dotClass} />
        </g>
      )}
    </svg>
  )
}
