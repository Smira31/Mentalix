import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const historySource = await readFile(
  new URL('../../src/screens/History.jsx', import.meta.url),
  'utf8'
)

test('History не ссылается на несуществующий OneOffPracticeDayCard', () => {
  assert.doesNotMatch(
    historySource,
    /OneOffPracticeDayCard/,
    'OneOffPracticeDayCard не должен использоваться — компонента не существует'
  )
})

test('History рендерит oneOffPractices обычными строками через OneOffPracticeEntry', () => {
  assert.match(
    historySource,
    /function OneOffPracticeEntry/,
    'должна быть функция-компонент OneOffPracticeEntry'
  )
  assert.match(
    historySource,
    /data-testid="history-oneoff-entry"/,
    'OneOffPracticeEntry должен иметь data-testid="history-oneoff-entry"'
  )
})

test('HistoryDetail показывает oneOffPractices как список строк', () => {
  const detailStart = historySource.indexOf('export function HistoryDetail')
  assert.ok(detailStart >= 0, 'HistoryDetail не найден')
  const detailEnd = historySource.indexOf('export default function History')
  const detailBlock = historySource.slice(detailStart, detailEnd)

  assert.match(
    detailBlock,
    /day\.oneOffPractices\?\.length > 0/,
    'HistoryDetail должен проверять day.oneOffPractices?.length > 0'
  )
  assert.match(
    detailBlock,
    /OneOffPracticeEntry/,
    'HistoryDetail должен рендерить OneOffPracticeEntry для каждой записи'
  )
})

test('лента дней (list view) показывает oneOffPractices', () => {
  // list view использует d.oneOffPractices (detail view — day.oneOffPractices),
  // поэтому достаточно проверить наличие d.oneOffPractices в файле
  assert.match(
    historySource,
    /d\.oneOffPractices\?\.length > 0/,
    'list view должен проверять d.oneOffPractices?.length > 0'
  )
})

test('OneOffPracticeEntry показывает название практики и время', () => {
  const componentStart = historySource.indexOf('function OneOffPracticeEntry')
  assert.ok(componentStart >= 0, 'OneOffPracticeEntry не найден')
  const componentEnd = historySource.indexOf('\n}', componentStart) + 2
  const componentBlock = historySource.slice(componentStart, componentEnd)

  assert.match(
    componentBlock,
    /entry\.name \|\| entry\.title/,
    'должен использовать entry.name или entry.title для названия'
  )
  assert.match(
    componentBlock,
    /moodPracticeTime/,
    'должен использовать moodPracticeTime для форматирования времени'
  )
})
