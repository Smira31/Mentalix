const STORAGE_KEY = 'mx-journal-v2'
const PROTOTYPE_STORAGE_KEY = 'mx-journal-prototype-v1'
const STORAGE_VERSION = 1

const PHASE_KEYS = ['idea', 'action', 'analysis', 'newStep']

function todayKey() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
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

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizePhase(value) {
  if (typeof value === 'string') return { text: value, status: value.trim() ? 'draft' : 'draft', updatedAt: null }
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

function readRaw(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function writeRaw(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function migratePrototype() {
  const prototype = readRaw(PROTOTYPE_STORAGE_KEY)
  if (!isObject(prototype) || typeof prototype.date !== 'string' || !isObject(prototype.drafts)) return null
  const entry = emptyEntry(prototype.date)
  for (const key of PHASE_KEYS) {
    entry.cycle[key] = normalizePhase({ text: prototype.drafts[key] || '', status: 'draft' })
  }
  entry.updatedAt = new Date().toISOString()
  return entry
}

export function readJournalStore() {
  const raw = readRaw(STORAGE_KEY)
  if (!isObject(raw)) {
    const migrated = migratePrototype()
    const store = { version: STORAGE_VERSION, entries: migrated ? { [migrated.date]: migrated } : {} }
    if (migrated) writeRaw(store)
    return store
  }
  const entries = isObject(raw.entries) ? raw.entries : {}
  return {
    version: STORAGE_VERSION,
    entries: Object.fromEntries(Object.entries(entries).map(([date, entry]) => [date, normalizeEntry(entry, date)])),
  }
}

export function readJournalEntry(date = todayKey()) {
  const store = readJournalStore()
  return store.entries[date] || emptyEntry(date)
}

export function saveJournalPhase({ date = todayKey(), phase, text, status = 'draft' }) {
  if (!PHASE_KEYS.includes(phase)) throw new Error(`Unknown journal phase: ${phase}`)
  const store = readJournalStore()
  const entry = store.entries[date] || emptyEntry(date)
  const updatedAt = new Date().toISOString()
  entry.cycle[phase] = { text: typeof text === 'string' ? text : '', status: status === 'final' ? 'final' : 'draft', updatedAt }
  entry.updatedAt = updatedAt
  store.entries[date] = entry
  writeRaw(store)
  return entry
}

export function clearJournalStore() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export { PHASE_KEYS, STORAGE_KEY, todayKey }
