// ── Символ Mentalix: лабиринт ──
// Спираль-лабиринт, по которой золотом заполняется пройденный путь.
// progress 0..1 — сколько лабиринта уже пройдено.

const MAZE_PATH =
  'M50 96 L12 96 L12 12 L88 12 L88 88 L24 88 L24 24 L76 24 L76 76 L36 76 L36 36 L64 36 L64 64 L48 64 L48 48 L56 48'

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
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* пройденный путь */}
      <path
        d={MAZE_PATH}
        pathLength="1"
        stroke="currentColor"
        className={trailClass}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${p} 1`}
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      {/* ты — в центре лабиринта */}
      {showDot && <circle cx="52" cy="52" r="4.5" className={dotClass} />}
    </svg>
  )
}
