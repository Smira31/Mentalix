import { buildBadges } from './badges.js'

/**
 * Counts the consecutive completed check-ins at the end of a history list.
 * The API returns the history in chronological order in the current client
 * contract; sorting by date here keeps the selector safe if that order changes.
 */
function dayNumber(date) {
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) return NaN

  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000
}

export function currentCheckinStreak(checkins = []) {
  const ordered = [...checkins]
    .filter(checkin => checkin?.date && Number.isFinite(dayNumber(checkin.date)))
    .sort((a, b) => dayNumber(a.date) - dayNumber(b.date))

  let streak = 0
  let previousDay = null

  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const checkin = ordered[index]
    const day = dayNumber(checkin.date)

    if (!checkin.review_completed_at) break
    if (previousDay !== null && previousDay - day !== 1) break

    streak += 1
    previousDay = day
  }

  return streak
}

export function buildSeriesViewModel({ stats, checkins, rituals, ascezas }) {
  const badges = buildBadges({
    stats,
    rituals: rituals || [],
    ascezas: ascezas || [],
  })

  return {
    currentStreak: currentCheckinStreak(checkins),
    bestStreak: Number(stats?.best_streak) || 0,
    activeDays: Number(stats?.days_active) || 0,
    totalCheckins: Number(stats?.total_checkins) || 0,
    badges,
  }
}
