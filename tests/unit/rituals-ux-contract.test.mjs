import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ritualsSource = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const flowSource = await readFile(new URL('../../src/components/practices/PracticeListFlow.jsx', import.meta.url), 'utf8')
const wordingSource = await readFile(new URL('../../src/lib/practiceWording.js', import.meta.url), 'utf8')
const detailSource = await readFile(new URL('../../src/components/PracticeDetail.jsx', import.meta.url), 'utf8')
const flowCss = await readFile(new URL('../../src/components/practices/PracticeListFlow.css', import.meta.url), 'utf8')
const detailCss = await readFile(new URL('../../src/components/PracticeDetail.css', import.meta.url), 'utf8')
const fieldFlowSource = await readFile(
  new URL('../../src/components/practices/PracticeFieldFlow.jsx', import.meta.url),
  'utf8'
)

test('Rituals list uses the unified two-column flow without streak counters', () => {
  assert.match(flowSource, /mx-practice-flow-grid/)
  assert.match(flowSource, /data-testid="practice-tile"/)
  // «Отмечено сегодня» — по фактическому уровню выполнения (min/optimal).
  assert.match(flowSource, /data-done=\{done\}/)
  assert.match(flowSource, /onOpenDetail\(item\)/)
  assert.doesNotMatch(flowSource, /StreakBar|freezes/)
  assert.match(flowCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)/)
})

test('экран практики держит восстановление дня и необязательные строки «+ …»', () => {
  // Восстановление дня: тихая ссылка под карточкой недели, лист — в каркасе.
  assert.match(detailSource, /data-testid="practice-restore-yesterday"/)
  assert.match(detailSource, /canRestoreYesterday/)
  assert.match(flowSource, /StreakRestoreSheet/)
  // Необязательные поля — строки «+ …» в карточке «Зачем», экран-поле на один шаг.
  assert.match(wordingSource, /RITUAL_OPTIONAL_FIELDS/)
  assert.match(wordingSource, /ASCEZA_OPTIONAL_FIELDS/)
  assert.match(wordingSource, /key: 'optimal_version'/)
  assert.match(wordingSource, /key: 'trigger'/)
  assert.match(wordingSource, /key: 'replacement'/)
  assert.match(detailSource, /data-testid=\{`practice-detail-field-\$\{field.key\}`\}/)
  assert.match(detailSource, /steps=\{\[sub\.field\.step\]\}/)
  // Цена срыва в интерфейс не возвращается.
  assert.doesNotMatch(detailSource, /relapse_cost/)
})

test('Ritual detail has the large toggle, accordions, delete flow and success haptic', () => {
  assert.match(detailSource, /data-testid="practice-detail-toggle"/)
  assert.match(detailSource, /testId="practice-accordion-why"/)
  assert.match(detailSource, /testId="practice-accordion-how"/)
  assert.match(detailSource, /testId="practice-accordion-note"/)
  assert.match(detailSource, /platform\.haptic\('success'\)/)
  assert.match(detailSource, /<DeleteConfirmationDialog/)
  assert.match(detailCss, /prefers-reduced-motion: reduce/)
})

test('Rituals logging uses the maximal level and invalidates Today cache', () => {
  assert.match(detailSource, /practice\.optimal_version\s*\?\s*'optimal'/)
  assert.match(ritualsSource, /api\.rituals\.log\(ritualId, user\.id, level, restoreDaysAgo\)/)
  assert.match(ritualsSource, /invalidateTodayData\(user\.id\)/)
  assert.match(ritualsSource, /invalidatePracticesData\(user\.id\)/)
})

test('Rituals own-create flow is a 2-step magazine with fullscreen and native BackButton', () => {
  const start = flowSource.indexOf('function OwnScreen')
  const end = flowSource.indexOf('export default function', start)
  assert.notEqual(start, -1)
  const ownSlice = flowSource.slice(start, end)
  assert.match(ownSlice, /ownSteps/)
  assert.match(ownSlice, /buildOwnDraft/)
  assert.match(fieldFlowSource, /useFullscreenSurface\(\)/)
  assert.match(fieldFlowSource, /useBackButton\(/)
  assert.match(wordingSource, /как назовёшь ритуал/)
  assert.match(wordingSource, /какой минимум даже в плохой день/)
})
