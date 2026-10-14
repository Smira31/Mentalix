import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * MXL-KEYBOARD-001 в разделе Mentalix Pro (PRO-002b/c): все поля ввода
 * плана — это «поле шага записи». Вход в правку («Изменить» по дню или по
 * общей цели) ставит фокус сам, через единственную реализацию правила
 * `src/lib/useAutoFocusField.js`; локальных `autoFocus`/`focus()` в Pro нет.
 *
 * Второе требование того же шага — фактический размер ввода 16px
 * (--mx-read-read: «основной текст и поля ввода»). Поле с меньшим размером
 * заставляет iOS/Telegram WebView масштабировать всю страницу при фокусе.
 */

const planViewSource = await readFile(
  new URL('../../src/screens/pro/ProPlanView.jsx', import.meta.url),
  'utf8'
)

const FIELD_IDS = ['pro-plan-edit-input', 'pro-plan-edit-criteria', 'pro-goal-edit-input']

/** Открывающий тег конкретного поля — от `<textarea` до его data-testid. */
function fieldTag(testId) {
  const marker = `data-testid="${testId}"`
  // Каждый кусок начинается сразу после `<textarea` и кончается перед следующим.
  const chunk = planViewSource
    .split('<textarea')
    .slice(1)
    .find(part => part.includes(marker))

  assert.ok(chunk, `поле ${testId} найдено`)

  return `<textarea${chunk.slice(0, chunk.indexOf(marker) + marker.length)}>`
}

test('поля Pro используют единственную реализацию автофокуса', () => {
  assert.match(
    planViewSource,
    /import \{ useAutoFocusField \} from '\.\.\/\.\.\/lib\/useAutoFocusField'/
  )
  // Локальный атрибут autoFocus или ручной focus() не дублируют правило.
  assert.doesNotMatch(planViewSource, /autoFocus=/)
  assert.doesNotMatch(planViewSource, /\.focus\(/)

  // Ровно два вызова хука: поле действия дня и поле общей цели.
  assert.equal((planViewSource.match(/useAutoFocusField\(/g) || []).length, 2)
})

test('в разделе Pro три поля ввода — все с размером 16px', () => {
  for (const testId of FIELD_IDS) {
    assert.match(fieldTag(testId), /text-\[16px\]/, `поле ${testId} читается в 16px`)
  }
})

test('правка действия дня: фокус по входу в день', () => {
  assert.match(fieldTag('pro-plan-edit-input'), /ref=\{actionRef\}/)
  assert.match(planViewSource, /useAutoFocusField\(actionRef, editing \? day\.id : null\)/)
})

test('правка общей цели недели: фокус по входу в правку', () => {
  assert.match(fieldTag('pro-goal-edit-input'), /ref=\{goalRef\}/)
  assert.match(planViewSource, /useAutoFocusField\(goalRef, editingGoal \? 'pro-goal-edit' : null\)/)
})

test('второе поле шага (критерий) фокус не забирает', () => {
  assert.doesNotMatch(fieldTag('pro-plan-edit-criteria'), /ref=\{/)
})
