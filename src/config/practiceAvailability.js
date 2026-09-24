export const PRACTICE_KEYS = Object.freeze({
  rituals: 'rituals',
  ascezas: 'ascezas',
  mood: 'mood',
})

export const AVAILABLE_PRACTICES = Object.freeze([
  'lila-discover',
  PRACTICE_KEYS.rituals,
  PRACTICE_KEYS.ascezas,
  PRACTICE_KEYS.mood,
])

export function isPracticeAvailable(practiceKey) {
  return AVAILABLE_PRACTICES.includes(practiceKey)
}
