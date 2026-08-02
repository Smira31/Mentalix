import { useId } from 'react'

import { LABYRINTH_PATH } from '../MazeLogo'


export function LabyrinthArt({
  animated = true,
  className = '',
}) {
  const uid = useId()
  const glowId = `mx-labyrinth-glow-${uid.replace(/:/g, '')}`

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      role="img"
      aria-label="Лабиринт — путь к центру"
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="42%" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="91"
        stroke="currentColor"
        strokeOpacity="0.09"
        strokeWidth="1"
        strokeDasharray="2 7"
      />

      <path
        d={LABYRINTH_PATH}
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d={LABYRINTH_PATH}
        pathLength="1"
        className={animated ? 'mx-archetype-travel' : ''}
        stroke="currentColor"
        strokeOpacity="0.92"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animated ? undefined : '0.19 0.81'}
      />

      <circle cx="100" cy="100" r="31" fill={`url(#${glowId})`} />
      <circle cx="100" cy="100" r="4.6" fill="currentColor" />
      <circle
        cx="100"
        cy="100"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
      />
      <circle cx="100" cy="184" r="2.2" fill="currentColor" fillOpacity="0.55" />
    </svg>
  )
}


export const ARCHETYPE_ART = {
  labyrinth: LabyrinthArt,
}
