import { PHASE_KEYS, readJournalStore } from './journalStorage.js'

const PHASE_LABELS = {
  idea: 'Идея',
  action: 'Действие',
  analysis: 'Анализ',
  newStep: 'Новый шаг',
}

function normalizeUserId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

function phaseHasText(phase) {
  return typeof phase?.text === 'string' && phase.text.trim().length > 0
}

function toFreeWrite(item) {
  if (typeof item?.text !== 'string' || !item.text.trim()) return null
  return {
    id: typeof item.id === 'string' ? item.id : null,
    text: item.text,
    status: item.status === 'final' ? 'final' : 'draft',
  }
}

function toHistoryEntry(entry) {
  const phases = PHASE_KEYS.map(key => {
    const source = entry.cycle?.[key]
    return {
      key,
      label: PHASE_LABELS[key],
      status: source?.status === 'final' ? 'final' : 'draft',
      text: typeof source?.text === 'string' ? source.text : '',
    }
  })
  const freeWrites = Array.isArray(entry.freeWrites)
    ? entry.freeWrites.map(toFreeWrite).filter(Boolean)
    : []
  const completedCount = phases.filter(phaseHasText).length
  const isComplete =
    completedCount === PHASE_KEYS.length && phases.find(phase => phase.key === 'newStep')?.status === 'final'

  return {
    date: entry.date,
    phases: phases.filter(phaseHasText),
    // Свободные записи дня остаются отдельными элементами того же дня —
    // их не схлопываем по дате и не теряем.
    freeWrites,
    completedCount,
    totalPhases: PHASE_KEYS.length,
    status: isComplete ? 'final' : 'draft',
  }
}

/**
 * Builds a read-only history view from the already existing local Journal store.
 * It deliberately does not write, migrate legacy data, or invoke an API.
 *
 * Requires a confirmed profile: without a valid userId the browser-wide legacy
 * keys (`mx-journal-v2` / `mx-journal-prototype-v1`) cannot prove ownership, so
 * they are not read at all. This also keeps `readJournalStore`'s compatibility
 * path — which may persist a migrated prototype entry — out of a history read.
 */
function readJournalHistory(userId) {
  if (!normalizeUserId(userId)) return []

  const store = readJournalStore(userId)

  return Object.values(store.entries)
    .map(toHistoryEntry)
    .filter(entry => entry.completedCount > 0 || entry.freeWrites.length > 0)
    .sort((left, right) => right.date.localeCompare(left.date))
}

export { PHASE_LABELS, readJournalHistory }
