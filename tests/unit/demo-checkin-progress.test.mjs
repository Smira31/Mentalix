import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const checkinSource = await readFile(
  new URL('../../src/screens/CheckIn.jsx', import.meta.url),
  'utf8'
)

test('PWA preview uses the three-question morning set in the agreed order', () => {
  assert.match(checkinSource, /export const MORNING_SCALE_STEPS = \[/)
  assert.match(checkinSource, /SCALE_STEPS\[0\],\s*SCALE_STEPS\[1\]/s)
  assert.match(checkinSource, /const noteStep = MORNING_SCALE_STEPS\.length/)
  assert.match(checkinSource, /const doneStep = noteStep \+ 1/)
  assert.match(checkinSource, /<CheckInScaleQuestion\s+scale=\{scale\}/)
  assert.match(checkinSource, /<CheckInQuestion\s+title="Что на уме\?"/)
  assert.match(checkinSource, /<h1>Готово\.<\/h1>/)
  assert.match(checkinSource, /Было полезно\?/)
  assert.match(checkinSource, /Вернуться в Сегодня/)
})

test('PWA and core flows share the same question renderer and do not render scale numbers', () => {
  assert.match(checkinSource, /export function CheckInQuestion\(/)
  assert.match(checkinSource, /export function CheckInScaleQuestion\(/)
  assert.match(checkinSource, /className="mx-checkin-scale__circle"/)
  assert.doesNotMatch(checkinSource, /<span className="mx-checkin-scale__circle">\s*\{level\}/)
})

test('Вечерний Check-In не показывает локальный счётчик или точки прогресса', () => {
  assert.doesNotMatch(checkinSource, /Анализ дня · \$\{step \+ 1\} из \$\{totalSteps\}/)
  assert.doesNotMatch(checkinSource, /mx-checkin-demo__progress-label/)
})
