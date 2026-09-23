import assert from 'node:assert/strict'
import test from 'node:test'
import { energyFillPercent } from '../../src/lib/checkinScale.js'
import { resolveCheckInMode } from '../../src/lib/todayCheckinMode.js'

test('вечерняя карточка открывает вечерний поток в 08:00 независимо от времени суток', () => {
  assert.equal(resolveCheckInMode({ sub: 'evening', initialSub: null, hourNow: 8 }), 'evening')
  assert.equal(resolveCheckInMode({ sub: 'evening', initialSub: null, hourNow: 21 }), 'evening')
})

test('initialSub evening сохраняет вечерний deep-link', () => {
  assert.equal(resolveCheckInMode({ sub: 'evening', initialSub: 'evening', hourNow: 8 }), 'evening')
})

test('шкала энергии заполняется уровнями 1–5 как 0/25/50/75/100%', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(energyFillPercent), [0, 25, 50, 75, 100])
})
