import {
  AudioLines,
  Coffee,
  Feather,
  Flame,
  FlameKindling,
  Footprints,
  Lighthouse,
  Sunrise,
  Tent,
  TreePine,
} from 'lucide-react'

const ICON_STROKE = 1.8

function CandleIcon({ x, y, width, height, className }) {
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
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.8c-1.2 1.7-3.1 3.2-3.1 5.2a3.1 3.1 0 0 0 6.2 0c0-1.2-.6-2.4-1.5-3.7-.2 1.1-.7 1.8-1.4 2.2-.1-1.4-.2-2.3-.2-3.7Z" />
      <path d="M8.5 12.2h7v8.6h-7zM8.5 15.3h7" />
    </svg>
  )
}

/* «Второй день» — искра: меньшая ступень огня. Тот же силуэт пламени, что у
   «Пламени» (Flame, default), уменьшенный до 60% (ширина 8.4 против 14), и две
   искры над ним. */
function SparkIcon({ x, y, width, height, className }) {
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
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.9 16.7A1.5 1.5 0 0 0 11.4 15.2c0-.83-.3-1.2-.6-1.8-.64-1.29-.13-2.43 1.2-3.6.3 1.5 1.2 2.94 2.4 3.9 1.2.96 1.8 2.1 1.8 3.3a4.2 4.2 0 1 1-8.4 0c0-.69.26-1.38.6-1.8a1.5 1.5 0 0 0 1.5 1.5Z" />
      <circle cx="8.6" cy="6.6" r="0.75" />
      <circle cx="14.4" cy="4.2" r="0.75" />
    </svg>
  )
}

/* «Серия: пять дней» — фонарь путника: кольцо-ручка, крышка, стеклянный
   корпус с огоньком внутри и основание. */
function LanternIcon({ x, y, width, height, className }) {
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
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="4.3" r="1.8" />
      <path d="M9.6 6.1h4.8l1.6 2.6H8z" />
      <path d="M8.6 8.7h6.8v9.4H8.6z" />
      <path d="M12 11.3c1 1.2 1.5 2 1.5 2.9a1.5 1.5 0 0 1-3 0c0-.9.5-1.7 1.5-2.9Z" />
      <path d="M7.2 18.1h9.6v2.3H7.2z" />
    </svg>
  )
}

function MoonOverMountainsIcon({ x, y, width, height, className }) {
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
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19.6 4.1a7.2 7.2 0 0 0 0 10.4 7.4 7.4 0 1 1-4.6-12.9 7.3 7.3 0 0 0 4.6 2.5Z" />
      <path d="m2.5 20.7 6.1-7.2 4 4.2 2.8-3.1 6.1 6.1H2.5Z" />
    </svg>
  )
}

function SummitFlagIcon({ x, y, width, height, className }) {
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
      strokeWidth={ICON_STROKE}
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

const BADGE_ICONS = {
  'first-step': Footprints,
  first_checkin: Sunrise,
  first_journal: Feather,
  'streak-two': SparkIcon,
  'streak-three': CandleIcon,
  'streak-five': LanternIcon,
  streak_7: FlameKindling,
  streak_30: Lighthouse,
  'voice-heard': AudioLines,
  'week-on-path': Tent,
  'month-on-path': MoonOverMountainsIcon,
  active_days_100: SummitFlagIcon,
  'ritual-holds': Coffee,
  'asceza-power': TreePine,
  default: Flame,
}

export function BadgeIcon({ name, fitScale = 1.25 }) {
  const Icon = BADGE_ICONS[name] || BADGE_ICONS.default
  const size = 54 / fitScale
  const iconProps = {
    x: 80 - size / 2,
    y: 68 - size / 2,
    width: size,
    height: size,
    className: 'mx-reward-icon__symbol',
    strokeWidth: ICON_STROKE,
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
