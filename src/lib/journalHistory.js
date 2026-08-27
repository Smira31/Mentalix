import { PHASE_KEYS, readJournalEntry as readStoredJournalEntry } from './journalStorage.js'

const PHASE_LABELS = {
  idea: 'Идея',
  action: 'Действие',
  analysis: 'Анализ',
  newStep: 'Новый шаг',
}

function phaseHasText(phase) {
  return typeof phase?.text === 'string' && phase.text.trim().length > 0
}

/**
 * Read-only view model for the local-first journal entry used by History.
 * This adapter deliberately performs no writes, network calls, or migration of its own.
 */
export function readJournalEntry(date) {
  const entry = readStoredJournalEntry(date)
  const phases = PHASE_KEYS.map(key => ({
    key,
    label: PHASE_LABELS[key],
    text: typeof entry.cycle?.[key]?.text === 'string' ? entry.cycle[key].text : '',
    status: entry.cycle?.[key]?.status === 'final' ? 'final' : 'draft',
    updatedAt:
      typeof entry.cycle?.[key]?.updatedAt === 'string' ? entry.cycle[key].updatedAt : null,
  }))
  const completedCount = phases.filter(phaseHasText).length
  const resumePhase = phases.find(phase => !phaseHasText(phase))?.key || PHASE_KEYS.at(-1)
  const status =
    completedCount === 0 ? 'empty' : completedCount === PHASE_KEYS.length ? 'final' : 'partial'

  return {
    date: typeof entry.date === 'string' ? entry.date : date,
    version: entry.version,
    phases,
    completedCount,
    totalPhases: PHASE_KEYS.length,
    status,
    resumePhase,
    hasContent: completedCount > 0,
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : null,
  }
}

export { PHASE_LABELS }
