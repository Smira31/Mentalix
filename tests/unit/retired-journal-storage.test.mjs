import assert from 'node:assert/strict'
import test from 'node:test'
import * as storage from '../../src/lib/journalStorage.js'

test('Удалённый цикл не имеет API записи или миграции', () => {
  for (const name of [
    'saveJournalPhase',
    'readJournalEntry',
    'migrateLegacyJournalToUser',
    'hasLegacyJournalData',
    'PHASE_KEYS',
  ]) {
    assert.equal(name in storage, false, name)
  }
})

test('Чтение старых мыслей и их удаление сохраняют остальные данные без миграции', () => {
  const date = storage.todayKey()
  const key = 'mx-journal-v2:user:101'
  const cycle = { idea: { text: 'Сохранённые данные', status: 'draft' } }
  const memory = new Map([
    [
      key,
      JSON.stringify({
        version: 2,
        entries: {
          [date]: {
            cycle,
            unknown: 'keep',
            freeWrites: [
              { id: 'one', text: 'Мысль', kind: 'мысль' },
              { id: 'two', text: 'Другая' },
            ],
          },
        },
      }),
    ],
  ])
  const before = memory.get(key)
  globalThis.localStorage = {
    getItem: k => memory.get(k) ?? null,
    setItem: (k, v) => memory.set(k, v),
  }
  assert.equal(storage.readJournalStore(101).entries[date].freeWrites.length, 2)
  assert.equal(memory.get(key), before)
  assert.deepEqual(storage.readJournalStore(202).entries, {})
  assert.deepEqual(storage.readJournalStore().entries, {})
  storage.deleteJournalFreeWrite({ userId: 101, date, id: 'one' })
  const entry = JSON.parse(memory.get(key)).entries[date]
  assert.deepEqual(entry.cycle, cycle)
  assert.equal(entry.unknown, 'keep')
  assert.equal(entry.freeWrites[0].id, 'two')
})
