import assert from 'node:assert/strict'
import test from 'node:test'

import {
  moodPracticeDate,
  groupMoodPracticesByDate,
} from '../../src/lib/moodPracticeLogic.js'
import { currentCheckinStreak, collectActivityDays } from '../../src/lib/series.js'

/** Локальный YYYY-MM-DD относительно сегодняшнего дня. */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

test('moodPracticeDate извлекает YYYY-MM-DD из recorded_at', () => {
  assert.equal(
    moodPracticeDate({ recorded_at: `${dayKey(0)}T15:30:00.000Z` }),
    dayKey(0)
  )
  assert.equal(
    moodPracticeDate({ date: dayKey(-1) }),
    dayKey(-1)
  )
  assert.equal(moodPracticeDate({}), null)
  assert.equal(moodPracticeDate(null), null)
})

test('groupMoodPracticesByDate группирует записи по дню', () => {
  const practices = [
    { id: 1, recorded_at: `${dayKey(0)}T08:00:00.000Z`, mood: 3, emotion: 'ровно' },
    { id: 2, recorded_at: `${dayKey(0)}T15:30:00.000Z`, mood: 2, emotion: 'устал' },
    { id: 3, recorded_at: `${dayKey(-1)}T10:00:00.000Z`, mood: 4, emotion: 'бодро' },
  ]
  const grouped = groupMoodPracticesByDate(practices)
  assert.deepEqual(Object.keys(grouped).sort(), [dayKey(-1), dayKey(0)].sort())
  assert.equal(grouped[dayKey(0)].length, 2)
  assert.equal(grouped[dayKey(-1)].length, 1)
})

test('groupMoodPracticesByDate: день без чек-ина, только с записями «Настроения»', () => {
  const practices = [
    { id: 1, recorded_at: `${dayKey(1)}T12:00:00.000Z`, mood: 3, emotion: 'спокойно' },
  ]
  const grouped = groupMoodPracticesByDate(practices)
  // День есть только в mood practices — нет чек-ина
  assert.ok(grouped[dayKey(1)])
  assert.equal(grouped[dayKey(1)].length, 1)
})

test('groupMoodPracticesByDate: пустой ввод → пустой объект', () => {
  assert.deepEqual(groupMoodPracticesByDate([]), {})
  assert.deepEqual(groupMoodPracticesByDate(null), {})
  assert.deepEqual(groupMoodPracticesByDate(undefined), {})
})

test('запись «Настроения» на новом дне продлевает серию', () => {
  const checkins = [
    { date: dayKey(-2), review_completed_at: `${dayKey(-2)}T20:00:00Z` },
    { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` },
    { date: dayKey(0), review_completed_at: `${dayKey(0)}T20:00:00Z` },
  ]
  const moodPractices = [
    { id: 1, recorded_at: `${dayKey(0)}T15:30:00Z`, mood: 2, emotion: 'устал' },
    { id: 2, recorded_at: `${dayKey(1)}T10:00:00Z`, mood: 4, emotion: 'бодро' },
  ]

  // Серия только по чек-инам — 3 дня
  const streakWithoutMood = currentCheckinStreak(checkins)
  assert.equal(streakWithoutMood, 3)

  // Запись «Настроения» на новом дне добавляет день через activityDays
  const activityDays = collectActivityDays({ moodPractices })
  const streakWithMood = currentCheckinStreak(checkins, { activityDays })
  assert.equal(streakWithMood, 4, 'запись «Настроения» на новом дне продлевает серию')
})

test('день только с записью «Настроения» продлевает серию; «Пройти заново» не увеличивает', () => {
  const checkins = [
    { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` },
  ]
  const moodPracticesOnly = [
    { id: 1, recorded_at: `${dayKey(0)}T12:00:00Z`, mood: 3, emotion: 'ровно' },
  ]

  // День есть только в mood practices — чек-ина нет,
  // но по новому правилу запись «Настроения» засчитывает день в серию
  const activityDays = collectActivityDays({ moodPractices: moodPracticesOnly })
  const streak = currentCheckinStreak(checkins, { activityDays })
  assert.equal(streak, 2, 'серия продлевается до 2 за счёт записи «Настроения»')

  // «Пройти заново» — повторный чек-ин за тот же день не увеличивает серию
  const redoCheckin = { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T22:00:00Z` }
  const streakWithRedo = currentCheckinStreak([...checkins, redoCheckin], { activityDays })
  assert.equal(streakWithRedo, 2, '«Пройти заново» не увеличивает серию')
})
