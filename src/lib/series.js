import { buildBadges } from './badges.js'
import { now as clockNow } from './clock.js'

const seriesSnapshots = new Map()
const SNAPSHOT_PREFIX = 'mx-series-snapshot:'

function dayNumber(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return NaN
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000
}

function logicalDateKey(value, timezone) {
  if (!timezone) return localDayKey(value)
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(value)
    const fields = Object.fromEntries(parts.map(part => [part.type, part.value]))
    const day = `${fields.year}-${fields.month}-${fields.day}`
    return Number(fields.hour) < 5
      ? new Date((dayNumber(day) - 1) * 86400000).toISOString().slice(0, 10)
      : day
  } catch {
    return localDayKey(value)
  }
}

function dateKey(checkin, timezone = 'UTC') {
  if (checkin?.date && Number.isFinite(dayNumber(checkin.date))) {
    return String(checkin.date).slice(0, 10)
  }

  const raw = checkin?.review_completed_at || checkin?.completed_at || checkin?.created_at
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null

  return logicalDateKey(parsed, timezone || 'UTC')
}

function isCompleted(checkin) {
  return Boolean(
    checkin?.review_completed_at || checkin?.completed_at || checkin?.status === 'completed'
  )
}

function localDayKey(now) {
  const day = new Date(now)
  if (day.getHours() < 5) day.setDate(day.getDate() - 1)
  const pad = value => String(value).padStart(2, '0')
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

/**
 * История чек-инов + сегодняшний чек-ин (GET /checkin/today). История с
 * бэкенда может отставать от записи за сегодня; утренний чек-ин уже есть —
 * значит, сегодняшний день засчитан в серию.
 */
export function withTodayCheckin(history = [], today = null, now = clockNow()) {
  const list = Array.isArray(history) ? history : []
  if (!today || typeof today !== 'object') return list
  const date = Number.isFinite(dayNumber(today.date))
    ? String(today.date).slice(0, 10)
    : localDayKey(now)
  return [...list, { ...today, date }]
}

// View-model значков без клиентского восстановления серии из неполной истории.
// Числа мягкой серии приходят исключительно из GET /api/streak.
export function buildServerSeriesViewModel({ stats = {}, checkins = [], rituals = [], ascezas = [], canonicalStats = null } = {}) {
  const completed = checkins.filter(isCompleted)
  return {
    currentStreak: canonicalStats?.currentStreak ?? null,
    bestStreak: canonicalStats?.bestStreak ?? null,
    activeDays: canonicalStats?.activeDays ?? null,
    totalCheckins: stats.total_checkins ?? completed.length,
    badges: buildBadges({
      stats: { ...stats, best_streak: canonicalStats?.bestStreak ?? 0, days_active: canonicalStats?.activeDays ?? 0 },
      checkins: completed,
      rituals,
      ascezas,
    }),
  }
}

/**
 * Разделить историю на «до сегодняшнего чек-ина» и «с сегодняшним чек-ином»,
 * чтобы сравнить значки и определить, какие открылись именно сейчас, а какие
 * были получены задним числом (ретро-зачёт при первом появлении значка в
 * каталоге). Обе модели строятся из одной свежей истории — это исключает
 * гонку с ещё не загруженным React-состоянием checkinHistory.
 */
export function splitCheckinsForComparison(history = [], todayCheckin = null, now = clockNow()) {
  const list = Array.isArray(history) ? history : []
  if (!todayCheckin || typeof todayCheckin !== 'object') {
    return { previous: list, next: list }
  }
  const todayKey = Number.isFinite(dayNumber(todayCheckin.date))
    ? String(todayCheckin.date).slice(0, 10)
    : localDayKey(now)
  const previous = list.filter(c => String(c.date).slice(0, 10) !== todayKey)
  const next = withTodayCheckin(list, todayCheckin, now)
  return { previous, next }
}

/**
 * Найти первый значок, который открыт в nextModel, но не был открыт в
 * previousModel. Используется для шторки «Новый значок» — показывает
 * только значки, полученные в момент нового чек-ина, а не ретро-зачёт.
 */
export function detectNewlyUnlockedBadge(previousModel, nextModel) {
  if (!nextModel?.badges) return null
  return (
    nextModel.badges.find(
      badge =>
        badge.done && !previousModel?.badges?.find(previous => previous.id === badge.id)?.done
    ) || null
  )
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

export function clearSeriesSnapshots() {
  seriesSnapshots.clear()
}

export function seriesLogicalDateKey(value = clockNow(), timezone) {
  return logicalDateKey(value, timezone)
}

export function seriesDateKey(checkin, timezone = 'UTC') {
  return dateKey(checkin, timezone)
}

export { isCompleted as isCompletedCheckin }
