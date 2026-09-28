import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildServerSeriesViewModel,
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

const STREAK_BADGE_IDS = ['streak-two', 'streak-three', 'streak-five', 'week-on-path', 'month-on-path']

// ── Ретро-зачёт: значки из истории не запускают шторку ──

test('ретро-значки при длинной истории не запускают шторку (история уже содержит их)', () => {
  // Пользователь с серией 5 дней в прошлом + сегодняшний чек-ин.
  // Значки first-step/voice-heard открыты историческими данными.
  const history = [-5, -4, -3, -2, -1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildServerSeriesViewModel({ checkins: previous })
  const nextModel = buildServerSeriesViewModel({ checkins: next })

  // Оба значка открыты в обеих моделях — ретро-зачёт.
  for (const id of ['first-step', 'voice-heard']) {
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

test('ретро-значки при разорванной серии (история из прошлого) не запускают шторку', () => {
  // 5 дней в прошлом, пропуск, затем сегодняшний чек-ин.
  const history = [
    ...[-9, -8, -7, -6, -5].map(checkinDay),
    checkinDay(0),
  ]
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildServerSeriesViewModel({ checkins: previous })
  const nextModel = buildServerSeriesViewModel({ checkins: next })

  assert.equal(previousModel.badges.find(b => b.id === 'voice-heard').done, true)
  assert.equal(nextModel.badges.find(b => b.id === 'voice-heard').done, true)

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked, null, 'ретро-значки из прошлой серии не запускают шторку')
})

// ── Новый чек-ин: значок, полученный именно сейчас, запускает шторку ──

test('новый чек-ин, доводящий счётчик до 5, запускает шторку для voice-heard', () => {
  // 4 чек-ина в прошлом + сегодняшний = 5.
  const history = [-4, -3, -2, -1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildServerSeriesViewModel({ checkins: previous })
  const nextModel = buildServerSeriesViewModel({ checkins: next })

  // previous: 4 чек-ина → voice-heard не открыт
  assert.equal(previousModel.badges.find(b => b.id === 'voice-heard').done, false)

  // next: 5 чек-инов → voice-heard открыт
  assert.equal(nextModel.badges.find(b => b.id === 'voice-heard').done, true)

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked?.id, 'voice-heard', 'шторка для voice-heard, полученного новым чек-ином')
})

test('первый чек-ин запускает шторку для first-step', () => {
  const history = [checkinDay(0)]
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildServerSeriesViewModel({ checkins: previous })
  const nextModel = buildServerSeriesViewModel({ checkins: next })

  assert.equal(previousModel.badges.find(b => b.id === 'first-step').done, false)
  assert.equal(nextModel.badges.find(b => b.id === 'first-step').done, true)

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked?.id, 'first-step')
})

// ── Серийные значки не запускают шторку на клиенте ──

test('серийные значки закрыты в моделях сравнения и не запускают шторку', () => {
  // Числа мягкой серии приходят с сервера; в моделях сравнения
  // (buildServerSeriesViewModel без canonicalStats) серийные значки
  // закрыты, и шторка для них не срабатывает — их открывает только
  // серверная статистика, а Today дополнительно фильтрует их.
  const history = [-4, -3, -2, -1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildServerSeriesViewModel({ checkins: previous })
  const nextModel = buildServerSeriesViewModel({ checkins: next })

  for (const id of STREAK_BADGE_IDS) {
    assert.equal(nextModel.badges.find(b => b.id === id).done, false, `${id} закрыт без серверной статистики`)
  }

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.notEqual(unlocked?.id, undefined)
  assert.ok(!STREAK_BADGE_IDS.includes(unlocked.id), 'серийный значок не запускает шторку')
})

// ── Гонка с пустым состоянием: fresh history используется для обеих моделей ──

test('гонка: даже если состояние было пустым, ретро-значки не запускают шторку', () => {
  // Имитация гонки: API вернуло историю с 5 чек-инами, включая сегодня.
  // previous строится из той же свежей истории без сегодняшнего дня.
  const history = [-4, -3, -2, -1, 0].map(checkinDay)
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  // previous содержит 4 дня (без сегодня) → voice-heard (порог 5) закрыт
  const previousModel = buildServerSeriesViewModel({ checkins: previous })
  // next содержит 5 дней → voice-heard открыт именно сегодняшним чек-ином.
  const nextModel = buildServerSeriesViewModel({ checkins: next })

  const unlocked = detectNewlyUnlockedBadge(previousModel, nextModel)
  assert.equal(unlocked?.id, 'voice-heard')
})

test('гонка: серия 5 из далёкого прошлого + сегодняшний чек-ин — ретро, шторки нет', () => {
  // Серия 5 была месяц назад, сегодня — одиночный чек-ин.
  const history = [
    ...[-35, -34, -33, -32, -31].map(checkinDay),
    checkinDay(0),
  ]
  const todayCheckin = checkinDay(0)
  const { previous, next } = splitCheckinsForComparison(history, todayCheckin)

  const previousModel = buildServerSeriesViewModel({ checkins: previous })
  const nextModel = buildServerSeriesViewModel({ checkins: next })

  assert.equal(previousModel.badges.find(b => b.id === 'voice-heard').done, true)
  assert.equal(nextModel.badges.find(b => b.id === 'voice-heard').done, true)

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
