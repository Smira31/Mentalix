/*
 * Коды ответа POST /api/privacy/account-erasure/request-code.
 *
 * Бэкенд отвечает на запрос одноразового кода удаления аккаунта так:
 *   200 — код отправлен, канал доставки: email или telegram (у веб-аккаунта,
 *         вошедшего через Telegram, email может отсутствовать — тогда код
 *         приходит сообщением бота);
 *   409 no_delivery_channel — нет ни email, ни Telegram;
 *   409 telegram_init_data_sufficient — Mini App: код не нужен;
 *   429 — слишком часто (email_minute_limit / email_hour_limit /
 *         too_many_email_requests);
 *   502 telegram_send_failed;
 *   503 telegram_delivery_not_configured.
 *
 * Разбор ответа и тексты — чистые функции: их проверяет unit-тест без браузера,
 * а Settings.jsx только показывает результат.
 */

export const ERASURE_HINTS = {
  email: 'Код подтверждения отправлен на email.',
  telegram: 'Код подтверждения отправлен в чат с Mentalix.',
  // Канал неизвестен: обещаем только то, что известно, — код придёт туда,
  // где он вообще может прийти.
  unknown: 'Код подтверждения придёт в Telegram или на email.',
  noCode: 'Код не нужен: подтверждение идёт через Telegram.',
}

export const ERASURE_REQUEST_ERRORS = {
  rate_limited: 'Слишком часто. Попробуй чуть позже',
  telegram_send_failed:
    'Не удалось отправить код в Telegram. Открой чат с ботом Mentalix, нажми Start и попробуй снова',
  telegram_delivery_not_configured: 'Отправка кода сейчас недоступна. Напиши в поддержку',
  no_delivery_channel: 'Не нашли, куда отправить код. Напиши в поддержку',
  failed: 'Не получилось. Попробуй ещё раз',
}

// Mini App подтверждает себя подписанным initData — код подтверждения не нужен.
// Строка совпадает с detail ответа бэкенда.
export const ERASURE_INIT_DATA_SUFFICIENT = 'telegram_init_data_sufficient'

export function erasureDeliveryHint(delivery) {
  return ERASURE_HINTS[delivery] || ERASURE_HINTS.unknown
}

// Канал доставки из успешного ответа. Если бэкенд его не назвал — null,
// и подсказка остаётся нейтральной (догадки не показываем).
export function erasureDeliveryMethod(payload) {
  const method = payload?.delivery_method ?? payload?.sent_via ?? payload?.channel
  return method === 'email' || method === 'telegram' ? method : null
}

export function erasureRequestErrorText(reason) {
  return ERASURE_REQUEST_ERRORS[reason] || ERASURE_REQUEST_ERRORS.failed
}

// Причина отказа запроса кода по ошибке ApiError (status + body.detail).
export function erasureRequestReason(error) {
  const status = error?.status
  const detail = error?.body?.detail
  if (status === 429) return 'rate_limited'
  if (status === 502) return 'telegram_send_failed'
  if (status === 503) return 'telegram_delivery_not_configured'
  if (status === 409 && detail === 'telegram_init_data_sufficient') {
    return ERASURE_INIT_DATA_SUFFICIENT
  }
  if (status === 409 && detail === 'no_delivery_channel') return 'no_delivery_channel'
  return 'failed'
}
