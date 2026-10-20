import {
  AudioLines,
  Coffee,
  Feather,
  Flame,
  FlameKindling,
  Footprints,
  Lighthouse,
  Moon,
  Sunrise,
  Tent,
  TreePine,
} from 'lucide-react'

const ICON_STROKE = 1.8

/* «Серия: три дня» — свеча: узкий корпус, фитиль и маленький огонёк.
   Ручки-кольца нет: по силуэту свеча сразу отличается от фонаря «пять дней». */
function CandleIcon({ x, y, width, height, className, strokeWidth = ICON_STROKE }) {
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 4.4c-1.05 1.3-1.7 2.3-1.7 3.5a1.7 1.7 0 0 0 3.4 0c0-1.2-.65-2.2-1.7-3.5Z" />
      <path d="M12 9.8v2.2" />
      <path d="M9.2 12h5.6v8.6H9.2z" />
    </svg>
  )
}

/* «Серия: пять дней» — фонарь путника: явная ручка-кольцо, крышка, широкий
   решётчатый корпус и основание. Корпус заметно шире свечи. */
function LanternIcon({ x, y, width, height, className, strokeWidth = ICON_STROKE }) {
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="3.2" r="1.7" />
      <path d="M9.4 5.4h5.2l2.1 3.2H7.3z" />
      <path d="M7.4 8.6h9.2v9.6H7.4z" />
      <path d="M7.4 12.8h9.2M7.4 16.6h9.2" />
      <path d="M10.4 8.6v9.6M13.6 8.6v9.6" />
      <path d="M6 18.2h12v2.4H6z" />
    </svg>
  )
}

/* «100 активных дней» — флаг на вершине. */
function SummitFlagIcon({ x, y, width, height, className, strokeWidth = ICON_STROKE }) {
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m2.7 20.5 7.1-9.3 3.1 4 2.1-2.7 6.3 8H2.7Z" />
      <path d="M12.9 15.2V3.5" />
      <path d="M12.9 4c2.3-1.1 4.6 1 7.3-.1v5.2c-2.7 1.1-5-1-7.3.1" />
    </svg>
  )
}

/* Иконок со своими точками/звёздочками нет намеренно: «снег» шара уже
   рисует точки, а лишние кружки внутри силуэта читались как часть значка. */
const BADGE_ICONS = {
  'first-step': Footprints,
  first_checkin: Sunrise,
  first_journal: Feather,
  // «Второй день» — простая искра-огонёк: меньшая ступень огня (Lucide Flame),
  // без колбы-силуэта и без собственных искр.
  'streak-two': Flame,
  'streak-three': CandleIcon,
  'streak-five': LanternIcon,
  streak_7: FlameKindling,
  streak_30: Lighthouse,
  'voice-heard': AudioLines,
  'week-on-path': Tent,
  'month-on-path': Moon,
  active_days_100: SummitFlagIcon,
  'ritual-holds': Coffee,
  'asceza-power': TreePine,
  default: Flame,
}

export function BadgeIcon({ name, fitScale = 1 }) {
  const Icon = BADGE_ICONS[name] || BADGE_ICONS.default
  // Значок всегда рисуется в квадрате 54: оптический размер задаёт пер-вариантный
  // transform в шаре (ART_FIT в SeriesBadges.jsx), а не размер этого элемента.
  const size = 54
  const iconProps = {
    x: 80 - size / 2,
    y: 68 - size / 2,
    width: size,
    height: size,
    className: 'mx-reward-icon__symbol',
    // Обводка компенсирует пер-вариантный fit-scale: ICON_STROKE остаётся 1.8
    // для всех значков, а на экране все 15 иконок рисуются одной толщиной —
    // иначе увеличенные значки выглядели бы плотнее остальных.
    strokeWidth: ICON_STROKE / fitScale,
    'aria-hidden': 'true',
    focusable: 'false',
  }

  return <Icon {...iconProps} />
}

export function BadgeSnowHorizon() {
  return (
    <g className="mx-reward-icon__snow-scene" aria-hidden="true">
      <circle className="mx-reward-icon__snow" cx="35" cy="26" r="1.2" />
      <circle className="mx-reward-icon__snow" cx="64" cy="21" r="1.2" />
      <circle className="mx-reward-icon__snow" cx="72" cy="31" r="1.2" />
      <path className="mx-reward-icon__horizon" d="M37 77h26" />
    </g>
  )
}
