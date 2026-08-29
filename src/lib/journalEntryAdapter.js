/*
 * MXL-JOURNAL-PERSISTENCE-001 — Journal Flow adapter onto the unified entry
 * contract (journalEntryContract.js).
 *
 * Read-only: this file does not write to journalStorage.js's store and does
 * not change its on-disk shape. It composes the existing, unmodified
 * `readJournalStore` and re-projects each day's phase-cycle into the
 * canonical entry contract, so a future History UI or backend handoff has
 * one stable shape to read regardless of which domain (journal, check-in,
 * one-shot practice — see the entry-contract doc) an entry came from.
 *
 * Field mapping is a frontend judgment call, not a backend fact:
 *   - `started_at` is the earliest phase/free-write `updatedAt` for the day,
 *     falling back to the entry's own `updatedAt`. journalStorage.js does
 *     not track a true "session start" moment (only last-write-per-phase),
 *     so this is an approximation, not an authoritative session start.
 *   - `completed_at` is the `newStep` phase's `updatedAt` only when that
 *     phase is `final` — mirrors the existing completion notion already used
 *     by journalHistory.js's `isComplete` check.
 *   - `reflection` maps from the `analysis` phase, `next_action` from
 *     `newStep` — both are direct, non-lossy renamings of an existing
 *     phase's text, not inferred content.
 *   - `outcome` is left null: Journal Flow's four-phase cycle has no single
 *     descriptive result field the way a one-shot practice does.
 *   - `sync_status` is always `local_only`: no backend is connected.
 *
 * Timezone/date policy is intentionally not addressed here — journalStorage.js's
 * `todayKey()` and this adapter both operate on whatever `date` string keys
 * the store already, and centralizing that policy is MXL-JOURNAL date-policy
 * work in `src/lib/dateTimezonePolicy.js`, not this module.
 */

import { readJournalStore } from './journalStorage.js'

import {
  ENTRY_SCHEMA_VERSION,
  dedupeEntries,
  deriveEntryId,
  normalizeEntry,
} from './journalEntryContract.js'

const ENTRY_TYPE = 'journal'
const SOURCE = 'journal_flow'

function normalizeUserId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

function phaseTimestamp(phase) {
  return typeof phase?.updatedAt === 'string' ? phase.updatedAt : null
}

function earliestTimestamp(timestamps) {
  const valid = timestamps.filter(Boolean).sort()
  return valid.length ? valid[0] : null
}

function hasContent(storeEntry) {
  const phases = Object.values(storeEntry?.cycle || {})
  const hasPhaseText = phases.some(phase => typeof phase?.text === 'string' && phase.text.trim())
  const hasFreeWrite =
    Array.isArray(storeEntry?.freeWrites) && storeEntry.freeWrites.some(item => item?.text?.trim())
  return hasPhaseText || hasFreeWrite
}

function toJournalEntry(storeEntry, normalizedUserId) {
  const cycle = storeEntry?.cycle || {}
  const newStep = cycle.newStep

  const startedAt =
    earliestTimestamp([
      ...Object.values(cycle).map(phaseTimestamp),
      ...(storeEntry?.freeWrites || []).map(phaseTimestamp),
    ]) || (typeof storeEntry?.updatedAt === 'string' ? storeEntry.updatedAt : null)

  const completedAt = newStep?.status === 'final' ? phaseTimestamp(newStep) : null

  return normalizeEntry({
    entry_id: deriveEntryId({
      entryType: ENTRY_TYPE,
      userId: normalizedUserId,
      naturalKey: storeEntry.date,
    }),
    user_id: normalizedUserId,
    entry_type: ENTRY_TYPE,
    started_at: startedAt,
    completed_at: completedAt,
    outcome: null,
    reflection: typeof cycle.analysis?.text === 'string' ? cycle.analysis.text : null,
    next_action: typeof cycle.newStep?.text === 'string' ? cycle.newStep.text : null,
    source: SOURCE,
    schema_version: ENTRY_SCHEMA_VERSION,
    sync_status: 'local_only',
  })
}

/*
 * Returns the user's Journal Flow entries in the unified entry contract,
 * newest first (same deterministic `date.localeCompare` ordering precedent
 * as journalHistory.js). Never throws: an unreadable/corrupt store already
 * degrades to an empty store inside readJournalStore, and any entry this
 * adapter cannot make sense of is dropped by normalizeEntry rather than
 * surfaced as a broken record.
 */
function readJournalEntries(userId) {
  const normalizedUserId = normalizeUserId(userId)
  if (!normalizedUserId) return []

  const store = readJournalStore(userId)
  const entries = Object.values(store.entries)
    .filter(hasContent)
    .map(storeEntry => toJournalEntry(storeEntry, normalizedUserId))
    .filter(Boolean)

  return dedupeEntries(entries).sort((a, b) => {
    const aKey = a.completed_at || a.started_at || ''
    const bKey = b.completed_at || b.started_at || ''
    return bKey.localeCompare(aKey)
  })
}

export { readJournalEntries, toJournalEntry }
