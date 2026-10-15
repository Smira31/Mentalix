/*
 * Донат («Поддержать проект») через ЮKassa — фронтенд-часть.
 *
 * Контракт бэкенда (смёржен, #173):
 *   POST /api/donations, Authorization: Bearer <session_token>,
 *   тело {"amount": <рубли, целое>}. 200 → { confirmation_url, payment_id }.
 * Донат НЕ даёт Pro и не продлевает подписку: GET /api/subscription после
 * возврата не меняется, поэтому экран благодарности статус подписки не
 * показывает.
 *
 * Модуль почти чистый: валидация суммы, состояние круглой кнопки и разбор
 * кодов ошибок — чистые функции (проверяются Node-тестами). Session-storage
 * отметки нужны только для распознавания возврата с ЮKassa и в Node
 * безопасно ничего не делают.
 */

import { confirmationUrl } from './yookassaCheckout.js'

/* Готовые плитки суммы, ₽. */
export const DONATION_AMOUNTS = [100, 300, 500, 1000]
/* «Своя сумма» — не число, а метка выбора. */
export const CUSTOM_AMOUNT = 'custom'
/* Пределы суммы, ₽ (те же, что на сервере). */
export const MIN_DONATION_AMOUNT = 50
export const MAX_DONATION_AMOUNT = 50000

/* Тексты для пользователя — русские, без технических кодов. */
export const DONATION_ERROR_COPY = {
  amount: 'Сумма от 50 до 50 000 ₽',
  unavailable: 'Платёж временно недоступен',
  generic: 'Не получилось, попробуй ещё раз',
}

/*
 * Ввод «Своей суммы»: только цифры, не длиннее 6 знаков.
 * Больше максимума оставляем набранным — предел покажет проверка суммы,
 * а не молчаливое обрезание ввода.
 */
export function sanitizeAmountInput(raw) {
  return String(raw ?? '').replace(/\D/g, '').slice(0, 6)
}

/* Целое из строки или числа: '' → null, '12a' → null, '300' → 300. */
export function parseDonationAmount(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : null
  const digits = String(value ?? '').trim()
  return /^\d+$/.test(digits) ? Number(digits) : null
}

/* Проверка суммы: целое, 50…50000. */
export function validateDonationAmount(value) {
  const amount = parseDonationAmount(value)
  if (amount === null || amount < MIN_DONATION_AMOUNT || amount > MAX_DONATION_AMOUNT) {
    return { ok: false, amount, error: DONATION_ERROR_COPY.amount }
  }
  return { ok: true, amount, error: null }
}

/*
 * Выбранная сумма из состояния экрана: готовый чипс или «Своя».
 * null — сумма не выбрана или невалидна (круглая кнопка тогда «✕»).
 */
export function resolveDonationAmount(selected, customAmount) {
  const candidate = selected === CUSTOM_AMOUNT ? customAmount : selected
  const result = validateDonationAmount(candidate)
  return result.ok ? result.amount : null
}

/*
 * Состояние единственной круглой кнопки: без суммы — «✕» (закрыть экран),
 * с суммой — «›» (оформить).
 */
export function donationCta(amount) {
  return Number.isInteger(amount) ? 'submit' : 'close'
}

/* Код/статус ошибки → текст для пользователя (без технических кодов). */
export function donationErrorMessage({ status = null, code = null } = {}) {
  if (
    status === 400 ||
    code === 'donation_amount_below_min' ||
    code === 'donation_amount_above_max'
  ) {
    return DONATION_ERROR_COPY.amount
  }
  if (code === 'yookassa_disabled' || code === 'yookassa_not_configured' || status === 503) {
    return DONATION_ERROR_COPY.unavailable
  }
  return DONATION_ERROR_COPY.generic
}

/*
 * Запуск доната: гость запроса не отправляет; сумма проверяется на клиенте;
 * успех → открытие confirmation_url в текущей вкладке и только затем отметка
 * возврата. create и navigate передаются вызывающим компонентом, поэтому
 * в тестах ни запроса, ни редиректа не происходит без явной подстановки.
 *
 * Навигация обязательна: ответ 200 сам по себе успехом не считается (в
 * Pro-оплате пропущенный navigate давал «успех» без перехода на ЮKassa).
 * Без navigate — сбой, отметка возврата не ставится.
 */
export async function startDonation({ create, navigate, amount, isGuest = false } = {}) {
  if (isGuest) return { state: 'guest' }

  const check = validateDonationAmount(amount)
  if (!check.ok) return { state: 'invalid', message: check.error }
  if (typeof create !== 'function') return { state: 'failed', message: DONATION_ERROR_COPY.generic }

  let data
  try {
    data = await create(check.amount)
  } catch (error) {
    return {
      state: 'failed',
      message: donationErrorMessage({
        status: error?.status ?? null,
        code: error?.body?.code ?? error?.body?.detail ?? null,
      }),
    }
  }

  const url = confirmationUrl(data?.confirmation_url)
  if (!url) return { state: 'failed', message: DONATION_ERROR_COPY.generic }

  // Навигация обязательна: 200 без перехода — не успех. Проверяем явно,
  // чтобы отсутствие navigate не выглядело как начатая оплата.
  if (typeof navigate !== 'function') {
    return { state: 'failed', message: DONATION_ERROR_COPY.generic }
  }

  try {
    navigate(url)
  } catch {
    return { state: 'failed', message: DONATION_ERROR_COPY.generic }
  }

  // Отметку возврата ставим только после фактического перехода на ЮKassa.
  markDonationStarted()
  return { state: 'ok', url }
}

/* ── Возврат с ЮKassa после доната ─────────────────────────────────────── */

const STARTED_KEY = 'mx-donation-started'
const THANKS_KEY = 'mx-donation-thanks'

/* Возврат старше суток донатом уже не считается. */
export const DONATION_RETURN_WINDOW_MS = 24 * 60 * 60 * 1000

function writeSession(key, value) {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value)
  } catch {
    /* приватный режим: донат от этого не ломается */
  }
}

function readSession(key) {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null
  } catch {
    return null
  }
}

function removeSession(key) {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(key)
  } catch {
    /* см. writeSession */
  }
}

/* Страница уходит на ЮKassa и загружается заново — отметку держим в sessionStorage. */
export function markDonationStarted(now = Date.now()) {
  writeSession(STARTED_KEY, String(now))
}

/* Момент начала доната, если он свежий; иначе null. */
export function readDonationStarted(now = Date.now()) {
  const raw = readSession(STARTED_KEY)
  const parsed = Number(raw)
  if (raw === null || raw === '' || !Number.isFinite(parsed)) return null
  return now - parsed > DONATION_RETURN_WINDOW_MS ? null : parsed
}

export function clearDonationStarted() {
  removeSession(STARTED_KEY)
}

/*
 * Приложение открылось по ?payment=return. Если донат начинался — это возврат
 * с доната, а не оплата Pro: помечаем одноразовую благодарность и снимаем
 * отметку начала. Возвращает true, если возврат действительно с доната.
 */
export function beginDonationReturn(now = Date.now()) {
  if (!readDonationStarted(now)) return false
  writeSession(THANKS_KEY, '1')
  clearDonationStarted()
  return true
}

/* Одноразовая благодарность: читается на экране доната, снимается после показа. */
export function readDonationThanks() {
  return readSession(THANKS_KEY) === '1'
}

export function clearDonationThanks() {
  removeSession(THANKS_KEY)
}
