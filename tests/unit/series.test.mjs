import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  buildServerSeriesViewModel,
  splitCheckinsForComparison,
  withTodayCheckin,
  seriesLogicalDateKey,
} from '../../src/lib/series.js'
import { readCanonicalStreakStats, serverSeriesBadges } from '../../src/lib/canonicalStreak.js'

const seriesSource = await readFile(new URL('../../src/lib/series.js', import.meta.url), 'utf8')

/**
 * Локальный YYYY-MM-DD относительно сегодняшнего дня.
 */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function checkinDay(offset) {
  const key = dayKey(offset)
  return { date: key, review_completed_at: `${key}T08:00:00Z` }
}

function softStats({ currentStreak = 0, bestStreak = 0, activeDays = 0, ...flags } = {}) {
  return {
    currentStreak,
    bestStreak,
    activeDays,
    isActiveToday: false,
    freezeUsedThisWeek: false,
    recoverable: false,
    ...flags,
  }
}

/*
 * МЯГКАЯ СЕРИЯ — ЕДИНЫЙ ИСТОЧНИК: GET /api/streak
 *
 * Любая завершённая активность за день (чек-ин, журнал, ритуал, аскеза,
 * «Настроение», направленная запись) засчитывается в серию; один пропуск
 * в календарную неделю не рвёт серию (заморозка); «Верни серию» доступна
 * за вчера. Расчёт живёт на сервере; фронтенд не восстанавливает серию
 * из истории чек-инов.
 */

test('в series.js больше нет локального расчёта серии по истории', () => {
  // Клиент не может пересчитать мягкую серию: календарная граница дня,
  // заморозка недели и учёт «любой активности» — серверные правила.
  assert.doesNotMatch(seriesSource, /currentCheckinStreak/)
  assert.doesNotMatch(seriesSource, /longestCheckinStreak/)
  assert.doesNotMatch(seriesSource, /collectActivityDays/)
  assert.doesNotMatch(seriesSource, /streakRuns/)
  assert.doesNotMatch(seriesSource, /\bbuildSeriesViewModel\(/)
})

// ── Логическая дата: отсечка 05:00 остаётся клиентской утилитой ──

test('seriesLogicalDateKey maps 02:00 to yesterday and 05:00 to today', () => {
  const today = dayKey()
  assert.equal(seriesLogicalDateKey(new Date(`${today}T02:00:00`)), dayKey(-1))
  assert.equal(seriesLogicalDateKey(new Date(`${today}T05:00:00`)), today)
  assert.equal(seriesLogicalDateKey(new Date(`${today}T19:00:00`)), today)
})

// ── withTodayCheckin: якорь сегодняшнего чек-ина для сравнения значков ──

test('withTodayCheckin добавляет сегодняшний чек-ин к истории без дублей', () => {
  // Фиксированный полдень: фолбэк-дата без отсечки 05:00 не зависит от времени прогона.
  const now = new Date(`${dayKey(0)}T12:00:00`)
  const today = { id: 7 }
  const list = withTodayCheckin([], today, now)
  assert.equal(list.length, 1)
  assert.equal(list[0].date, dayKey(0))

  const history = [{ date: dayKey(-1) }]
  const merged = withTodayCheckin(history, { date: dayKey(0) }, now)
  assert.equal(merged.length, 2)
  assert.equal(merged[1].date, dayKey(0))

  // Сегодняшний чек-ин не дублируется, если он уже в истории.
  const deduped = withTodayCheckin([{ date: dayKey(0) }], { date: dayKey(0) }, now)
  assert.equal(deduped.length, 1)
})

test('withTodayCheckin без сегодняшнего чек-ина не меняет историю', () => {
  const history = [{ date: dayKey(-1) }]
  assert.equal(withTodayCheckin(history, null, new Date()), history)
  assert.deepEqual(withTodayCheckin(history, null, new Date()), history)
})

// ── Серверный контракт мягкой серии ──

test('readCanonicalStreakStats пропускает мягкие флаги сервера без пересчёта', () => {
  const stats = readCanonicalStreakStats({
    current_streak: 6,
    longest_streak: 9,
    total_active_days: 12,
    is_active_today: true,
    freeze_used_this_week: true,
    recoverable: false,
  })
  assert.deepEqual(stats, softStats({
    currentStreak: 6,
    bestStreak: 9,
    activeDays: 12,
    isActiveToday: true,
    freezeUsedThisWeek: true,
  }))
})

test('readCanonicalStreakStats: нулевая серия — валидное значение, не «нет данных»', () => {
  const stats = readCanonicalStreakStats({
    current_streak: 0,
    longest_streak: 0,
    total_active_days: 0,
  })
  assert.notEqual(stats, null)
  assert.equal(stats.currentStreak, 0)
  assert.equal(stats.isActiveToday, false)
  assert.equal(stats.freezeUsedThisWeek, false)
  assert.equal(stats.recoverable, false)
})

test('readCanonicalStreakStats не принимает некорректные ответы', () => {
  assert.equal(readCanonicalStreakStats(null), null)
  assert.equal(readCanonicalStreakStats({}), null)
  // Отрицательные и нецелые числа серии — не подменяются расчётом по истории.
  assert.equal(readCanonicalStreakStats({ current_streak: -1, longest_streak: 3, total_active_days: 3 }), null)
  assert.equal(readCanonicalStreakStats({ current_streak: 2.5, longest_streak: 3, total_active_days: 3 }), null)
  assert.equal(readCanonicalStreakStats({ current_streak: 2, longest_streak: '5', total_active_days: 3 }), null)
  assert.equal(readCanonicalStreakStats({ current_streak: 2, longest_streak: 5, total_active_days: -1 }), null)
})

// ── Значки серии из серверной статистики ──

const STREAK_IDS = ['streak-two', 'streak-three', 'streak-five']

test('serverSeriesBadges открывает значки серии по серверному bestStreak', () => {
  // Как в SeriesBadges/Profile: модель значков строится без серии,
  // затем серверная статистика доопределяет серийные значки.
  const badges = serverSeriesBadges(
    buildServerSeriesViewModel({ checkins: [checkinDay(0)] }).badges,
    softStats({ bestStreak: 3 })
  )
  assert.equal(badges.find(b => b.id === 'streak-two').done, true)
  assert.equal(badges.find(b => b.id === 'streak-three').done, true)
  assert.equal(badges.find(b => b.id === 'streak-five').done, false)
  assert.equal(badges.find(b => b.id === 'streak-five').progress, 3)
})

test('serverSeriesBadges: «Неделя/Месяц пути» — по серверным activeDays, не по bestStreak', () => {
  const badges = serverSeriesBadges(
    buildServerSeriesViewModel({ checkins: [checkinDay(0)] }).badges,
    softStats({ bestStreak: 30, activeDays: 6 })
  )
  assert.equal(badges.find(b => b.id === 'week-on-path').done, false)
  assert.equal(badges.find(b => b.id === 'week-on-path').progress, 6)
  assert.equal(badges.find(b => b.id === 'streak-five').done, true)
})

test('serverSeriesBadges: без серверной статистики серийные значки закрыты', () => {
  const badges = serverSeriesBadges(
    buildServerSeriesViewModel({ checkins: [checkinDay(0)] }).badges,
    null
  )
  for (const id of [...STREAK_IDS, 'week-on-path', 'month-on-path']) {
    assert.equal(badges.find(b => b.id === id).done, false, `${id} закрыт без серверных данных`)
  }
})

// ── View-model без клиентского восстановления серии ──

test('buildServerSeriesViewModel берёт числа серии только из canonicalStats', () => {
  const history = [-4, -3, -2, -1, 0].map(checkinDay)
  // История содержит 5 дней подряд — но клиент не выводит из неё серию.
  const model = buildServerSeriesViewModel({ checkins: history })
  assert.equal(model.currentStreak, null)
  assert.equal(model.bestStreak, null)
  assert.equal(model.activeDays, null)

  const serverModel = buildServerSeriesViewModel({
    stats: { total_checkins: 5 },
    checkins: history,
    canonicalStats: softStats({ currentStreak: 5, bestStreak: 5, activeDays: 6 }),
  })
  assert.equal(serverModel.currentStreak, 5)
  assert.equal(serverModel.bestStreak, 5)
  assert.equal(serverModel.activeDays, 6)
  assert.equal(serverModel.totalCheckins, 5)
  for (const id of STREAK_IDS) {
    assert.equal(serverModel.badges.find(b => b.id === id).done, true)
  }
})

test('buildServerSeriesViewModel: разорванная серия хранится серверным bestStreak', () => {
  // Прошлая серия 5 дней, сейчас серия 1: сервер хранит максимум,
  // клиент не пересчитывает значки из истории.
  const model = buildServerSeriesViewModel({
    canonicalStats: softStats({ currentStreak: 1, bestStreak: 5, activeDays: 8 }),
  })
  assert.equal(model.currentStreak, 1)
  for (const id of STREAK_IDS) {
    assert.equal(model.badges.find(b => b.id === id).done, true)
  }
})

test('buildServerSeriesViewModel is safe for empty API responses', () => {
  const model = buildServerSeriesViewModel({})
  assert.equal(model.currentStreak, null)
  assert.equal(model.totalCheckins, 0)
  assert.equal(model.badges.length, 9)
  assert.equal(model.badges.every(badge => badge.done === false), true)
})

test('buildServerSeriesViewModel keeps practice badges from practice lists', () => {
  const model = buildServerSeriesViewModel({
    rituals: [{ streak: 7 }],
    ascezas: [{ streak: 2 }],
  })
  assert.equal(model.badges.find(b => b.id === 'ritual-holds').done, true)
  assert.equal(model.badges.find(b => b.id === 'asceza-power').done, false)
})

test('buildServerSeriesViewModel: без серверского total_checkins считаются завершённые записи', () => {
  const model = buildServerSeriesViewModel({
    checkins: [checkinDay(0), { date: dayKey(-1) }, null],
  })
  // Число чек-инов — фолбэк по завершённым записям; серия при этом
  // остаётся null и восстанавливается только сервером.
  assert.equal(model.totalCheckins, 1)
  assert.equal(model.currentStreak, null)
})

// ── Сравнение значков для шторки «Новый значок» ──

test('splitCheckinsForComparison делит историю на «до» и «после» сегодняшнего чек-ина', () => {
  const history = [checkinDay(-2), checkinDay(-1), checkinDay(0)]
  const { previous, next } = splitCheckinsForComparison(history, checkinDay(0))
  assert.equal(previous.length, 2)
  assert.equal(next.length, 3)
  assert.equal(previous.some(c => c.date === dayKey(0)), false)
})
