import assert from 'node:assert/strict'
import { test } from 'node:test'

import { MORNING_RETURN_FLOW, EVENING_RETURN_FLOW, parseReturnFlow, returnFlowEvent, claimReturnFlowEvent } from '../../src/lib/returnFlow.js'

test('parseReturnFlow accepts morning_v1 and evening_v1', () => {
  assert.equal(parseReturnFlow(MORNING_RETURN_FLOW), MORNING_RETURN_FLOW)
  assert.equal(parseReturnFlow(EVENING_RETURN_FLOW), EVENING_RETURN_FLOW)
  assert.equal(parseReturnFlow('morning_v2'), null)
  assert.equal(parseReturnFlow('action=morning_v1'), null)
  assert.equal(parseReturnFlow(''), null)
})

test('события вечернего потока не смешиваются с утренними и не дублируются', () => {
  const id = `test-${Math.random()}`
  for (const suffix of ['flow_opened', 'action_started', 'action_completed', 'flow_skipped']) {
    const eveningEvent = returnFlowEvent(EVENING_RETURN_FLOW, suffix)
    assert.equal(eveningEvent, `evening_${suffix}`)
    assert.equal(claimReturnFlowEvent(id, EVENING_RETURN_FLOW, eveningEvent), true)
    assert.equal(claimReturnFlowEvent(id, EVENING_RETURN_FLOW, eveningEvent), false)
    assert.equal(claimReturnFlowEvent(id, MORNING_RETURN_FLOW, returnFlowEvent(MORNING_RETURN_FLOW, suffix)), true)
  }
})
