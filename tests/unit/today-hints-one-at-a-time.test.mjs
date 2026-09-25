import assert from 'node:assert/strict'
import test from 'node:test'

import { TODAY_HINT_ORDER, pickVisibleTodayHint } from '../../src/lib/todayHints.js'

function visibleHints(eligible) {
  const visible = pickVisibleTodayHint(eligible)
  return TODAY_HINT_ORDER.filter(id => id === visible)
}

test('одновременно видна максимум одна подсказка', () => {
  const combos = [
    { series: false, cards: false },
    { series: true, cards: false },
    { series: false, cards: true },
    { series: true, cards: true },
  ]
  for (const eligible of combos) {
    assert.ok(visibleHints(eligible).length <= 1, JSON.stringify(eligible))
  }
})

test('порядок сохранён: сначала серия, после её закрытия — карточки', () => {
  assert.equal(pickVisibleTodayHint({ series: true, cards: true }), 'series')
  assert.equal(pickVisibleTodayHint({ series: false, cards: true }), 'cards')
  assert.equal(pickVisibleTodayHint({ series: false, cards: false }), null)
})
