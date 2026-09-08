export const PRACTICE_KEYS = Object.freeze({
  rituals: 'rituals',
  ascezas: 'ascezas',
  firstStep: 'first-step',
  noBlame: 'no-blame',
  narrowFocus: 'narrow-focus',
  oneFinish: 'one-finish',
  brain: 'brain',
  breathing: 'breathing',
  focus: 'focus',
  meditation: 'meditation',
})

export const AVAILABLE_PRACTICES = Object.freeze([
  'lila-discover',
  PRACTICE_KEYS.rituals,
  PRACTICE_KEYS.ascezas,
  PRACTICE_KEYS.firstStep,
  PRACTICE_KEYS.noBlame,
  PRACTICE_KEYS.narrowFocus,
  PRACTICE_KEYS.oneFinish,
  PRACTICE_KEYS.meditation,
  // MXL-525 G6: «Живая линза» (brain/breathing/focus) — рабочие практики,
  // признаны доступными (Focus починен #544); гейтинг должен быть честным.
  PRACTICE_KEYS.brain,
  PRACTICE_KEYS.breathing,
  PRACTICE_KEYS.focus,
])

export function isPracticeAvailable(practiceKey) {
  return AVAILABLE_PRACTICES.includes(practiceKey)
}
