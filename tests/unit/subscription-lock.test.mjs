import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * Юнит-тест выбора значка-замка для экрана «Подписка».
 *
 * lockArtKind — чистая функция: 'lock' (закрытый замок) только для
 * неоплаченных состояний, 'unlock' (открытый замок) — для Pro активен
 * и экрана успеха. Замок (закрытый) — только у неоплаченных состояний.
 */

const { lockArtKind } = await import(
  new URL('../../src/lib/subscriptionState.js', import.meta.url)
)

test('неоплаченные состояния → закрытый замок (lock)', () => {
  assert.equal(lockArtKind('guest'), 'lock')
  assert.equal(lockArtKind('base'), 'lock')
  assert.equal(lockArtKind('expired'), 'lock')
  assert.equal(lockArtKind('pending'), 'lock')
  assert.equal(lockArtKind('loading'), 'lock')
})

test('Pro активен и экран успеха → открытый замок (unlock)', () => {
  assert.equal(lockArtKind('pro'), 'unlock')
  assert.equal(lockArtKind('success'), 'unlock')
})

test('неоплаченные состояния никогда не дают unlock', () => {
  for (const state of ['guest', 'base', 'expired', 'pending', 'loading']) {
    assert.notEqual(lockArtKind(state), 'unlock')
  }
})
