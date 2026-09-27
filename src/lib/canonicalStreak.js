/*
 * Canonical streak contract (GET /api/streak?user_id=<id>, backend PR #108).
 *
 * Валидный ответ содержит current_streak — безопасное целое >= 0.
 * Нулевая серия — валидное значение; null означает «нет корректных
 * данных» — вызывающий код обязан использовать fallback.
 */
export function readCanonicalCurrentStreak(payload) {
  const value = payload?.current_streak
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

export function readCanonicalStreakStats(payload) {
  const currentStreak = readCanonicalCurrentStreak(payload)
  const bestStreak = payload?.longest_streak
  const activeDays = payload?.total_active_days
  if (
    currentStreak === null ||
    !Number.isSafeInteger(bestStreak) || bestStreak < 0 ||
    !Number.isSafeInteger(activeDays) || activeDays < 0
  ) return null

  return { currentStreak, bestStreak, activeDays }
}
