import assert from 'node:assert/strict'
import test from 'node:test'

import { isRealPhone } from '../../src/lib/demoMode.js'

function makeWindow({ coarse, screenWidth, innerWidth, standalone = false }) {
  return {
    matchMedia: query =>
      query === '(pointer: coarse)'
        ? { matches: coarse }
        : { matches: standalone ? query === '(display-mode: standalone)' : false },
    screen: { width: screenWidth },
    innerWidth,
    navigator: { standalone: false },
  }
}

test('coarse pointer + узкий экран = настоящий телефон', () => {
  assert.equal(
    isRealPhone(makeWindow({ coarse: true, screenWidth: 393, innerWidth: 393 })),
    true,
  )
})

test('coarse pointer + innerWidth уже screen = телефон', () => {
  assert.equal(
    isRealPhone(makeWindow({ coarse: true, screenWidth: 430, innerWidth: 380 })),
    true,
  )
})

test('coarse pointer + ровно 500px = телефон (граница)', () => {
  assert.equal(
    isRealPhone(makeWindow({ coarse: true, screenWidth: 500, innerWidth: 500 })),
    true,
  )
})

test('coarse pointer + 501px = не телефон', () => {
  assert.equal(
    isRealPhone(makeWindow({ coarse: true, screenWidth: 501, innerWidth: 501 })),
    false,
  )
})

test('fine pointer (десктоп) + узкий экран = не телефон', () => {
  assert.equal(
    isRealPhone(makeWindow({ coarse: false, screenWidth: 393, innerWidth: 393 })),
    false,
  )
})

test('fine pointer + широкий экран = не телефон', () => {
  assert.equal(
    isRealPhone(makeWindow({ coarse: false, screenWidth: 1920, innerWidth: 1280 })),
    false,
  )
})

test('без window (SSR) = false', () => {
  assert.equal(isRealPhone(null), false)
})

test('без matchMedia = false', () => {
  assert.equal(isRealPhone({ screen: { width: 393 }, innerWidth: 393 }), false)
})

test('без screen.width — fallback на innerWidth', () => {
  assert.equal(
    isRealPhone({ matchMedia: () => ({ matches: true }), innerWidth: 400 }),
    true,
  )
})
