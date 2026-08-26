const PATH_D = 'M 8 112 C 42 88, 54 38, 92 48 S 138 126, 178 96 S 226 32, 264 54 S 306 126, 350 72 S 378 42, 392 22'

export default function JourneyLineArt({ progress = 0, className = '' }) {
  const normalized = Math.max(0, Math.min(100, Number(progress) || 0))

  return (
    <svg
      viewBox="0 0 400 140"
      className={className}
      role="img"
      aria-label={`Линия пути: ${normalized}%`}
      preserveAspectRatio="none"
    >
      <path
        d={PATH_D}
        pathLength="100"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={PATH_D}
        pathLength="100"
        fill="none"
        stroke="rgb(var(--c-gold))"
        strokeOpacity="0.9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${normalized} 100`}
      />
      <circle
        cx="392"
        cy="22"
        r="4"
        fill="rgb(var(--c-gold))"
        fillOpacity={normalized >= 100 ? 1 : 0.35}
      />
    </svg>
  )
}
