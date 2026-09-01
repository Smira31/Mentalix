import assert from 'node:assert/strict'
import { test } from 'node:test'

import { MORNING_RETURN_FLOW, parseReturnFlow } from '../../src/lib/returnFlow.js'

test('parseReturnFlow accepts only morning_v1', () => {
  assert.equal(parseReturnFlow(MORNING_RETURN_FLOW), MORNING_RETURN_FLOW)
  assert.equal(parseReturnFlow('morning_v2'), null)
  assert.equal(parseReturnFlow('action=morning_v1'), null)
  assert.equal(parseReturnFlow(''), null)
})
