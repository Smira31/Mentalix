import './CardSystemGlyph.css'


function Guide() {
  return (
    <g className="mx-card-system-glyph__guide">
      <path d="M18 88H142" />
      <path d="M80 12V100" />
    </g>
  )
}


function Drawing({ kind }) {
  if (kind === 'asceza-boundary') {
    return (
      <>
        <Guide />
        <g className="mx-card-system-glyph__boundary mx-card-system-glyph__boundary--outer">
          <path d="M20 22L58 40L72 56L58 72L20 90" />
          <path d="M140 22L102 40L88 56L102 72L140 90" />
        </g>
        <g className="mx-card-system-glyph__boundary mx-card-system-glyph__boundary--inner">
          <path d="M38 30L66 44L76 56L66 68L38 82" />
          <path d="M122 30L94 44L84 56L94 68L122 82" />
        </g>
        <path className="mx-card-system-glyph__threshold" d="M80 24V88" />
        <circle className="mx-card-system-glyph__point" cx="80" cy="56" r="4" />
      </>
    )
  }

  if (kind === 'neuro-synapse') {
    return (
      <>
        <Guide />
        <g className="mx-card-system-glyph__network">
          <path d="M22 74L40 48L58 62L78 40L98 56L118 34L140 52" />
          <path d="M40 48L30 26M40 48L54 28M58 62L46 86M58 62L78 82M78 40L74 18M78 40L98 24M98 56L92 86M98 56L118 78M118 34L136 22M118 34L140 52" />
          <circle cx="22" cy="74" r="2.2" /><circle cx="40" cy="48" r="2.8" />
          <circle cx="58" cy="62" r="2.5" /><circle cx="78" cy="40" r="3" />
          <circle cx="98" cy="56" r="2.6" /><circle cx="118" cy="34" r="2.8" />
          <circle cx="140" cy="52" r="2.2" /><circle cx="30" cy="26" r="2" />
          <circle cx="54" cy="28" r="2.1" /><circle cx="46" cy="86" r="2.2" />
          <circle cx="78" cy="82" r="2.4" /><circle cx="74" cy="18" r="2" />
          <circle cx="98" cy="24" r="2.2" /><circle cx="92" cy="86" r="2.1" />
          <circle cx="118" cy="78" r="2.4" /><circle cx="136" cy="22" r="2" />
        </g>
        <path className="mx-card-system-glyph__route" d="M22 74L40 48L58 62L78 40L98 56L118 34L140 52" />
        <circle className="mx-card-system-glyph__point mx-card-system-glyph__signal" cx="22" cy="74" r="4" />
      </>
    )
  }

  if (kind === 'breath-flow') {
    return (
      <>
        <Guide />
        <g className="mx-card-system-glyph__breath-upper">
          <path d="M24 56C37 31 55 19 80 19C105 19 123 31 136 56" />
          <path d="M39 56C49 39 62 31 80 31C98 31 111 39 121 56" />
        </g>
        <g className="mx-card-system-glyph__breath-lower">
          <path d="M24 56C37 81 55 93 80 93C105 93 123 81 136 56" />
          <path d="M39 56C49 73 62 81 80 81C98 81 111 73 121 56" />
        </g>
        <path className="mx-card-system-glyph__breath-axis" d="M80 22V90" />
        <circle className="mx-card-system-glyph__point" cx="80" cy="56" r="4.5" />
      </>
    )
  }

  if (kind === 'focus-convergence') {
    return (
      <>
        <Guide />
        <g className="mx-card-system-glyph__focus-beams">
          <path d="M18 22C42 28 58 40 80 56" />
          <path d="M18 39C46 42 62 48 80 56" />
          <path d="M18 56H80" />
          <path d="M18 73C46 70 62 64 80 56" />
          <path d="M18 90C42 84 58 72 80 56" />
        </g>
        <path className="mx-card-system-glyph__focus-axis" d="M84 56H142" />
        <path className="mx-card-system-glyph__focus-plane" d="M80 42V70" />
        <circle className="mx-card-system-glyph__point" cx="80" cy="56" r="4.5" />
      </>
    )
  }

  if (kind === 'meditation-contours') {
    return (
      <>
        <Guide />
        <g className="mx-card-system-glyph__contour mx-card-system-glyph__contour--outer">
          <path d="M28 56C28 31 49 16 78 19C108 15 134 32 132 58C135 84 108 97 80 93C50 98 25 82 28 56Z" />
        </g>
        <g className="mx-card-system-glyph__contour mx-card-system-glyph__contour--middle">
          <path d="M43 57C41 39 58 29 79 31C100 28 119 41 117 59C118 77 100 85 80 82C58 86 42 74 43 57Z" />
        </g>
        <g className="mx-card-system-glyph__contour mx-card-system-glyph__contour--inner">
          <path d="M59 56C59 46 67 40 80 42C93 40 102 47 101 57C102 68 92 73 80 71C67 73 58 67 59 56Z" />
        </g>
        <circle className="mx-card-system-glyph__point" cx="80" cy="56" r="4" />
      </>
    )
  }

  return (
    <>
      <Guide />
      <g className="mx-card-system-glyph__path-wall mx-card-system-glyph__path-wall--left">
        <path d="M18 92C42 84 52 68 64 56C76 44 80 32 84 16" />
        <path d="M34 94C52 82 60 68 70 58C82 46 88 34 92 18" />
      </g>
      <g className="mx-card-system-glyph__path-wall mx-card-system-glyph__path-wall--right">
        <path d="M142 20C118 28 108 42 96 54C84 66 80 78 76 96" />
        <path d="M126 18C108 30 100 44 90 54C78 66 72 78 68 94" />
      </g>
      <path className="mx-card-system-glyph__path-route" d="M26 88C52 80 60 66 80 56C100 46 108 30 134 22" />
      <circle className="mx-card-system-glyph__point mx-card-system-glyph__path-signal" cx="26" cy="88" r="4" />
    </>
  )
}


export default function CardSystemGlyph({
  kind,
  animated = true,
  className = '',
}) {
  return (
    <svg
      viewBox="0 0 160 112"
      className={`mx-card-system-glyph mx-card-system-glyph--${kind} ${className}`}
      data-animated={animated}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <Drawing kind={kind} />
    </svg>
  )
}
