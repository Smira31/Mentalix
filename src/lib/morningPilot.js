import {
  readLocal,
  writeLocal,
} from './store'

const STORAGE_PREFIX =
  'mx-morning-pilot-v1'

const RETAIN_DAYS = 14


function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`
}


function parseLog(raw) {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed
      : []
  } catch {
    return []
  }
}


export function localDayId(
  date = new Date(),
) {
  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


export function isMorningPilotTime(
  date = new Date(),
) {
  const hour = date.getHours()

  return hour >= 5 && hour < 12
}


export function readMorningPilotDay(
  userId,
  date = new Date(),
) {
  if (!userId) return null

  const day = localDayId(date)
  const log = parseLog(
    readLocal(storageKey(userId)),
  )

  return log.find(
    (entry) => entry.day === day,
  ) || null
}


export function recordMorningPilotEvent(
  userId,
  event,
  date = new Date(),
) {
  if (!userId) return null

  const key = storageKey(userId)
  const day = localDayId(date)
  const timestamp = date.toISOString()
  const log = parseLog(
    readLocal(key),
  )
  const previous = log.find(
    (entry) => entry.day === day,
  ) || { day }

  const nextEntry =
    event === 'viewed'
      ? {
          ...previous,
          viewed_at:
            previous.viewed_at
            || timestamp,
        }
      : {
          ...previous,
          outcome: event,
          decided_at: timestamp,
        }

  const nextLog = [
    ...log.filter(
      (entry) =>
        entry.day !== day,
    ),
    nextEntry,
  ]
    .sort(
      (left, right) =>
        left.day.localeCompare(
          right.day,
        ),
    )
    .slice(-RETAIN_DAYS)

  writeLocal(
    key,
    JSON.stringify(nextLog),
  )

  return nextEntry
}


export function clearMorningPilotDecision(
  userId,
  date = new Date(),
) {
  if (!userId) return null

  const key = storageKey(userId)
  const day = localDayId(date)
  const log = parseLog(
    readLocal(key),
  )
  const previous = log.find(
    (entry) => entry.day === day,
  )

  if (!previous) return null

  const nextEntry = {
    ...previous,
  }

  delete nextEntry.outcome
  delete nextEntry.decided_at

  const nextLog = [
    ...log.filter(
      (entry) =>
        entry.day !== day,
    ),
    nextEntry,
  ]

  writeLocal(
    key,
    JSON.stringify(nextLog),
  )

  return nextEntry
}


export function morningRituals(
  rituals,
  limit = 3,
) {
  return rituals
    .filter(
      (ritual) =>
        !ritual.today_level,
    )
    .slice(0, limit)
}
