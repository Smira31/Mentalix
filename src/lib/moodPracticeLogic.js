/**
 * Чистая логика практики «Настроение» — извлечена из MoodPractice.jsx
 * для unit-тестирования без React-окружения.
 */

export const CONTEXT_VALUES = ['work', 'home', 'relationships', 'health', 'study', 'other']

export const STEP_INTRO = 0
export const STEP_MOOD = 1
export const STEP_EMOTION = 2
export const STEP_CONTEXT = 3
export const STEP_BREATHING = 4
export const STEP_DONE = 5

/**
 * Можно ли перейти к следующему шагу.
 * @param {number} step — текущий шаг (STEP_MOOD | STEP_EMOTION | STEP_CONTEXT)
 * @param {{ mood: number|null, emotion: string|null }} state
 * @returns {boolean}
 */
export function canProceedFromStep(step, { mood, emotion }) {
  if (step === STEP_MOOD) return mood != null
  if (step === STEP_EMOTION) return Boolean(emotion)
  return true
}

/**
 * Собрать payload для POST /mood-practices.
 * Контекст валидируется по списку — неизвестные значения → null.
 * @param {{ mood: number|null, emotion: string|null, context: string|null, note: string }} state
 * @param {boolean} breathing_completed
 * @returns {{ mood: number|null, emotion: string|null, context: string|null, note: string|null, breathing_completed: boolean }}
 */
export function buildMoodPracticePayload({ mood, emotion, context, note }, breathing_completed) {
  return {
    mood,
    emotion,
    context: CONTEXT_VALUES.includes(context) ? context : null,
    note: note?.trim() || null,
    breathing_completed: Boolean(breathing_completed),
  }
}
