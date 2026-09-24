import assert from 'node:assert/strict'
import test from 'node:test'

import {
  moodPracticeDate,
  groupMoodPracticesByDate,
} from '../../src/lib/moodPracticeLogic.js'
import { currentCheckinStreak } from '../../src/lib/series.js'

test('moodPracticeDate извлекает YYYY-MM-DD из recorded_at', () => {
  assert.equal(
    moodPracticeDate({ recorded_at: '2026-09-24T15:30:00.000Z' }),
    '2026-09-24'
  )
  assert.equal(
    moodPracticeDate({ date: '2026-09-23' }),
    '2026-09-23'
  )
  assert.equal(moodPracticeDate({}), null)
  assert.equal(moodPracticeDate(null), null)
})

test('groupMoodPracticesByDate группирует записи по дню', () => {
  const practices = [
    { id: 1, recorded_at: '2026-09-24T08:00:00.000Z', mood: 3, emotion: 'ровно' },
    { id: 2, recorded_at: '2026-09-24T15:30:00.000Z', mood: 2, emotion: 'устал' },
    { id: 3, recorded_at: '2026-09-23T10:00:00.000Z', mood: 4, emotion: 'бодро' },
  ]
  const grouped = groupMoodPracticesByDate(practices)
  assert.deepEqual(Object.keys(grouped).sort(), ['2026-09-23', '2026-09-24'])
  assert.equal(grouped['2026-09-24'].length, 2)
  assert.equal(grouped['2026-09-23'].length, 1)
})

test('groupMoodPracticesByDate: день без чек-ина, только с записями «Настроения»', () => {
  const practices = [
    { id: 1, recorded_at: '2026-09-25T12:00:00.000Z', mood: 3, emotion: 'спокойно' },
  ]
  const grouped = groupMoodPracticesByDate(practices)
  // День 2026-09-25 существует только в mood practices — нет чек-ина
  assert.ok(grouped['2026-09-25'])
  assert.equal(grouped['2026-09-25'].length, 1)
})

test('groupMoodPracticesByDate: пустой ввод → пустой объект', () => {
  assert.deepEqual(groupMoodPracticesByDate([]), {})
  assert.deepEqual(groupMoodPracticesByDate(null), {})
  assert.deepEqual(groupMoodPracticesByDate(undefined), {})
})

test('записи «Настроения» не влияют на подсчёт серии', () => {
  const checkins = [
    { date: '2026-09-24', review_completed_at: '2026-09-24T20:00:00Z' },
    { date: '2026-09-23', review_completed_at: '2026-09-23T20:00:00Z' },
    { date: '2026-09-22', review_completed_at: '2026-09-22T20:00:00Z' },
  ]
  const moodPractices = [
    { id: 1, recorded_at: '2026-09-24T15:30:00Z', mood: 2, emotion: 'устал' },
    { id: 2, recorded_at: '2026-09-25T10:00:00Z', mood: 4, emotion: 'бодро' },
  ]

  // Серия считается только по checkins с review_completed_at
  const streakWithoutMood = currentCheckinStreak(checkins)
  // Даже если «смешать» mood practices в массив, серия не меняется —
  // у них нет review_completed_at и они не выглядят как checkins
  const streakWithMood = currentCheckinStreak([...checkins, ...moodPractices])

  assert.equal(streakWithMood, streakWithoutMood)
  assert.ok(streakWithoutMood >= 1, 'серия должна быть >= 1')
})

test('записи «Настроения» в дне без чек-ина не создают ложную серию', () => {
  const checkins = [
    { date: '2026-09-23', review_completed_at: '2026-09-23T20:00:00Z' },
  ]
  const moodPracticesOnly = [
    { id: 1, recorded_at: '2026-09-24T12:00:00Z', mood: 3, emotion: 'ровно' },
  ]

  // День 2026-09-24 есть только в mood practices — чек-ина нет
  const streak = currentCheckinStreak([...checkins, ...moodPracticesOnly])
  // Серия не должна увеличиться от mood practice без review_completed_at
  assert.equal(streak, currentCheckinStreak(checkins))
})
