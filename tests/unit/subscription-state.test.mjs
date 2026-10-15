import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * PAY-UI-001: юнит-тест выбора состояния экрана «Подписка»
 * по ответу /api/subscription.
 *
 * Проверяет getSubscriptionState — чистую функцию, определяющую
 * состояние экрана (guest | base | pro | expired | loading)
 * по данным ответа API и признаку гостя.
 *
 * Контракт: GET /api/subscription возвращает
 *   { tier, expires_at, has_pro, source_provider, auto_renew, days_left }
 */

const { getSubscriptionState } = await import(
  new URL('../../src/lib/subscriptionState.js', import.meta.url)
)

test('гость → состояние guest, покупка недоступна', () => {
  assert.equal(getSubscriptionState({ tier: 'base', has_pro: false }, true), 'guest')
  assert.equal(getSubscriptionState(null, true), 'guest')
  // Даже если API говорит has_pro=true, гость не может быть Pro
  assert.equal(getSubscriptionState({ tier: 'pro', has_pro: true }, true), 'guest')
})

test('нет ответа API → loading', () => {
  assert.equal(getSubscriptionState(null, false), 'loading')
  assert.equal(getSubscriptionState(undefined, false), 'loading')
})

test('has_pro=true → pro (активен)', () => {
  assert.equal(getSubscriptionState({ tier: 'pro', has_pro: true, expires_at: '2026-11-15T00:00:00Z', days_left: 30 }, false), 'pro')
})

test('has_pro=false, expires_at=null → base (никогда не было Pro)', () => {
  assert.equal(getSubscriptionState({ tier: 'base', has_pro: false, expires_at: null, days_left: 0 }, false), 'base')
})

test('has_pro=false, expires_at задан → expired (Pro истёк)', () => {
  assert.equal(
    getSubscriptionState({ tier: 'base', has_pro: false, expires_at: '2026-10-10T00:00:00Z', days_left: 0 }, false),
    'expired'
  )
  // Даже если tier='pro', но has_pro=false и есть expires_at — истёк
  assert.equal(
    getSubscriptionState({ tier: 'pro', has_pro: false, expires_at: '2026-10-10T00:00:00Z', days_left: 0 }, false),
    'expired'
  )
})

test('has_pro=true всегда даёт pro, даже если expires_at в прошлом', () => {
  // Бэкенд гарантирует: has_pro=true значит активен.
  // Фронтенд не вычисляет Pro на клиенте — опирается только на has_pro.
  assert.equal(
    getSubscriptionState({ tier: 'pro', has_pro: true, expires_at: '2026-10-10T00:00:00Z', days_left: 0 }, false),
    'pro'
  )
})

test('некорректный ответ не ломает определение состояния', () => {
  assert.equal(getSubscriptionState({}, false), 'base')
  assert.equal(getSubscriptionState({ tier: 'base' }, false), 'base')
  assert.equal(getSubscriptionState({ has_pro: false }, false), 'base')
})
