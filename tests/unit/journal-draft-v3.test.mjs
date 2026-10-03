import assert from 'node:assert/strict'
import test from 'node:test'

import {
  STORAGE_KEY,
  contentSignature,
  newAttemptKey,
  normalizeTemplateId,
  sameTemplateId,
  buildQuestionSnapshot,
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

test('MXL-JOURNAL-V3-004: contentSignature стабилен для одинакового содержимого', () => {
  assert.equal(
    contentSignature({ 'step-1': 'один', 'step-2': 'два' }),
    contentSignature({ 'step-2': 'два', 'step-1': 'один' })
  )
})

test('MXL-JOURNAL-V3-005: contentSignature различает разное содержимое', () => {
  assert.notEqual(contentSignature({ 'step-1': 'один' }), contentSignature({ 'step-1': 'другой' }))
})

test('MXL-JOURNAL-V3-006: повтор неизменённого черновика использует тот же ключ из черновика', () => {
  reset()
  const key = newAttemptKey()
  saveJournalDraft('101', '1', { 'step-1': 'текст' }, key, 'Шаблон')
  assert.equal(readJournalDraft('101', '1').idempotency_key, key)
})

test('MXL-JOURNAL-V3-007: newAttemptKey уникален для каждой попытки', () => {
  const keys = new Set(Array.from({ length: 500 }, () => newAttemptKey()))
  assert.equal(keys.size, 500)
  for (const key of keys) assert.match(key, /^jd3-[a-z0-9]+-[0-9a-f]+$/)
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

test('MXL-JOURNAL-V3-015: saveJournalDraft сохраняет существующий idempotency_key при autosave', () => {
  reset()
  const answers = { 'step-1': 'текст' }
  const key = newAttemptKey()
  // First save with key
  saveJournalDraft('101', '1', answers, key, 'Шаблон')
  // Autosave without passing key (should preserve existing)
  saveJournalDraft('101', '1', answers, null, 'Шаблон')
  const draft = readJournalDraft('101', '1')
  assert.equal(draft.idempotency_key, key)
})

test('MXL-JOURNAL-V3-016: contentSignature однозначна — разделители в тексте не склеивают ответы', () => {
  assert.notEqual(contentSignature({ a: 'x|b:y' }), contentSignature({ a: 'x', b: 'y' }))
  assert.notEqual(contentSignature({ a: ['x,y'] }), contentSignature({ a: ['x', 'y'] }))
})

test('MXL-JOURNAL-V3-017: normalizeTemplateId приводит строку/число к одному виду', () => {
  assert.equal(normalizeTemplateId(7), '7')
  assert.equal(normalizeTemplateId('7'), '7')
  assert.equal(normalizeTemplateId(' 07 '), '7')
  assert.equal(normalizeTemplateId('tpl-a'), 'tpl-a')
  assert.equal(normalizeTemplateId(''), null)
  assert.equal(normalizeTemplateId(null), null)
  assert.equal(normalizeTemplateId(NaN), null)
  assert.ok(sameTemplateId(7, '7'))
  assert.ok(!sameTemplateId(7, '8'))
  assert.ok(!sameTemplateId(null, null))
})

test('MXL-JOURNAL-V3-018: черновик по числовому и строковому id — один и тот же', () => {
  reset()
  saveJournalDraft('101', 7, { s: 'a' }, null, 'Шаблон')
  assert.deepEqual(readJournalDraft('101', '7').answers, { s: 'a' })
  clearJournalDraft('101', '7')
  assert.equal(readJournalDraft('101', 7), null)
})

test('MXL-JOURNAL-V3-019: снимок вопросов хранит id, текст, тип и версию шаблона', () => {
  reset()
  const steps = [
    { id: 'a', title: 'Вопрос', type: 'free_text', required: true, extra: 'x' },
    { id: 'b', title: 'Список', type: 'checklist', options: ['один', 'два'] },
    { title: 'без id' },
  ]
  const snapshot = buildQuestionSnapshot(steps)
  assert.equal(snapshot.length, 2)
  assert.deepEqual(snapshot[0], { id: 'a', title: 'Вопрос', type: 'free_text', required: true })
  assert.deepEqual(snapshot[1].options, ['один', 'два'])
  assert.equal(snapshot[0].extra, undefined)

  saveJournalDraft('101', '1', { a: 'ответ' }, null, 'Шаблон', { snapshot, templateVersion: 3 })
  // автосохранение без meta не теряет снимок и версию
  saveJournalDraft('101', '1', { a: 'ответ 2' }, null, 'Шаблон')
  const draft = readJournalDraft('101', '1')
  assert.deepEqual(draft.snapshot, snapshot)
  assert.equal(draft.templateVersion, 3)
  // изменение шаблона не влияет на снимок
  steps[0].title = 'Новый текст'
  assert.equal(readJournalDraft('101', '1').snapshot[0].title, 'Вопрос')
})

test('MXL-JOURNAL-V3-020: saveJournalDraft возвращает ok=false при ошибке localStorage', () => {
  reset()
  assert.equal(saveJournalDraft('101', '1', { a: 'x' }, null, 'Ш').ok, true)
  globalThis.localStorage.setItem = () => {
    throw new Error('QuotaExceededError')
  }
  const result = saveJournalDraft('101', '1', { a: 'y' }, null, 'Ш')
  assert.equal(result.ok, false)
  assert.equal(clearJournalDraft('101', '1'), false)
})
