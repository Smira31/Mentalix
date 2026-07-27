// ── Иконки Mentalix ──
// Тонкая линия в системе lucide: сетка 24x24, штрих 1.75,
// круглые концы и стыки, ничего не залито.
// Интерфейс совпадает с lucide-react — size, className, strokeWidth, —
// поэтому иконки взаимозаменяемы с ним в любом месте кода.
//
// Смысловая пара к Art.jsx: там те же образы крупной заливкой,
// здесь — мелкой линией. Один словарь, два масштаба.

function Svg({ size, className, strokeWidth, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Узел — ритуал держит */
export function IconKnot({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M6 8c8-4 12 4 12 4s-4 8-12 4"/>
      <path d="M18 8c-8-4-12 4-12 4s4 8 12 4"/>
      <circle cx="12" cy="12" r="1.6"/>
    </Svg>
  )
}

/** Щит — граница, которую держишь */
export function IconShield({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3l7.5 3v6c0 4.8-3.2 8-7.5 9.5C7.7 20 4.5 16.8 4.5 12V6z"/>
      <path d="M9.2 12.2l2.2 2.2 4.3-4.3"/>
    </Svg>
  )
}

/** Мозг — внимание, память, реакция */
export function IconBrain({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 5.5a3 3 0 0 0-5.6 1.2A3 3 0 0 0 4.2 11a3 3 0 0 0 .9 4.4A3 3 0 0 0 9 19a3 3 0 0 0 3-1.6z"/>
      <path d="M12 5.5a3 3 0 0 1 5.6 1.2A3 3 0 0 1 19.8 11a3 3 0 0 1-.9 4.4A3 3 0 0 1 15 19a3 3 0 0 1-3-1.6z"/>
      <path d="M12 5.5v11.9"/>
    </Svg>
  )
}

/** Ветер — дыхание, выдох */
export function IconWind({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H3"/>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H3"/>
      <path d="M12.6 19.4A2 2 0 1 0 14 16H3"/>
    </Svg>
  )
}

/** Часы — таймер глубокой работы */
export function IconHourglass({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M6 2h12"/>
      <path d="M6 22h12"/>
      <path d="M17 2v4.4c0 1.6-5 4-5 5.6s5 4 5 5.6V22"/>
      <path d="M7 2v4.4c0 1.6 5 4 5 5.6s-5 4-5 5.6V22"/>
    </Svg>
  )
}

/** Лабиринт — путь, знак приложения */
export function IconMaze({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M21 21V3H3v18h14V7H7v10h10"/>
    </Svg>
  )
}

/** Клубок — начало пути, первый шаг */
export function IconThread({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="10.5" cy="12.5" r="6.5"/>
      <path d="M4.6 10c3.6 1.8 8 1.7 11-.6"/>
      <path d="M4.4 14.4c3.6 1.9 8.2 1.2 11.4-1.9"/>
      <path d="M17 12.6c2.6 1 3.6 3.4 2.7 5.6"/>
    </Svg>
  )
}

/** Дверь — выход найден, завершение */
export function IconDoor({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M6 21V9a6 6 0 0 1 12 0v12"/>
      <path d="M3.5 21h17"/>
      <circle cx="14.6" cy="14" r="1"/>
    </Svg>
  )
}

/** Фонарь — свет наставника */
export function IconLantern({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M9 5.2a3 3 0 0 1 6 0"/>
      <rect x="8.2" y="6.2" width="7.6" height="2.6" rx="1.3"/>
      <path d="M8.6 9.4h6.8l1.4 8.6H7.2z"/>
      <circle cx="12" cy="13.4" r="1.6"/>
      <path d="M6.4 20.4h11.2"/>
    </Svg>
  )
}

/** Чашка — вечер, покой */
export function IconCup({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M4 10.4h12.6v4.6a6.3 6.3 0 0 1-12.6 0z"/>
      <path d="M16.6 11.4h1.6a2.6 2.6 0 0 1 0 5.2h-1"/>
      <path d="M3 21h15"/>
      <path d="M8 7.6c-1.6-1.6 1.6-2.6 0-4.2"/>
      <path d="M12.2 7.6c-1.6-1.6 1.6-2.6 0-4.2"/>
    </Svg>
  )
}

/** Ночь — тишина как часть пути */
export function IconNight({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M15.4 3.6a8.4 8.4 0 1 0 5 12.2 7.4 7.4 0 0 1-5-12.2z"/>
      <path d="M6.2 4.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>
    </Svg>
  )
}

/** Камни — вехи, пройденное */
export function IconCairn({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <ellipse cx="12" cy="18.2" rx="7" ry="2.6"/>
      <ellipse cx="12" cy="13.2" rx="5.4" ry="2.3"/>
      <ellipse cx="12" cy="8.6" rx="4" ry="2"/>
      <circle cx="12" cy="4.4" r="1.5"/>
    </Svg>
  )
}

/** Следы — путь позади */
export function IconSteps({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <ellipse cx="7.5" cy="18" rx="2.3" ry="3.4"/>
      <ellipse cx="12.6" cy="14" rx="2.3" ry="3.4"/>
      <ellipse cx="8.4" cy="9.6" rx="2.3" ry="3.4"/>
      <ellipse cx="13.5" cy="5.6" rx="2.3" ry="3.4"/>
    </Svg>
  )
}

/** Росток — рост из малого */
export function IconSprout({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 21v-8.6"/>
      <path d="M12 14.4c-4 0-6.6-2.6-6.6-6.2 4 0 6.6 2.6 6.6 6.2z"/>
      <path d="M12 16.2c3.6 0 6.2-2.4 6.2-5.8-3.6 0-6.2 2.4-6.2 5.8z"/>
      <path d="M7 21h10"/>
      <circle cx="12" cy="10.4" r="1.2"/>
    </Svg>
  )
}

/** Книга — сохранённое знание */
export function IconBook({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M3 5h5.6a3.4 3.4 0 0 1 3.4 3.4V19a3.4 3.4 0 0 0-3.4-3.4H3z"/>
      <path d="M21 5h-5.6A3.4 3.4 0 0 0 12 8.4V19a3.4 3.4 0 0 1 3.4-3.4H21z"/>
    </Svg>
  )
}

/** Перо — записанное слово */
export function IconFeather({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M19 4c2 6.8 0 11.8-4.4 15.2C11.2 21.6 7.8 20.8 6.2 19.8 6.2 12 11 6 19 4z"/>
      <path d="M16.8 6.2L6.2 19.8"/>
      <path d="M6.2 19.8L3.4 22"/>
    </Svg>
  )
}

/** Солнце — ритм дней */
export function IconSun({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="4.4"/>
      <path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22"/>
      <path d="M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"/>
    </Svg>
  )
}

/** Пламя — удержанный отказ */
export function IconFlame({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M12 3c5 5.4 7 8.4 7 11.8a7 7 0 0 1-14 0C5 11.4 7 8.4 12 3z"/>
      <path d="M12 12.6c2 2.4 3 3.9 3 5.3a3 3 0 0 1-6 0c0-1.4 1-2.9 3-5.3z"/>
    </Svg>
  )
}

/** Месяц — месяц пути */
export function IconMoon({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <path d="M16.6 3a9 9 0 1 0 2.2 16.8A7.4 7.4 0 0 1 16.6 3z"/>
      <circle cx="18.4" cy="6.2" r="1.2"/>
    </Svg>
  )
}

/** Мишень — цель, фокус */
export function IconTarget({ size = 24, className = '', strokeWidth = 1.75 }) {
  return (
    <Svg size={size} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="8.6"/>
      <circle cx="12" cy="12" r="4.8"/>
      <circle cx="12" cy="12" r="1.4"/>
    </Svg>
  )
}
