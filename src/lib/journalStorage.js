import { toLocalCalendarDate } from './dateTimezonePolicy.js'

const STORAGE_KEY = 'mx-journal-v2'
const PROTOTYPE_STORAGE_KEY = 'mx-journal-prototype-v1'
const STORAGE_VERSION = 2

const PHASE_KEYS = ['idea', 'action', 'analysis', 'newStep']

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

function emptyPhase() {
  return { text: '', status: 'draft', updatedAt: null }
}

function emptyEntry(date) {
  return {
    date,
    version: STORAGE_VERSION,
    cycle: Object.fromEntries(PHASE_KEYS.map(key => [key, emptyPhase()])),
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

function normalizePhase(value) {
  if (typeof value === 'string') return { text: value, status: 'draft', updatedAt: null }
  if (!isObject(value)) return emptyPhase()
  const text = typeof value.text === 'string' ? value.text : ''
  return {
    text,
    status: value.status === 'final' ? 'final' : 'draft',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  }
}

function normalizeEntry(value, date) {
  const entry = emptyEntry(date)
  if (!isObject(value)) return entry
  const cycle = isObject(value.cycle) ? value.cycle : {}
  for (const key of PHASE_KEYS) entry.cycle[key] = normalizePhase(cycle[key])
  if (Array.isArray(value.freeWrites)) {
    entry.freeWrites = value.freeWrites
      .filter(item => isObject(item) && typeof item.text === 'string')
      .map(item => ({
        id: typeof item.id === 'string' ? item.id : `${date}-${item.text.slice(0, 12)}`,
        text: item.text,
        status: item.status === 'final' ? 'final' : 'draft',
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null,
      }))
  }
  entry.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : null
  return entry
}

function normalizeStore(value) {
  if (!isObject(value)) return emptyStore()
  const entries = isObject(value.entries) ? value.entries : {}
  return {
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

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function removeRaw(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

function prototypeEntry() {
  const prototype = readRaw(PROTOTYPE_STORAGE_KEY)
  if (!isObject(prototype) || typeof prototype.date !== 'string' || !isObject(prototype.drafts))
    return null
  const entry = emptyEntry(prototype.date)
  for (const key of PHASE_KEYS) {
    entry.cycle[key] = normalizePhase({ text: prototype.drafts[key] || '', status: 'draft' })
  }
  entry.updatedAt = new Date().toISOString()
  return entry
}

function hasJournalContent(store) {
  return Object.values(store.entries).some(
    entry => PHASE_KEYS.some(key => entry.cycle[key]?.text?.trim()) || entry.freeWrites.length > 0
  )
}

function mergePrototype(store) {
  const prototype = prototypeEntry()
  if (!prototype) return store
  const current = store.entries[prototype.date]
  if (!current) {
    store.entries[prototype.date] = prototype
    return store
  }
  for (const key of PHASE_KEYS) {
    if (!current.cycle[key].text.trim() && prototype.cycle[key].text.trim()) {
      current.cycle[key] = prototype.cycle[key]
    }
  }
  return store
}

function readLegacyStore() {
  return mergePrototype(normalizeStore(readRaw(STORAGE_KEY)))
}

function persistOrThrow(key, store) {
  if (!writeRaw(key, store)) {
    throw new Error('Локальное хранилище недоступно')
  }
}

/**
 * Older Journal Home builds saved data under one browser-wide key. New data
 * is scoped by signed-in user. Migration is opt-in in the UI because an old
 * browser key cannot reliably prove which account originally wrote it.
 */
function hasLegacyJournalData(userId) {
  if (!normalizeUserId(userId)) return false
  return hasJournalContent(readLegacyStore())
}

function mergeLegacyStoreIntoUser(userStore, legacyStore) {
  for (const [date, legacyEntry] of Object.entries(legacyStore.entries)) {
    const current = userStore.entries[date]
    if (!current) {
      userStore.entries[date] = legacyEntry
      continue
    }

    for (const key of PHASE_KEYS) {
      if (!current.cycle[key].text.trim() && legacyEntry.cycle[key].text.trim()) {
        current.cycle[key] = legacyEntry.cycle[key]
      }
    }

    const knownFreeWriteIds = new Set(current.freeWrites.map(item => item.id))
    current.freeWrites = [
      ...current.freeWrites,
      ...legacyEntry.freeWrites.filter(item => !knownFreeWriteIds.has(item.id)),
    ]
    current.updatedAt = current.updatedAt || legacyEntry.updatedAt
  }
  return userStore
}

function migrateLegacyJournalToUser(userId) {
  const normalizedUserId = normalizeUserId(userId)
  if (!normalizedUserId) throw new Error('Не удалось определить профиль для переноса журнала')

  const legacy = readLegacyStore()
  if (!hasJournalContent(legacy)) return null

  const userKey = journalStorageKey(normalizedUserId)
  const userStore = normalizeStore(readRaw(userKey))
  const merged = mergeLegacyStoreIntoUser(userStore, legacy)
  persistOrThrow(userKey, merged)
  removeRaw(STORAGE_KEY)
  removeRaw(PROTOTYPE_STORAGE_KEY)
  return merged
}

function readJournalStore(userId) {
  const normalizedUserId = normalizeUserId(userId)
  if (normalizedUserId) return normalizeStore(readRaw(journalStorageKey(normalizedUserId)))

  // Compatibility mode is retained for legacy consumers and test fixtures.
  const raw = readRaw(STORAGE_KEY)
  if (isObject(raw)) return normalizeStore(raw)
  const migrated = prototypeEntry()
  const store = emptyStore()
  if (migrated) {
    store.entries[migrated.date] = migrated
    persistOrThrow(STORAGE_KEY, store)
  }
  return store
}

function readJournalEntry(date = todayKey(), userId) {
  const store = readJournalStore(userId)
  return store.entries[date] || emptyEntry(date)
}

function saveJournalPhase({ date = todayKey(), phase, text, status = 'draft', userId }) {
  if (!PHASE_KEYS.includes(phase)) throw new Error(`Unknown journal phase: ${phase}`)
  const key = journalStorageKey(userId)
  const store = readJournalStore(userId)
  const entry = store.entries[date] || emptyEntry(date)
  const updatedAt = new Date().toISOString()
  entry.cycle[phase] = {
    text: typeof text === 'string' ? text : '',
    status: status === 'final' ? 'final' : 'draft',
    updatedAt,
  }
  entry.updatedAt = updatedAt
  store.entries[date] = entry
  persistOrThrow(key, store)
  return entry
}

function clearJournalStore(userId) {
  return removeRaw(journalStorageKey(userId))
}

export {
  PHASE_KEYS,
  PROTOTYPE_STORAGE_KEY,
  STORAGE_KEY,
  STORAGE_VERSION,
  clearJournalStore,
  hasLegacyJournalData,
  journalStorageKey,
  migrateLegacyJournalToUser,
  readJournalEntry,
  readJournalStore,
  saveJournalPhase,
  todayKey,
}
