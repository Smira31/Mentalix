import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const rituals = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const ascezas = await readFile(new URL('../../src/screens/Ascezas.jsx', import.meta.url), 'utf8')
const detail = await readFile(new URL('../../src/components/PracticeDetail.jsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../../src/components/PracticeDetail.css', import.meta.url), 'utf8')

function assertListScreen(source, heading, statusExpression) {
  assert.match(source, new RegExp(`<h2[^>]*>${heading}\\.</h2>`))
  assert.match(source, /mx-practice-grid/)
  assert.match(source, /data-testid="practice-tile"/)
  assert.match(source, /data-done=/)
  assert.match(source, new RegExp(statusExpression))
  assert.match(source, /setSelected\(/)
  assert.doesNotMatch(source, /StreakBar|StreakRestoreSheet|restoreTarget|freezes/)
}

test('production lists use the two-column Variant C tile contract', () => {
  assertListScreen(rituals, 'ритуалы', 'ritual\\.today_level')
  assertListScreen(ascezas, 'аскезы', "asceza\\.today_status === 'held'")
  assert.match(css, /\.mx-practice-grid\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)/)
  assert.match(css, /\.mx-practice-tile\.is-done\s*\{[\s\S]*background: rgb\(var\(--c-text\)\)/)
})

test('practice detail exposes toggle, three accordions and the asceza break action', () => {
  assert.match(detail, /data-testid="practice-detail-toggle"/)
  assert.match(detail, /data-testid="practice-accordion-why"/)
  assert.match(detail, /data-testid="practice-accordion-how"/)
  assert.match(detail, /data-testid="practice-accordion-note"/)
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

test('existing create flows retain fullscreen, Telegram actions and 16px fields', () => {
  for (const [source, formName, heading, cta] of [
    [rituals, 'CreateRitualScreen', 'новый ритуал.', 'Создать ритуал'],
    [ascezas, 'CreateAscezaScreen', 'новая аскеза.', 'Принять аскезу'],
  ]) {
    const start = source.indexOf(`function ${formName}`)
    const end = source.indexOf('export default function', start)
    const form = source.slice(start, end)
    assert.match(form, /useFullscreenSurface\(\)/)
    assert.match(form, /<BackButton onClick=\{onCancel\} \/>/)
    assert.match(form, /text-\[16px\]/)
    assert.match(form, /<WebActionBar action=\{webAction\} \/>/)
    assert.match(form, /useMainButton\(/)
    assert.match(form, new RegExp(heading))
    assert.match(form, new RegExp(cta))
  }
})
