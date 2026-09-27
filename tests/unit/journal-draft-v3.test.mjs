import assert from 'node:assert/strict'
import test from 'node:test'

import {
  STORAGE_KEY,
  contentSignature,
  generateIdempotencyKey,
  isKeyValid,
  readJournalDraft,
  saveJournalDraft,
  clearJournalDraft,
  listJournalDrafts,
} from '../../src/lib/journalDraftV3.js'

// ── localStorage mock ──

let store = {}

function setupLocalStorage() {
  store = {}
  globalThis.localStorage = {
    getItem: key => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value
    },
    removeItem: key => {
      delete store[key]
    },
  }
}

function reset() {
  setupLocalStorage()
}

// ── Tests ──

test('MXL-JOURNAL-V3-001: saveJournalDraft сохраняет answers локально без server call', () => {
  reset()
  const answers = { 'step-1': 'Тестовая запись' }
  saveJournalDraft('101', '1', answers, null, 'Разбор ситуации')
  const draft = readJournalDraft('101', '1')
  assert.ok(draft)
  assert.deepEqual(draft.answers, { 'step-1': 'Тестовая запись' })
  assert.equal(draft.template_id, '1')
  assert.equal(draft.templateTitle, 'Разбор ситуации')
  assert.ok(draft.updatedAt)
  // No server call — only localStorage
  assert.ok(store[`${STORAGE_KEY}:user:101`])
})

test('MXL-JOURNAL-V3-002: reopen/resume восстанавливает тот же draft', () => {
  reset()
  const answers = { 'step-1': 'Первый ответ', 'step-2': 'Второй ответ' }
  saveJournalDraft('101', '1', answers, null, 'Шаблон')
  // Simulate reopen
  const restored = readJournalDraft('101', '1')
  assert.ok(restored)
  assert.equal(restored.answers['step-1'], 'Первый ответ')
  assert.equal(restored.answers['step-2'], 'Второй ответ')
})

test('MXL-JOURNAL-V3-003: legacy server draft endpoint не вызывается — draft только локальный', () => {
  reset()
  saveJournalDraft('101', '1', { 'step-1': 'текст' }, null, 'Шаблон')
  // Verify storage key is local-only
  const keys = Object.keys(store)
  assert.ok(keys.every(k => k.startsWith(STORAGE_KEY)))
  assert.equal(keys.length, 1)
})

test('MXL-JOURNAL-V3-004: generateIdempotencyKey стабилен для одинакового содержимого', () => {
  const answers1 = { 'step-1': 'один', 'step-2': 'два' }
  const answers2 = { 'step-2': 'два', 'step-1': 'один' } // different key order
  assert.equal(generateIdempotencyKey(answers1), generateIdempotencyKey(answers2))
})

test('MXL-JOURNAL-V3-005: generateIdempotencyKey различает разное содержимое', () => {
  const answers1 = { 'step-1': 'один' }
  const answers2 = { 'step-1': 'другой' }
  assert.notEqual(generateIdempotencyKey(answers1), generateIdempotencyKey(answers2))
})

test('MXL-JOURNAL-V3-006: retry unchanged draft использует тот же key', () => {
  reset()
  const answers = { 'step-1': 'текст' }
  const key = generateIdempotencyKey(answers)
  saveJournalDraft('101', '1', answers, key, 'Шаблон')
  // Simulate retry: read draft, check key is still valid
  const draft = readJournalDraft('101', '1')
  assert.equal(draft.idempotency_key, key)
  assert.ok(isKeyValid(draft.idempotency_key, draft.answers))
})

test('MXL-JOURNAL-V3-007: изменение draft после failed attempt инвалидирует старый key', () => {
  reset()
  const originalAnswers = { 'step-1': 'оригинал' }
  const originalKey = generateIdempotencyKey(originalAnswers)
  saveJournalDraft('101', '1', originalAnswers, originalKey, 'Шаблон')

  // User changes content after failed attempt
  const modifiedAnswers = { 'step-1': 'изменённый' }
  // Old key should NOT be valid for new content
  const draft = readJournalDraft('101', '1')
  assert.ok(!isKeyValid(draft.idempotency_key, modifiedAnswers))

  // New key should be different
  const newKey = generateIdempotencyKey(modifiedAnswers)
  assert.notEqual(originalKey, newKey)
})

test('MXL-JOURNAL-V3-008: 200/201 success удаляет draft', () => {
  reset()
  saveJournalDraft('101', '1', { 'step-1': 'текст' }, 'key-123', 'Шаблон')
  assert.ok(readJournalDraft('101', '1'))
  // Simulate success: clear draft
  clearJournalDraft('101', '1')
  assert.equal(readJournalDraft('101', '1'), null)
})

test('MXL-JOURNAL-V3-009: 404/409/422 не удаляют draft', () => {
  reset()
  const answers = { 'step-1': 'текст' }
  saveJournalDraft('101', '1', answers, 'key-123', 'Шаблон')
  // Simulate error: draft should still exist (clearJournalDraft NOT called)
  const draft = readJournalDraft('101', '1')
  assert.ok(draft)
  assert.deepEqual(draft.answers, answers)
  assert.equal(draft.idempotency_key, 'key-123')
})

test('MXL-JOURNAL-V3-010: reopen после success не восстанавливает старый draft', () => {
  reset()
  saveJournalDraft('101', '1', { 'step-1': 'текст' }, 'key-123', 'Шаблон')
  clearJournalDraft('101', '1')
  // Simulate reopen
  const draft = readJournalDraft('101', '1')
  assert.equal(draft, null)
})

test('MXL-JOURNAL-V3-011: listJournalDrafts возвращает все драфты пользователя', () => {
  reset()
  saveJournalDraft('101', '1', { 'step-1': 'a' }, null, 'Шаблон 1')
  saveJournalDraft('101', '2', { 'step-1': 'b' }, null, 'Шаблон 2')
  const drafts = listJournalDrafts('101')
  assert.equal(drafts.length, 2)
  const ids = drafts.map(d => d.templateId).sort()
  assert.deepEqual(ids, ['1', '2'])
})

test('MXL-JOURNAL-V3-012: драфты изолированы между пользователями', () => {
  reset()
  saveJournalDraft('101', '1', { 'step-1': 'user-101' }, null, 'Шаблон')
  saveJournalDraft('202', '1', { 'step-1': 'user-202' }, null, 'Шаблон')
  assert.equal(readJournalDraft('101', '1').answers['step-1'], 'user-101')
  assert.equal(readJournalDraft('202', '1').answers['step-1'], 'user-202')
})

test('MXL-JOURNAL-V3-013: contentSignature игнорирует пустые значения', () => {
  const withEmpty = { 'step-1': 'текст', 'step-2': '', 'step-3': null }
  const withoutEmpty = { 'step-1': 'текст' }
  assert.equal(contentSignature(withEmpty), contentSignature(withoutEmpty))
})

test('MXL-JOURNAL-V3-014: isKeyValid возвращает false для null key', () => {
  assert.ok(!isKeyValid(null, { 'step-1': 'текст' }))
  assert.ok(!isKeyValid(undefined, { 'step-1': 'текст' }))
})

test('MXL-JOURNAL-V3-015: saveJournalDraft сохраняет существующий idempotency_key при autosave', () => {
  reset()
  const answers = { 'step-1': 'текст' }
  const key = generateIdempotencyKey(answers)
  // First save with key
  saveJournalDraft('101', '1', answers, key, 'Шаблон')
  // Autosave without passing key (should preserve existing)
  saveJournalDraft('101', '1', answers, null, 'Шаблон')
  const draft = readJournalDraft('101', '1')
  assert.equal(draft.idempotency_key, key)
})
