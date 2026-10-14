import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PRO_POLL_INTERVAL_MS,
  PRO_POLL_MAX_ATTEMPTS,
  PRO_POLL_WINDOW_MS,
  ProPollCancelledError,
  ProPollTimeoutError,
  pollGenerationReady,
} from '../../src/lib/proGenerationPolling.js'

/*
 * PRO-002b/c: правила ограниченного опроса GET после POST-ответа
 * 409 generation_in_progress. Контракт (backend/pro/router.py):
 * GET не возвращает generation_in_progress, поэтому повторная POST-генерация
 * не отправляется — только GET до ready или терминального состояния.
 */

test('готовое состояние возвращает сразу и не выполняет лишних запросов', async () => {
  let calls = 0
  const final = await pollGenerationReady(
    () => {
      calls += 1
      return Promise.resolve({ status: 'ready', report: { week_start: '2026-10-05' } })
    },
    { intervalMs: 1 }
  )
  assert.equal(final.status, 'ready')
  assert.equal(calls, 1)
})

test('промежуточное not_generated не останавливает опрос, готовое — останавливает', async () => {
  const statuses = ['not_generated', 'not_generated', 'ready']
  let calls = 0
  const final = await pollGenerationReady(
    () => Promise.resolve({ status: statuses[calls++] }),
    { intervalMs: 1 }
  )
  assert.equal(final.status, 'ready')
  assert.equal(calls, 3)
})

test('опрос ограничен числом попыток и завершается ProPollTimeoutError', async () => {
  let calls = 0
  await assert.rejects(
    pollGenerationReady(
      () => {
        calls += 1
        return Promise.resolve({ status: 'not_generated' })
      },
      { intervalMs: 1, maxAttempts: 4 }
    ),
    ProPollTimeoutError
  )
  assert.equal(calls, 4)
  assert.ok(PRO_POLL_MAX_ATTEMPTS >= 2)
})

test('окно опроса покрывает таймаут AI-генерации (60 с, как POST в api.js)', () => {
  assert.equal(PRO_POLL_WINDOW_MS, 60_000)
  assert.equal(PRO_POLL_MAX_ATTEMPTS, 30)
  assert.equal(PRO_POLL_INTERVAL_MS, 2000)
})

test('терминальные состояния ошибки генерации останавливают опрос', async () => {
  for (const status of ['consent_required', 'insufficient_data', 'report_required']) {
    let calls = 0
    const final = await pollGenerationReady(
      () => {
        calls += 1
        return Promise.resolve({ status })
      },
      { intervalMs: 1 }
    )
    assert.equal(final.status, status)
    assert.equal(calls, 1)
  }
})

test('отмена (размонтирование экрана) прекращает опрос с ProPollCancelledError', async () => {
  let calls = 0
  await assert.rejects(
    pollGenerationReady(
      () => {
        calls += 1
        return Promise.resolve({ status: 'not_generated' })
      },
      { intervalMs: 1, isCancelled: () => calls >= 2 }
    ),
    ProPollCancelledError
  )
  assert.equal(calls, 2)
})
