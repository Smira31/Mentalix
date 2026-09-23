import { buildBadges } from './badges.js'

const seriesSnapshots = new Map()
const SNAPSHOT_PREFIX = 'mx-series-snapshot:'

function dayNumber(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return NaN
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000
}

function dateKey(checkin, timezone = 'UTC') {
  if (checkin?.date && Number.isFinite(dayNumber(checkin.date))) {
    return String(checkin.date).slice(0, 10)
  }

  const raw = checkin?.review_completed_at || checkin?.completed_at || checkin?.created_at
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null

  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(parsed)
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}`
  } catch {
    return parsed.toISOString().slice(0, 10)
  }
}

function isCompleted(checkin) {
  return Boolean(
    checkin?.review_completed_at || checkin?.completed_at || checkin?.status === 'completed'
  )
}

function completedDays(checkins = [], timezone = 'UTC') {
  return [
    ...new Set(
      checkins
        .filter(isCompleted)
        .map(checkin => dateKey(checkin, timezone))
        .filter(Boolean)
    ),
  ]
    .sort()
    .map(dayNumber)
}

export function currentCheckinStreak(checkins = [], options = {}) {
  const days = completedDays(checkins, options.timezone)
  if (!days.length) return 0

  let streak = 1
  for (let index = days.length - 1; index > 0; index -= 1) {
    if (days[index] - days[index - 1] !== 1) break
    streak += 1
  }
  return streak
}

export function longestCheckinStreak(checkins = [], options = {}) {
  const days = completedDays(checkins, options.timezone)
  if (!days.length) return 0

  let longest = 1
  let run = 1
  for (let index = 1; index < days.length; index += 1) {
    if (days[index] - days[index - 1] === 1) run += 1
    else run = 1
    longest = Math.max(longest, run)
  }
  return longest
}

export function buildSeriesViewModel({
  stats = {},
  checkins = [],
  rituals,
  ascezas,
  timezone,
} = {}) {
  const resolvedTimezone =
    timezone || stats?.timezone || stats?.user_timezone || stats?.time_zone || 'UTC'
  const completed = checkins.filter(isCompleted)
  const activeDays = completedDays(checkins, resolvedTimezone).length
  const currentStreak = currentCheckinStreak(checkins, { timezone: resolvedTimezone })
  const bestStreak = longestCheckinStreak(checkins, { timezone: resolvedTimezone })
  const metrics = {
    ...stats,
    total_checkins: Math.max(completed.length, Number(stats?.total_checkins) || 0),
    days_active: Math.max(activeDays, Number(stats?.days_active) || 0),
    best_streak: Math.max(bestStreak, Number(stats?.best_streak) || 0),
  }

  return {
    currentStreak,
    bestStreak: metrics.best_streak,
    activeDays: metrics.days_active,
    totalCheckins: metrics.total_checkins,
    timezone: resolvedTimezone,
    badges: buildBadges({
      stats: metrics,
      checkins: completed,
      rituals: rituals || [],
      ascezas: ascezas || [],
    }),
  }
}

export function peekSeriesSnapshot(userId) {
  if (!userId) return null
  if (seriesSnapshots.has(userId)) return seriesSnapshots.get(userId)

  try {
    const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}${userId}`)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed) seriesSnapshots.set(userId, parsed)
    return parsed
  } catch {
    return null
  }
}

export function rememberSeriesSnapshot(userId, model) {
  if (!userId || !model) return
  seriesSnapshots.set(userId, model)
  try {
    localStorage.setItem(`${SNAPSHOT_PREFIX}${userId}`, JSON.stringify(model))
  } catch {
    // Snapshot is an optimisation; private browsing may disallow storage.
  }
}

export function seriesDateKey(checkin, timezone = 'UTC') {
  return dateKey(checkin, timezone)
}

export { isCompleted as isCompletedCheckin }
