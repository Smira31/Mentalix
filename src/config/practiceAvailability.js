export const PRACTICE_KEYS = Object.freeze({
  rituals: 'rituals',
  ascezas: 'ascezas',
  daimon: 'daimon',
  journal: 'journal',
  mood: 'mood',
})

export const AVAILABLE_PRACTICES = Object.freeze([
  PRACTICE_KEYS.daimon,
  PRACTICE_KEYS.rituals,
  PRACTICE_KEYS.ascezas,
  PRACTICE_KEYS.journal,
])

export function isPracticeAvailable(practiceKey) {
  return AVAILABLE_PRACTICES.includes(practiceKey)
}
