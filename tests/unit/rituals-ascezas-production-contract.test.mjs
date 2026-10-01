import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const rituals = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const ascezas = await readFile(new URL('../../src/screens/Ascezas.jsx', import.meta.url), 'utf8')
const flow = await readFile(new URL('../../src/components/practices/PracticeListFlow.jsx', import.meta.url), 'utf8')
const wording = await readFile(new URL('../../src/lib/practiceWording.js', import.meta.url), 'utf8')
const detail = await readFile(new URL('../../src/components/PracticeDetail.jsx', import.meta.url), 'utf8')
const flowCss = await readFile(new URL('../../src/components/practices/PracticeListFlow.css', import.meta.url), 'utf8')
const fieldFlow = await readFile(
  new URL('../../src/components/practices/PracticeFieldFlow.jsx', import.meta.url),
  'utf8'
)
const milestone = await readFile(
  new URL('../../src/components/practices/PracticeMilestone.jsx', import.meta.url),
  'utf8'
)
const signScreen = await readFile(
  new URL('../../src/components/practices/PracticeSignScreen.jsx', import.meta.url),
  'utf8'
)

test('production lists use the unified two-column flow tile contract', () => {
  assert.match(rituals, /kind="ritual"/)
  assert.match(ascezas, /kind="asceza"/)
  assert.match(flow, /mx-practice-flow-grid/)
  assert.match(flow, /data-testid="practice-tile"/)
  assert.match(flow, /data-done=/)
  assert.match(flow, /onOpenDetail\(/)
  assert.doesNotMatch(flow, /StreakBar|StreakRestoreSheet|restoreTarget|freezes/)
  assert.match(flowCss, /\.mx-practice-flow-grid\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)/)
  assert.match(flowCss, /\.mx-practice-flow-tile\.is-done\s*\{[\s\S]*#ece8e1/)
  assert.match(wording, /серия/)
  assert.match(wording, /держишься/)
})

test('practice detail exposes toggle, three accordions and the asceza break action', () => {
  assert.match(detail, /data-testid="practice-detail-toggle"/)
  assert.match(detail, /testId="practice-accordion-why"/)
  assert.match(detail, /testId="practice-accordion-how"/)
  assert.match(detail, /testId="practice-accordion-note"/)
  assert.match(detail, /onLog/)
  assert.match(detail, /Сорвался сегодня/)
  assert.match(detail, /<DeleteConfirmationDialog/)
})

test('practice logging keeps user scope and invalidates Today and practices caches', () => {
  assert.match(rituals, /api\.rituals\.log\(ritualId, user\.id, level\)/)
  assert.match(ascezas, /api\.ascezas\.log\(ascezaId, user\.id, status, breakTrigger, breakNote\)/)
  for (const source of [rituals, ascezas]) {
    assert.match(source, /invalidateTodayData\(user\.id\)/)
    assert.match(source, /invalidatePracticesData\(user\.id\)/)
    assert.match(source, /isLinkedWebWriteBlocked\(user, error\)/)
  }
})

test('delete remains a named confirmation flow', () => {
  assert.match(detail, /itemName=\{practice\.name\}/)
  assert.match(detail, /onDelete\(practice\.id\)/)
})

test('unified own-create flow is a 2-step magazine with fullscreen and native BackButton', () => {
  const start = flow.indexOf('function OwnScreen')
  const end = flow.indexOf('export default function', start)
  const ownSlice = flow.slice(start, end)
  assert.match(ownSlice, /ownSteps/)
  assert.match(ownSlice, /buildOwnDraft/)
  // Экран-поле общий для «Свой» и «Изменить»: полноэкранная поверхность
  // и нативный «Назад» живут в нём.
  assert.match(fieldFlow, /useFullscreenSurface\(\)/)
  assert.match(fieldFlow, /useBackButton\(/)
  assert.match(wording, /от чего отказываешься/)
  assert.match(wording, /где твоя граница даже в плохой день/)
  assert.match(wording, /Держусь сегодня/)
  assert.match(wording, /Отметить сегодня/)
})

test('practice menu offers edit, sign and delete', () => {
  assert.match(detail, /testId="practice-detail-edit"/)
  assert.match(detail, /testId="practice-detail-sign"/)
  assert.match(detail, /testId="practice-detail-delete"/)
  // «Изменить» — тот же экран-поле, что и «Свой»; «Знак» — сетка 4×3.
  assert.match(detail, /<PracticeFieldFlow/)
  assert.match(detail, /buildEditPatch/)
  assert.match(detail, /<PracticeSignScreen/)
  assert.match(signScreen, /PRACTICE_GLYPHS/)
  assert.match(signScreen, /SemanticGlyph/)
  assert.match(wording, /buildEditPatch/)
})

test('streak milestone is a fullscreen screen with a week of circles and Готово', () => {
  assert.match(milestone, /useFullscreenSurface\(\)/)
  assert.match(milestone, /getFullscreenPortalTarget\(\)/)
  assert.match(milestone, /data-testid="practice-milestone-done"/)
  assert.match(milestone, /Готово/)
  assert.match(milestone, /mx-practice-milestone-screen__week/)
  assert.match(wording, /MILESTONE_PHRASES/)
  assert.match(wording, /Три дня подряд — ты уже не новичок\./)
  assert.match(wording, /Месяц\. Ты доказал себе, что можешь\./)
  assert.match(wording, /milestoneDayLabel/)
})
