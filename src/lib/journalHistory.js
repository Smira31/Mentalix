import { PHASE_KEYS, readJournalStore } from './journalStorage.js'

const PHASE_LABELS = {
  idea: 'Идея',
  action: 'Действие',
  analysis: 'Анализ',
  newStep: 'Новый шаг',
}

function phaseHasText(phase) {
  return typeof phase?.text === 'string' && phase.text.trim().length > 0
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
  const completedCount = phases.filter(phaseHasText).length
  const isComplete =
    completedCount === PHASE_KEYS.length && phases.find(phase => phase.key === 'newStep')?.status === 'final'

  return {
    date: entry.date,
    phases: phases.filter(phaseHasText),
    completedCount,
    totalPhases: PHASE_KEYS.length,
    status: isComplete ? 'final' : 'draft',
  }
}

/**
 * Builds a read-only history view from the already existing local Journal store.
 * It deliberately does not write, migrate legacy data, or invoke an API.
 */
function readJournalHistory(userId) {
  const store = readJournalStore(userId)

  return Object.values(store.entries)
    .map(toHistoryEntry)
    .filter(entry => entry.completedCount > 0)
    .sort((left, right) => right.date.localeCompare(left.date))
}

export { PHASE_LABELS, readJournalHistory }
