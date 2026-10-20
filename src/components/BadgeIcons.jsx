import {
  AudioLines,
  Feather,
  Flame,
  FlameKindling,
  Lamp,
  Lighthouse,
  Puzzle,
  Route,
  Sparkle,
  Sunrise,
  Tent,
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
  'first-step': Route,
  first_checkin: Sunrise,
  first_journal: Feather,
  'streak-two': Sparkle,
  'streak-three': CandleIcon,
  'streak-five': Lamp,
  streak_7: FlameKindling,
  streak_30: Lighthouse,
  'voice-heard': AudioLines,
  'week-on-path': Tent,
  'month-on-path': MoonOverMountainsIcon,
  active_days_100: SummitFlagIcon,
  'ritual-holds': Puzzle,
  'asceza-power': CandleIcon,
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
