import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildSeriesViewModel,
  currentCheckinStreak,
  longestCheckinStreak,
  collectActivityDays,
  seriesLogicalDateKey,
} from '../../src/lib/series.js'

/**
 * Локальный YYYY-MM-DD относительно сегодняшнего дня.
 * Тесты серии зависят от «вчера/сегодня» — жёстко зашитые даты
 * ломаются при смене календарного дня.
 */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Понедельник относительно текущего дня: стабильные проверки границ пн–вс.
const mondayOffset = -((new Date().getDay() + 6) % 7)
function weekday(weekOffset, dayOffset) {
  return dayKey(mondayOffset + weekOffset * 7 + dayOffset)
}
function checkin(date) {
  return { date }
}
function noon(date) {
  return new Date(`${date}T12:00:00`)
}

test('seriesLogicalDateKey maps 02:00 to yesterday and 05:00 to today', () => {
  const today = dayKey()
  assert.equal(seriesLogicalDateKey(new Date(`${today}T02:00:00`)), dayKey(-1))
  assert.equal(seriesLogicalDateKey(new Date(`${today}T05:00:00`)), today)
  assert.equal(seriesLogicalDateKey(new Date(`${today}T19:00:00`)), today)
})

test('currentCheckinStreak counts the completed tail in chronological order', () => {
  const checkins = [
    { date: dayKey(-2), review_completed_at: `${dayKey(-2)}T20:00:00Z` },
    { date: dayKey(0), review_completed_at: `${dayKey(0)}T20:00:00Z` },
    { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` },
  ]

  assert.equal(currentCheckinStreak(checkins), 3)
})

test('currentCheckinStreak counts morning-only check-ins (date without review_completed_at)', () => {
  const checkins = [
    { date: dayKey(-3), review_completed_at: `${dayKey(-3)}T20:00:00Z` },
    { date: dayKey(-2), review_completed_at: null },
    { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` },
  ]

  assert.equal(currentCheckinStreak(checkins), 3)
})

test('currentCheckinStreak ignores records without a date or completion marker', () => {
  const checkins = [checkin(weekday(0, 0)), { review_completed_at: null }, checkin(weekday(0, 3))]
  assert.equal(currentCheckinStreak(checkins, { now: noon(weekday(0, 3)) }), 1)
})

test('buildSeriesViewModel keeps badges derived from existing stats and practice lists', () => {
  const model = buildSeriesViewModel({
    stats: { total_checkins: 5, days_active: 7, best_streak: 4 },
    checkins: [{ date: dayKey(0), review_completed_at: `${dayKey(0)}T20:00:00Z` }],
    rituals: [{ streak: 7 }],
    ascezas: [{ streak: 2 }],
  })

  assert.equal(model.currentStreak, 1)
  assert.equal(model.bestStreak, 1)
  assert.equal(model.totalCheckins, 1)
  assert.equal(model.activeDays, 1)
  assert.equal(model.badges.length, 9)
  assert.equal(model.badges.find(badge => badge.id === 'voice-heard').done, false)
  assert.equal(model.badges.find(badge => badge.id === 'ritual-holds').done, true)
})

test('freeze does not unlock 2/3/5-day badges for a missed day', () => {
  const dates = [0, 2, 3, 4, 5].map(day => weekday(-1, day))
  for (const count of [1, 2, 4, 5]) {
    const model = buildSeriesViewModel({ checkins: dates.slice(0, count).map(checkin) })
    assert.equal(model.bestStreak, count)
    for (const goal of [2, 3, 5]) {
      const badge = model.badges.find(
        item => item.id === `streak-${{ 2: 'two', 3: 'three', 5: 'five' }[goal]}`
      )
      assert.equal(badge.done, count >= goal)
      assert.equal(badge.progress, Math.min(count, goal))
    }
  }
})

test('buildSeriesViewModel is safe for empty API responses', () => {
  const model = buildSeriesViewModel({})

  assert.equal(model.currentStreak, 0)
  assert.equal(model.badges.length, 9)
  assert.equal(model.badges.every(badge => badge.done === false), true)
})

test('currentCheckinStreak stops after two missed days in one week', () => {
  const checkins = [checkin(weekday(0, 0)), checkin(weekday(0, 3))]
  assert.equal(currentCheckinStreak(checkins, { now: noon(weekday(0, 3)) }), 1)
})

test('currentCheckinStreak treats midnight as the next user calendar day', () => {
  const checkins = [
    { review_completed_at: `${dayKey(-1)}T23:59:00Z` },
    { review_completed_at: `${dayKey(0)}T05:01:00Z` },
  ]

  assert.equal(currentCheckinStreak(checkins, { timezone: 'UTC' }), 2)
})

test('currentCheckinStreak groups timestamps by the user timezone', () => {
  const checkins = [
    { review_completed_at: `${dayKey(-1)}T20:30:00Z` },
    { review_completed_at: `${dayKey(0)}T03:30:00Z` },
  ]

  assert.equal(currentCheckinStreak(checkins, { timezone: 'Europe/Moscow' }), 2)
  assert.equal(currentCheckinStreak(checkins, { timezone: 'America/New_York' }), 1)
})

test('currentCheckinStreak keeps one missed calendar day without counting it', () => {
  const checkins = [checkin(weekday(0, 0)), checkin(weekday(0, 2))]
  assert.equal(currentCheckinStreak(checkins, { now: noon(weekday(0, 2)) }), 2)
  assert.equal(longestCheckinStreak(checkins), 2)
})

test('two missed days in the same week reset the current series even without a new check-in', () => {
  const days = [checkin(weekday(0, 0)), checkin(weekday(0, 2))]
  assert.equal(currentCheckinStreak(days, { now: noon(weekday(0, 4)) }), 0)
  assert.equal(longestCheckinStreak(days), 2)
})

test('one missed day in each adjacent week keeps the series', () => {
  const days = [checkin(weekday(-1, 4)), checkin(weekday(-1, 6)), checkin(weekday(0, 1))]
  assert.equal(currentCheckinStreak(days, { now: noon(weekday(0, 1)) }), 3)
  assert.equal(longestCheckinStreak(days), 3)
})

test('Sunday and Monday misses use separate weekly allowances', () => {
  const days = [checkin(weekday(-1, 5)), checkin(weekday(0, 1))]
  assert.equal(currentCheckinStreak(days, { now: noon(weekday(0, 1)) }), 2)
  assert.equal(longestCheckinStreak(days), 2)
})

test('00:00–04:59 belongs to yesterday and does not spend a freeze', () => {
  const monday = weekday(0, 0)
  const tuesday = weekday(0, 1)
  const checkins = [
    { review_completed_at: `${monday}T22:00:00Z` },
    { review_completed_at: `${tuesday}T02:30:00Z` },
  ]
  assert.equal(currentCheckinStreak(checkins, { timezone: 'UTC', now: new Date(`${tuesday}T04:59:00Z`) }), 1)
  assert.equal(currentCheckinStreak(checkins, { timezone: 'UTC', now: new Date(`${tuesday}T05:00:00Z`) }), 1)
  assert.equal(longestCheckinStreak(checkins, { timezone: 'UTC' }), 1)
})

test('first completed check-in starts at one and an empty history stays at zero', () => {
  assert.equal(currentCheckinStreak([checkin(dayKey(0))]), 1)
  assert.equal(currentCheckinStreak([]), 0)
})

test('morning check-in without review_completed_at counts as a completed day', () => {
  assert.equal(
    currentCheckinStreak([{ date: dayKey(0), mood: 3, energy: 2 }]),
    1
  )
})

test('yesterday check-in keeps a one-day series before today is completed', () => {
  assert.equal(
    currentCheckinStreak([
      { date: dayKey(-2), review_completed_at: `${dayKey(-2)}T08:00:00Z` },
    ]),
    1
  )
})

test('streak counts up to yesterday when today is not yet completed', () => {
  assert.equal(
    currentCheckinStreak([
      { date: dayKey(-2), review_completed_at: `${dayKey(-2)}T08:00:00Z` },
    ]),
    1
  )

  assert.equal(
    currentCheckinStreak([
      { date: dayKey(-2), review_completed_at: `${dayKey(-2)}T08:00:00Z` },
      { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T08:00:00Z` },
    ]),
    2
  )
})

test('series metrics use one completed check-in dataset instead of stale profile totals', () => {
  const model = buildSeriesViewModel({
    stats: { total_checkins: 4, days_active: 23, best_streak: 0 },
    checkins: [{ date: dayKey(-2), review_completed_at: `${dayKey(-2)}T08:00:00Z` }],
  })
  assert.equal(model.currentStreak, 1)
  assert.equal(model.totalCheckins, 1)
  assert.equal(model.activeDays, 1)
  assert.equal(model.bestStreak, 1)
})

test('withTodayCheckin: утренний чек-ин за сегодня даёт серию 1, даже если истории ещё нет', async () => {
  const { withTodayCheckin } = await import('../../src/lib/series.js')
  const now = new Date()
  assert.equal(currentCheckinStreak(withTodayCheckin([], { id: 7 }, now)), 1)
  assert.equal(currentCheckinStreak(withTodayCheckin([], null, now)), 0)
  const history = [{ date: dayKey(-1) }]
  assert.equal(currentCheckinStreak(withTodayCheckin(history, { date: dayKey(0) }, now)), 2)
  assert.equal(
    currentCheckinStreak(withTodayCheckin([{ date: dayKey(0) }], { date: dayKey(0) }, now)),
    1
  )
})

test('currentCheckinStreak учитывает утреннюю запись только с created_at', () => {
  assert.equal(currentCheckinStreak([{ created_at: `${dayKey(0)}T06:00:00Z` }]), 1)
})

// ── Новое правило: день засчитывается по любой активности ──

test('collectActivityDays: отметка ритуала сегодня добавляет сегодняшний день', () => {
  const now = new Date()
  const days = collectActivityDays({
    rituals: [{ id: 1, today_level: 2 }],
    ascezas: [],
    moodPractices: [],
    now,
  })
  assert.deepEqual(days, [dayKey(0)])
})

test('collectActivityDays: отметка аскезы сегодня добавляет сегодняшний день', () => {
  const now = new Date()
  const days = collectActivityDays({
    rituals: [],
    ascezas: [{ id: 1, today_status: 'held' }],
    moodPractices: [],
    now,
  })
  assert.deepEqual(days, [dayKey(0)])
})

test('collectActivityDays: записи «Настроение» добавляют свои даты', () => {
  const days = collectActivityDays({
    rituals: [],
    ascezas: [],
    moodPractices: [
      { recorded_at: `${dayKey(-2)}T15:00:00Z` },
      { recorded_at: `${dayKey(-1)}T10:00:00Z` },
    ],
  })
  assert.deepEqual(days.sort(), [dayKey(-2), dayKey(-1)].sort())
})

test('collectActivityDays: без активности — пустой массив', () => {
  assert.deepEqual(collectActivityDays({}), [])
  assert.deepEqual(collectActivityDays({ rituals: [], ascezas: [], moodPractices: [] }), [])
})

test('mood practice засчитывает день в серию через activityDays', () => {
  // Вчера — чек-ин, сегодня — только mood practice (без чек-ина)
  const checkins = [{ date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` }]
  const activityDays = [dayKey(0)]
  assert.equal(currentCheckinStreak(checkins, { activityDays }), 2)
})

test('mood practice не засчитывается, если день уже есть в чек-инах (без дублирования)', () => {
  const checkins = [
    { date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` },
    { date: dayKey(0), mood: 3, energy: 2 },
  ]
  const activityDays = [dayKey(0)] // та же дата — не дублируется
  assert.equal(currentCheckinStreak(checkins, { activityDays }), 2)
})

test('buildSeriesViewModel учитывает moodPractices в серии', () => {
  const model = buildSeriesViewModel({
    checkins: [{ date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` }],
    moodPractices: [{ recorded_at: `${dayKey(0)}T11:00:00Z` }],
  })
  assert.equal(model.currentStreak, 2)
})

test('buildSeriesViewModel: отметка ритуала сегодня продлевает серию', () => {
  const model = buildSeriesViewModel({
    checkins: [{ date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` }],
    rituals: [{ id: 1, today_level: 2 }],
  })
  // Сегодня засчитано через ритуал — серия = 2
  assert.equal(model.currentStreak, 2)
})

// ── practiceDays: дни с отметками практик из бэкенд-эндпоинта ──

test('collectActivityDays: practiceDays добавляют прошедшие дни', () => {
  const days = collectActivityDays({
    rituals: [],
    ascezas: [],
    moodPractices: [],
    practiceDays: [dayKey(-4), dayKey(-3)],
  })
  assert.deepEqual(days.sort(), [dayKey(-4), dayKey(-3)].sort())
})

test('practiceDays: прошлый день с практикой продлевает серию', () => {
  const checkins = [{ date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` }]
  const activityDays = collectActivityDays({ practiceDays: [dayKey(0)] })
  assert.equal(currentCheckinStreak(checkins, { activityDays }), 2)
})

test('practiceDays: при пустом ответе (ошибка/404) серия не меняется', () => {
  const checkins = [{ date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` }]
  const activityDays = collectActivityDays({ practiceDays: [] })
  assert.equal(currentCheckinStreak(checkins, { activityDays }), 1)
})

test('buildSeriesViewModel учитывает practiceDays в серии', () => {
  const model = buildSeriesViewModel({
    checkins: [{ date: dayKey(-1), review_completed_at: `${dayKey(-1)}T20:00:00Z` }],
    practiceDays: [dayKey(0)],
  })
  assert.equal(model.currentStreak, 2)
})
