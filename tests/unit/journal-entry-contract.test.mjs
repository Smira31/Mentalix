import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_NEXT_ACTION_LENGTH,
  MAX_OUTCOME_LENGTH,
  MAX_REFLECTION_LENGTH,
  dedupeEntries,
  deriveEntryId,
  deserializeEntry,
  normalizeEntry,
  serializeEntry,
} from '../../src/lib/journalEntryContract.js'

function validEntry(overrides = {}) {
  return {
    entry_id: deriveEntryId({ entryType: 'journal', userId: '101', naturalKey: '2026-08-27' }),
    user_id: '101',
    entry_type: 'journal',
    started_at: '2026-08-27T08:00:00.000Z',
    completed_at: '2026-08-27T09:00:00.000Z',
    outcome: null,
    reflection: 'Заметил спешку по утрам.',
    next_action: 'Выйти на 10 минут раньше',
    source: 'journal_flow',
    schema_version: 1,
    sync_status: 'local_only',
    ...overrides,
  }
}

test('MXL-JOURNAL-PERSISTENCE-001 deriveEntryId детерминирован для одного и того же natural key', () => {
  const first = deriveEntryId({ entryType: 'journal', userId: '101', naturalKey: '2026-08-27' })
  const second = deriveEntryId({ entryType: 'journal', userId: '101', naturalKey: '2026-08-27' })
  assert.equal(first, second)
})

test('MXL-JOURNAL-PERSISTENCE-001 deriveEntryId различает пользователя и дату (idempotency boundary)', () => {
  const base = deriveEntryId({ entryType: 'journal', userId: '101', naturalKey: '2026-08-27' })
  const otherUser = deriveEntryId({ entryType: 'journal', userId: '202', naturalKey: '2026-08-27' })
  const otherDate = deriveEntryId({ entryType: 'journal', userId: '101', naturalKey: '2026-08-28' })
  assert.notEqual(base, otherUser)
  assert.notEqual(base, otherDate)
})

test('MXL-JOURNAL-PERSISTENCE-001 normalizeEntry принимает валидную запись как есть', () => {
  const normalized = normalizeEntry(validEntry())
  assert.ok(normalized)
  assert.equal(normalized.entry_type, 'journal')
  assert.equal(normalized.sync_status, 'local_only')
  assert.equal(normalized.reflection, 'Заметил спешку по утрам.')
})

test('MXL-JOURNAL-PERSISTENCE-001 normalizeEntry безопасно отклоняет malformed/legacy вход', () => {
  assert.equal(normalizeEntry(null), null)
  assert.equal(normalizeEntry(undefined), null)
  assert.equal(normalizeEntry('not-an-object'), null)
  assert.equal(normalizeEntry([]), null)
  assert.equal(normalizeEntry({}), null)
  assert.equal(normalizeEntry(validEntry({ entry_type: 'unknown_domain' })), null)
  assert.equal(normalizeEntry(validEntry({ user_id: '' })), null)
  assert.equal(normalizeEntry(validEntry({ entry_id: null })), null)
})

test('MXL-JOURNAL-PERSISTENCE-001 normalizeEntry ограничивает длину outcome/reflection/next_action', () => {
  const normalized = normalizeEntry(
    validEntry({
      outcome: 'o'.repeat(MAX_OUTCOME_LENGTH + 50),
      reflection: 'r'.repeat(MAX_REFLECTION_LENGTH + 50),
      next_action: 'n'.repeat(MAX_NEXT_ACTION_LENGTH + 50),
    })
  )
  assert.equal(normalized.outcome.length, MAX_OUTCOME_LENGTH)
  assert.equal(normalized.reflection.length, MAX_REFLECTION_LENGTH)
  assert.equal(normalized.next_action.length, MAX_NEXT_ACTION_LENGTH)
})

test('MXL-JOURNAL-PERSISTENCE-001 normalizeEntry отклоняет невалидные timestamp, но не падает', () => {
  const normalized = normalizeEntry(validEntry({ started_at: 'not-a-date', completed_at: '2026-08-27' }))
  assert.equal(normalized.started_at, null)
  assert.equal(normalized.completed_at, null)
})

test('MXL-JOURNAL-PERSISTENCE-001 serializeEntry детерминирован (фиксированный порядок ключей)', () => {
  const entry = validEntry()
  const first = serializeEntry(entry)
  const second = serializeEntry({ ...entry })
  const reordered = serializeEntry({
    sync_status: entry.sync_status,
    entry_id: entry.entry_id,
    schema_version: entry.schema_version,
    entry_type: entry.entry_type,
    user_id: entry.user_id,
    source: entry.source,
    started_at: entry.started_at,
    completed_at: entry.completed_at,
    outcome: entry.outcome,
    reflection: entry.reflection,
    next_action: entry.next_action,
  })
  assert.equal(first, second)
  assert.equal(first, reordered)
})

test('MXL-JOURNAL-PERSISTENCE-001 serialize/deserialize это round-trip без потерь', () => {
  const entry = validEntry()
  const roundTripped = deserializeEntry(serializeEntry(entry))
  assert.deepEqual(roundTripped, normalizeEntry(entry))
})

test('MXL-JOURNAL-PERSISTENCE-001 deserializeEntry не падает на битом JSON', () => {
  assert.equal(deserializeEntry('{not json'), null)
  assert.equal(deserializeEntry(null), null)
  assert.equal(deserializeEntry(42), null)
})

test('MXL-JOURNAL-PERSISTENCE-001 dedupeEntries схлопывает дубли по entry_id, оставляя более свежую запись', () => {
  const id = deriveEntryId({ entryType: 'journal', userId: '101', naturalKey: '2026-08-27' })
  const older = validEntry({ entry_id: id, completed_at: '2026-08-27T09:00:00.000Z', reflection: 'старая' })
  const newer = validEntry({ entry_id: id, completed_at: '2026-08-27T20:00:00.000Z', reflection: 'новая' })

  const deduped = dedupeEntries([older, newer])
  assert.equal(deduped.length, 1)
  assert.equal(deduped[0].reflection, 'новая')
})

test('MXL-JOURNAL-PERSISTENCE-001 dedupeEntries игнорирует malformed элементы, не падает', () => {
  const deduped = dedupeEntries([null, 'garbage', validEntry(), 42])
  assert.equal(deduped.length, 1)
})

test('MXL-JOURNAL-PERSISTENCE-001 dedupeEntries безопасен на не-массиве', () => {
  assert.deepEqual(dedupeEntries(null), [])
  assert.deepEqual(dedupeEntries(undefined), [])
})
