import assert from 'node:assert/strict'
import { test } from 'node:test'
import { logEngagementEvent } from '../../src/lib/engagementEvents.js'

const user = { id: `user-${Math.random()}` }

test('значок отправляется один раз при повторных показах и StrictMode', async () => {
  const calls = []
  const send = (...args) => { calls.push(args); return Promise.resolve() }
  const args = { user, demo: false, event: 'badge_earned', entityType: 'badge', entityId: 'first-step', once: 'first-step', send }
  logEngagementEvent(args)
  logEngagementEvent(args)
  logEngagementEvent({ ...args, entityId: 'voice-heard', once: 'voice-heard' })
  assert.deepEqual(calls, [
    [user.id, 'badge_earned', 'badge', 'first-step'],
    [user.id, 'badge_earned', 'badge', 'voice-heard'],
  ])
})

test('демо, гость без сессии и отсутствие пользователя не отправляют события', () => {
  const calls = []
  const send = (...args) => calls.push(args)
  for (const options of [
    { user, demo: true },
    { user: { ...user, demo: true }, demo: false },
    { user: { ...user, is_guest: true }, demo: false },
    { user: null, demo: false },
  ]) logEngagementEvent({ ...options, event: 'teaser_shown', send })
  assert.equal(calls.length, 0)
})

test('ошибки отправки не влияют на экран', async () => {
  logEngagementEvent({ user, event: 'teaser_shown', send: () => { throw Error('offline') } })
  logEngagementEvent({ user, event: 'streak_freeze_seen', send: () => Promise.reject(Error('offline')) })
  await new Promise(resolve => setImmediate(resolve))
})
