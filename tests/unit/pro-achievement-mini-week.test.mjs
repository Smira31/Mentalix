import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MINI_WEEK_DAYS,
  buildAchievementWeek,
} from '../../src/screens/pro/achievementMiniWeek.js'

/*
 * PRO-002b, редизайн Stoic: мини-неделя достижения разбора — 7 точек Пн–Вс.
 *
 * Точка строится только из распознанного ISO-дня начала недели: без даты
 * недели мини-неделя не строится вовсе (карточка показывает даты текстом).
 * Нераспознанные даты достижения пропускаются, дни вне недели ничего
 * не закрашивают. Чистая функция без React — даты проверяются напрямую.
 */

/* 2026-10-12 — понедельник; неделя 12–18 октября. */
const WEEK_START = '2026-10-12'
const WEEK_DATES = [
  '2026-10-12',
  '2026-10-13',
  '2026-10-14',
  '2026-10-15',
  '2026-10-16',
  '2026-10-17',
  '2026-10-18',
]

test('неделя без распознанной даты начала не строится', () => {
  for (const bad of [undefined, null, '', 'не дата', '2026-13-45', '12.10.2026', 42, {}]) {
    assert.equal(
      buildAchievementWeek(bad, [WEEK_START]),
      null,
      `buildAchievementWeek(${JSON.stringify(bad)}, …)`
    )
  }
})

test('неделя строится из 7 точек Пн–Вс от распознанного начала', () => {
  const week = buildAchievementWeek(WEEK_START, [])

  assert.equal(week.length, 7)
  assert.deepEqual(
    week.map(day => day.label),
    MINI_WEEK_DAYS
  )
  assert.deepEqual(
    week.map(day => day.date),
    WEEK_DATES
  )
  assert.equal(week.every(day => !day.filled), true, 'без достижений все точки пустые')
})

test('дни достижения закрашивают свои точки, нераспознанные пропускаются', () => {
  const week = buildAchievementWeek(WEEK_START, [
    '2026-10-12',
    '2026-10-14',
    '2026-13-45',
    null,
    '12.10.2026',
  ])

  assert.deepEqual(
    week.map(day => day.filled),
    [true, false, true, false, false, false, false]
  )
})

test('дни вне недели не закрашивают точки', () => {
  const week = buildAchievementWeek(WEEK_START, ['2026-10-05', '2026-10-19'])

  assert.equal(week.every(day => !day.filled), true)
})

test('без списка дней все точки пустые', () => {
  for (const days of [undefined, null, '2026-10-12', 42]) {
    const week = buildAchievementWeek(WEEK_START, days)
    assert.equal(week.length, 7, `days=${JSON.stringify(days)}`)
    assert.equal(week.every(day => !day.filled), true, `days=${JSON.stringify(days)}`)
  }
})
