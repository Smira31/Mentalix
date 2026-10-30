import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DESKTOP_FRAME_GUTTERS,
  DESKTOP_FRAME_MIN_SCALE,
  DESKTOP_FRAME_VIEWPORT,
  desktopFrameScale,
} from '../../src/lib/desktopFrame.js'

/*
 * Рамка телефона в обычном браузере на компьютере — логический размер
 * iPhone 16 Pro Max (440×956). Если окно ниже, рамка уменьшается
 * пропорционально и целиком влезает без прокрутки страницы.
 */

test('рамка на компьютере: логический размер iPhone 16 Pro Max 440×956', () => {
  assert.deepEqual(DESKTOP_FRAME_VIEWPORT, { width: 440, height: 956 })
})

test('рамка на компьютере: высокое окно — масштаб 1', () => {
  assert.equal(desktopFrameScale(1080), 1)
  assert.equal(desktopFrameScale(DESKTOP_FRAME_VIEWPORT.height + DESKTOP_FRAME_GUTTERS), 1)
})

test('рамка на компьютере: низкое окно — пропорциональное уменьшение без прокрутки', () => {
  const scale = desktopFrameScale(700)

  assert.ok(scale < 1)
  assert.ok(DESKTOP_FRAME_VIEWPORT.height * scale + DESKTOP_FRAME_GUTTERS <= 700)
})

test('рамка на компьютере: очень низкое окно не уменьшает рамку до нуля', () => {
  assert.equal(desktopFrameScale(200), DESKTOP_FRAME_MIN_SCALE)
})

test('рамка на компьютере: некорректная высота окна не ломает масштаб', () => {
  assert.equal(desktopFrameScale(undefined), 1)
  assert.equal(desktopFrameScale(Number.NaN), 1)
})
