import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AVAILABLE_PRACTICES,
  PRACTICE_KEYS,
  isPracticeAvailable,
} from '../../src/config/practiceAvailability.js'
import { withQuery } from '../../src/lib/apiQuery.js'

test('allowlist сохраняет текущие шесть доступных практик', () => {
  assert.deepEqual(AVAILABLE_PRACTICES, [
    'rituals',
    'ascezas',
    'first-step',
    'no-blame',
    'narrow-focus',
    'one-finish',
  ])

  assert.equal(isPracticeAvailable(PRACTICE_KEYS.brain), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.breathing), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.focus), false)
  assert.equal(isPracticeAvailable(PRACTICE_KEYS.meditation), false)
  assert.equal(isPracticeAvailable('unknown-practice'), false)
})

test('withQuery сохраняет порядок и кодирует значения', () => {
  assert.equal(
    withQuery('/mentalix/messages', { user_id: 42, persona: 'mentor & guide' }),
    '/mentalix/messages?user_id=42&persona=mentor+%26+guide'
  )
})

test('withQuery пропускает только null/undefined и не добавляет пустой query', () => {
  assert.equal(withQuery('/articles'), '/articles')
  assert.equal(
    withQuery('/example', { empty: null, missing: undefined, zero: 0, disabled: false }),
    '/example?zero=0&disabled=false'
  )
})
