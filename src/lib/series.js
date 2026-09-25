import { buildBadges } from './badges.js'
import { moodPracticeDate } from './moodPracticeLogic.js'
import { now as clockNow } from './clock.js'

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

/**
 * День засчитан для серии, если есть запись чек-ина за этот день —
 * утренняя (date / created_at) или завершённый разбор (review_completed_at / completed_at).
 * В отличие от isCompleted, учитывает утренний чек-ин без вечернего разбора.
 */
function hasCheckinRecord(checkin) {
  return Boolean(
    checkin?.date ||
    checkin?.created_at ||
    checkin?.review_completed_at ||
    checkin?.completed_at ||
    checkin?.status === 'completed'
  )
}

/**
 * Собрать дни с активностью из всех источников, кроме чек-инов:
 * - Отметки ритуалов (today_level) — только за сегодня
 * - Отметки аскез (today_status) — только за сегодня
 * - Записи практики «Настроение» (moodPractices) — по recorded_at/date
 *
 * Бэкенд отдаёт today_level / today_status только за сегодня;
 * исторические отметки практик за прошлые дни не доступны.
 * Если нужен учёт прошлых ритуалов/аскез — требуется отдельный эндпоинт.
 */
export function collectActivityDays({
  rituals,
  ascezas,
  moodPractices,
  practiceDays,
  now = clockNow(),
} = {}) {
  const days = new Set()

  // Сегодняшние отметки ритуалов и аскез
  const hasRitualToday = Array.isArray(rituals) && rituals.some(r => r?.today_level)
  const hasAscezaToday = Array.isArray(ascezas) && ascezas.some(a => a?.today_status)
  if (hasRitualToday || hasAscezaToday) {
    const pad = value => String(value).padStart(2, '0')
    days.add(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
  }

  // Записи практики «Настроение»
  if (Array.isArray(moodPractices)) {
    for (const mp of moodPractices) {
      const date = moodPracticeDate(mp)
      if (date) days.add(date)
    }
  }

  // Дни с отметками практик (ритуалы/аскезы) из бэкенд-эндпоинта /practice-days
  if (Array.isArray(practiceDays)) {
    for (const day of practiceDays) {
      if (day) days.add(String(day).slice(0, 10))
    }
  }

  return [...days]
}

function completedDays(checkins = [], timezone = 'UTC', activityDays = []) {
  const checkinDays = [
    ...new Set(
      checkins
        .filter(hasCheckinRecord)
        .map(checkin => dateKey(checkin, timezone))
        .filter(Boolean)
    ),
  ]
  const allDays = [...new Set([...checkinDays, ...activityDays.filter(Boolean)])]
  return allDays.sort().map(dayNumber)
}

function localDayKey(now) {
  const pad = value => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
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

export function currentCheckinStreak(checkins = [], options = {}) {
  const days = completedDays(checkins, options.timezone, options.activityDays)
  if (!days.length) return 0

  let streak = 1
  for (let index = days.length - 1; index > 0; index -= 1) {
    if (days[index] - days[index - 1] !== 1) break
    streak += 1
  }
  return streak
}

export function longestCheckinStreak(checkins = [], options = {}) {
  const days = completedDays(checkins, options.timezone, options.activityDays)
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
  moodPractices,
  practiceDays,
  timezone,
} = {}) {
  const resolvedTimezone =
    timezone || stats?.timezone || stats?.user_timezone || stats?.time_zone || 'UTC'
  const activityDays = collectActivityDays({ rituals, ascezas, moodPractices, practiceDays })
  const completed = checkins.filter(isCompleted)
  const activeDays = completedDays(checkins, resolvedTimezone, activityDays).length
  const currentStreak = currentCheckinStreak(checkins, { timezone: resolvedTimezone, activityDays })
  const bestStreak = longestCheckinStreak(checkins, { timezone: resolvedTimezone, activityDays })
  const metrics = {
    ...stats,
    total_checkins: completed.length,
    days_active: activeDays,
    best_streak: bestStreak,
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

export function seriesDateKey(checkin, timezone = 'UTC') {
  return dateKey(checkin, timezone)
}

export { isCompleted as isCompletedCheckin }
