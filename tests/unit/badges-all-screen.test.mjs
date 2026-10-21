import assert from 'node:assert/strict'
import test from 'node:test'

import { badgeCategoryLabel, badgeGroups } from '../../src/lib/badgeCatalog.js'
import { badgeEarnedDate } from '../../src/lib/featuredBadge.js'

const badge = (id, title) => ({ id, title, done: true, progress: 1, goal: 1 })

test('«Все значки»: серия идёт по возрастанию дней, а не по порядку массива', () => {
  // MVP-значки приходят в модель первыми, серверные — следом; порядок внутри
  // группы задаёт каталог, поэтому «Серия» всегда 2 → 3 → 5 → 7 → 30.
  const badges = [
    badge('streak_7', 'Серия: 7 дней'),
    badge('streak_30', '30 дней подряд'),
    badge('streak-two', 'Второй день'),
    badge('streak-three', 'Серия: три дня'),
    badge('streak-five', 'Серия: пять дней'),
  ]
  const series = badgeGroups(badges).find(group => group.title === 'Серия')
  assert.deepEqual(
    series.badges.map(item => item.id),
    ['streak-two', 'streak-three', 'streak-five', 'streak_7', 'streak_30']
  )
})

test('«Все значки»: группы остаются четырьмя и не подмешивают чужие значки', () => {
  const badges = [badge('first_checkin', 'Первый чек-ин'), badge('ritual-holds', 'Ритуал держит')]
  const groups = badgeGroups(badges)
  assert.deepEqual(
    groups.map(group => group.title),
    ['Серия', 'Записи', 'Практики', 'Общие']
  )
  assert.deepEqual(
    groups.find(group => group.title === 'Записи').badges.map(item => item.id),
    ['first_checkin']
  )
  assert.deepEqual(groups.find(group => group.title === 'Серия').badges, [])
})

test('метка шторки значка выбирается по категории', () => {
  assert.equal(badgeCategoryLabel('streak-two'), 'ЗНАЧОК СЕРИИ')
  assert.equal(badgeCategoryLabel('streak_30'), 'ЗНАЧОК СЕРИИ')
  assert.equal(badgeCategoryLabel('first_checkin'), 'ЗНАЧОК ЗАПИСЕЙ')
  assert.equal(badgeCategoryLabel('first_journal'), 'ЗНАЧОК ЗАПИСЕЙ')
  assert.equal(badgeCategoryLabel('ritual-holds'), 'ЗНАЧОК ПРАКТИК')
  assert.equal(badgeCategoryLabel('asceza-power'), 'ЗНАЧОК ПРАКТИК')
  assert.equal(badgeCategoryLabel('week-on-path'), 'ОБЩИЙ ЗНАЧОК')
  assert.equal(badgeCategoryLabel('active_days_100'), 'ОБЩИЙ ЗНАЧОК')
  assert.equal(badgeCategoryLabel('unknown-badge'), 'ОБЩИЙ ЗНАЧОК')
})

test('дата получения значка: «18 октября», без даты — null', () => {
  assert.equal(badgeEarnedDate({ earnedAt: '2026-10-18T12:00:00Z' }), '18 октября')
  assert.equal(badgeEarnedDate({ earned_at: '2026-10-18T12:00:00Z' }), '18 октября')
  assert.equal(badgeEarnedDate({}), null)
  assert.equal(badgeEarnedDate({ earnedAt: 'not-a-date' }), null)
})
