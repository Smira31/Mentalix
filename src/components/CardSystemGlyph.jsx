const GLYPH_BY_PRACTICE = {
  ascezas: 'asceza-boundary',
  breathing: 'breath-flow',
  meditation: 'meditation-contours',
  journal: 'focus-convergence',
  rituals: 'ritual-cycle',
  mood: 'mood-face',
  'alter-ego': 'alter-ego-mask',
}

function GlyphShape({ kind }) {
  switch (kind) {
    case 'ritual-cycle':
      return (
        <>
          <path d="M45 18a19 19 0 1 1-26 0" fill="none" />
          <path d="M19 10v8h-8" fill="none" />
          <circle cx="32" cy="32" r="4" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'mood-face':
      return (
        <>
          <circle cx="32" cy="32" r="20" fill="none" />
          <path d="M23 37c5 6 13 6 18 0" fill="none" />
          <circle cx="25" cy="27" r="2.5" className="mx-card-system-glyph__accent" />
          <circle cx="39" cy="27" r="2.5" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'alter-ego-mask':
      return (
        <>
          <path d="M12 20c10-5 30-5 40 0 0 15-8 26-20 26S12 35 12 20Z" fill="none" />
          <path d="M19 28c3-3 7-3 10 0M35 28c3-3 7-3 10 0" fill="none" />
          <circle cx="32" cy="38" r="3" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'asceza-boundary':
      return (
        <>
          <path d="M14 17h12c4 0 5 2 6 5 1-3 2-5 6-5h12" />
          <path d="M14 47h12c4 0 5-2 6-5 1 3 2 5 6 5h12" />
          <path d="M32 28v8" />
          <circle cx="32" cy="32" r="3" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'neuro-synapse':
      return (
        <>
          <path d="M17 22 31 32 47 18M31 32 46 46M17 42 31 32" />
          <circle cx="17" cy="22" r="4" />
          <circle cx="47" cy="18" r="4" />
          <circle cx="17" cy="42" r="4" />
          <circle cx="46" cy="46" r="4" />
          <circle cx="31" cy="32" r="4" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'breath-flow':
      return (
        <>
          <path d="M13 23c6-8 13-8 19 0 6 8 13 8 19 0M13 41c6 8 13 8 19 0 6-8 13-8 19 0" />
          <circle cx="32" cy="32" r="4" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'focus-convergence':
      return (
        <>
          <path d="M12 14v10M12 14h10M52 14H42M52 14v10M12 50V40M12 50h10M52 50H42M52 50V40" />
          <path d="m20 22 9 9M44 22l-9 9M20 42l9-9M44 42l-9-9" />
          <circle cx="32" cy="32" r="4" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'meditation-contours':
      return (
        <>
          <path d="M11 26c6-9 14-12 21-12s15 3 21 12c-6-4-14-5-21-5s-15 1-21 5ZM11 38c6 9 14 12 21 12s15-3 21-12c-6 4-14 5-21 5s-15-1-21-5Z" />
          <circle cx="32" cy="32" r="4" className="mx-card-system-glyph__accent" />
        </>
      )
    case 'path-corridor':
    default:
      return (
        <>
          <path d="M16 12 27 52M48 12 37 52M23 20h18M20 32h24M17 44h30" />
          <circle cx="32" cy="32" r="4" className="mx-card-system-glyph__accent" />
        </>
      )
  }
}

export function practiceGlyphKind(practice) {
  return GLYPH_BY_PRACTICE[practice?.key] || 'focus-convergence'
}

export default function CardSystemGlyph({ kind = 'focus-convergence', className = '' }) {
  return (
    <svg
      className={`mx-card-system-glyph ${className}`.trim()}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <GlyphShape kind={kind} />
    </svg>
  )
}
