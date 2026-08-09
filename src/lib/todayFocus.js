import {
  readLocal,
  writeLocal,
} from './store'
import { localDayId } from './morningPilot'

const STORAGE_PREFIX =
  'mx-today-focus-v1'

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


export function readTodayFocusDay(
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


export function saveTodayFocusPick(
  userId,
  items,
  picked,
  date = new Date(),
) {
  if (!userId) return null

  const key = storageKey(userId)
  const day = localDayId(date)
  const log = parseLog(
    readLocal(key),
  )

  const nextEntry = {
    day,
    items,
    picked,
    picked_at: date.toISOString(),
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


export function clearTodayFocusPick(
  userId,
  date = new Date(),
) {
  if (!userId) return

  const key = storageKey(userId)
  const day = localDayId(date)
  const log = parseLog(
    readLocal(key),
  )

  writeLocal(
    key,
    JSON.stringify(
      log.filter(
        (entry) =>
          entry.day !== day,
      ),
    ),
  )
}
