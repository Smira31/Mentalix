import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  EDGE_WIDTH,
  EDGE_SWIPE_DISTANCE_RATIO,
  SHEET_CLOSE_RATIO,
  VELOCITY_THRESHOLD,
  isEdgeStart,
  isHorizontalSwipe,
  shouldTriggerEdgeBack,
  shouldTriggerSheetClose,
  edgeBackdropOpacity,
} from '../../src/lib/gestures/swipeThresholds.js'

test('EDGE_WIDTH — полоса 24 px от левого края', () => {
  assert.equal(EDGE_WIDTH, 24)
})

test('isEdgeStart — true в полосе, false за пределами', () => {
  assert.ok(isEdgeStart(0))
  assert.ok(isEdgeStart(24))
  assert.ok(!isEdgeStart(25))
  assert.ok(!isEdgeStart(100))
})

test('isHorizontalSwipe — горизонталь преобладает', () => {
  assert.ok(isHorizontalSwipe(50, 10))
  assert.ok(!isHorizontalSwipe(10, 50))
  assert.ok(isHorizontalSwipe(-50, -10))
})

test('shouldTriggerEdgeBack — 35% ширины ИЛИ скорость > 0.5', () => {
  const screenWidth = 400
  const threshold = screenWidth * EDGE_SWIPE_DISTANCE_RATIO

  // Недостаточно по расстоянию и скорости
  assert.ok(!shouldTriggerEdgeBack(threshold - 10, screenWidth, 0.1))

  // Достаточно по расстоянию
  assert.ok(shouldTriggerEdgeBack(threshold + 10, screenWidth, 0.1))

  // Достаточно по скорости
  assert.ok(shouldTriggerEdgeBack(10, screenWidth, VELOCITY_THRESHOLD + 0.1))

  // Ровно на пороге скорости — не срабатывает (строгое сравнение)
  assert.ok(!shouldTriggerEdgeBack(10, screenWidth, VELOCITY_THRESHOLD))
})

test('shouldTriggerSheetClose — 25% высоты ИЛИ скорость > 0.5', () => {
  const sheetHeight = 600
  const threshold = sheetHeight * SHEET_CLOSE_RATIO

  // Недостаточно
  assert.ok(!shouldTriggerSheetClose(threshold - 10, sheetHeight, 0.1))

  // Достаточно по расстоянию
  assert.ok(shouldTriggerSheetClose(threshold + 10, sheetHeight, 0.1))

  // Достаточно по скорости
  assert.ok(shouldTriggerSheetClose(10, sheetHeight, VELOCITY_THRESHOLD + 0.1))
})

test('edgeBackdropOpacity — растёт от 0 до maxOpacity', () => {
  const screenWidth = 400
  const fullDistance = screenWidth * EDGE_SWIPE_DISTANCE_RATIO

  assert.equal(edgeBackdropOpacity(0, screenWidth), 0)
  assert.equal(edgeBackdropOpacity(fullDistance, screenWidth), 0.5)
  assert.equal(edgeBackdropOpacity(fullDistance * 2, screenWidth), 0.5) // clamp
  assert.equal(edgeBackdropOpacity(fullDistance / 2, screenWidth), 0.25)
  assert.equal(edgeBackdropOpacity(fullDistance * 2, screenWidth, 0.8), 0.8) // custom max
})
