/*
 * Мягкая серия — серверный контракт GET /api/streak?user_id=<id>.
 *
 * Валидный ответ содержит current_streak — безопасное целое >= 0.
 * Нулевая серия — валидное значение; null означает «нет корректных
 * данных» — не подменяем его расчётом по истории.
 */
export function readCanonicalCurrentStreak(payload) {
  const value = payload?.current_streak
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

export function serverSeriesBadges(badges = [], stats) {
  return badges.map(badge => {
    if (!['streak-two', 'streak-three', 'streak-five', 'week-on-path', 'month-on-path'].includes(badge.id)) return badge
    const value = stats && (badge.id === 'week-on-path' || badge.id === 'month-on-path'
      ? stats.activeDays : stats.bestStreak)
    return { ...badge, done: value != null && value >= badge.goal, progress: Math.min(value ?? 0, badge.goal) }
  })
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

  return {
    currentStreak,
    bestStreak,
    activeDays,
    isActiveToday: payload.is_active_today === true,
    freezeUsedThisWeek: payload.freeze_used_this_week === true,
    recoverable: payload.recoverable === true,
  }
}
