import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002c: полный согласованный редактор плана. Правка общей цели недели
 * (goal_text) и критерия выполнения (done_criteria) — не только действия.
 * PATCH идёт с expected_version; после изменения общей цели план
 * перечитывается целиком (цель хранится в каждом дне — версии растут у всех).
 */

const planViewSource = await readFile(
  new URL('../../src/screens/pro/ProPlanView.jsx', import.meta.url),
  'utf8'
)
const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

test('цель недели редактируется: отдельный вход, поле и сохранение', () => {
  assert.match(planViewSource, /data-testid="pro-goal-edit"/)
  assert.match(planViewSource, /data-testid="pro-goal-edit-input"/)
  assert.match(planViewSource, /data-testid="pro-goal-edit-save"/)
  assert.match(planViewSource, /async function saveGoal\(text = goalText\)/)
})

test('PATCH цели отправляет goal_text и expected_version', () => {
  const saveGoal = planViewSource.match(
    /await api\.pro\.patchPlanItem\(first\.id, \{[\s\S]{0,200}\}\)/
  )?.[0]
  assert.ok(saveGoal, 'вызов PATCH цели найден')
  assert.match(saveGoal, /goal_text: text/)
  assert.match(saveGoal, /expected_version: first\.version/)
})

test('после сохранения общей цели план перечитывается целиком', () => {
  const saveGoal = planViewSource.match(
    /async function saveGoal\(text = goalText\) \{[\s\S]{0,1600}?\n  \}/
  )?.[0]
  assert.ok(saveGoal, 'saveGoal найдена')
  assert.match(saveGoal, /load\(\)/)
})

test('критерий выполнения редактируется вместе с действием', () => {
  assert.match(planViewSource, /data-testid="pro-plan-edit-criteria"/)
  const saveEdit = planViewSource.match(
    /api\.pro\.patchPlanItem\(item\.id, \{[\s\S]{0,200}\}\)/
  )?.[0]
  assert.ok(saveEdit, 'вызов PATCH дня найден')
  assert.match(saveEdit, /action: text/)
  assert.match(saveEdit, /done_criteria: criteria/)
  assert.match(saveEdit, /expected_version: item\.version/)
})

test('PATCH-контракт api.js остаётся фактическим: /pro/plan/{id} с expected_version', () => {
  assert.match(apiSource, /patchPlanItem: \(itemId, patch\)/)
  assert.match(apiSource, /request\(`\/pro\/plan\/\$\{itemId\}`, \{\s*method: 'PATCH'/)
})
