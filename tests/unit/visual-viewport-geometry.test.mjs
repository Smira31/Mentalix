import assert from 'node:assert/strict'
import test from 'node:test'

import { readVisualViewportGeometry } from '../../src/lib/visualViewport.js'

test('MXL-VISUAL-VIEWPORT-RACE-001 reads height and offsetTop from one keyboard snapshot', () => {
  const geometry = readVisualViewportGeometry({ height: 508.4, offsetTop: 23.6 })

  assert.deepEqual(geometry, { height: 508, offsetTop: 24 })
})

test('MXL-VISUAL-VIEWPORT-RACE-001 clamps negative offsetTop and height', () => {
  const geometry = readVisualViewportGeometry({ height: -12, offsetTop: -4 })

  assert.deepEqual(geometry, { height: 0, offsetTop: 0 })
})

test('MXL-VISUAL-VIEWPORT-RACE-001 returns null without visualViewport', () => {
  assert.equal(readVisualViewportGeometry(null), null)
})
