import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * Донат («Поддержать проект») через ЮKassa — фронтенд-логика.
 *
 * Проверяем чистые функции src/lib/donation.js: валидацию суммы (целое,
 * 50…50000), состояние единственной круглой кнопки («✕» без суммы, «›»
 * с суммой), разбор кодов ошибок бэкенда и запуск доната (гость запрос не
 * отправляет; успех открывает confirmation_url). Отметки возврата в Node
 * (без sessionStorage) безопасно ничего не делают.
 */

const {
  CUSTOM_AMOUNT,
  DONATION_ERROR_COPY,
  MAX_DONATION_AMOUNT,
  MIN_DONATION_AMOUNT,
  beginDonationReturn,
  donationCta,
  donationErrorMessage,
  markDonationStarted,
  readDonationStarted,
  readDonationThanks,
  resolveDonationAmount,
  sanitizeAmountInput,
  startDonation,
  validateDonationAmount,
} = await import(new URL('../../src/lib/donation.js', import.meta.url))

const CONFIRMATION_URL = 'https://yoomoney.ru/api-pages/v2/checkout/555'

/* ── Ввод «Своей суммы» ────────────────────────────────────────────────── */

test('ввод суммы: только цифры, не длиннее 6 знаков', () => {
  assert.equal(sanitizeAmountInput('300'), '300')
  assert.equal(sanitizeAmountInput('3a0b0'), '300')
  assert.equal(sanitizeAmountInput(' 1 000 ₽ '), '1000')
  assert.equal(sanitizeAmountInput('1234567'), '123456')
  assert.equal(sanitizeAmountInput(''), '')
  assert.equal(sanitizeAmountInput(null), '')
})

/* ── Валидация суммы ───────────────────────────────────────────────────── */

test('сумма: целое в пределах 50…50000', () => {
  assert.equal(validateDonationAmount('300').ok, true)
  assert.equal(validateDonationAmount('300').amount, 300)
  assert.equal(validateDonationAmount(300).ok, true)
  assert.equal(validateDonationAmount(MIN_DONATION_AMOUNT).ok, true)
  assert.equal(validateDonationAmount(MAX_DONATION_AMOUNT).ok, true)
})

test('сумма вне пределов и нецелые значения — ошибка', () => {
  for (const bad of ['49', '50001', '0', '', '50.5', '300.5', 'abc', null, undefined]) {
    const result = validateDonationAmount(bad)
    assert.equal(result.ok, false, `ожидалась ошибка для ${String(bad)}`)
    assert.equal(result.error, DONATION_ERROR_COPY.amount)
  }
  // Нецелое число как number — тоже ошибка.
  assert.equal(validateDonationAmount(50.5).ok, false)
})

/* ── Выбранная сумма из состояния экрана ───────────────────────────────── */

test('выбранная сумма: плитка или валидная «Своя», иначе null', () => {
  assert.equal(resolveDonationAmount(300, ''), 300)
  assert.equal(resolveDonationAmount(CUSTOM_AMOUNT, '750'), 750)
  assert.equal(resolveDonationAmount(CUSTOM_AMOUNT, ''), null)
  assert.equal(resolveDonationAmount(CUSTOM_AMOUNT, '20'), null)
  assert.equal(resolveDonationAmount(CUSTOM_AMOUNT, '90000'), null)
  assert.equal(resolveDonationAmount(null, ''), null)
})

/* ── Состояние круглой кнопки ──────────────────────────────────────────── */

test('кнопка: без суммы «✕» (закрыть), с суммой «›» (оформить)', () => {
  assert.equal(donationCta(null), 'close')
  assert.equal(donationCta(undefined), 'close')
  assert.equal(donationCta(100), 'submit')
  assert.equal(donationCta(MIN_DONATION_AMOUNT), 'submit')
})

/* ── Разбор кодов ошибок ───────────────────────────────────────────────── */

test('ошибки: 400 → сумма, 503 → недоступно, остальное → «попробуй ещё раз»', () => {
  assert.equal(donationErrorMessage({ status: 400 }), DONATION_ERROR_COPY.amount)
  assert.equal(
    donationErrorMessage({ code: 'donation_amount_below_min' }),
    DONATION_ERROR_COPY.amount
  )
  assert.equal(
    donationErrorMessage({ code: 'donation_amount_above_max' }),
    DONATION_ERROR_COPY.amount
  )

  assert.equal(donationErrorMessage({ status: 503 }), DONATION_ERROR_COPY.unavailable)
  assert.equal(donationErrorMessage({ code: 'yookassa_disabled' }), DONATION_ERROR_COPY.unavailable)
  assert.equal(
    donationErrorMessage({ code: 'yookassa_not_configured' }),
    DONATION_ERROR_COPY.unavailable
  )

  // 401/403/422/500/502 и всё прочее — общий текст без технических кодов.
  for (const error of [
    { status: 401, code: 'unauthorized' },
    { status: 403, code: 'guest_payment_forbidden' },
    { status: 422 },
    { status: 500 },
    { status: 502, code: 'yookassa_create_failed' },
    {},
  ]) {
    assert.equal(donationErrorMessage(error), DONATION_ERROR_COPY.generic)
  }
})

/* ── Запуск доната ─────────────────────────────────────────────────────── */

test('гость: запрос не отправляется', async () => {
  const calls = []
  const result = await startDonation({
    amount: 300,
    isGuest: true,
    create: async () => {
      calls.push('create')
      return { confirmation_url: CONFIRMATION_URL }
    },
  })

  assert.equal(result.state, 'guest')
  assert.deepEqual(calls, [])
})

test('невалидная сумма: запрос не отправляется', async () => {
  const calls = []
  const result = await startDonation({
    amount: 10,
    create: async () => {
      calls.push('create')
      return {}
    },
  })

  assert.equal(result.state, 'invalid')
  assert.equal(result.message, DONATION_ERROR_COPY.amount)
  assert.deepEqual(calls, [])
})

test('успех: 200 с confirmation_url открывается в текущей вкладке', async () => {
  const navigated = []
  let sentAmount = null
  const result = await startDonation({
    amount: 500,
    create: async value => {
      sentAmount = value
      return { confirmation_url: CONFIRMATION_URL, payment_id: 'd-1' }
    },
    navigate: url => navigated.push(url),
  })

  assert.equal(result.state, 'ok')
  assert.equal(sentAmount, 500)
  assert.equal(result.url, CONFIRMATION_URL)
  assert.deepEqual(navigated, [CONFIRMATION_URL])
})

test('200 без navigate — сбой: отсутствие перехода не считается успехом', async () => {
  let created = 0
  const result = await startDonation({
    amount: 500,
    create: async () => {
      created += 1
      return { confirmation_url: CONFIRMATION_URL, payment_id: 'd-2' }
    },
    // navigate не передан — перехода на ЮKassa не будет.
  })

  assert.equal(created, 1, 'запрос отправляется, но без навигации успеха нет')
  assert.equal(result.state, 'failed')
  assert.equal(result.url, undefined)
})

test('navigate упал — сбой, успеха нет', async () => {
  const result = await startDonation({
    amount: 500,
    create: async () => ({ confirmation_url: CONFIRMATION_URL, payment_id: 'd-3' }),
    navigate: () => {
      throw new Error('навигация недоступна')
    },
  })

  assert.equal(result.state, 'failed')
  assert.equal(result.url, undefined)
})

test('200 без confirmation_url — сбой, редиректа нет', async () => {
  const navigated = []
  const result = await startDonation({
    amount: 500,
    create: async () => ({}),
    navigate: url => navigated.push(url),
  })

  assert.equal(result.state, 'failed')
  assert.deepEqual(navigated, [])
})

test('ошибка create доходит до текста для пользователя', async () => {
  const cases = [
    [{ status: 400, body: { code: 'donation_amount_below_min' } }, DONATION_ERROR_COPY.amount],
    [{ status: 503, body: { code: 'yookassa_disabled' } }, DONATION_ERROR_COPY.unavailable],
    [{ status: 502, body: { code: 'yookassa_create_failed' } }, DONATION_ERROR_COPY.generic],
    [new Error('Нет сети'), DONATION_ERROR_COPY.generic],
  ]

  for (const [error, expected] of cases) {
    const navigated = []
    const result = await startDonation({
      amount: 500,
      create: async () => {
        throw error
      },
      navigate: url => navigated.push(url),
    })

    assert.equal(result.state, 'failed')
    assert.equal(result.message, expected)
    assert.deepEqual(navigated, [], 'при ошибке редиректа быть не должно')
  }
})

/* ── Отметки возврата (без sessionStorage — безопасный no-op) ──────────── */

test('без sessionStorage отметки возврата безопасны', () => {
  markDonationStarted(1234)
  assert.equal(readDonationStarted(1234), null)
  assert.equal(beginDonationReturn(1234), false)
  assert.equal(readDonationThanks(), false)
})
