import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002c: при 409 version_conflict правка пункта плана не отбрасывает
 * введённый текст: план перечитывается, поле правки возвращается с тем же
 * текстом. Проверяет фактическую связку в ProPlanView.jsx (ввод сохраняется
 * в pendingEditRef до перечитывания и восстанавливается после ответа GET).
 */

const planViewSource = await readFile(
  new URL('../../src/screens/pro/ProPlanView.jsx', import.meta.url),
  'utf8'
)

test('409 version_conflict сохраняет введённый текст правки', () => {
  assert.match(planViewSource, /pendingEditRef = useRef\(null\)/)
  assert.match(
    planViewSource,
    /key === 'version_conflict'[\s\S]{0,200}pendingEditRef\.current = \{ id: item\.id, text: editText \}/
  )
  // Ввод восстанавливается после перечитывания плана и сбрасывается.
  assert.match(
    planViewSource,
    /const pending = pendingEditRef\.current[\s\S]{0,300}setEditingId\(pending\.id\)[\s\S]{0,100}setEditText\(pending\.text\)/
  )
  // Явное начало или отмена правки сбрасывают ожидание восстановления.
  assert.match(planViewSource, /function startEdit\(item\) \{\s*pendingEditRef\.current = null/)
})

test('ввод не отбрасывается: setEditingId(null) при version_conflict отсутствует', () => {
  const conflictBranch = planViewSource.match(
    /key === 'version_conflict'[\s\S]{0,400}?\n      \} else/
  )?.[0]
  assert.ok(conflictBranch, 'ветка version_conflict найдена')
  assert.doesNotMatch(conflictBranch, /setEditingId\(null\)/)
})
