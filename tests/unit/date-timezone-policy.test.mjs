import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEVICE_LOCAL_POLICY,
  SERVER_POLICY,
  UnimplementedDatePolicyError,
  isValidDate,
  resolveCalendarDate,
  toLocalCalendarDate,
  toUtcInstant,
} from '../../src/lib/dateTimezonePolicy.js'

/* Same trick as journalStorage.js's todayKey() / checkinDraft.js's
 * todayCheckinKey() — used here only to prove toLocalCalendarDate agrees
 * with it, not as something this module depends on. */
function legacyOffsetShiftLocalDate(date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function withTz(tz, fn) {
  const original = process.env.TZ
  process.env.TZ = tz
  try {
    return fn()
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
}

test('MXL-date-policy toUtcInstant возвращает ISO-инстант, детерминирован', () => {
  const instant = toUtcInstant('2026-08-27T10:00:00.000Z')
  assert.equal(instant, '2026-08-27T10:00:00.000Z')
  assert.equal(toUtcInstant('2026-08-27T10:00:00.000Z'), instant)
})

test('MXL-date-policy toUtcInstant безопасен на невалидном вводе', () => {
  assert.equal(toUtcInstant('not-a-date'), null)
  assert.equal(toUtcInstant(new Date('garbage')), null)
  assert.equal(toUtcInstant({}), null)
  assert.equal(toUtcInstant(null), null)
})

test('MXL-date-policy toLocalCalendarDate безопасен на невалидном вводе (не NaN-NaN-NaN)', () => {
  assert.equal(toLocalCalendarDate('not-a-date'), null)
  assert.equal(toLocalCalendarDate(new Date('garbage')), null)
  assert.equal(toLocalCalendarDate({}), null)
})

test('MXL-date-policy toLocalCalendarDate без аргумента резолвит "сегодня" по устройству', () => {
  const result = toLocalCalendarDate()
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/)
})

test('MXL-date-policy toLocalCalendarDate детерминирован для одного и того же инстанта', () => {
  const instant = '2026-08-27T10:00:00.000Z'
  assert.equal(toLocalCalendarDate(instant), toLocalCalendarDate(instant))
})

test('MXL-date-policy toLocalCalendarDate совпадает с существующим getTimezoneOffset-приёмом в нескольких зонах', () => {
  const instants = [
    '2026-01-15T12:00:00.000Z',
    '2026-08-27T00:30:00.000Z',
    '2026-08-27T23:59:00.000Z',
    '2026-12-31T23:00:00.000Z',
  ]
  const zones = ['UTC', 'America/New_York', 'Europe/Moscow', 'Pacific/Kiritimati', 'Pacific/Midway']

  for (const zone of zones) {
    withTz(zone, () => {
      for (const iso of instants) {
        const date = new Date(iso)
        assert.equal(
          toLocalCalendarDate(date),
          legacyOffsetShiftLocalDate(date),
          `mismatch for ${iso} in ${zone}`
        )
      }
    })
  }
})

test('MXL-date-policy DST spring-forward (America/New_York, 2026-03-08): граница дня без двойного сдвига', () => {
  withTz('America/New_York', () => {
    // 01:59 EST, still 2026-03-08 locally.
    assert.equal(toLocalCalendarDate('2026-03-08T06:59:00.000Z'), '2026-03-08')
    // Clocks jump to 03:00 EDT one minute later — still the same local day.
    assert.equal(toLocalCalendarDate('2026-03-08T07:00:00.000Z'), '2026-03-08')
    // Local midnight boundary the next day (now EDT, UTC-4).
    assert.equal(toLocalCalendarDate('2026-03-09T03:59:00.000Z'), '2026-03-08')
    assert.equal(toLocalCalendarDate('2026-03-09T04:00:00.000Z'), '2026-03-09')
  })
})

test('MXL-date-policy DST fall-back (America/New_York, 2026-11-01): граница дня без двойного сдвига', () => {
  withTz('America/New_York', () => {
    // Clocks fall back from 02:00 EDT to 01:00 EST — 2026-11-01 local both sides.
    assert.equal(toLocalCalendarDate('2026-11-01T05:30:00.000Z'), '2026-11-01')
    assert.equal(toLocalCalendarDate('2026-11-01T06:30:00.000Z'), '2026-11-01')
    assert.equal(toLocalCalendarDate('2026-11-01T07:30:00.000Z'), '2026-11-01')
  })
})

test('MXL-date-policy resolveCalendarDate: device_local делегирует в toLocalCalendarDate', () => {
  const instant = '2026-08-27T10:00:00.000Z'
  assert.equal(resolveCalendarDate(instant), toLocalCalendarDate(instant))
  assert.equal(resolveCalendarDate(instant, { policy: DEVICE_LOCAL_POLICY }), toLocalCalendarDate(instant))
})

test('MXL-date-policy resolveCalendarDate: server policy — явный placeholder, не выдуманный backend', () => {
  assert.throws(() => resolveCalendarDate('2026-08-27T10:00:00.000Z', { policy: SERVER_POLICY }), UnimplementedDatePolicyError)
  try {
    resolveCalendarDate('2026-08-27T10:00:00.000Z', { policy: SERVER_POLICY })
    assert.fail('expected throw')
  } catch (error) {
    assert.ok(error instanceof UnimplementedDatePolicyError)
    assert.equal(error.policy, SERVER_POLICY)
  }
})

test('MXL-date-policy resolveCalendarDate: неизвестная policy — явная ошибка, не тихий fallback', () => {
  assert.throws(() => resolveCalendarDate('2026-08-27T10:00:00.000Z', { policy: 'made_up' }), /Unknown calendar date policy/)
})

test('MXL-date-policy isValidDate', () => {
  assert.equal(isValidDate(new Date('2026-08-27')), true)
  assert.equal(isValidDate(new Date('garbage')), false)
  assert.equal(isValidDate('2026-08-27'), false)
  assert.equal(isValidDate(null), false)
})
