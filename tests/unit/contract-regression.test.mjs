import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

/*
 * Contract/regression harness — catches future drift in the entry-contract
 * work tracked by MXL-JOURNAL-PERSISTENCE-001 and the practice-completion
 * conflict note (docs/architecture/PRACTICE-COMPLETION-ADAPTER_CONFLICT_NOTE.md),
 * without depending on those PRs being merged first.
 *
 * This branches from main independently of the entry-contract PRs, so tests
 * against src/lib/journalEntryContract.js, journalEntryAdapter.js, and
 * dateTimezonePolicy.js dynamically import and SKIP (not fail) if the module
 * isn't present yet — they start enforcing automatically the moment that
 * PR merges, without this harness needing a follow-up edit. Everything else
 * here checks invariants against code that already exists on main today.
 */

const srcDir = fileURLToPath(new URL('../../src', import.meta.url))

function readSource(relativePath) {
  return readFileSync(`${srcDir}/${relativePath}`, 'utf8')
}

async function importIfPresent(relativePath) {
  try {
    return await import(new URL(`../../src/${relativePath}`, import.meta.url))
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') return null
    throw error
  }
}

function stubLocalStorage() {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
  }
  return memory
}

// ---------------------------------------------------------------------------
// 1. Entry schema / required fields (MXL-JOURNAL-PERSISTENCE-001, once merged)
// ---------------------------------------------------------------------------

test('contract: entry schema declares the required fields from the entry-contract doc §4', async t => {
  const contract = await importIfPresent('lib/journalEntryContract.js')
  if (!contract) return t.skip('journalEntryContract.js not on this branch yet (pending MXL-JOURNAL-PERSISTENCE-001 merge)')

  const required = ['entry_id', 'user_id', 'entry_type', 'started_at', 'completed_at', 'source', 'schema_version', 'sync_status']
  for (const field of required) {
    assert.ok(contract.ENTRY_KEY_ORDER.includes(field), `ENTRY_KEY_ORDER missing required field: ${field}`)
  }

  // entry_id / user_id / entry_type must actually be required to normalize.
  assert.equal(contract.normalizeEntry({}), null)
  assert.equal(contract.normalizeEntry({ user_id: 'u', entry_type: 'journal' }), null)
})

// ---------------------------------------------------------------------------
// 2. Allowlist of practice/entry types — guards against silent proliferation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3. Idempotency (MXL-JOURNAL-PERSISTENCE-001, once merged)
// ---------------------------------------------------------------------------

test('contract: dedupeEntries collapses entries sharing an entry_id', async t => {
  const contract = await importIfPresent('lib/journalEntryContract.js')
  if (!contract) return t.skip('journalEntryContract.js not on this branch yet (pending MXL-JOURNAL-PERSISTENCE-001 merge)')

  const id = contract.deriveEntryId({ entryType: 'journal', userId: '1', naturalKey: '2026-08-27' })
  const base = {
    entry_id: id,
    user_id: '1',
    entry_type: 'journal',
    started_at: null,
    completed_at: '2026-08-27T09:00:00.000Z',
    outcome: null,
    reflection: null,
    next_action: null,
    source: 'journal_flow',
    schema_version: 1,
    sync_status: 'local_only',
  }

  const deduped = contract.dedupeEntries([base, { ...base, completed_at: '2026-08-27T10:00:00.000Z' }])
  assert.equal(deduped.length, 1)
})

// ---------------------------------------------------------------------------
// 4. Deterministic ordering (MXL-JOURNAL-PERSISTENCE-001, once merged)
// ---------------------------------------------------------------------------

test('contract: readJournalEntries returns a stable, deterministic order across repeated calls', async t => {
  const adapter = await importIfPresent('lib/journalEntryAdapter.js')
  const storage = await importIfPresent('lib/journalStorage.js')
  if (!adapter || !storage) return t.skip('journalEntryAdapter.js not on this branch yet (pending MXL-JOURNAL-PERSISTENCE-001 merge)')

  stubLocalStorage()
  storage.saveJournalPhase({ userId: 9, date: '2026-08-20', phase: 'idea', text: 'A' })
  storage.saveJournalPhase({ userId: 9, date: '2026-08-25', phase: 'idea', text: 'B' })
  storage.saveJournalPhase({ userId: 9, date: '2026-08-27', phase: 'idea', text: 'C' })

  const first = adapter.readJournalEntries(9).map(e => e.entry_id)
  const second = adapter.readJournalEntries(9).map(e => e.entry_id)
  assert.deepEqual(first, second)
  assert.equal(first.length, 3)
})

// ---------------------------------------------------------------------------
// 5. Timezone / date policy (MXL-date-policy, once merged)
// ---------------------------------------------------------------------------

test('contract: calendar-date policy never returns NaN-shaped output and has an explicit server placeholder', async t => {
  const policy = await importIfPresent('lib/dateTimezonePolicy.js')
  if (!policy) return t.skip('dateTimezonePolicy.js not on this branch yet (pending MXL-date-policy merge)')

  assert.equal(policy.toLocalCalendarDate('not-a-date'), null)
  assert.doesNotMatch(policy.toLocalCalendarDate('2026-08-27T10:00:00.000Z') ?? '', /NaN/)
  assert.throws(
    () => policy.resolveCalendarDate('2026-08-27T10:00:00.000Z', { policy: policy.SERVER_POLICY }),
    policy.UnimplementedDatePolicyError
  )
})

// ---------------------------------------------------------------------------
// 6. Malformed/legacy entry handling (MXL-JOURNAL-PERSISTENCE-001, once merged)
// ---------------------------------------------------------------------------

test('contract: normalizeEntry degrades malformed/legacy input to null, never throws', async t => {
  const contract = await importIfPresent('lib/journalEntryContract.js')
  if (!contract) return t.skip('journalEntryContract.js not on this branch yet (pending MXL-JOURNAL-PERSISTENCE-001 merge)')

  for (const garbage of [null, undefined, 'string', 42, [], {}, { entry_id: 123 }]) {
    assert.doesNotThrow(() => contract.normalizeEntry(garbage))
    assert.equal(contract.normalizeEntry(garbage), null)
  }
  assert.doesNotThrow(() => contract.deserializeEntry('{not json'))
  assert.equal(contract.deserializeEntry('{not json'), null)
})

// ---------------------------------------------------------------------------
// 7. No diagnostic/treatment claims in user-facing outcome labels
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 8. No fabricated backend endpoints
// ---------------------------------------------------------------------------

test('contract: api.js does not invent endpoints for unconfirmed entry-contract concepts', () => {
  const source = readSource('lib/api.js')
  const forbidden = ['entry_id', 'practice_completion', 'one_shot_practice', 'checkin_reflection', 'sync_status']

  for (const token of forbidden) {
    assert.doesNotMatch(source, new RegExp(token), `api.js references "${token}" — no backend for this is confirmed yet`)
  }
})

// ---------------------------------------------------------------------------
// 9. No journal/practice free text in Telegram or AI payloads
// ---------------------------------------------------------------------------

test('contract: AI persona send() call sites do not pass journal/practice field names as the message', () => {
  const forbiddenIdentifiers = /\b(reflection|outcome|next_action|freeWrites|journalEntry|practiceLog)\b/

  for (const screenPath of ['screens/Mentalix.jsx', 'screens/TodayFocusFlow.jsx']) {
    const source = readSource(screenPath)
    const sendCalls = [...source.matchAll(/api\.mentalix\.send\(([^)]*)\)/g)]
    assert.ok(sendCalls.length > 0, `${screenPath}: expected an api.mentalix.send(...) call to check`)
    for (const [, args] of sendCalls) {
      assert.doesNotMatch(args, forbiddenIdentifiers, `${screenPath}: api.mentalix.send(${args}) looks like it forwards journal/practice data to AI`)
    }
  }
})

test('contract: no WebApp.sendData call sends journal/practice field names to Telegram', () => {
  const forbiddenIdentifiers = /\b(reflection|outcome|next_action|freeWrites|journalEntry|practiceLog)\b/
  const platformSource = readSource('platform/telegram.adapter.js')
  const sendDataCalls = [...platformSource.matchAll(/sendData\(([^)]*)\)/g)]

  for (const [, args] of sendDataCalls) {
    assert.doesNotMatch(args, forbiddenIdentifiers, `telegram.adapter.js: sendData(${args}) looks like it forwards journal/practice data to Telegram`)
  }
})
