import test from 'node:test'
import assert from 'node:assert/strict'

import { findLilaCard, LILA_DISCOVER_CARDS } from '../../src/data/lilaDiscoverCards.js'

test('Lila MVP ships three bounded static discovery cards', () => {
  assert.equal(LILA_DISCOVER_CARDS.length, 3)
  for (const card of LILA_DISCOVER_CARDS) {
    assert.ok(card.id)
    assert.ok(card.topic)
    assert.equal(card.questions.length, 3)
    assert.ok(card.questions.every(question => question.length > 10))
  }
})

test('Lila card lookup is allowlisted and unknown ids are rejected', () => {
  assert.equal(findLilaCard('stuck')?.topic, 'движение')
  assert.equal(findLilaCard('tension')?.topic, 'отношения')
  assert.equal(findLilaCard('direction')?.topic, 'направление')
  assert.equal(findLilaCard('unknown'), null)
})
