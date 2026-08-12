import { useEffect, useRef, useState } from 'react'

// ── Символ Mentalix: лабиринт ──
// Круговой однопутный лабиринт, по которому золотом заполняется пройденный путь.
// progress 0..1 — сколько лабиринта уже пройдено.
//
// Геометрия: один вход снизу, чередующиеся кольца и финиш в центре.
export const LABYRINTH_PATH = `
  M 100 184
  A 84 84 0 1 1 100 16
  A 84 84 0 1 1 100 184
  L 100 168
  A 68 68 0 1 0 100 32
  A 68 68 0 1 0 100 168
  L 100 152
  A 52 52 0 1 1 100 48
  A 52 52 0 1 1 100 152
  L 100 136
  A 36 36 0 1 0 100 64
  A 36 36 0 1 0 100 136
  L 100 120
  A 20 20 0 1 1 100 80
  A 20 20 0 1 1 100 120
  L 100 100
`

export default function MazeLogo({
  size = 64,
  progress = 1,
  className = '',
  baseClass = 'text-faint',
  trailClass = 'text-gold',
  dotClass = 'fill-gold',
  showDot = true,
  animateOnMount = false,
  motionDuration = 700,
}) {
  const p = Math.max(0, Math.min(1, progress))
  const trailRef = useRef(null)
  const [dot, setDot] = useState(null)
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [dotVisible, setDotVisible] = useState(!animateOnMount)
  const displayProgress = animateOnMount ? animatedProgress : p

  // На редких приветственных экранах путь можно один раз спокойно
  // дорисовать. По умолчанию компонент остаётся прежним: без стартовой
  // анимации и с теми же 700 мс при изменении progress.
  useEffect(() => {
    if (!animateOnMount) return undefined

    const reducedMotion = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    )

    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => {
        setAnimatedProgress(p)
        setDotVisible(true)
      })
      return () => window.cancelAnimationFrame(frame)
    }

    const frame = window.requestAnimationFrame(() => setAnimatedProgress(p))
    const dotTimer = window.setTimeout(
      () => setDotVisible(true),
      Math.round(motionDuration * 0.68)
    )

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(dotTimer)
    }
  }, [animateOnMount, motionDuration, p])

  // Точка «ты здесь» едет по маршруту вместе с прогрессом.
  useEffect(() => {
    const path = trailRef.current
    if (!path || typeof path.getTotalLength !== 'function') return
    try {
      const len = path.getTotalLength()
      if (!len) return
      const pt = path.getPointAtLength(len * displayProgress)
      setDot({ x: pt.x, y: pt.y })
    } catch {
      // окружение без поддержки SVG-геометрии — просто без точки
    }
  }, [displayProgress])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="100"
        cy="100"
        r="91"
        stroke="currentColor"
        className={baseClass}
        strokeWidth="1"
        strokeDasharray="2 7"
        vectorEffect="non-scaling-stroke"
      />

      {/* стены лабиринта */}
      <path
        d={LABYRINTH_PATH}
        stroke="currentColor"
        className={baseClass}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* пройденный путь */}
      <path
        ref={trailRef}
        d={LABYRINTH_PATH}
        pathLength="1"
        stroke="currentColor"
        className={`${trailClass} transition-[stroke-dasharray] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none`}
        style={{
          transitionDuration: `${motionDuration}ms`,
        }}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${displayProgress} 1`}
        vectorEffect="non-scaling-stroke"
      />

      {/* ты — там, докуда дошёл */}
      {showDot && dot && (
        <g
          className="transition-opacity [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            opacity: dotVisible ? 1 : 0,
            transitionDuration: `${Math.min(520, motionDuration)}ms`,
          }}
        >
          <circle cx={dot.x} cy={dot.y} r="9" className={dotClass} opacity="0.14" />
          <circle cx={dot.x} cy={dot.y} r="3.6" className={dotClass} />
        </g>
      )}
    </svg>
  )
}
