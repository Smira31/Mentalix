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
  PRACTICE_KEYS.rituals,
  PRACTICE_KEYS.ascezas,
  PRACTICE_KEYS.firstStep,
  PRACTICE_KEYS.noBlame,
  PRACTICE_KEYS.narrowFocus,
  PRACTICE_KEYS.oneFinish,
])

export function isPracticeAvailable(practiceKey) {
  return AVAILABLE_PRACTICES.includes(practiceKey)
}
