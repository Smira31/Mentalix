import test from 'node:test'
import assert from 'node:assert/strict'

import { buildBadges } from '../../src/lib/badges.js'
import { buildServerSeriesViewModel } from '../../src/lib/series.js'

/**
 * Локальный YYYY-MM-DD относительно сегодняшнего дня.
 */
function dayKey(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function softStats({ currentStreak = 0, bestStreak = 0, activeDays = 0 } = {}) {
  return { currentStreak, bestStreak, activeDays }
}

const STREAK_IDS = ['streak-two', 'streak-three', 'streak-five']

// ── Пороги 2 / 3 / 5 ──

test('streak-two открывается при best_streak ≥ 2, остальные — нет', () => {
  const badges = buildBadges({ stats: { best_streak: 2 } })
  assert.equal(badges.find(b => b.id === 'streak-two').done, true)
  assert.equal(badges.find(b => b.id === 'streak-three').done, false)
  assert.equal(badges.find(b => b.id === 'streak-five').done, false)
})

test('streak-three открывается при best_streak ≥ 3, streak-five — нет', () => {
  const badges = buildBadges({ stats: { best_streak: 3 } })
  assert.equal(badges.find(b => b.id === 'streak-two').done, true)
  assert.equal(badges.find(b => b.id === 'streak-three').done, true)
  assert.equal(badges.find(b => b.id === 'streak-five').done, false)
})

test('все три значка открываются при best_streak ≥ 5', () => {
  const badges = buildBadges({ stats: { best_streak: 5 } })
  for (const id of STREAK_IDS) {
    assert.equal(badges.find(b => b.id === id).done, true)
  }
})

test('при best_streak = 1 ни один серийный значок не открыт', () => {
  const badges = buildBadges({ stats: { best_streak: 1 } })
  for (const id of STREAK_IDS) {
    assert.equal(badges.find(b => b.id === id).done, false)
  }
})

test('прогресс значков серии ограничен целью', () => {
  const badges = buildBadges({ stats: { best_streak: 4 } })
  assert.equal(badges.find(b => b.id === 'streak-two').progress, 2)
  assert.equal(badges.find(b => b.id === 'streak-three').progress, 3)
  assert.equal(badges.find(b => b.id === 'streak-five').progress, 4)
  assert.equal(badges.find(b => b.id === 'streak-five').goal, 5)
})

// ── Мягкая серия: числа приходят с сервера, значки — из них ──

test('серийные значки открываются по серверному bestStreak (любая активность)', () => {
  // Сервер мягкой серии засчитывает за день любую активность:
  // чек-ин, журнал, ритуал, аскезу, «Настроение». Клиенту достаточно
  // одного числа longest_streak — историю для этого не восстанавливаем.
  const model = buildServerSeriesViewModel({
    checkins: [{ date: dayKey(0), review_completed_at: `${dayKey(0)}T08:00:00Z` }],
    canonicalStats: softStats({ bestStreak: 5 }),
  })
  for (const id of STREAK_IDS) {
    assert.equal(
      model.badges.find(b => b.id === id).done,
      true,
      `${id} должен быть открыт при серверном bestStreak = 5`
    )
  }
})

test('серверный bestStreak = 3 открывает streak-two и streak-three, но не streak-five', () => {
  const model = buildServerSeriesViewModel({
    canonicalStats: softStats({ bestStreak: 3 }),
  })
  assert.equal(model.badges.find(b => b.id === 'streak-two').done, true)
  assert.equal(model.badges.find(b => b.id === 'streak-three').done, true)
  assert.equal(model.badges.find(b => b.id === 'streak-five').done, false)
})

test('разорванная серия не обнуляет прошлые значки (сервер хранит максимум)', () => {
  // Прошлая серия 5 дней (в т.ч. с заморозкой пропуска), сейчас серия 1:
  // сервер сообщает longest_streak = 5, current_streak = 1.
  const model = buildServerSeriesViewModel({
    canonicalStats: softStats({ currentStreak: 1, bestStreak: 5 }),
  })
  assert.equal(model.currentStreak, 1)
  assert.equal(model.bestStreak, 5)
  for (const id of STREAK_IDS) {
    assert.equal(model.badges.find(b => b.id === id).done, true)
  }
})

test('без серверной статистики серийные значки закрыты и числа серии null', () => {
  const model = buildServerSeriesViewModel({
    checkins: [-4, -3, -2, -1, 0].map(offset => ({
      date: dayKey(offset),
      review_completed_at: `${dayKey(offset)}T08:00:00Z`,
    })),
  })
  // История из 5 дней подряд не открывает серийные значки на клиенте:
  // мягкая серия считается только сервером.
  assert.equal(model.currentStreak, null)
  assert.equal(model.bestStreak, null)
  for (const id of STREAK_IDS) {
    assert.equal(model.badges.find(b => b.id === id).done, false)
  }
})

// ── Отсутствие дублей ──

test('все ID значков уникальны', () => {
  const badges = buildBadges({ stats: { best_streak: 10, total_checkins: 10, days_active: 30 } })
  const ids = badges.map(b => b.id)
  assert.equal(ids.length, new Set(ids).size)
})

test('пороги серийных значков не дублируют друг друга', () => {
  const badges = buildBadges({ stats: { best_streak: 10 } })
  const streakBadges = badges.filter(b => STREAK_IDS.includes(b.id))
  const goals = streakBadges.map(b => b.goal)
  assert.equal(goals.length, new Set(goals).size)
  assert.deepEqual(goals.sort((a, b) => a - b), [2, 3, 5])
})

test('новые пороги не пересекаются с существующими серийными значками', () => {
  // Существующие значки на порогах 7 (week-on-path, ritual-holds, asceza-power)
  // и 30 (month-on-path) — это другие метрики (дни в системе, серия ритуала,
  // серия аскезы), не серия чек-инов. Порог 5 у voice-heard — это общее число
  // чек-инов, не серия. Поэтому пороги 2/3/5 для серии чек-инов не дублируют
  // ни один существующий значок.
  const badges = buildBadges({ stats: { best_streak: 10 } })
  const streakGoals = badges
    .filter(b => STREAK_IDS.includes(b.id))
    .map(b => b.goal)
  // Ни один существующий значок не использует best_streak как метрику
  const nonStreakBadges = badges.filter(b => !STREAK_IDS.includes(b.id))
  for (const badge of nonStreakBadges) {
    assert.ok(
      !STREAK_IDS.includes(badge.id),
      `${badge.id} не должен быть серийным значком`
    )
  }
  assert.deepEqual(streakGoals.sort((a, b) => a - b), [2, 3, 5])
})
