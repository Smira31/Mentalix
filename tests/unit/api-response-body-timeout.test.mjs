import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

// Исполняем сам helper api.js, изолируя только браузерные импорты.
const source = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const errorClass = source.slice(
  source.indexOf('export class ApiError'),
  source.indexOf('\nfunction isRetryableStatus')
)
const helper = source.slice(
  source.indexOf('async function fetchWithTimeout'),
  source.indexOf('\n/*\n * MXL-SECURITY')
)

function client(fetch) {
  return new Function(
    'fetch',
    `${errorClass.replace('export ', '')}\n${helper}\nreturn fetchWithTimeout`
  )(fetch)
}

function slowBody(onSignal) {
  return async (_url, { signal }) => {
    onSignal?.(signal)
    return {
      status: 200,
      ok: true,
      text: () =>
        new Promise((resolve, reject) => {
          if (signal.aborted) return reject(signal.reason)
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        }),
    }
  }
}

test('таймаут продолжает действовать после заголовков до чтения тела', async () => {
  let signal
  const fetchWithTimeout = client(
    slowBody(value => {
      signal = value
    })
  )
  await assert.rejects(fetchWithTimeout('/slow', {}, 20), error => error.kind === 'timeout')
  assert.equal(signal.aborted, true)
})

test('отмена вызывающего во время тела нормализуется как aborted', async () => {
  const controller = new AbortController()
  const fetchWithTimeout = client(
    slowBody(() => setTimeout(() => controller.abort(new Error('cancel')), 5))
  )
  await assert.rejects(
    fetchWithTimeout('/slow', { signal: controller.signal }, 100),
    error => error.kind === 'aborted'
  )
})

test('успешное чтение не отменяется последующим таймаутом или caller abort', async () => {
  const controller = new AbortController()
  let signal
  const fetchWithTimeout = client(async (_url, options) => {
    signal = options.signal
    return { ok: true, status: 200, text: async () => '{"ok":true}' }
  })
  const { res, raw } = await fetchWithTimeout('/fast', { signal: controller.signal }, 10)
  assert.equal(res.status, 200)
  assert.deepEqual(JSON.parse(raw), { ok: true })
  controller.abort()
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(signal.aborted, false)
})

test('обычная ошибка чтения тела сохраняет прежнюю обработку без сетевого retry', async () => {
  const original = new TypeError('body read failed')
  const fetchWithTimeout = client(async () => ({
    text: async () => {
      throw original
    },
  }))
  await assert.rejects(fetchWithTimeout('/body-error', {}, 20), error => error === original)
})

test('ошибка сети сохраняет прежнюю нормализацию', async () => {
  const fetchWithTimeout = client(async () => {
    throw new TypeError('network')
  })
  await assert.rejects(fetchWithTimeout('/offline', {}, 20), error => error.kind === 'network')
})
