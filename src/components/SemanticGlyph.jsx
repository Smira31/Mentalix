import './SemanticGlyph.css'

const normalize = value => String(value || '').toLowerCase()

const includesAny = (value, fragments) => {
  const text = normalize(value)
  return fragments.some(fragment => text.includes(fragment))
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

function Accent({ cx, cy, r = 4 }) {
  return <circle className="mx-semantic-glyph__accent" cx={cx} cy={cy} r={r} />
}

function Book() {
  return (
    <>
      <g className="mx-semantic-glyph__soft">
        <path d="M18 34C39 31 60 36 78 49V91C61 79 41 75 18 78Z" />
        <path d="M142 34C121 31 100 36 82 49V91C99 79 119 75 142 78Z" />
        <path d="M18 82C39 79 60 83 80 96C100 83 121 79 142 82" />
      </g>
      <path className="mx-semantic-glyph__line" d="M27 60C48 55 63 76 83 67C98 61 110 49 130 43" />
      <Accent cx="130" cy="43" />
    </>
  )
}

function PathScene() {
  return (
    <>
      <path className="mx-semantic-glyph__soft" d="M10 68L36 39L54 58L72 30L96 64L119 42L150 70" />
      <path
        className="mx-semantic-glyph__fill"
        d="M62 108C72 92 94 88 92 73C90 62 77 61 82 51C86 42 99 39 103 30C94 39 78 42 72 52C64 65 78 72 75 82C72 91 58 96 50 108Z"
      />
      <Accent cx="103" cy="30" />
    </>
  )
}

function Magnifier() {
  return (
    <>
      <g className="mx-semantic-glyph__soft">
        <circle cx="68" cy="52" r="34" />
        <path d="M92 76L139 108" />
        <circle cx="52" cy="43" r="3" />
        <circle cx="66" cy="64" r="3" />
      </g>
      <circle className="mx-semantic-glyph__line" cx="79" cy="50" r="8" />
      <Accent cx="79" cy="50" />
    </>
  )
}

function Calendar() {
  return (
    <>
      <g className="mx-semantic-glyph__soft">
        <path d="M31 35H129L123 94H25Z" />
        <path d="M40 24V43M61 24V43M82 24V43M103 24V43M124 24V43" />
        <circle cx="45" cy="65" r="5" />
        <circle cx="68" cy="65" r="5" />
        <circle cx="91" cy="65" r="5" />
        <circle cx="114" cy="65" r="5" />
      </g>
      <Accent cx="91" cy="65" r="5" />
    </>
  )
}

function Toggle() {
  return (
    <>
      <rect className="mx-semantic-glyph__line" x="44" y="36" width="72" height="40" rx="20" />
      <circle className="mx-semantic-glyph__fill" cx="64" cy="56" r="14" />
      <path className="mx-semantic-glyph__soft" d="M28 56H38M122 56H132" />
      <Accent cx="28" cy="56" />
    </>
  )
}

function Breath() {
  return (
    <>
      <path className="mx-semantic-glyph__line" d="M79 26V84" />
      <path
        className="mx-semantic-glyph__fill"
        d="M75 43C65 31 48 31 40 46C33 59 34 82 49 88C62 93 72 82 75 67Z"
      />
      <path
        className="mx-semantic-glyph__fill"
        d="M85 43C95 31 112 31 120 46C127 59 126 82 111 88C98 93 88 82 85 67Z"
      />
      <g className="mx-semantic-glyph__ink">
        <path d="M75 51C65 51 57 58 52 69" />
        <path d="M85 51C95 51 103 58 108 69" />
      </g>
      <Accent cx="80" cy="34" r="3.5" />
    </>
  )
}

function Meditation() {
  return (
    <>
      <g className="mx-semantic-glyph__soft">
        <path d="M34 73C50 88 110 88 126 73" />
        <path d="M44 67C54 76 106 76 116 67" />
        <path d="M50 92H110" />
        <path d="M62 49C58 41 67 37 64 29" />
        <path d="M80 49C76 39 86 35 82 24" />
        <path d="M98 49C94 41 103 37 100 29" />
      </g>
      <path className="mx-semantic-glyph__fill" d="M40 58C47 82 113 82 120 58Z" />
      <Accent cx="80" cy="61" />
    </>
  )
}

function Archive() {
  return (
    <>
      <g className="mx-semantic-glyph__soft">
        <path d="M32 53L46 37H114L128 53L121 94H39Z" />
        <path d="M47 37L50 27H110L113 37" />
        <path d="M56 53V88M74 53V88M92 53V88M110 53V88" />
      </g>
      <Accent cx="110" cy="53" />
    </>
  )
}

function Neuro() {
  return (
    <>
      <path
        className="mx-semantic-glyph__fill"
        d="M54 54C54 38 65 27 81 27C98 27 108 39 108 54C108 65 103 69 98 76C94 81 94 87 94 91H67C67 84 66 80 61 74C57 69 54 63 54 54Z"
      />
      <g className="mx-semantic-glyph__ink">
        <path d="M65 51L79 42L94 51L82 62L95 70" />
        <path d="M79 42V67L68 75M82 62L72 55" />
        <circle cx="65" cy="51" r="2" />
        <circle cx="79" cy="42" r="2" />
        <circle cx="94" cy="51" r="2" />
        <circle cx="82" cy="62" r="2" />
      </g>
      <path className="mx-semantic-glyph__soft" d="M69 97H92" />
      <Accent cx="95" cy="70" r="3.5" />
    </>
  )
}

function Drawing({ kind, debugSource }) {
  switch (kind) {
    case 'journal':
    case 'ui-exp-003-journal':
      return <Book />
    case 'purpose':
      return (
        <>
          <path className="mx-semantic-glyph__baseline" d="M20 92H140" />
          <g className="mx-semantic-glyph__soft">
            <rect x="39" y="43" width="24" height="49" rx="4" transform="rotate(-25 51 67)" />
            <rect x="69" y="39" width="24" height="53" rx="4" />
            <rect x="101" y="39" width="24" height="53" rx="4" />
            <circle cx="81" cy="52" r="3" />
            <circle cx="113" cy="52" r="3" />
            <path d="M72 70H90M104 70H122" />
          </g>
          <Accent cx="65" cy="58" />
        </>
      )
    case 'focus':
      return <Magnifier />
    case 'release':
    case 'anxiety':
    case 'ui-exp-003-release':
      return (
        <>
          <path
            className="mx-semantic-glyph__soft"
            d="M28 61C46 30 66 87 83 51C95 25 118 48 104 68C91 88 65 41 49 65C42 77 35 79 27 76"
          />
          <path
            className="mx-semantic-glyph__line"
            d="M27 76C47 76 66 76 88 76C108 76 119 69 132 55"
          />
          <Accent cx="132" cy="55" />
        </>
      )
    case 'ritual':
    case 'ui-exp-003-ritual':
      return <Calendar />
    case 'asceza':
    case 'ui-exp-003-asceza':
      return <Toggle />
    case 'breath':
    case 'ui-exp-003-breath':
      return <Breath />
    case 'meditation':
    case 'ui-exp-003-meditation':
      return <Meditation />
    case 'next-step':
    case 'pathfinder':
    case 'ui-exp-003-next-step':
      return <PathScene />
    case 'neuro':
      return <Neuro />
    case 'brain-attention':
      return (
        <>
          <circle className="mx-semantic-glyph__soft" cx="80" cy="56" r="34" />
          <circle className="mx-semantic-glyph__line" cx="80" cy="56" r="16" />
          <Accent cx="80" cy="56" />
        </>
      )
    case 'brain-memory':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <path d="M24 78L50 48L76 69L105 33L136 55" />
            <circle cx="24" cy="78" r="3" />
            <circle cx="50" cy="48" r="3" />
            <circle cx="76" cy="69" r="3" />
            <circle cx="105" cy="33" r="3" />
          </g>
          <Accent cx="136" cy="55" />
        </>
      )
    case 'brain-reaction':
      return (
        <>
          <path className="mx-semantic-glyph__soft" d="M24 58H57L68 35L86 81L101 58H136" />
          <Accent cx="86" cy="81" />
        </>
      )
    case 'brain-plasticity':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <path d="M24 36C55 36 63 77 91 77C111 77 122 65 136 53" />
            <path d="M24 78C55 78 63 37 91 37C111 37 122 49 136 61" />
          </g>
          <Accent cx="91" cy="57" />
        </>
      )
    case 'brain-gymnastics':
      return (
        <>
          <path
            className="mx-semantic-glyph__soft"
            d="M22 65C35 42 49 42 62 65C75 88 88 88 101 65C114 42 127 42 140 65"
          />
          <Accent cx="80" cy="76" />
        </>
      )
    case 'prayer':
      return (
        <>
          <path
            className="mx-semantic-glyph__fill"
            d="M75 43C68 35 71 25 80 17C89 25 92 35 85 43Z"
          />
          <g className="mx-semantic-glyph__soft">
            <path d="M64 47H96L91 92H69Z" />
            <path d="M58 92H102" />
          </g>
          <Accent cx="80" cy="31" r="3" />
        </>
      )
    case 'shower':
      return (
        <>
          <path
            className="mx-semantic-glyph__soft"
            d="M42 51C42 31 57 21 77 21C96 21 111 31 111 49"
          />
          <path className="mx-semantic-glyph__fill" d="M96 43H126L120 56H90Z" />
          <g className="mx-semantic-glyph__line">
            <path d="M96 66L91 79M108 66L103 85M120 66L115 79" />
          </g>
          <Accent cx="103" cy="85" r="3.5" />
        </>
      )
    case 'water':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <path d="M52 25H108L101 91H59Z" />
            <path d="M57 60C71 55 89 65 103 60" />
          </g>
          <path className="mx-semantic-glyph__water" d="M58 61C72 57 88 65 102 61L99 87H61Z" />
          <Accent cx="80" cy="61" r="3.5" />
        </>
      )
    case 'alcohol':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <path d="M54 24H106C103 52 94 66 80 70C66 66 57 52 54 24Z" />
            <path d="M80 70V89M61 92H99" />
          </g>
          <path className="mx-semantic-glyph__line" d="M42 86L118 27" />
          <Accent cx="112" cy="32" r="3.5" />
        </>
      )
    case 'smoking':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <path d="M24 59H126V76H24Z" />
            <path d="M100 59V76M109 64H121M109 70H121" />
            <path d="M31 51C17 40 43 33 29 20M49 51C35 39 59 31 45 17" />
          </g>
          <path className="mx-semantic-glyph__line" d="M47 88L111 37" />
          <Accent cx="105" cy="42" r="3.5" />
        </>
      )
    case 'mentor':
      return (
        <>
          <circle className="mx-semantic-glyph__soft" cx="80" cy="56" r="34" />
          <path className="mx-semantic-glyph__fill" d="M80 27L90 60L80 84L70 60Z" />
          <path className="mx-semantic-glyph__ink" d="M80 34L80 76" />
          <Accent cx="80" cy="27" />
        </>
      )
    case 'companion':
      return (
        <>
          <path
            className="mx-semantic-glyph__soft"
            d="M18 27H59C70 27 75 33 75 44V70C75 81 69 86 58 86H42L29 98V86H18Z"
          />
          <path
            className="mx-semantic-glyph__soft"
            d="M142 27H101C90 27 85 33 85 44V70C85 81 91 86 102 86H118L131 98V86H142Z"
          />
          <path className="mx-semantic-glyph__line" d="M54 56H106" />
          <Accent cx="80" cy="56" />
        </>
      )
    case 'narrow':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <rect x="22" y="32" width="31" height="52" rx="4" />
            <rect x="64" y="32" width="31" height="52" rx="4" />
            <rect x="106" y="32" width="31" height="52" rx="4" />
          </g>
          <path
            className="mx-semantic-glyph__line"
            d="M38 93C52 100 66 102 80 102C94 102 108 100 122 93"
          />
          <Accent cx="80" cy="58" />
        </>
      )
    case 'finish':
      return (
        <>
          <path
            className="mx-semantic-glyph__soft"
            d="M34 96C52 81 66 84 78 70C91 55 97 39 105 20"
          />
          <path className="mx-semantic-glyph__line" d="M105 20V70M106 23H137L128 38L137 53H106" />
          <Accent cx="34" cy="96" />
        </>
      )
    case 'sleep':
    case 'ui-exp-003-evening':
      return (
        <>
          <path
            className="mx-semantic-glyph__fill"
            d="M86 21C64 26 55 50 66 69C77 89 105 90 121 72C108 78 91 72 84 59C76 45 77 32 86 21Z"
          />
          <path className="mx-semantic-glyph__soft" d="M32 87C57 78 103 78 128 87L122 98H38Z" />
          <Accent cx="115" cy="37" r="3.5" />
        </>
      )
    case 'loading':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <path d="M34 42H109L126 56V91H34Z" />
            <path d="M45 31H99L111 42H45Z" />
            <path d="M53 21H91L100 31H53Z" />
          </g>
          <Accent cx="126" cy="56" />
        </>
      )
    case 'progress':
      return (
        <>
          <g className="mx-semantic-glyph__soft">
            <path d="M18 88C47 80 56 48 91 36C111 29 127 30 142 24" />
            <path d="M25 95C53 83 65 57 94 43C113 34 128 31 142 24" />
            <path d="M36 99C58 84 75 66 101 48C117 37 130 30 142 24" />
            <path d="M55 102C72 83 88 63 110 45C122 35 133 28 142 24" />
          </g>
          <Accent cx="142" cy="24" r="5" />
        </>
      )
    case 'empty':
    case 'template':
      return <Archive />
    case 'success':
      return (
        <>
          <path className="mx-semantic-glyph__fill" d="M43 24H104L121 41V94H43Z" />
          <g className="mx-semantic-glyph__ink">
            <path d="M104 24V42H121" />
            <path d="M60 61L74 75L102 47" />
          </g>
          <Accent cx="102" cy="47" r="3.5" />
        </>
      )
    case 'error':
      return (
        <>
          <path className="mx-semantic-glyph__soft" d="M42 24H103L121 42V94H42Z" />
          <path className="mx-semantic-glyph__line" d="M103 24V43H121M59 69C70 61 80 75 91 67" />
          <Accent cx="110" cy="76" r="4" />
        </>
      )
    case 'onboarding':
      return <Book />
    default:
      if (import.meta.env.DEV) {
        console.error(
          `[SemanticGlyph] неизвестный kind "${kind}"` +
            (debugSource ? ` (источник: ${debugSource})` : '') +
            ' — используется статичная системная заглушка.'
        )
      }
      return <Archive />
  }
}

export default function SemanticGlyph({
  kind = 'template',
  className = '',
  highlighted = true,
  accent,
  debugSource,
}) {
  return (
    <svg
      viewBox="0 0 160 112"
      className={`mx-semantic-glyph mx-semantic-glyph--${kind} ${className}`}
      data-animated="false"
      data-highlighted={highlighted}
      data-accent={accent}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <Drawing kind={kind} debugSource={debugSource} />
    </svg>
  )
}
