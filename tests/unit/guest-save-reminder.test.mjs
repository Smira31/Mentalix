import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hideGuestSaveReminder, shouldShowGuestSaveReminder } from '../../src/lib/guestSaveReminder.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

const guest = { id: 17, is_guest: true, email: null }
const today = Date.now()

function eligible(user, storage, options = {}) {
  return shouldShowGuestSaveReminder({ user, storage, platformName: 'web', hasEntries: true, now: today, ...options })
}

test('only a web guest with a record sees the reminder', () => {
  const storage = memoryStorage()
  assert.equal(eligible(guest, storage), true)
  assert.equal(eligible(guest, storage, { platformName: 'telegram' }), false)
  assert.equal(eligible({ ...guest, is_guest: false }, storage), false)
  assert.equal(eligible({ ...guest, email: 'me@example.invalid' }, storage), false)
  assert.equal(eligible(guest, storage, { hasEntries: false }), false)
  assert.equal(eligible(guest, storage, { hasEntries: false, demoGuest: true }), true)
})

test('dismissing hides for seven days on the same device and only for that guest', () => {
  const storage = memoryStorage()
  hideGuestSaveReminder(guest.id, storage, today)
  assert.equal(eligible(guest, storage), false)
  assert.equal(eligible({ ...guest, id: 18 }, storage), true)
  assert.equal(eligible(guest, storage, { now: today + 7 * 24 * 60 * 60 * 1000 - 1 }), false)
  assert.equal(eligible(guest, storage, { now: today + 7 * 24 * 60 * 60 * 1000 }), true)
})
