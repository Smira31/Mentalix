import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * PRO-002c: сохранность правок и порядок ответов. Один слот сохранения
 * блокирует повторное сохранение пункта и повторные смены статуса на время
 * запроса; поздние ответы загрузки/сохранения (уход с экрана, смена экрана,
 * перечитывание) не затирают новое состояние и введённый текст.
 */

const planViewSource = await readFile(
  new URL('../../src/screens/pro/ProPlanView.jsx', import.meta.url),
  'utf8'
)
const reportViewSource = await readFile(
  new URL('../../src/screens/pro/ProReportView.jsx', import.meta.url),
  'utf8'
)
const progressViewSource = await readFile(
  new URL('../../src/screens/pro/ProProgressView.jsx', import.meta.url),
  'utf8'
)

test('повторное сохранение пункта и повторный статус заблокированы на время запроса', () => {
  for (const name of ['handleStatus', 'saveEdit', 'saveGoal']) {
    const guard = planViewSource.match(
      new RegExp(`function ${name}\\([\\s\\S]{0,400}?if \\(saving(?: \\|\\| !first)?\\) return`)
    )?.[0]
    assert.ok(guard, `${name}: старт с блокировкой повторного сохранения`)
  }
  // Кнопки дней отключены, пока любое сохранение в полёте.
  assert.match(planViewSource, /const busy = saving !== null/)
  assert.doesNotMatch(planViewSource, /savingStatus=\{false\}/)
  assert.doesNotMatch(planViewSource, /savingStatus=\{false \}/)
})

test('поздние ответы загрузки отбрасываются по номеру запроса и размонтированию', () => {
  for (const [name, source] of [
    ['план', planViewSource],
    ['разбор', reportViewSource],
    ['прогресс', progressViewSource],
  ]) {
    assert.match(source, /const loadSeqRef = useRef\(0\)/, name)
    assert.match(
      source,
      /if \(!aliveRef\.current \|\| seq !== loadSeqRef\.current\) return/,
      name
    )
  }
})

test('результат опроса генерации не применяется после ухода или новой загрузки', () => {
  const planApply = planViewSource.match(/function applyPlan\(data, seq[\s\S]{0,200}\)/)?.[0]
  assert.ok(planApply, 'applyPlan плана принимает seq')
  assert.match(planApply, /seq !== loadSeqRef\.current/)
  const reportApply = reportViewSource.match(
    /function applyResult\(data, seq[\s\S]{0,200}\)/
  )?.[0]
  assert.ok(reportApply, 'applyResult разбора принимает seq')
  assert.match(reportApply, /seq !== loadSeqRef\.current/)
  // Отменённый опрос не применяет ответ.
  assert.match(planViewSource, /isCancelled: \(\) => !aliveRef\.current/)
  assert.match(planViewSource, /if \(pollError instanceof ProPollCancelledError\) return/)
  assert.match(reportViewSource, /if \(pollError instanceof ProPollCancelledError\) return/)
})
