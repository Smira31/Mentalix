import assert from 'node:assert/strict'
import test from 'node:test'

import { createAuthPort } from '../../src/auth/authPort.js'

test('AuthPort restores an authenticated session from an adapter user', async () => {
  const adapter = {
    name: 'telegram',
    async requestAuth() {
      return { id: 42 }
    },
  }
  const auth = createAuthPort(adapter)

  assert.deepEqual(auth.getSession(), { status: 'unknown', provider: 'telegram' })
  await auth.restore()

  assert.deepEqual(auth.getSession(), {
    status: 'authenticated',
    provider: 'telegram',
    userId: 42,
  })
})

test('AuthPort represents a missing adapter user as anonymous', async () => {
  const auth = createAuthPort({ name: 'web', async requestAuth() {} })

  await auth.restore()

  assert.deepEqual(auth.getSession(), { status: 'anonymous', provider: 'web' })
})

test('AuthPort publishes changes and clear returns to anonymous', async () => {
  const events = []
  const adapter = {
    name: 'native',
    async requestAuth() {
      return { id: 7 }
    },
    clearUser() {
      events.push('adapter-cleared')
    },
  }
  const auth = createAuthPort(adapter)
  const unsubscribe = auth.subscribe(session => events.push(session.status))

  await auth.restore()
  auth.clear()
  unsubscribe()

  assert.deepEqual(events, ['authenticated', 'adapter-cleared', 'anonymous'])
})

test('AuthPort publishes an error state when restore fails', async () => {
  const auth = createAuthPort({
    name: 'web',
    async requestAuth() {
      throw new Error('session unavailable')
    },
  })

  await assert.rejects(auth.restore(), /session unavailable/)
  assert.deepEqual(auth.getSession(), { status: 'error', provider: 'web' })
})
