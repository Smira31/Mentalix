import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * PAY-UI-001 (веб): ЮKassa — состояния и гейт платформы.
 *
 * Проверяем чистые функции модуля src/lib/yookassaCheckout.js:
 *   - каждому ответу POST /api/payments/yookassa/create (200/401/403/503/502)
 *     соответствует своё состояние экрана;
 *   - возврат с ЮKassa не считается оплатой без has_pro от /api/subscription;
 *   - в Telegram (и при выключенном флаге) ЮKassa не вызывается: запрос и
 *     редирект не выполняются.
 *
 * Телеграм-путь (Tribute) здесь не проверяется: он в SubscriptionManager
 * и остаётся прежним.
 */

const {
  CHECKOUT_AUTH,
  CHECKOUT_FAILED,
  CHECKOUT_GUEST,
  CHECKOUT_OK,
  CHECKOUT_SKIPPED,
  CHECKOUT_UNAVAILABLE,
  beginGuestCheckout,
  checkoutAvailable,
  confirmationUrl,
  consumeGuestCheckout,
  createResponseState,
  markPaymentStarted,
  paymentReturnState,
  readPaymentStarted,
  clearPaymentStarted,
  startCheckout,
} = await import(new URL('../../src/lib/yookassaCheckout.js', import.meta.url))

const CONFIRMATION_URL = 'https://yoomoney.ru/api-pages/v2/checkout/12345'

test('200 с confirmation_url → открываем оплату (редирект в текущей вкладке)', async () => {
  assert.equal(createResponseState(200, { confirmation_url: CONFIRMATION_URL }), CHECKOUT_OK)

  const navigated = []
  const result = await startCheckout({
    platform: 'web',
    enabled: true,
    create: async () => ({ confirmation_url: CONFIRMATION_URL }),
    navigate: url => navigated.push(url),
  })

  assert.deepEqual(result, { state: CHECKOUT_OK, url: CONFIRMATION_URL })
  assert.deepEqual(navigated, [CONFIRMATION_URL])
})

test('200 без confirmation_url — сбой, а не оплата', () => {
  assert.equal(createResponseState(200, {}), CHECKOUT_FAILED)
  assert.equal(createResponseState(200, { confirmation_url: null }), CHECKOUT_FAILED)
  // Не https — открывать нечего.
  assert.equal(createResponseState(200, { confirmation_url: 'javascript:alert(1)' }), CHECKOUT_FAILED)
})

test('401 unauthorized / verified_identity_required → нужен вход', () => {
  assert.equal(createResponseState(401, { detail: 'unauthorized' }), CHECKOUT_AUTH)
  assert.equal(createResponseState(401, { detail: 'verified_identity_required' }), CHECKOUT_AUTH)
  assert.equal(createResponseState(403, { code: 'verified_identity_required' }), CHECKOUT_AUTH)
})

test('403 guest_payment_forbidden → гость, сначала прогресс по email', () => {
  assert.equal(createResponseState(403, { code: 'guest_payment_forbidden' }), CHECKOUT_GUEST)
  assert.equal(createResponseState(403, { detail: 'guest_payment_forbidden' }), CHECKOUT_GUEST)
})

test('503 yookassa_disabled / yookassa_not_configured → оплата пока недоступна', () => {
  assert.equal(createResponseState(503, { code: 'yookassa_disabled' }), CHECKOUT_UNAVAILABLE)
  assert.equal(createResponseState(503, { code: 'yookassa_not_configured' }), CHECKOUT_UNAVAILABLE)
  assert.equal(createResponseState(503, null), CHECKOUT_UNAVAILABLE)
})

test('502 yookassa_create_failed → сбой, предлагаем повторить', () => {
  assert.equal(createResponseState(502, { code: 'yookassa_create_failed' }), CHECKOUT_FAILED)
  assert.equal(createResponseState(500, null), CHECKOUT_FAILED)
})

test('ошибки create доходят до состояния экрана как есть', async () => {
  const cases = [
    [{ status: 401, body: { detail: 'verified_identity_required' } }, CHECKOUT_AUTH],
    [{ status: 403, body: { code: 'guest_payment_forbidden' } }, CHECKOUT_GUEST],
    [{ status: 503, body: { code: 'yookassa_disabled' } }, CHECKOUT_UNAVAILABLE],
    [{ status: 502, body: { code: 'yookassa_create_failed' } }, CHECKOUT_FAILED],
    // Сеть и таймаут — тоже сбой с предложением повторить.
    [new Error('Нет сети'), CHECKOUT_FAILED],
  ]

  for (const [error, expected] of cases) {
    const navigated = []
    const result = await startCheckout({
      platform: 'web',
      enabled: true,
      create: async () => {
        throw error
      },
      navigate: url => navigated.push(url),
    })

    assert.equal(result.state, expected)
    assert.deepEqual(navigated, [], 'при ошибке редиректа быть не должно')
  }
})

test('возврат с ЮKassa не считается оплатой без has_pro', () => {
  const startedAt = 1_000_000

  // Свежий /api/subscription: has_pro=false → «Оплата обрабатывается».
  assert.equal(
    paymentReturnState({ subscription: { tier: 'base', has_pro: false }, startedAt, now: startedAt + 60_000 }),
    'pending'
  )
  // Ответа ещё нет — тоже pending, а не успех.
  assert.equal(
    paymentReturnState({ subscription: null, startedAt, now: startedAt + 1_000 }),
    'pending'
  )
  // has_pro=true → экран успеха.
  assert.equal(
    paymentReturnState({
      subscription: { tier: 'pro', has_pro: true, expires_at: '2026-11-15T00:00:00Z' },
      startedAt,
      now: startedAt + 60_000,
    }),
    'success'
  )
})

test('без начатой оплаты возврата нет', () => {
  assert.equal(paymentReturnState({ subscription: { has_pro: true }, startedAt: null }), null)
  // Возврат старше суток оплатой не считается.
  const startedAt = 1_000_000
  assert.equal(
    paymentReturnState({
      subscription: { has_pro: false },
      startedAt,
      now: startedAt + 25 * 60 * 60 * 1000,
    }),
    null
  )
})

test('в Telegram ЮKassa не вызывается — ни запрос, ни редирект', async () => {
  const calls = []
  const result = await startCheckout({
    platform: 'telegram',
    enabled: true,
    create: async () => {
      calls.push('create')
      return { confirmation_url: CONFIRMATION_URL }
    },
    navigate: url => calls.push(`navigate:${url}`),
  })

  assert.equal(result.state, CHECKOUT_SKIPPED)
  assert.deepEqual(calls, [])
  assert.equal(checkoutAvailable({ enabled: true, platform: 'telegram' }), false)
})

test('без флага оплата не запускается', async () => {
  const calls = []
  const result = await startCheckout({
    platform: 'web',
    enabled: false,
    create: async () => {
      calls.push('create')
      return { confirmation_url: CONFIRMATION_URL }
    },
  })

  assert.equal(result.state, CHECKOUT_SKIPPED)
  assert.deepEqual(calls, [])
  assert.equal(checkoutAvailable({ enabled: false, platform: 'web' }), false)
  assert.equal(checkoutAvailable({ enabled: true, platform: 'web' }), true)
})

test('принимаем только https-адрес подтверждения', () => {
  assert.equal(confirmationUrl(CONFIRMATION_URL), CONFIRMATION_URL)
  assert.equal(confirmationUrl('https://pay.example/checkout?order=1'), 'https://pay.example/checkout?order=1')
  assert.equal(confirmationUrl('http://yoomoney.ru/checkout'), null)
  assert.equal(confirmationUrl(''), null)
  assert.equal(confirmationUrl(undefined), null)
  assert.equal(confirmationUrl({ confirmation_url: CONFIRMATION_URL }), null)
})

test('намерение гостя одноразовое (без sessionStorage — безопасный no-op)', () => {
  // В Node sessionStorage нет: функции не должны падать и не выдают намерение.
  markPaymentStarted(1234)
  assert.equal(readPaymentStarted(), null)
  beginGuestCheckout(1234)
  assert.equal(consumeGuestCheckout(5678), false)
  clearPaymentStarted()
  assert.equal(readPaymentStarted(), null)
})
