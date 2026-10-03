import assert from 'node:assert/strict'
import test from 'node:test'
import { mskDayKey, shiftMskDay, mskDaysBetween, themeOpeningLabel } from '../../src/lib/mskDate.js'

const today = mskDayKey(new Date())

test('Тема: будущие вопросы считаются от server_date, не от часов устройства', () => {
  const started = shiftMskDay(today, -2)
  assert.equal(themeOpeningLabel(4, started, today), 'Откроется завтра')
  assert.equal(themeOpeningLabel(7, started, today), 'Откроется через 4 дн.')
  assert.equal(themeOpeningLabel(7, started, shiftMskDay(today, 1)), 'Откроется через 3 дн.')
})

test('Тема: полночь МСК при UTC-времени меняет календарный остаток', () => {
  const before = `${today}T20:59:59Z`
  const after = `${today}T21:00:00Z`
  assert.equal(mskDayKey(before), today)
  assert.equal(mskDayKey(after), shiftMskDay(today, 1))
  assert.equal(themeOpeningLabel(3, today, before), 'Откроется через 2 дн.')
  assert.equal(themeOpeningLabel(3, today, after), 'Откроется завтра')
  assert.equal(mskDaysBetween(before, after), 1)
})

test('Тема: календарная арифметика переносит дату и возвращает отсутствующие данные', () => {
  assert.equal(mskDaysBetween(shiftMskDay(today, -10), shiftMskDay(today, 30)), 40)
  assert.equal(themeOpeningLabel(4, undefined, today), '')
})
