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

function Guide() {
  return (
    <g className="mx-semantic-glyph__guide">
      <path d="M18 88H142" />
      <path d="M80 12V100" />
    </g>
  )
}

function Drawing({ kind, debugSource }) {
  switch (kind) {
    case 'neuro':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__network">
            <path d="M22 74L40 48L58 62L78 40L98 56L118 34L140 52" />
            <path d="M40 48L30 26M40 48L54 28M58 62L46 86M58 62L78 82M78 40L74 18M78 40L98 24M98 56L92 86M98 56L118 78M118 34L136 22M118 34L140 52" />
            <circle cx="22" cy="74" r="2.2" />
            <circle cx="40" cy="48" r="2.8" />
            <circle cx="58" cy="62" r="2.5" />
            <circle cx="78" cy="40" r="3" />
            <circle cx="98" cy="56" r="2.6" />
            <circle cx="118" cy="34" r="2.8" />
            <circle cx="140" cy="52" r="2.2" />
            <circle cx="30" cy="26" r="2" />
            <circle cx="54" cy="28" r="2.1" />
            <circle cx="46" cy="86" r="2.2" />
            <circle cx="78" cy="82" r="2.4" />
            <circle cx="74" cy="18" r="2" />
            <circle cx="98" cy="24" r="2.2" />
            <circle cx="92" cy="86" r="2.1" />
            <circle cx="118" cy="78" r="2.4" />
            <circle cx="136" cy="22" r="2" />
          </g>
          <path
            className="mx-semantic-glyph__route"
            d="M22 74L40 48L58 62L78 40L98 56L118 34L140 52"
          />
          <circle
            className="mx-semantic-glyph__point mx-semantic-glyph__signal"
            cx="22"
            cy="74"
            r="4"
          />
        </>
      )

    case 'brain-attention':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__exercise">
            <circle cx="80" cy="56" r="29" />
            <circle cx="80" cy="56" r="15" />
            <path d="M80 18V34M80 78V94M42 56H58M102 56H118" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'brain-memory':
      return (
        <>
          <Guide />
          <path className="mx-semantic-glyph__exercise" d="M28 72L50 48L73 65L96 34L128 55" />
          <g className="mx-semantic-glyph__exercise-nodes">
            <circle cx="28" cy="72" r="3" />
            <circle cx="50" cy="48" r="3" />
            <circle cx="73" cy="65" r="3" />
            <circle cx="96" cy="34" r="3" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="128" cy="55" r="4" />
        </>
      )

    case 'brain-reaction':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__exercise">
            <path d="M32 56H61L72 34L88 78L100 56H128" />
            <path d="M42 38L32 56L42 74M118 38L128 56L118 74" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'brain-plasticity':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__exercise">
            <path d="M28 36C56 36 61 76 88 76C106 76 117 64 132 52" />
            <path d="M28 76C56 76 61 36 88 36C106 36 117 48 132 60" />
            <path d="M124 47L132 52L127 60M124 65L132 60L127 52" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'brain-gymnastics':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__exercise">
            <path d="M28 64C39 45 50 45 61 64C72 83 83 83 94 64C105 45 116 45 132 64" />
            <path d="M38 45C48 31 58 31 68 45M92 45C102 31 112 31 122 45" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="64" r="4" />
        </>
      )

    case 'breath':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__breath-upper">
            <path d="M24 56C37 31 55 19 80 19C105 19 123 31 136 56" />
            <path d="M39 56C49 39 62 31 80 31C98 31 111 39 121 56" />
          </g>
          <g className="mx-semantic-glyph__breath-lower">
            <path d="M24 56C37 81 55 93 80 93C105 93 123 81 136 56" />
            <path d="M39 56C49 73 62 81 80 81C98 81 111 73 121 56" />
          </g>
          <path className="mx-semantic-glyph__breath-axis" d="M80 22V90" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4.5" />
        </>
      )

    case 'focus':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__focus-beams">
            <path d="M18 22C42 28 58 40 80 56" />
            <path d="M18 39C46 42 62 48 80 56" />
            <path d="M18 56H80" />
            <path d="M18 73C46 70 62 64 80 56" />
            <path d="M18 90C42 84 58 72 80 56" />
          </g>
          <path className="mx-semantic-glyph__focus-axis" d="M84 56H142" />
          <path className="mx-semantic-glyph__focus-plane" d="M80 42V70" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4.5" />
        </>
      )

    case 'meditation':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__contour mx-semantic-glyph__contour--outer">
            <path d="M28 56C28 31 49 16 78 19C108 15 134 32 132 58C135 84 108 97 80 93C50 98 25 82 28 56Z" />
          </g>
          <g className="mx-semantic-glyph__contour mx-semantic-glyph__contour--middle">
            <path d="M43 57C41 39 58 29 79 31C100 28 119 41 117 59C118 77 100 85 80 82C58 86 42 74 43 57Z" />
          </g>
          <g className="mx-semantic-glyph__contour mx-semantic-glyph__contour--inner">
            <path d="M59 56C59 46 67 40 80 42C93 40 102 47 101 57C102 68 92 73 80 71C67 73 58 67 59 56Z" />
          </g>
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'journal':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__journal-pages">
            <path d="M36 30H75C83 30 87 34 87 42V86C87 78 83 74 75 74H36Z" />
            <path d="M124 30H85C77 30 73 34 73 42V86C73 78 77 74 85 74H124Z" />
          </g>
          <path className="mx-semantic-glyph__journal-line" d="M48 46H70M48 56H70M90 46H112M90 56H112" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="86" r="4" />
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
            <path d="M48 48V78" />
            <path d="M64 46V84" />
            <path d="M80 44V88" />
            <path d="M96 46V84" />
            <path d="M112 48V78" />
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
            <path d="M80 72V88M62 90H98" />
            <path d="M58 44C70 40 90 50 102 44" />
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
            <path d="M28 64H100V80H28Z" />
            <path d="M100 64H130V80H100Z" />
            <path d="M108 69H124M108 74H124" />
            <path d="M28 64V80M34 68V76" />
          </g>
          <g className="mx-semantic-glyph__smoke">
            <path d="M34 58C18 48 44 38 30 26" />
            <path d="M50 56C34 44 58 36 44 22" />
          </g>
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
          <path
            className="mx-semantic-glyph__voice-left"
            d="M26 34C52 34 56 46 62 56C56 66 52 78 26 78"
          />
          <path
            className="mx-semantic-glyph__voice-right"
            d="M134 34C108 34 104 46 98 56C104 66 108 78 134 78"
          />
          <path className="mx-semantic-glyph__dialog-line" d="M66 56H94" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'pathfinder':
      return (
        <>
          <Guide />
          <path
            className="mx-semantic-glyph__trail-guide"
            d="M30 82C50 52 68 80 86 58C104 36 116 52 132 28"
          />
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

    case 'release':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__release-knot">
            <path d="M34 60C44 24 76 88 88 44C98 12 126 62 108 78C88 96 54 28 34 60Z" />
            <path d="M46 72C70 16 92 96 122 42" />
          </g>
          <path className="mx-semantic-glyph__release-line" d="M34 64H126" />
          <circle className="mx-semantic-glyph__point" cx="126" cy="64" r="4" />
        </>
      )

    case 'narrow':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__narrow-field">
            <circle cx="30" cy="30" r="3" />
            <circle cx="46" cy="82" r="2.6" />
            <circle cx="24" cy="60" r="2.4" />
            <circle cx="112" cy="28" r="2.8" />
            <circle cx="130" cy="60" r="2.4" />
            <circle cx="104" cy="86" r="2.6" />
            <circle cx="60" cy="24" r="2.2" />
            <circle cx="128" cy="90" r="2.2" />
          </g>
          <circle
            className="mx-semantic-glyph__point mx-semantic-glyph__narrow-center"
            cx="80"
            cy="56"
            r="4.5"
          />
        </>
      )

    case 'finish':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__finish-attempts">
            <path d="M30 40C34 28 44 22 54 24" />
            <path d="M28 74C30 86 40 94 52 92" />
            <path d="M96 26C108 26 118 34 120 46" />
          </g>
          <path className="mx-semantic-glyph__finish-loop" d="M80 24A34 34 0 1 1 46 58" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="24" r="4" />
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
          <g className="mx-semantic-glyph__boundary mx-semantic-glyph__boundary--outer">
            <path d="M20 22L58 40L72 56L58 72L20 90" />
            <path d="M140 22L102 40L88 56L102 72L140 90" />
          </g>
          <g className="mx-semantic-glyph__boundary mx-semantic-glyph__boundary--inner">
            <path d="M38 30L66 44L76 56L66 68L38 82" />
            <path d="M122 30L94 44L84 56L94 68L122 82" />
          </g>
          <path className="mx-semantic-glyph__threshold" d="M80 24V88" />
          <circle className="mx-semantic-glyph__point" cx="80" cy="56" r="4" />
        </>
      )

    case 'ritual':
      return (
        <>
          <g transform="translate(3 0) scale(.7)">
            <g className="mx-semantic-glyph__ritual-orbits">
              <g className="mx-semantic-glyph__ritual-orbit-layer mx-semantic-glyph__ritual-orbit-layer--outer">
                <ellipse
                  className="mx-semantic-glyph__ritual-orbit-faint"
                  cx="110"
                  cy="78"
                  rx="76"
                  ry="45"
                  transform="rotate(-8 110 78)"
                />
                <ellipse
                  className="mx-semantic-glyph__ritual-orbit-main"
                  cx="110"
                  cy="78"
                  rx="69"
                  ry="42"
                  transform="rotate(10 110 78)"
                />
              </g>
              <g className="mx-semantic-glyph__ritual-orbit-layer mx-semantic-glyph__ritual-orbit-layer--middle">
                <ellipse cx="110" cy="78" rx="58" ry="33" transform="rotate(-18 110 78)" />
                <ellipse
                  className="mx-semantic-glyph__ritual-orbit-soft"
                  cx="110"
                  cy="78"
                  rx="43"
                  ry="25"
                  transform="rotate(7 110 78)"
                />
                <ellipse
                  className="mx-semantic-glyph__ritual-orbit-dashed"
                  cx="110"
                  cy="78"
                  rx="29"
                  ry="17"
                  transform="rotate(-12 110 78)"
                />
              </g>
              <g className="mx-semantic-glyph__ritual-orbit-layer mx-semantic-glyph__ritual-orbit-layer--cross">
                <ellipse
                  className="mx-semantic-glyph__ritual-orbit-soft"
                  cx="110"
                  cy="78"
                  rx="31"
                  ry="67"
                  transform="rotate(58 110 78)"
                />
                <ellipse
                  className="mx-semantic-glyph__ritual-orbit-faint"
                  cx="110"
                  cy="78"
                  rx="37"
                  ry="70"
                  transform="rotate(73 110 78)"
                />
              </g>
            </g>
            <g className="mx-semantic-glyph__ritual-nodes">
              <circle cx="48" cy="76" r="2.4" />
              <circle cx="78" cy="43" r="2.2" />
              <circle cx="144" cy="47" r="2.5" />
              <circle cx="139" cy="111" r="2.4" />
              <circle cx="81" cy="111" r="2.1" />
            </g>
            <circle className="mx-semantic-glyph__focus-ring" cx="110" cy="78" r="10" />
            <circle className="mx-semantic-glyph__point" cx="110" cy="78" r="6" />
            <g className="mx-semantic-glyph__ritual-runner">
              <circle className="mx-semantic-glyph__point" cx="169" cy="77" r="5" />
            </g>
          </g>
        </>
      )

    case 'next-step':
      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__path-wall mx-semantic-glyph__path-wall--left">
            <path d="M18 92C42 84 52 68 64 56C76 44 80 32 84 16" />
            <path d="M34 94C52 82 60 68 70 58C82 46 88 34 92 18" />
          </g>
          <g className="mx-semantic-glyph__path-wall mx-semantic-glyph__path-wall--right">
            <path d="M142 20C118 28 108 42 96 54C84 66 80 78 76 96" />
            <path d="M126 18C108 30 100 44 90 54C78 66 72 78 68 94" />
          </g>
          <path
            className="mx-semantic-glyph__path-route"
            d="M26 88C52 80 60 66 80 56C100 46 108 30 134 22"
          />
          <circle
            className="mx-semantic-glyph__point mx-semantic-glyph__path-signal"
            cx="26"
            cy="88"
            r="4"
          />
        </>
      )

    default:
      if (import.meta.env.DEV) {
        console.error(
          `[SemanticGlyph] неизвестный kind "${kind}"` +
            (debugSource ? ` (источник: ${debugSource})` : '') +
            ' — рендерится generic-заглушка. Проверь имя kind у вызывающего компонента.'
        )
      }

      return (
        <>
          <Guide />
          <g className="mx-semantic-glyph__brackets">
            <path d="M52 46V32H66M108 46V32H94M52 66V80H66M108 66V80H94" />
          </g>
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
  accent,
  debugSource,
}) {
  return (
    <svg
      viewBox="0 0 160 112"
      className={`mx-semantic-glyph mx-semantic-glyph--${kind} ${className}`}
      data-animated={animated}
      data-highlighted={highlighted}
      data-accent={accent}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <Drawing kind={kind} debugSource={debugSource} />
    </svg>
  )
}
