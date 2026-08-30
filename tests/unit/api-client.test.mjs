import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')

test('API-клиент задаёт единый timeout и ограниченный retry policy', () => {
  assert.match(source, /DEFAULT_TIMEOUT_MS = 10_000/)
  assert.match(source, /DEFAULT_RETRIES = 2/)
  assert.match(source, /isRetryableMethod\(method\)/)
  assert.match(source, /\['GET', 'HEAD', 'OPTIONS'\]/)
  assert.match(source, /isRetryableResponse\(response\.status\)/)
  assert.match(source, /250 \* 2 \*\* attempt/)
})

test('API-клиент поддерживает cancellation и нормализует timeout/network ошибки', () => {
  assert.match(source, /AbortController/)
  assert.match(source, /callerSignal\?\.aborted/)
  assert.match(source, /code: 'ABORTED'/)
  assert.match(source, /code: 'TIMEOUT'/)
  assert.match(source, /code: 'NETWORK_ERROR'/)
})

test('API-клиент возвращает структурированный ApiError для HTTP и payload ошибок', () => {
  assert.match(source, /export class ApiError extends Error/)
  assert.match(source, /code: 'HTTP_ERROR'/)
  assert.match(source, /code: 'EMPTY_RESPONSE'/)
  assert.match(source, /code: 'INVALID_JSON'/)
  assert.match(source, /details: raw\.slice\(0, 300\)/)
  assert.match(source, /retryable = code === 'NETWORK_ERROR'/)
})

test('API-клиент экспортирует единый request-контракт для точечных потребителей', () => {
  assert.match(source, /export async function request\(path, options = \{\}\)/)
  assert.match(source, /fetchWithPolicy\(path, \{/)
})
