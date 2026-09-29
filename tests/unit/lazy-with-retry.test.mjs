import test from 'node:test'
import assert from 'node:assert/strict'
import { isChunkLoadError, loadWithRetry } from '../../src/lib/lazyWithRetry.js'

/*
 * Механизм повторов ленивых чанков (регрессия «чёрного экрана» в
 * Telegram WebView): ошибку чанка повторяем один раз, любую другую
 * отдаём наверх сразу, «висящий» импорт прерываем по таймауту.
 */

test('isChunkLoadError узнаёт формулировки браузеров и WebView', () => {
  const chunkMessages = [
    'Importing a module script failed',
    'Failed to fetch',
    'Load failed',
    'error loading dynamically imported module',
    'Unable to preload CSS for chunk',
    'Module import timed out',
  ]

  for (const message of chunkMessages) {
    assert.equal(isChunkLoadError(new Error(message)), true, message)
  }

  assert.equal(isChunkLoadError(new Error('Обычная ошибка экрана')), false)
  assert.equal(isChunkLoadError('Failed to fetch'), true)
})

test('ошибка чанка повторяется и второй импорт выигрывает', async () => {
  let calls = 0

  const value = await loadWithRetry(async () => {
    calls += 1
    if (calls === 1) throw new Error('Failed to fetch')
    return 'screen'
  })

  assert.equal(value, 'screen')
  assert.equal(calls, 2)
})

test('не-чанковая ошибка не тратит повтор', async () => {
  let calls = 0

  await assert.rejects(
    loadWithRetry(async () => {
      calls += 1
      throw new Error('Ошибка данных')
    }),
    /Ошибка данных/
  )

  assert.equal(calls, 1)
})

test('исчерпан повтор — последняя ошибка чанка уходит наверх', async () => {
  await assert.rejects(
    loadWithRetry(async () => {
      throw new Error('Failed to fetch')
    }, { retries: 1 }),
    /Failed to fetch/
  )
})

test('висящий импорт прерывается таймаутом и повторяется', async () => {
  let calls = 0

  const value = await loadWithRetry(
    () => {
      calls += 1
      if (calls === 1) return new Promise(() => {})
      return Promise.resolve('late-screen')
    },
    { timeoutMs: 5 }
  )

  assert.equal(value, 'late-screen')
  assert.equal(calls, 2)
})
