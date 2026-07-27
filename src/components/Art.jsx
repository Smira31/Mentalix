import { useId } from 'react'

// ── Иллюстрации Mentalix ──
// Стиль как у stoic.: плоский вектор в один цвет, массивная заливка +
// тонкие линии одной толщины, детали вырезаны насквозь.
// Всё на currentColor — работает и в тёмной, и в светлой теме.
// Мотивы свои: нить Ариадны, дверь, фонарь, камни — семья образов
// про путь через лабиринт.
//
// Три правила, которые держат набор вместе:
//   1. Вырез — настоящая дыра через маску, а не линия цветом фона.
//      Поэтому иллюстрацию можно класть на любой фон.
//   2. Толщин ровно две: THIN для деталей, BOLD для несущих форм.
//   3. Земля у всех одна: от 30 до 90, по центру кадра.
// Ровно одна золотая деталь на иллюстрацию — это суть образа.

const THIN = 3
const BOLD = 5

/** Общая линия земли — одинаковая ширина у всех, кто на ней стоит */
function Ground() {
  return <path d="M30 100h60" stroke="currentColor" strokeWidth={THIN} strokeLinecap="round" />
}

function Frame({ size, className, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

/* ─────────── Сцены ─────────── */

/** Клубок нити — начало пути, первый шаг */
export function ArtThread({ size = 120, className = '' }) {
  const uid = useId()
  const m = `thread${uid}`
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <mask id={m} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
        <rect width="120" height="120" fill="white" />
        <path d="M32 56c16 9 32 9 48 0" stroke="black" strokeWidth={THIN} strokeLinecap="round" />
        <path d="M30 72c18 10 36 8 52-5" stroke="black" strokeWidth={THIN} strokeLinecap="round" />
        <path d="M42 42c-7 16-5 35 6 46" stroke="black" strokeWidth={THIN} strokeLinecap="round" />
      </mask>
      <g className="mx-float">
        <circle cx="56" cy="66" r="28" fill="currentColor" mask={`url(#${m})`} />
      </g>
      <path d="M83 60c14 5 20 16 15 28-4 10-13 15-23 13" pathLength="1" stroke="currentColor" strokeWidth={THIN} strokeLinecap="round" className="mx-draw" />
    </Frame>
  )
}

/** Дверь со светом — выход найден, завершение */
export function ArtDoor({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <path d="M34 100V62a26 26 0 0 1 52 0v38z" fill="currentColor" />
      <path d="M52 100V68a8 8 0 0 1 16 0v32z" className="text-gold mx-glow" fill="currentColor" />
      <Ground />
    </Frame>
  )
}

/** Фонарь — свет наставника в темноте */
export function ArtLantern({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <g className="mx-float">
        <path d="M48 32a12 12 0 0 1 24 0" stroke="currentColor" strokeWidth={THIN} strokeLinecap="round" />
        <rect x="46" y="34" width="28" height="9" rx="4" fill="currentColor" />
        <path d="M44 47h32l6 42H38z" fill="currentColor" />
        <circle cx="60" cy="68" r="8" className="text-gold mx-glow" fill="currentColor" />
        <rect x="38" y="91" width="44" height="8" rx="4" fill="currentColor" />
      </g>
    </Frame>
  )
}

/** Чашка с паром — вечер, покой, ритуал */
export function ArtCup({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <path d="M46 44c-6-7 7-11 0-18" stroke="currentColor" strokeWidth={THIN} strokeLinecap="round" className="mx-sway" />
      <path d="M62 44c-6-7 7-11 0-18" stroke="currentColor" strokeWidth={THIN} strokeLinecap="round" className="mx-sway mx-delay" />
      <path d="M32 56h46v18a23 23 0 0 1-46 0z" fill="currentColor" />
      <path d="M80 61h5a10 10 0 0 1 0 20h-3" stroke="currentColor" strokeWidth={BOLD} strokeLinecap="round" />
      <Ground />
    </Frame>
  )
}

/** Ночь — тишина как часть пути */
export function ArtNight({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <g className="mx-float">
        <path d="M70 26a32 32 0 1 0 6 63 26 26 0 1 1-6-63z" fill="currentColor" />
        <path d="M34 34l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" className="text-gold mx-glow" fill="currentColor" />
        <path d="M30 74l1.5 4.5 4.5 1.5-4.5 1.5L30 86l-1.5-4.5L24 80l4.5-1.5z" fill="currentColor" opacity="0.5" />
      </g>
    </Frame>
  )
}

/** Пирамидка камней — вехи, пройденное */
export function ArtCairn({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <ellipse cx="60" cy="94" rx="30" ry="10" fill="currentColor" />
      <ellipse cx="60" cy="74" rx="23" ry="9" fill="currentColor" />
      <ellipse cx="60" cy="57" rx="16" ry="8" fill="currentColor" />
      <circle cx="60" cy="41" r="8" className="text-gold mx-glow" fill="currentColor" />
    </Frame>
  )
}

/** Следы — путь позади */
export function ArtSteps({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <ellipse cx="44" cy="92" rx="9" ry="13" fill="currentColor" opacity="0.35" />
      <ellipse cx="64" cy="76" rx="9" ry="13" fill="currentColor" opacity="0.55" />
      <ellipse cx="46" cy="58" rx="9" ry="13" fill="currentColor" opacity="0.75" />
      <ellipse cx="66" cy="40" rx="9" ry="13" className="text-gold mx-glow" fill="currentColor" />
    </Frame>
  )
}

/** Щит — аскеза, граница, которую держишь */
export function ArtShield({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <path d="M60 22l30 12v26c0 20-13 33-30 40-17-7-30-20-30-40V34z" fill="currentColor" />
      <path d="M60 40v42" className="text-gold mx-glow" stroke="currentColor" strokeWidth={BOLD} strokeLinecap="round" />
    </Frame>
  )
}

/** Росток — рост из малого */
export function ArtSprout({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <path d="M60 100V52" stroke="currentColor" strokeWidth={BOLD} strokeLinecap="round" />
      <path d="M60 62c-16 0-26-10-26-24 16 0 26 10 26 24z" fill="currentColor" className="mx-float" />
      <path d="M60 70c14 0 24-9 24-22-15 0-24 9-24 22z" fill="currentColor" className="mx-float mx-delay" />
      <Ground />
      <circle cx="60" cy="46" r="5" className="text-gold mx-glow" fill="currentColor" />
    </Frame>
  )
}

/** Книга — библиотека, сохранённое знание */
export function ArtBook({ size = 120, className = '' }) {
  const uid = useId()
  const m = `book${uid}`
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <mask id={m} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
        <rect width="120" height="120" fill="white" />
        <path d="M60 42v50" stroke="black" strokeWidth={THIN} strokeLinecap="round" />
      </mask>
      <g mask={`url(#${m})`}>
        <path d="M26 34h30a8 8 0 0 1 8 8v50a8 8 0 0 0-8-8H26z" fill="currentColor" />
        <path d="M94 34H64a8 8 0 0 0-8 8v50a8 8 0 0 1 8-8h30z" fill="currentColor" />
      </g>
      <circle cx="60" cy="26" r="6" className="text-gold mx-glow" fill="currentColor" />
    </Frame>
  )
}

/* ─────────── Знаки вех: те же правила, меньше деталей ─────────── */

/** След — первый шаг */
export function ArtFootprint({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <ellipse cx="56" cy="66" rx="20" ry="28" fill="currentColor" />
      <circle cx="80" cy="40" r="7" fill="currentColor" />
      <circle cx="88" cy="56" r="5.5" fill="currentColor" />
    </Frame>
  )
}

/** Перо — голос услышан, записанное слово */
export function ArtFeather({ size = 120, className = '' }) {
  const uid = useId()
  const m = `feather${uid}`
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <mask id={m} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
        <rect width="120" height="120" fill="white" />
        <path d="M76 36 40 90" stroke="black" strokeWidth={THIN} strokeLinecap="round" />
      </mask>
      <g className="mx-float">
        <path d="M84 26c8 26 0 48-16 60-10 8-22 9-30 6 2-30 20-56 46-66z" fill="currentColor" mask={`url(#${m})`} />
      </g>
      <path d="M40 90 24 104" stroke="currentColor" strokeWidth={THIN} strokeLinecap="round" />
    </Frame>
  )
}

/** Солнце — неделя пути, ритм дней */
export function ArtSun({ size = 120, className = '' }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    return (
      <path
        key={i}
        d={`M${60 + Math.cos(a) * 32} ${60 + Math.sin(a) * 32} L${60 + Math.cos(a) * 44} ${60 + Math.sin(a) * 44}`}
        stroke="currentColor"
        strokeWidth={THIN}
        strokeLinecap="round"
      />
    )
  })
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <circle cx="60" cy="60" r="22" className="text-gold mx-glow" fill="currentColor" />
      {rays}
    </Frame>
  )
}

/** Узел — ритуал держит */
export function ArtKnot({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <path d="M38 44c30-14 44 12 44 12s-14 26-44 12" stroke="currentColor" strokeWidth={BOLD} strokeLinecap="round" />
      <path d="M82 44c-30-14-44 12-44 12s14 26 44 12" stroke="currentColor" strokeWidth={BOLD} strokeLinecap="round" />
      <path d="M60 82v18" stroke="currentColor" strokeWidth={BOLD} strokeLinecap="round" />
      <circle cx="60" cy="56" r="6" className="text-gold" fill="currentColor" />
    </Frame>
  )
}

/** Пламя — аскеза, удержанный отказ */
export function ArtFlame({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <path d="M60 20c18 20 26 32 26 46a26 26 0 0 1-52 0c0-14 8-26 26-46z" fill="currentColor" />
      <path d="M60 54c8 10 11 16 11 22a11 11 0 0 1-22 0c0-6 3-12 11-22z" className="text-gold mx-glow" fill="currentColor" />
      <Ground />
    </Frame>
  )
}

/** Месяц — месяц пути */
export function ArtMoonMark({ size = 120, className = '' }) {
  return (
    <Frame size={size} className={`text-cream/85 ${className}`}>
      <g className="mx-float">
        <path d="M70 24a34 34 0 1 0 8 68 28 28 0 1 1-8-68z" fill="currentColor" />
        <circle cx="88" cy="38" r="5" className="text-gold mx-glow" fill="currentColor" />
      </g>
    </Frame>
  )
}
