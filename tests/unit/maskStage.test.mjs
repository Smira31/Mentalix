import assert from 'node:assert/strict'
import test from 'node:test'
import { MASK_STAGES } from '../../src/config/maskStages.js'
import { getMaskStage } from '../../src/lib/maskStage.js'

const cases = [
  [0, 0, 7],
  [6, 0, 1],
  [7, 1, 23],
  [29, 1, 1],
  [30, 2, 70],
  [99, 2, 1],
  [100, 3, null],
]

for (const [days, index, remaining] of cases) {
  test(`маска: ${days} дней → ${MASK_STAGES[index].name}`, () => {
    const { stage, next, daysUntilNext } = getMaskStage(days)
    assert.equal(stage, MASK_STAGES[index])
    assert.equal(next, MASK_STAGES[index + 1] || null)
    assert.equal(daysUntilNext, remaining)
  })
}

test('серия не влияет на накопительную стадию', () => {
  const daysActive = 30
  for (const currentStreak of [0, 1, 30, 100]) {
    const profile = { days_active: daysActive, current_streak: currentStreak }
    assert.equal(getMaskStage(profile.days_active).stage.name, 'Находит путь')
  }
})

test('все картинки пока используют fallback маски профиля', () => {
  assert.equal(MASK_STAGES.length, 4)
  assert.ok(MASK_STAGES.every(stage => stage.image === null))
})
