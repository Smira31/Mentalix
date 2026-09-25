import test from 'node:test'
import assert from 'node:assert/strict'
import { CLOCK_PRESETS, now, readDemoClock, setDemoClock } from '../../src/lib/clock.js'

const storage = new Map()
globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
}

const real = new Date(2026, 8, 25, 9, 15)

test('четыре пресета задают часы и минуты', () => {
  assert.deepEqual(CLOCK_PRESETS, ['07:00', '12:00', '19:30', '01:00'])
  for (const preset of CLOCK_PRESETS) {
    setDemoClock(preset)
    const shifted = now(real, true)
    assert.equal(`${String(shifted.getHours()).padStart(2, '0')}:${String(shifted.getMinutes()).padStart(2, '0')}`, preset)
    assert.equal(real.getHours(), 9)
  }
})

test('сдвиг дней переживает чтение из хранилища', () => {
  setDemoClock('19:30', 2)
  assert.deepEqual(readDemoClock(), { preset: '19:30', days: 2 })
  assert.equal(now(real, true).getDate(), 27)
  setDemoClock('07:00', -1)
  assert.equal(now(real, true).getDate(), 24)
})

test('в production даже сохранённый сдвиг не применяется', () => {
  setDemoClock('01:00', 3)
  assert.equal(now(real, false), real)
  setDemoClock(null, 0)
  assert.equal(now(real, true).getTime(), real.getTime())
})
