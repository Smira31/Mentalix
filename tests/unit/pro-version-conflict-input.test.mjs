import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002c: при 409 version_conflict правка пункта плана не отбрасывает
 * введённый текст. Поле правки остаётся открытым с тем же текстом,
 * автоповтора нет: пользователь осознанно выбирает «Обновить план»
 * (перечитывание с восстановлением ввода) или «Повторить сохранение»
 * (перечитывание + повторный PATCH актуальной версией).
 */

const planViewSource = await readFile(
  new URL('../../src/screens/pro/ProPlanView.jsx', import.meta.url),
  'utf8'
)

test('409 version_conflict сохраняет введённый текст правки', () => {
  const conflictBranch = planViewSource.match(
    /key === 'version_conflict'[\s\S]{0,300}?\n      \} else/
  )?.[0]
  assert.ok(conflictBranch, 'ветка version_conflict найдена')
  // Текст и критерий уходят в состояние конфликта, поле остаётся открытым.
  assert.match(conflictBranch, /setConflict\(\{ id: item\.id, text, criteria \}\)/)
  assert.doesNotMatch(conflictBranch, /setEditingId\(null\)/)
})

test('конфликт предлагает осознанное обновление/повтор, без автосохранения', () => {
  assert.match(planViewSource, /data-testid="pro-conflict-refresh"/)
  assert.match(planViewSource, /data-testid="pro-conflict-retry"/)
  assert.match(planViewSource, /testId="pro-conflict-card"/)
  // Оба действия проходят через перечитывание плана: ввод ждёт в pendingEditRef.
  assert.match(
    planViewSource,
    /function resolveConflict\(retry\) \{[\s\S]{0,200}pendingEditRef\.current = conflict\.goal/
  )
  assert.match(planViewSource, /pendingEditRef\.current = conflict\.goal[\s\S]{0,200}load\(\)/)
})

test('после перечитывания ввод восстанавливается в поле правки', () => {
  assert.match(
    planViewSource,
    /const pending = pendingEditRef\.current[\s\S]{0,600}setEditingId\(day\.id\)[\s\S]{0,100}setEditText\(pending\.text\)/
  )
  // Повтор сохранения после перечитывания идёт с восстановленным вводом.
  assert.match(planViewSource, /if \(pending\.retry\) saveEdit\(day, pending\.text, pending\.criteria\)/)
})

test('явное начало правки или отмена сбрасывают ожидание восстановления', () => {
  assert.match(planViewSource, /function startEdit\(item\) \{\s*pendingEditRef\.current = null/)
  assert.match(
    planViewSource,
    /function cancelEdit\(item\) \{\s*pendingEditRef\.current = null/
  )
})

test('правка цели при 409 тоже сохраняет ввод и предлагает решение', () => {
  assert.match(planViewSource, /setConflict\(\{ goal: true, text \}\)/)
  assert.match(planViewSource, /if \(pending\.goal\) \{[\s\S]{0,200}setGoalText\(pending\.text\)/)
  assert.match(planViewSource, /if \(pending\.retry\) saveGoal\(pending\.text\)/)
})
