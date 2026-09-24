import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ritualsSource = await readFile(new URL('../../src/screens/Rituals.jsx', import.meta.url), 'utf8')
const detailSource = await readFile(new URL('../../src/components/PracticeDetail.jsx', import.meta.url), 'utf8')
const cssSource = await readFile(new URL('../../src/components/PracticeDetail.css', import.meta.url), 'utf8')

function formSlice(source, name) {
  const start = source.indexOf(`function ${name}`)
  const end = source.indexOf('export default function', start)
  assert.notEqual(start, -1)
  return source.slice(start, end)
}

test('Rituals uses a two-column list without streak counters or restore controls', () => {
  assert.match(ritualsSource, /mx-practice-grid/)
  assert.match(ritualsSource, /data-testid="practice-tile"/)
  assert.match(ritualsSource, /data-done=\{Boolean\(ritual\.today_level\)\}/)
  assert.match(ritualsSource, /setSelected\(ritual\)/)
  assert.doesNotMatch(ritualsSource, /StreakBar|StreakRestoreSheet|restoreTarget|freezes/)
  assert.match(cssSource, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)/)
})

test('Ritual detail has the large toggle, accordions, delete flow and success haptic', () => {
  assert.match(detailSource, /data-testid="practice-detail-toggle"/)
  assert.match(detailSource, /data-testid="practice-accordion-why"/)
  assert.match(detailSource, /data-testid="practice-accordion-how"/)
  assert.match(detailSource, /data-testid="practice-accordion-note"/)
  assert.match(detailSource, /platform\.haptic\('success'\)/)
  assert.match(detailSource, /<DeleteConfirmationDialog/)
  assert.match(cssSource, /prefers-reduced-motion: reduce/)
})

test('Rituals logging uses the maximal level and invalidates Today cache', () => {
  assert.match(detailSource, /practice\.optimal_version\s*\?\s*'optimal'/)
  assert.match(ritualsSource, /api\.rituals\.log\(ritualId, user\.id, level\)/)
  assert.match(ritualsSource, /invalidateTodayData\(user\.id\)/)
  assert.match(ritualsSource, /invalidatePracticesData\(user\.id\)/)
})

test('Rituals create form retains fullscreen, native BackButton and 16px inputs', () => {
  const form = formSlice(ritualsSource, 'CreateRitualScreen')
  assert.match(form, /useFullscreenSurface\(\)/)
  assert.match(form, /<BackButton onClick=\{onCancel\} \/>/)
  assert.match(form, /text-\[16px\]/)
  assert.match(form, /<WebActionBar action=\{webAction\} \/>/)
  assert.match(form, /useMainButton\(/)
})
