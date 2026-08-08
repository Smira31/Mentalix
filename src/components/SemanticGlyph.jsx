import './SemanticGlyph.css'


const normalize = (value) => String(value || '').toLowerCase()

const includesAny = (value, fragments) => {
  const text = normalize(value)
  return fragments.some((fragment) => text.includes(fragment))
}


export function semanticKindForRitual(title) {
  if (includesAny(title, ['молит', 'духовн'])) return 'prayer'
  if (includesAny(title, ['душ', 'холодн', 'облив'])) return 'shower'
  if (includesAny(title, ['зачем', 'проснул', 'смысл', 'намерен'])) return 'purpose'
  if (includesAny(title, ['вод', 'стакан'])) return 'water'
  return 'ritual'
}


export function semanticKindForAsceza(asceza) {
  const text = `${asceza?.name || ''} ${asceza?.category || ''}`
  if (includesAny(text, ['алкогол', 'вино', 'пиво'])) return 'alcohol'
  if (includesAny(text, ['курен', 'сигар', 'никотин'])) return 'smoking'
  return 'asceza'
}


export function semanticKindForArticle(article) {
  const text = `${article?.tag || ''} ${article?.title || ''}`
  if (includesAny(text, ['тревог', 'стресс', 'паник', 'страх'])) return 'anxiety'
  if (includesAny(text, ['сон', 'сна', 'бессон', 'выспат', 'ноч'])) return 'sleep'
  if (includesAny(text, ['нейро', 'мозг', 'памят'])) return 'neuro'
  if (includesAny(text, ['фокус', 'вниман', 'концентрац'])) return 'focus'
  if (includesAny(text, ['дыхан', 'дыш'])) return 'breath'
  return 'template'
}


export function semanticKindForPersona(persona) {
  if (persona === 'kompas') return 'mentor'
  if (persona === 'dnevnik') return 'pathfinder'
  return 'companion'
}


function Guide() {
  return (
    <g className="mx-semantic-glyph__guide">
      <path d="M18 88H142" />
      <path d="M80 12V100" />
    </g>
  )
}


function Drawing({ kind }) {
  switch (kind) {
    case 'neuro':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__neuro-branches">
            <path d="M30 76L54 54L40 30" />
            <path d="M54 54L68 38" />
            <path d="M130 34L106 56L120 82" />
            <path d="M106 56L92 74" />
          </g>
          <g className="mx-semantic-glyph__neuro-nodes">
            <circle cx="30" cy="76" r="3" /><circle cx="40" cy="30" r="3" />
            <circle cx="68" cy="38" r="3" /><circle cx="130" cy="34" r="3" />
            <circle cx="120" cy="82" r="3" /><circle cx="92" cy="74" r="3" />
          </g>
          <path className="mx-semantic-glyph__neuro-bridge" d="M54 54C64 44 70 52 80 56C90 60 96 66 106 56" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'breath':
      return (
        <>
          <Guide />
          <path className="mx-semantic-glyph__breath-left" d="M78 30C52 28 34 44 38 68C42 88 66 86 78 64Z" />
          <path className="mx-semantic-glyph__breath-right" d="M82 30C108 28 126 44 122 68C118 88 94 86 82 64Z" />
          <path className="mx-semantic-glyph__axis" d="M80 24V82" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'focus':
      return (
        <>
          <Guide />
          <path className="mx-semantic-glyph__lens-outer" d="M24 56C48 24 112 24 136 56C112 88 48 88 24 56Z" />
          <path className="mx-semantic-glyph__lens-inner" d="M54 56C66 40 94 40 106 56C94 72 66 72 54 56Z" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'meditation':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__meditation-waves">
            <path d="M28 72Q80 22 132 72" />
            <path d="M46 72Q80 40 114 72" />
            <path d="M62 72Q80 56 98 72" />
          </g>
          <path className="mx-semantic-glyph__horizon" d="M38 78H122" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="72" r="4" />
        </>
      )

    case 'prayer':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__prayer">
            <path d="M30 78A50 50 0 0 1 130 78" />
            <path d="M50 78A30 30 0 0 1 110 78" />
            <path d="M80 22V66" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="64" r="4" />
        </>
      )

    case 'shower':
      return (
        <>
          <Guide />
          <path className="mx-semantic-glyph__shower-arch" d="M38 42Q80 14 122 42" />
          <g className="mx-semantic-glyph__streams">
            <path d="M48 48V78" /><path d="M64 46V84" /><path d="M80 44V88" />
            <path d="M96 46V84" /><path d="M112 48V78" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="88" r="4" />
        </>
      )

    case 'purpose':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__purpose-arcs">
            <path d="M26 78A54 54 0 0 1 134 78" />
            <path d="M48 78A32 32 0 0 1 112 78" />
          </g>
          <path className="mx-semantic-glyph__horizon" d="M24 84H136" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="58" r="4" />
        </>
      )

    case 'water':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__glass">
            <path d="M54 28H106L100 84H60Z" />
            <path d="M58 62C70 58 90 66 102 62" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="62" r="4" />
        </>
      )

    case 'alcohol':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__glass">
            <path d="M54 26H106C104 56 96 68 80 72C64 68 56 56 54 26Z" />
            <path d="M80 72V88M62 90H98" /><path d="M58 44C70 40 90 50 102 44" />
          </g>
          <path className="mx-semantic-glyph__decision" d="M42 82L118 30" />
          <circle className="mx-semantic-glyph__point" cx="106" cy="38" r="4" />
        </>
      )

    case 'smoking':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__cigarette">
            <path d="M28 64H100V80H28Z" /><path d="M100 64H130V80H100Z" />
            <path d="M108 69H124M108 74H124" /><path d="M28 64V80M34 68V76" />
          </g>
          <g className="mx-semantic-glyph__smoke"><path d="M34 58C18 48 44 38 30 26" /><path d="M50 56C34 44 58 36 44 22" /></g>
          <path className="mx-semantic-glyph__decision" d="M66 56L88 88" />
          <circle className="mx-semantic-glyph__point" cx="28" cy="72" r="4" />
        </>
      )

    case 'mentor':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__compass-arcs">
            <path d="M42 76A42 42 0 0 1 70 18" />
            <path d="M90 18A42 42 0 0 1 118 76" />
          </g>
          <g className="mx-semantic-glyph__cardinal-marks">
            <path d="M80 14V24M34 56H44M116 56H126" />
          </g>
          <path className="mx-semantic-glyph__needle" d="M58 82L102 34" />
          <circle className="mx-semantic-glyph__pivot" cx="80" cy="58" r="3" />
          <circle className="mx-semantic-glyph__point" cx="102" cy="34" r="4" />
        </>
      )

    case 'companion':
      return (
        <>
          <Guide />
          <path className="mx-semantic-glyph__voice-left" d="M26 34C52 34 56 46 62 56C56 66 52 78 26 78" />
          <path className="mx-semantic-glyph__voice-right" d="M134 34C108 34 104 46 98 56C104 66 108 78 134 78" />
          <path className="mx-semantic-glyph__dialog-line" d="M66 56H94" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'pathfinder':
      return (
        <>
          <Guide />
          <path className="mx-semantic-glyph__trail-guide" d="M30 82C50 52 68 80 86 58C104 36 116 52 132 28" />
          <g className="mx-semantic-glyph__trail-marks">
            <path d="M32 78L41 74M38 86L47 82" />
            <path d="M62 61L70 64M67 69L75 72" />
            <path d="M90 58L98 53M96 65L104 60" />
            <path d="M114 42L123 43M118 50L127 51" />
          </g>
          <circle className="mx-semantic-glyph__path-point" cx="132" cy="28" r="4" />
        </>
      )

    case 'anxiety':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__anxiety-knot">
            <path d="M34 60C44 24 76 88 88 44C98 12 126 62 108 78C88 96 54 28 34 60Z" />
            <path d="M46 72C70 16 92 96 122 42" />
          </g>
          <path className="mx-semantic-glyph__calm-line" d="M34 64H126" />
          <circle className="mx-semantic-glyph__point" cx="126" cy="64" r="4" />
        </>
      )

    case 'sleep':
      return (
        <>
          <Guide />
          <path className="mx-semantic-glyph__sleep-upper" d="M28 54Q80 18 132 54" />
          <path className="mx-semantic-glyph__sleep-lower" d="M28 54Q80 90 132 54" />
          <path className="mx-semantic-glyph__sleep-drop" d="M80 38V70" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="48" r="4" />
        </>
      )

    case 'asceza':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__choice-boundary">
            <path d="M48 24C34 38 34 74 48 88" />
            <path d="M112 24C126 38 126 74 112 88" />
          </g>
          <path className="mx-semantic-glyph__choice-path" d="M80 88V24" />
          <path className="mx-semantic-glyph__temptation-path" d="M80 60C66 54 52 42 42 28" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="60" r="4" />
        </>
      )

    case 'ritual':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__ritual-marks"><path d="M34 76V52M52 76V44M70 76V36M88 76V48M106 76V40M124 76V56" /></g>
          <path className="mx-semantic-glyph__horizon" d="M26 76H134" />
          <circle className="mx-semantic-glyph__point" cx="70" cy="36" r="4" />
        </>
      )

    default:
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__brackets"><path d="M52 46V32H66M108 46V32H94M52 66V80H66M108 66V80H94" /></g>
          <path className="mx-semantic-glyph__template-axis" d="M62 56H98M80 38V74" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )
  }
}


export default function SemanticGlyph({
  kind = 'template',
  className = '',
  animated = true,
  highlighted = true,
}) {
  return (
    <svg
      viewBox="0 0 160 112"
      className={`mx-semantic-glyph mx-semantic-glyph--${kind} ${className}`}
      data-animated={animated}
      data-highlighted={highlighted}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <Drawing kind={kind} />
    </svg>
  )
}
