import assert from 'node:assert/strict'
import test from 'node:test'

import { createDismissCallback } from '../../src/lib/useAutoDismissOnScroll.js'

function makeEntry({ isIntersecting, intersectionRatio, top }) {
  return {
    isIntersecting,
    intersectionRatio,
    boundingClientRect: { top },
  }
}

test('видима → ушла вверх → onDismiss вызван один раз', () => {
  let calls = 0
  const callback = createDismissCallback(() => calls++)

  // Подсказка видна (≥50%)
  callback([makeEntry({ isIntersecting: true, intersectionRatio: 0.6, top: 100 })])
  assert.equal(calls, 0, 'не должен вызываться, пока подсказка видна')

  // Полностью ушла за верхний край
  callback([makeEntry({ isIntersecting: false, intersectionRatio: 0, top: -50 })])
  assert.equal(calls, 1, 'onDismiss должен быть вызван один раз')

  // Повторное срабатывание — не вызывается снова
  callback([makeEntry({ isIntersecting: false, intersectionRatio: 0, top: -100 })])
  assert.equal(calls, 1, 'onDismiss не должен вызываться повторно')
})

test('ушла вниз, не показавшись → onDismiss не вызван', () => {
  let calls = 0
  const callback = createDismissCallback(() => calls++)

  // Подсказка не была видна и ушла вниз (top ≥ 0)
  callback([makeEntry({ isIntersecting: false, intersectionRatio: 0, top: 800 })])
  assert.equal(calls, 0, 'не должен вызываться, если не был виден и ушёл вниз')

  // Даже если потом «ушла вверх» — не была видна, не вызываем
  callback([makeEntry({ isIntersecting: false, intersectionRatio: 0, top: -50 })])
  assert.equal(calls, 0, 'не должен вызываться без предварительной видимости')
})

test('видима менее 50% → ушла вверх → onDismiss не вызван', () => {
  let calls = 0
  const callback = createDismissCallback(() => calls++)

  // Видна только на 30% — порог не пройден
  callback([makeEntry({ isIntersecting: true, intersectionRatio: 0.3, top: 100 })])
  assert.equal(calls, 0)

  // Ушла вверх
  callback([makeEntry({ isIntersecting: false, intersectionRatio: 0, top: -50 })])
  assert.equal(calls, 0, 'не должен вызываться, если не достиг порога 50%')
})
