import assert from 'node:assert/strict'
import test from 'node:test'

import { mskDayKey, msUntilNextMskMidnight } from '../../src/lib/mskDate.js'

test('MXL-DIALOG-DATE-MSK граница суток считается по Москве, а не по UTC', () => {
  // 2026-10-02T22:30:00Z — в Москве уже 2026-10-03 01:30.
  assert.equal(mskDayKey('2026-10-02T22:30:00Z'), '2026-10-03')
  assert.equal(mskDayKey('2026-10-02T20:59:00Z'), '2026-10-02')
})

test('MXL-DIALOG-DATE-MSK остаток до полуночи МСК считается по UTC+3', () => {
  // 2026-10-02T20:00:00Z == 23:00 МСК → до полуночи ровно час.
  assert.equal(msUntilNextMskMidnight(new Date('2026-10-02T20:00:00Z')), 60 * 60 * 1000)

  // 2026-10-02T21:00:00Z == 00:00 МСК → следующий рубеж через полные сутки.
  assert.equal(msUntilNextMskMidnight(new Date('2026-10-02T21:00:00Z')), 24 * 60 * 60 * 1000)
})
