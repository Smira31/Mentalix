import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CHECKLIST_OPTIONS_HINT,
  cleanOptions,
  ensureStepIds,
  newStepId,
  normalizeStepsForSave,
  validateBuilderSteps,
} from '../../src/lib/guidedJournalBuilder.js'

test('GJB-001: newStepId уникален и не зависит от длины массива', () => {
  const ids = []
  for (let i = 0; i < 300; i += 1) ids.push(newStepId(ids))
  assert.equal(new Set(ids).size, 300)
})

test('GJB-002: после удаления шага новый ID не совпадает с существующим', () => {
  const steps = [{ id: 'step-1' }, { id: 'step-2' }, { id: 'step-3' }]
  const afterDelete = steps.filter(step => step.id !== 'step-1') // осталось 2 → "step-3" по длине
  const fresh = newStepId(afterDelete.map(step => step.id))
  assert.ok(!afterDelete.some(step => step.id === fresh))
})

test('GJB-003: ensureStepIds не меняет существующие ID, чинит пустые и дубликаты', () => {
  const result = ensureStepIds([{ id: 'a' }, { id: 'a' }, {}, { id: 'b' }])
  assert.equal(result[0].id, 'a')
  assert.equal(result[3].id, 'b')
  assert.equal(new Set(result.map(step => step.id)).size, 4)
})

test('GJB-004: «Список» без вариантов не проходит валидацию', () => {
  for (const options of [undefined, [], ['', '  ']]) {
    const { ok, errors } = validateBuilderSteps([
      { id: 'a', title: 'Список', type: 'checklist', options },
    ])
    assert.equal(ok, false)
    assert.equal(errors.a, CHECKLIST_OPTIONS_HINT)
  }
})

test('GJB-005: «Список» с вариантом и другие типы проходят валидацию', () => {
  const { ok } = validateBuilderSteps([
    { id: 'a', title: 'Список', type: 'checklist', options: [' да '] },
    { id: 'b', title: 'Текст', type: 'free_text' },
  ])
  assert.equal(ok, true)
  assert.equal(validateBuilderSteps([{ id: 'c', title: ' ', type: 'free_text' }]).ok, false)
})

test('GJB-006: normalizeStepsForSave чистит варианты и убирает options у не-списков', () => {
  assert.deepEqual(cleanOptions([' а ', 'а', '', 'б']), ['а', 'б'])
  const result = normalizeStepsForSave([
    { id: 'a', type: 'checklist', options: [' а ', 'а', ''] },
    { id: 'b', type: 'free_text', options: ['лишнее'] },
  ])
  assert.deepEqual(result[0].options, ['а'])
  assert.equal('options' in result[1], false)
})
