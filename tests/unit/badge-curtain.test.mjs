import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildSeriesViewModel,
  splitCheckinsForComparison,
  detectNewlyUnlockedBadge,
} from '../../src/lib/series.js'

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

const SERIES_BADGE_IDS = ['streak-two', 'streak-three', 'streak-five']

// ── Ретро-зачёт: значки из истории не запускают шторку ──

test('ретро-значки при bestStreak ≥ 5 не запускают шторку (история уже содержит серию)', () => {
  // Пользователь с серией 5 дней в прошлом + сегодняшний чек-ин.
  // bestStreak ≥ 5 достигнут историческими данными, не сегодняшним чек-ином.
  const history = [-5, -4, -3, -2, -1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildSeriesViewModel({ checkins: previous })
  const nextModel = buildSeriesViewModel({ checkins: next })

  // Все три серийных значка открыты в обеих моделях — ретро-зачёт.
  for (const id of SERIES_BADGE_IDS) {
    assert.equal(
      previousModel.badges.find(b => b.id === id).done,
      true,
      `${id} должен быть открыт в previousModel (ретро-зачёт)`
    )
    assert.equal(nextModel.badges.find(b => b.id === id).done, true)
  }

  // Шторка не должна показываться.
  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked, null, 'ретро-значки не должны запускать шторку')
})

test('ретро-значки при разорванной серии (bestStreak из прошлого) не запускают шторку', () => {
  // 5 дней подряд в прошлом, пропуск, затем сегодняшний чек-ин (серия = 1).
  // bestStreak = 5 — из истории, не из сегодняшнего чек-ина.
  const history = [
    ...[-9, -8, -7, -6, -5].map(checkinDay),
    checkinDay(0),
  ]
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildSeriesViewModel({ checkins: previous })
  const nextModel = buildSeriesViewModel({ checkins: next })

  assert.equal(previousModel.bestStreak, 5)
  assert.equal(nextModel.bestStreak, 5)
  for (const id of SERIES_BADGE_IDS) {
    assert.equal(previousModel.badges.find(b => b.id === id).done, true)
  }

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked, null, 'ретро-значки из прошлой серии не запускают шторку')
})

// ── Новый чек-ин: значок, полученный именно сейчас, запускает шторку ──

test('новый чек-ин, доводящий серию до 5, запускает шторку для streak-five', () => {
  // 4 дня подряд в прошлом + сегодняшний = 5.
  const history = [-4, -3, -2, -1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildSeriesViewModel({ checkins: previous })
  const nextModel = buildSeriesViewModel({ checkins: next })

  // previous: bestStreak = 4 → streak-five не открыт
  assert.equal(previousModel.bestStreak, 4)
  assert.equal(previousModel.badges.find(b => b.id === 'streak-five').done, false)

  // next: bestStreak = 5 → streak-five открыт
  assert.equal(nextModel.bestStreak, 5)
  assert.equal(nextModel.badges.find(b => b.id === 'streak-five').done, true)

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked?.id, 'streak-five', 'шторка для streak-five, полученного новым чек-ином')
})

test('новый чек-ин, доводящий серию до 2, запускает шторку для streak-two', () => {
  const history = [-1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildSeriesViewModel({ checkins: previous })
  const nextModel = buildSeriesViewModel({ checkins: next })

  assert.equal(previousModel.bestStreak, 1)
  assert.equal(nextModel.bestStreak, 2)

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked?.id, 'streak-two')
})

test('первый чек-ин запускает шторку для first-step', () => {
  const history = [checkinDay(0)]
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildSeriesViewModel({ checkins: previous })
  const nextModel = buildSeriesViewModel({ checkins: next })

  assert.equal(previousModel.badges.find(b => b.id === 'first-step').done, false)
  assert.equal(nextModel.badges.find(b => b.id === 'first-step').done, true)

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked?.id, 'first-step')
})

// ── Гонка с пустым состоянием: fresh history используется для обеих моделей ──

test('гонка: даже если состояние было пустым, ретро-значки не запускают шторку', () => {
  // Имитация гонки: API вернуло историю с серией 5, включая сегодня.
  // Раньше previousModel строился из пустого checkinHistory state.
  // Теперь previous строится из той же свежей истории без сегодняшнего дня.
  const history = [-4, -3, -2, -1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  // previous содержит 4 дня (без сегодня) — bestStreak = 4
  const previousModel = buildSeriesViewModel({ checkins: previous })
  // next содержит 5 дней — bestStreak = 5
  const nextModel = buildSeriesViewModel({ checkins: next })

  // В этом случае streak-five открыт новым чек-ином — шторка должна показать.
  // Это НЕ ретро-зачёт: серия 5 достигнута именно сегодняшним чек-ином.
  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked?.id, 'streak-five')
})

test('гонка: серия 5 из далёкого прошлого + сегодняшний чек-ин — ретро, шторки нет', () => {
  // Серия 5 была месяц назад, сегодня — одиночный чек-ин.
  // bestStreak = 5 из истории, не из сегодняшнего дня.
  const history = [
    ...[-35, -34, -33, -32, -31].map(checkinDay),
    checkinDay(0),
  ]
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildSeriesViewModel({ checkins: previous })
  const nextModel = buildSeriesViewModel({ checkins: next })

  assert.equal(previousModel.bestStreak, 5)
  assert.equal(nextModel.bestStreak, 5)

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked, null, 'ретро-значки из далёкого прошлого не запускают шторку')
})

// ── Edge cases ──

test('splitCheckinsForComparison без todayCheckin возвращает одинаковые списки', () => {
  const history = [-2, -1, 0].map(checkinDay)
  const { previous, next } = splitCheckinsForComparison(history, null)
  assert.deepEqual(previous, next)
})

test('detectNewlyUnlockedBadge без nextModel возвращает null', () => {
  assert.equal(detectNewlyUnlockedBadge(null, null), null)
  assert.equal(detectNewlyUnlockedBadge({}, null), null)
})
