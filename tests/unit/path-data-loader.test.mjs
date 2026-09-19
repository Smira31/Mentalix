import assert from 'node:assert/strict'
import test from 'node:test'
import { loadIndependentSources, retrySources, SOURCE_STATES } from '../../src/lib/pathDataLoader.js'

const rejected = (status = 503) => {
  const error = new Error(`failed: ${status}`)
  error.status = status
  return Promise.reject(error)
}

test('loadIndependentSources reports full success and preserves values', async () => {
  const result = await loadIndependentSources({
    rituals: async () => ['ritual'],
    analytics: async () => ({ period_days: 14 }),
  })

  assert.equal(result.status, 'success')
  assert.deepEqual(result.states, { rituals: 'success', analytics: 'success' })
  assert.deepEqual(result.data, { rituals: ['ritual'], analytics: { period_days: 14 } })
  assert.deepEqual(result.failed, [])
})

test('one failed source becomes partial and is not replaced with an empty value', async () => {
  const result = await loadIndependentSources({
    rituals: async () => ['ritual'],
    analytics: () => rejected(503),
  })

  assert.equal(result.status, 'partial')
  assert.equal(result.states.rituals, SOURCE_STATES.success)
  assert.equal(result.states.analytics, SOURCE_STATES.error)
  assert.deepEqual(result.data, { rituals: ['ritual'] })
  assert.equal('analytics' in result.data, false)
})

test('multiple failed sources become error without empty-data masking', async () => {
  const result = await loadIndependentSources({
    rituals: () => rejected(500),
    ascezas: () => rejected(503),
    profile: async () => ({ total_checkins: 2 }),
  })

  assert.equal(result.status, 'partial')
  assert.deepEqual(result.failed.sort(), ['ascezas', 'rituals'])
  assert.deepEqual(result.data, { profile: { total_checkins: 2 } })
})

test('401 and 403 are auth states, distinct from ordinary errors', async () => {
  const result = await loadIndependentSources({
    profile: () => rejected(401),
    rituals: () => rejected(403),
  })

  assert.equal(result.status, 'auth')
  assert.equal(result.states.profile, SOURCE_STATES.auth)
  assert.equal(result.states.rituals, SOURCE_STATES.auth)
  assert.deepEqual(result.auth.sort(), ['profile', 'rituals'])
})

test('retrySources retries only failed sources and keeps successful data', async () => {
  const calls = []
  const first = await loadIndependentSources({
    rituals: async () => {
      calls.push('rituals:first')
      return ['ok']
    },
    analytics: async () => {
      calls.push('analytics:first')
      return rejected(503)
    },
  })

  const retried = await loadIndependentSources(
    {
      rituals: async () => {
        calls.push('rituals:retry')
        return ['must-not-run']
      },
      analytics: async () => {
        calls.push('analytics:retry')
        return { ok: true }
      },
    },
    { only: retrySources(first), previous: first }
  )

  assert.deepEqual(calls, ['rituals:first', 'analytics:first', 'analytics:retry'])
  assert.equal(retried.status, 'success')
  assert.deepEqual(retried.data, { rituals: ['ok'], analytics: { ok: true } })
})
