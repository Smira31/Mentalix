import { readLocal, writeLocal } from './store'
import { localDayId } from './morningPilot'

const STORAGE_PREFIX = 'mx-no-blame-v1'

const RETAIN_ENTRIES = 60

/*
 * MXL-PRB-001, MXL-DEC-014: лог практики «Без вины» — только локально
 * (device/Telegram Cloud), без backend-событий и без текста самой задачи.
 * Как и firstStepPractice.js — не «одна запись на день», каждая сессия
 * добавляется отдельной записью.
 *
 * outcome: 'started' | 'not_started' | 'stopped_for_safety'
 * reflection: 'easier' | 'same' | 'harder' | null (пропущен шаг reflect)
 */

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`
}

function parseLog(raw) {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function readNoBlameLog(userId) {
  if (!userId) return []

  return parseLog(readLocal(storageKey(userId)))
}

export function saveNoBlameEntry(userId, { outcome, reflection = null }, date = new Date()) {
  if (!userId) return null

  const key = storageKey(userId)
  const log = parseLog(readLocal(key))

  const entry = {
    day: localDayId(date),
    outcome,
    reflection,
    completed_at: date.toISOString(),
  }

  const nextLog = [...log, entry].slice(-RETAIN_ENTRIES)

  writeLocal(key, JSON.stringify(nextLog))

  return entry
}
