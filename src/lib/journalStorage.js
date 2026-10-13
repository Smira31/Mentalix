import { toLocalCalendarDate } from './dateTimezonePolicy.js'

// Compatibility for existing saved thoughts only. Opaque fields are preserved;
// the retired diary has no phase-writing or prototype-migration API.
const STORAGE_KEY = 'mx-journal-v2'
const STORAGE_VERSION = 2

/*
 * Delegates to the centralized calendar-date policy (see
 * dateTimezonePolicy.js) instead of a local getTimezoneOffset() copy —
 * behavior is unchanged (verified equivalent in
 * tests/unit/date-timezone-policy.test.mjs), signature is unchanged.
 */
function todayKey() {
  return toLocalCalendarDate()
}

function normalizeUserId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

function journalStorageKey(userId) {
  const normalizedUserId = normalizeUserId(userId)
  return normalizedUserId
    ? `${STORAGE_KEY}:user:${encodeURIComponent(normalizedUserId)}`
    : STORAGE_KEY
}

function emptyEntry(date) {
  return {
    date,
    version: STORAGE_VERSION,
    freeWrites: [],
    updatedAt: null,
  }
}

function emptyStore() {
  return { version: STORAGE_VERSION, entries: {} }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeEntry(value, date) {
  const entry = emptyEntry(date)
  if (!isObject(value)) return entry
  Object.assign(entry, value)
  entry.freeWrites = []
  if (Array.isArray(value.freeWrites)) {
    entry.freeWrites = value.freeWrites
      .filter(item => isObject(item) && typeof item.text === 'string')
      .map(item => ({
        id: typeof item.id === 'string' ? item.id : `${date}-${item.text.slice(0, 12)}`,
        text: item.text,
        status: item.status === 'final' ? 'final' : 'draft',
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null,
        kind: typeof item.kind === 'string' ? item.kind : null,
        quoteKey: typeof item.quoteKey === 'string' ? item.quoteKey : null,
      }))
  }
  entry.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : null
  return entry
}

function normalizeStore(value) {
  if (!isObject(value)) return emptyStore()
  const entries = isObject(value.entries) ? value.entries : {}
  return {
    ...value,
    version: STORAGE_VERSION,
    entries: Object.fromEntries(
      Object.entries(entries).map(([date, entry]) => [date, normalizeEntry(entry, date)])
    ),
  }
}

function readRaw(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function persistOrThrow(key, store) {
  try {
    localStorage.setItem(key, JSON.stringify(store))
  } catch {
    throw new Error('Локальное хранилище недоступно')
  }
}

function readJournalStore(userId) {
  const normalizedUserId = normalizeUserId(userId)
  if (!normalizedUserId) return emptyStore()
  return normalizeStore(readRaw(journalStorageKey(normalizedUserId)))
}

function deleteJournalFreeWrite({ date = todayKey(), id, userId }) {
  if (!normalizeUserId(userId)) return false
  const key = journalStorageKey(userId)
  const store = readJournalStore(userId)
  const entry = store.entries[date]
  if (!entry) return false
  const before = entry.freeWrites.length
  entry.freeWrites = entry.freeWrites.filter(w => w.id !== id)
  if (entry.freeWrites.length === before) return false
  entry.updatedAt = new Date().toISOString()
  store.entries[date] = entry
  persistOrThrow(key, store)
  return true
}

export { deleteJournalFreeWrite, readJournalStore, todayKey }
