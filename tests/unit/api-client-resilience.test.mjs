import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const normalized = source.replace(/\s+/g, ' ')

test('API client defines a bounded timeout and normalized error shape', () => {
  assert.match(source, /const API_TIMEOUT_MS = 10_000/)
  assert.match(source, /new AbortController\(\)/)
  assert.match(source, /kind = 'unknown'/)
  assert.match(source, /kind: 'timeout'/)
  assert.match(source, /kind: 'network'/)
  assert.match(source, /kind: 'protocol'/)
})

test('API client retries only safe idempotent methods and transient failures', () => {
  assert.match(source, /new Set\(\['GET', 'HEAD', 'OPTIONS'\]\)/)
  assert.match(source, /const canRetry = RETRYABLE_METHODS\.has\(method\)/)
  assert.match(source, /status >= 500/)
  assert.match(source, /attempt < API_MAX_RETRIES/)
  assert.match(normalized, /method = \(options\.method \|\| 'GET'\)\.toUpperCase\(\)/)
})

test('API client never retries mutation methods by default', () => {
  assert.doesNotMatch(source, /RETRYABLE_METHODS = new Set\(\['POST'/)
  assert.match(source, /delete fetchOptions\.timeoutMs/)
  assert.match(source, /throw normalized/)
})
