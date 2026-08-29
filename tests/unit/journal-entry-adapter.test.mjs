import assert from 'node:assert/strict'
import test from 'node:test'

import { readJournalEntries } from '../../src/lib/journalEntryAdapter.js'
import { clearJournalStore, saveJournalPhase } from '../../src/lib/journalStorage.js'

function useMemoryLocalStorage() {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
  }
  return memory
}

test('MXL-JOURNAL-PERSISTENCE-001 readJournalEntries проецирует завершённый цикл в unified contract', () => {
  useMemoryLocalStorage()

  saveJournalPhase({ userId: 101, date: '2026-08-27', phase: 'idea', text: 'Идея дня' })
  saveJournalPhase({ userId: 101, date: '2026-08-27', phase: 'analysis', text: 'Заметил спешку по утрам.' })
  saveJournalPhase({
    userId: 101,
    date: '2026-08-27',
    phase: 'newStep',
    text: 'Выйти на 10 минут раньше',
    status: 'final',
  })

  const entries = readJournalEntries(101)
  assert.equal(entries.length, 1)

  const entry = entries[0]
  assert.equal(entry.entry_type, 'journal')
  assert.equal(entry.user_id, '101')
  assert.equal(entry.source, 'journal_flow')
  assert.equal(entry.sync_status, 'local_only')
  assert.equal(entry.schema_version, 1)
  assert.equal(entry.reflection, 'Заметил спешку по утрам.')
  assert.equal(entry.next_action, 'Выйти на 10 минут раньше')
  assert.equal(entry.outcome, null)
  // started_at/completed_at come from journalStorage.js's phase `updatedAt`
  // (real write time), not the `date` store key — see journalEntryAdapter.js's
  // module comment on why this is an approximation, not a true session start.
  assert.match(entry.started_at, /^\d{4}-\d{2}-\d{2}T/)
  assert.match(entry.completed_at, /^\d{4}-\d{2}-\d{2}T/)

  assert.equal(clearJournalStore(101), true)
})

test('MXL-JOURNAL-PERSISTENCE-001 readJournalEntries: completed_at остаётся null пока newStep не final', () => {
  useMemoryLocalStorage()

  saveJournalPhase({ userId: 101, date: '2026-08-27', phase: 'idea', text: 'Идея дня' })
  saveJournalPhase({ userId: 101, date: '2026-08-27', phase: 'newStep', text: 'Черновик следующего шага' })

  const [entry] = readJournalEntries(101)
  assert.equal(entry.completed_at, null)
  assert.ok(entry.started_at)

  assert.equal(clearJournalStore(101), true)
})

test('MXL-JOURNAL-PERSISTENCE-001 readJournalEntries: entry_id стабилен между вызовами (idempotency)', () => {
  useMemoryLocalStorage()

  saveJournalPhase({ userId: 101, date: '2026-08-27', phase: 'idea', text: 'Идея дня' })

  const first = readJournalEntries(101)[0].entry_id
  const second = readJournalEntries(101)[0].entry_id
  assert.equal(first, second)

  assert.equal(clearJournalStore(101), true)
})

test('MXL-JOURNAL-PERSISTENCE-001 readJournalEntries изолирует записи по user_id', () => {
  useMemoryLocalStorage()

  saveJournalPhase({ userId: 101, date: '2026-08-27', phase: 'idea', text: 'Профиль 101' })
  saveJournalPhase({ userId: 202, date: '2026-08-27', phase: 'idea', text: 'Профиль 202' })

  const entriesFor101 = readJournalEntries(101)
  const entriesFor202 = readJournalEntries(202)

  assert.equal(entriesFor101.length, 1)
  assert.equal(entriesFor202.length, 1)
  assert.notEqual(entriesFor101[0].entry_id, entriesFor202[0].entry_id)

  assert.equal(clearJournalStore(101), true)
  assert.equal(clearJournalStore(202), true)
})

test('MXL-JOURNAL-PERSISTENCE-001 readJournalEntries пропускает дни без контента и сортирует по убыванию', () => {
  useMemoryLocalStorage()

  saveJournalPhase({ userId: 101, date: '2026-08-20', phase: 'idea', text: 'Раньше' })
  saveJournalPhase({ userId: 101, date: '2026-08-27', phase: 'idea', text: 'Позже' })
  // A day with no phase text and no free writes must not appear as an entry.
  saveJournalPhase({ userId: 101, date: '2026-08-28', phase: 'idea', text: '' })

  const entries = readJournalEntries(101)
  // The empty '2026-08-28' day must be excluded — only the two days with
  // actual phase text produce entries.
  assert.equal(entries.length, 2)
  // Written second, so its real write timestamp sorts first (descending).
  assert.ok(entries[0].started_at >= entries[1].started_at)

  assert.equal(clearJournalStore(101), true)
})

test('MXL-JOURNAL-PERSISTENCE-001 readJournalEntries на пустом/недоступном хранилище не падает', () => {
  useMemoryLocalStorage()
  assert.deepEqual(readJournalEntries(101), [])
  assert.deepEqual(readJournalEntries(), [])
  assert.deepEqual(readJournalEntries(null), [])
})

test('MXL-JOURNAL-PERSISTENCE-001 readJournalEntries не падает на битом JSON в сторе (legacy/malformed)', () => {
  const memory = useMemoryLocalStorage()
  memory.set('mx-journal-v2:user:101', 'not-json-at-all{{{')

  assert.deepEqual(readJournalEntries(101), [])
})
