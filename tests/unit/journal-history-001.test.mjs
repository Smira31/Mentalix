import assert from 'node:assert/strict'
import test from 'node:test'

import { readJournalHistory } from '../../src/lib/journalHistory.js'

/*
 * JOURNAL-001 — «История» безопасно показывает существующие записи журнала.
 *
 * Проверяем ровно то, что перечислено в тикете: прямое чтение (без открытия
 * журнала), повторное чтение без дублей, изоляция профилей A→B, отсутствие
 * userId, общие legacy-ключи, повреждённый JSON, частичные записи и несколько
 * записей за один день. Отдельно — что чтение истории не пишет и не удаляет:
 * ни один вызов не должен доходить до setItem/removeItem, а исходное
 * хранилище обязано остаться побайтово тем же.
 *
 * Даты считаются относительно текущего дня (правило репозитория): хранилище
 * ключуется календарным днём, и подмена «сегодня» не должна ломать проверку.
 */

const SCOPED_KEY = userId => `mx-journal-v2:user:${encodeURIComponent(String(userId))}`
const LEGACY_KEY = 'mx-journal-v2'
const PROTOTYPE_KEY = 'mx-journal-prototype-v1'

function isoDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const TODAY = isoDaysAgo(0)
const TWO_DAYS_AGO = isoDaysAgo(2)
const THREE_DAYS_AGO = isoDaysAgo(3)

function createStorageSpy(seed = {}) {
  const memory = new Map(Object.entries(seed))
  const calls = { getItem: [], setItem: [], removeItem: [] }
  return {
    memory,
    calls,
    storage: {
      getItem: key => {
        calls.getItem.push(key)
        return memory.has(key) ? memory.get(key) : null
      },
      setItem: (key, value) => {
        calls.setItem.push(key)
        memory.set(key, value)
      },
      removeItem: key => {
        calls.removeItem.push(key)
        memory.delete(key)
      },
    },
  }
}

function phase(text, status = 'draft') {
  return { text, status, updatedAt: null }
}

function dayEntry({ phases = {}, freeWrites = [], updatedAt = null } = {}) {
  return {
    version: 2,
    cycle: {
      idea: phase(''),
      action: phase(''),
      analysis: phase(''),
      newStep: phase(''),
      ...phases,
    },
    freeWrites,
    updatedAt,
  }
}

function seedStore(memory, userId, entries) {
  memory.set(SCOPED_KEY(userId), JSON.stringify({ version: 2, entries }))
}

function snapshot(memory) {
  return JSON.stringify([...memory.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

test('JOURNAL-001 читает записи текущего профиля напрямую, сохраняя текст, даты и статусы', () => {
  const { memory, storage } = createStorageSpy()
  globalThis.localStorage = storage

  seedStore(memory, 101, {
    [TWO_DAYS_AGO]: dayEntry({ phases: { idea: phase('Первая мысль') } }),
    [TODAY]: dayEntry({
      phases: { action: phase('Малый шаг'), newStep: phase('Продолжить завтра', 'final') },
      freeWrites: [
        { id: 'fw-1', text: 'Свободная заметка', status: 'final', updatedAt: null, kind: null, quoteKey: null },
      ],
    }),
  })

  const before = snapshot(memory)
  const history = readJournalHistory(101)

  // Новые записи первыми, даты не подменяются.
  assert.deepEqual(history.map(entry => entry.date), [TODAY, TWO_DAYS_AGO])

  const recent = history[0]
  assert.equal(recent.completedCount, 2)
  assert.equal(recent.status, 'draft')
  // Статусы и тексты фаз сохраняются как есть.
  assert.deepEqual(
    recent.phases.map(p => [p.key, p.label, p.status, p.text]),
    [
      ['action', 'Действие', 'draft', 'Малый шаг'],
      ['newStep', 'Новый шаг', 'final', 'Продолжить завтра'],
    ]
  )
  // Свободные записи дня тоже видны и не теряются.
  assert.deepEqual(
    recent.freeWrites.map(fw => [fw.id, fw.status, fw.text]),
    [['fw-1', 'final', 'Свободная заметка']]
  )
  assert.equal(history[1].phases[0].text, 'Первая мысль')

  // Чтение истории ничего не изменило в хранилище.
  assert.equal(snapshot(memory), before)
})

test('JOURNAL-001 повторное чтение истории идемпотентно и не создаёт дублей', () => {
  const { memory, storage } = createStorageSpy()
  globalThis.localStorage = storage

  seedStore(memory, 101, {
    [TODAY]: dayEntry({
      phases: { idea: phase('Мысль') },
      freeWrites: [{ id: 'fw-1', text: 'Заметка', status: 'draft', updatedAt: null, kind: null, quoteKey: null }],
    }),
  })

  const first = readJournalHistory(101)
  const second = readJournalHistory(101)

  assert.deepEqual(second, first)
  assert.equal(second.length, 1)
  assert.equal(second[0].phases.length, 1)
  assert.equal(second[0].freeWrites.length, 1)
})

test('JOURNAL-001 изолирует профили A→B: записи чужого профиля не появляются', () => {
  const { memory, storage } = createStorageSpy()
  globalThis.localStorage = storage

  seedStore(memory, 101, { [TWO_DAYS_AGO]: dayEntry({ phases: { idea: phase('Профиль A') } }) })
  seedStore(memory, 202, { [TODAY]: dayEntry({ phases: { idea: phase('Профиль B') } }) })

  assert.deepEqual(readJournalHistory(101).map(e => e.date), [TWO_DAYS_AGO])
  assert.deepEqual(readJournalHistory(202).map(e => e.date), [TODAY])
  assert.equal(readJournalHistory(202)[0].phases[0].text, 'Профиль B')
  // После смены профиля история A больше не возвращается для B.
  assert.equal(readJournalHistory(202).some(e => e.phases[0]?.text === 'Профиль A'), false)
})

test('JOURNAL-001 без userId не читает общие legacy-ключи и ничего не возвращает', () => {
  const { memory, storage, calls } = createStorageSpy({
    // Даже если общие ключи полны данных, без подтверждённого userId они не наши.
    [LEGACY_KEY]: JSON.stringify({
      version: 2,
      entries: { [TODAY]: dayEntry({ phases: { idea: phase('Общая запись') } }) },
    }),
    [PROTOTYPE_KEY]: JSON.stringify({ date: TODAY, phaseIndex: 1, drafts: { idea: 'Прототип' } }),
  })
  globalThis.localStorage = storage

  const before = snapshot(memory)
  for (const missing of [undefined, null, '', 0, NaN, '   ']) {
    assert.deepEqual(readJournalHistory(missing), [])
  }

  // Общие ключи не читались автоматически…
  assert.equal(calls.getItem.includes(LEGACY_KEY), false)
  assert.equal(calls.getItem.includes(PROTOTYPE_KEY), false)
  // …и чтение истории ничего не записало и не удалило.
  assert.deepEqual(calls.setItem, [])
  assert.deepEqual(calls.removeItem, [])
  assert.equal(snapshot(memory), before)
})

test('JOURNAL-001 не подмешивает общие legacy-данные в историю подтверждённого профиля', () => {
  const { memory, storage } = createStorageSpy({
    [LEGACY_KEY]: JSON.stringify({
      version: 2,
      entries: { [TODAY]: dayEntry({ phases: { idea: phase('Общая legacy-запись') } }) },
    }),
  })
  globalThis.localStorage = storage

  seedStore(memory, 101, { [TWO_DAYS_AGO]: dayEntry({ phases: { idea: phase('Своя запись') } }) })

  const history = readJournalHistory(101)
  assert.deepEqual(history.map(e => e.date), [TWO_DAYS_AGO])
  assert.equal(history.some(e => e.phases.some(p => p.text === 'Общая legacy-запись')), false)
})

test('JOURNAL-001 переживает повреждённый JSON без исключения и без записи', () => {
  const { memory, storage, calls } = createStorageSpy()
  globalThis.localStorage = storage
  memory.set(SCOPED_KEY(101), '{ это не JSON')

  const before = snapshot(memory)
  assert.deepEqual(readJournalHistory(101), [])
  assert.deepEqual(calls.setItem, [])
  assert.deepEqual(calls.removeItem, [])
  assert.equal(snapshot(memory), before)
})

test('JOURNAL-001 корректно показывает частичные записи', () => {
  const { memory, storage } = createStorageSpy()
  globalThis.localStorage = storage
  seedStore(memory, 101, {
    // Только одна фаза из четырёх.
    [TODAY]: dayEntry({ phases: { analysis: phase('Итог дня', 'final') } }),
    // Пустая запись без текста и без свободных записей — не показывается.
    [TWO_DAYS_AGO]: dayEntry(),
  })

  const history = readJournalHistory(101)
  assert.deepEqual(history.map(e => e.date), [TODAY])
  assert.equal(history[0].completedCount, 1)
  assert.equal(history[0].totalPhases, 4)
  assert.equal(history[0].phases[0].label, 'Анализ')
  assert.equal(history[0].phases[0].status, 'final')
})

test('JOURNAL-001 не схлопывает разные записи одного дня по дате', () => {
  const { memory, storage } = createStorageSpy()
  globalThis.localStorage = storage
  seedStore(memory, 101, {
    [TODAY]: dayEntry({
      phases: { idea: phase('Утро'), newStep: phase('Вечер', 'final') },
      freeWrites: [
        { id: 'fw-1', text: 'Первая свободная', status: 'final', updatedAt: null, kind: null, quoteKey: null },
        { id: 'fw-2', text: 'Вторая свободная', status: 'draft', updatedAt: null, kind: null, quoteKey: null },
        { id: 'fw-3', text: '', status: 'draft', updatedAt: null, kind: null, quoteKey: null },
      ],
    }),
  })

  const history = readJournalHistory(101)
  assert.equal(history.length, 1)
  assert.deepEqual(history[0].phases.map(p => p.text), ['Утро', 'Вечер'])
  // Все непустые свободные записи дня остаются отдельными, пустая отбрасывается.
  assert.deepEqual(history[0].freeWrites.map(fw => fw.text), ['Первая свободная', 'Вторая свободная'])
})

test('JOURNAL-001 день только из свободной записи виден, но без фаз', () => {
  const { memory, storage } = createStorageSpy()
  globalThis.localStorage = storage
  seedStore(memory, 101, {
    [THREE_DAYS_AGO]: dayEntry({
      freeWrites: [{ id: 'fw-only', text: 'Только свободная', status: 'draft', updatedAt: null, kind: null, quoteKey: null }],
    }),
  })

  const history = readJournalHistory(101)
  assert.deepEqual(history.map(e => e.date), [THREE_DAYS_AGO])
  assert.equal(history[0].completedCount, 0)
  assert.deepEqual(history[0].phases, [])
  assert.equal(history[0].freeWrites[0].text, 'Только свободная')
})

test('JOURNAL-001 чтение истории не вызывает setItem/removeItem и не меняет хранилище', () => {
  const { memory, storage, calls } = createStorageSpy()
  globalThis.localStorage = storage
  seedStore(memory, 101, {
    [TODAY]: dayEntry({
      phases: { idea: phase('Запись') },
      freeWrites: [{ id: 'fw-1', text: 'Свободная', status: 'final', updatedAt: null, kind: null, quoteKey: null }],
    }),
  })

  const before = snapshot(memory)
  readJournalHistory(101)
  readJournalHistory(101)

  assert.deepEqual(calls.setItem, [])
  assert.deepEqual(calls.removeItem, [])
  assert.equal(snapshot(memory), before)
})
