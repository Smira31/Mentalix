/*
 * ОБЛОЖКИ СТАТЕЙ
 *
 * Обложка рисуется кодом, а не берётся из файла. Причин две.
 * Во-первых, каждая новая статья иначе требовала бы отдельной
 * работы дизайнера, и рано или поздно картинки разъехались бы
 * по стилю. Во-вторых, изображения весят, а Mini App должен
 * открываться мгновенно.
 *
 * Все шесть архетипов написаны в одном языке:
 *   — одинаковая толщина линии;
 *   — золото только на смысловом акценте, приглушённая линия
 *     как фон;
 *   — геометрия, никаких декоративных элементов.
 *
 * Архетип выбирается сначала по смыслу — по словарю слов в теге
 * и заголовке. Если совпадений нет, он определяется
 * детерминированно по идентификатору статьи: одна и та же
 * статья всегда получает одну и ту же обложку.
 */

const GOLD = 'rgb(var(--c-gold))'
const MUTED = 'rgba(242, 239, 233, 0.18)'


function Maze() {
  return (
    <>
      <path
        d="M40 88 V64 H64 V40 H88 V64 H112 V88 H136 V64 H160 V40 H184 V24"
        stroke={MUTED}
      />
      <path
        d="M40 88 V64 H64 V40 H88 V64 H112"
        stroke={GOLD}
      />
      <circle cx="112" cy="64" r="3.4" fill={GOLD} stroke="none" />
    </>
  )
}


function Wave() {
  return (
    <>
      <path
        d="M28 88 Q60 50 100 72 T172 60 T212 74"
        stroke={MUTED}
      />
      <path
        d="M28 76 Q60 26 100 58 T172 44 T212 62"
        stroke={GOLD}
      />
    </>
  )
}


function Steps() {
  return (
    <>
      <path
        d="M36 88 H76 V70 H116 V52 H156 V34 H196"
        stroke={MUTED}
      />
      <path
        d="M36 88 H76 V70 H116 V52"
        stroke={GOLD}
      />
      <circle cx="116" cy="52" r="3.4" fill={GOLD} stroke="none" />
    </>
  )
}


function Thread() {
  return (
    <>
      <path
        d="M56 56 C56 26 106 26 106 56 C106 86 156 86 156 56 C156 32 186 32 196 44"
        stroke={MUTED}
      />
      <path
        d="M44 60 C44 34 92 34 92 60 C92 86 140 86 140 60"
        stroke={GOLD}
      />
      <circle cx="44" cy="60" r="3.4" fill={GOLD} stroke="none" />
    </>
  )
}


function Cycle() {
  return (
    <>
      <ellipse
        cx="120"
        cy="56"
        rx="62"
        ry="26"
        stroke={MUTED}
      />
      <circle cx="120" cy="56" r="26" stroke={GOLD} />
      <circle cx="182" cy="56" r="3.4" fill={GOLD} stroke="none" />
    </>
  )
}


function Edge() {
  return (
    <>
      <path
        d="M120 22 L162 38 V62 C162 80 142 90 120 96 C98 90 78 80 78 62 V38 Z"
        stroke={MUTED}
      />
      <path
        d="M120 22 L162 38 V62 C162 74 146 84 120 92"
        stroke={GOLD}
      />
    </>
  )
}


const ARCHETYPES = [
  Maze,
  Wave,
  Steps,
  Thread,
  Cycle,
  Edge,
]


/*
 * Словарь смыслов. Ключи — корни слов, чтобы падежи и формы
 * попадали без отдельных правил.
 */
const MEANINGS = [
  { index: 0, roots: ['дисциплин', 'систем', 'путь', 'порядок', 'структур', 'воля', 'цель'] },
  { index: 1, roots: ['тревог', 'эмоц', 'чувств', 'стресс', 'паник', 'шум', 'настроен', 'страх'] },
  { index: 2, roots: ['привычк', 'рост', 'шаг', 'прогресс', 'практик', 'рутин', 'начал'] },
  { index: 3, roots: ['мысл', 'рефлекс', 'размышл', 'дневник', 'разбор', 'вопрос', 'внимани'] },
  { index: 4, roots: ['сон', 'сна', 'ритм', 'нейро', 'мозг', 'цикл', 'восстановл', 'энерг'] },
  { index: 5, roots: ['аскез', 'отказ', 'границ', 'запрет', 'соблазн', 'зависим', 'воздержан'] },
]


function hash(value) {
  const text = String(value || '')
  let total = 0

  for (let i = 0; i < text.length; i += 1) {
    total = (total * 31 + text.charCodeAt(i)) % 100000
  }

  return total
}


export function pickArchetype(article) {
  const haystack = `${article?.tag || ''} ${article?.title || ''}`
    .toLowerCase()

  for (const meaning of MEANINGS) {
    if (
      meaning.roots.some(
        (root) => haystack.includes(root),
      )
    ) {
      return meaning.index
    }
  }

  return hash(article?.id) % ARCHETYPES.length
}


/*
 * fill — обложка становится полосой во всю высоту карточки:
 * без собственной высоты и скруглений, растягивается по
 * родителю. Рисунок уходит в край карточки и читается жёстче,
 * ближе к языку «Практик».
 */
export default function ArticleCover({
  article,
  className = '',
  height = 100,
  fill = false,
}) {
  const Archetype =
    ARCHETYPES[pickArchetype(article)]

  return (
    <div
      className={[
        'bg-emerald-light overflow-hidden',
        fill ? 'h-full' : 'w-full rounded-2xl',
        className,
      ].join(' ')}
      style={fill ? undefined : { height }}
      aria-hidden="true"
    >
      <svg
        viewBox={fill ? '60 0 120 112' : '0 0 240 112'}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        strokeWidth={fill ? '2.2' : '1.3'}
        strokeLinecap="round"
        className="w-full h-full"
      >
        <Archetype />
      </svg>
    </div>
  )
}
