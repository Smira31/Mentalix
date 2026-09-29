import assert from 'node:assert/strict'
import test from 'node:test'
import { featuredBadge, featuredBadgeCaption } from '../../src/lib/featuredBadge.js'

const badge = (id, done, progress, goal, earnedAt) => ({ id, title: id, done, progress, goal, earnedAt })
const dayBefore = days => new Date(Date.now() - days * 86400000).toISOString()
const expectedDate = value => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
  .format(new Date(value)).replace(/\./g, '')

test('последний полученный по дате, иначе последний по порядку', () => {
  const first = badge('first', true, 1, 1, dayBefore(1))
  const second = badge('second', true, 1, 1, dayBefore(2))
  assert.equal(featuredBadge([first, second, badge('locked', false, 0, 1)]), first)
  assert.equal(featuredBadge([badge('a', true, 1, 1), badge('b', true, 1, 1)]).id, 'b')
  assert.equal(featuredBadge([badge('a', true, 1, 1), second]).id, 'second')
})

test('без полученных выбирает максимальную долю прогресса', () => {
  const badges = [badge('one', false, 2, 5), badge('two', false, 1, 2), badge('three', false, 3, 10)]
  const selected = featuredBadge(badges)
  assert.equal(selected.id, 'two')
  assert.equal(featuredBadgeCaption(selected), '1/2 до получения')
  assert.equal(featuredBadge([]), null)
})

test('полученный показывает дату, а при её отсутствии просто статус', () => {
  const date = dayBefore(1)
  assert.equal(featuredBadgeCaption(badge('first', true, 1, 1, date)), `Получен ${expectedDate(date)}`)
  assert.equal(featuredBadgeCaption(badge('first', true, 1, 1)), 'Получен')
  assert.equal(featuredBadgeCaption({ ...badge('first', true, 1, 1), earnedAt: null, earned_at: date }), `Получен ${expectedDate(date)}`)
})
