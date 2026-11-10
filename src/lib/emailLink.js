/*
 * Issue #1189 — «Почта для входа» в Профиле.
 *
 * Telegram-аккаунт можно связать с почтой: тогда на сайте mentalix.space
 * человек входит по этой почте в тот же аккаунт. Контракт — GET/POST/DELETE
 * /api/auth/email-link… (бэкенд mentalix-bot, PR #247).
 *
 * Флаг VITE_EMAIL_LINK_ENABLED по умолчанию выключен: production-сборка его
 * не получает, поэтому строки в Профиле нет вовсе. В песочнице флаг включён
 * через docker-compose.base44.yml.
 */
export const EMAIL_LINK_ENABLED = import.meta.env?.VITE_EMAIL_LINK_ENABLED === 'true'

/*
 * Строка «Почта для входа» — только живой Telegram и настоящий пользователь,
 * то же условие, что у canManageAiContext (#1169). В вебе и у гостя
 * (id <= 0) поведение не меняется.
 */
export function canSeeEmailLink({ enabled = EMAIL_LINK_ENABLED, platform, user } = {}) {
  return enabled === true && platform === 'telegram' && Number(user?.id) > 0
}

// Тексты задачи #1189: тон на «ты», спокойно, без восклицаний.
export const EMAIL_LINK_TITLE = 'Почта для входа'
export const EMAIL_LINK_SUBTITLE = 'Чтобы входить на сайте mentalix.space по почте'
export const EMAIL_LINK_ADD_LABEL = 'Добавить'
export const EMAIL_LINK_REQUEST_CODE_LABEL = 'Получить код'
export const EMAIL_LINK_VERIFY_LABEL = 'Подтвердить'
export const EMAIL_LINK_RESEND_LABEL = 'Отправить код ещё раз'
export const EMAIL_LINK_UNLINK_LABEL = 'Отвязать'
export const EMAIL_LINK_UNLINK_CONFIRM_TITLE = 'Отвязать почту?'
export const EMAIL_LINK_UNLINK_CONFIRM_TEXT = 'Входить на сайте по ней больше не получится.'

export const EMAIL_LINK_ERROR_IN_USE = 'Эта почта уже используется. Укажи другую.'
export const EMAIL_LINK_ERROR_TOO_MANY = 'Слишком много попыток. Попробуй позже.'
export const EMAIL_LINK_ERROR_INVALID_CODE = 'Код не подошёл. Проверь письмо.'
export const EMAIL_LINK_ERROR_NETWORK = 'Не получилось — проверь связь.'
export const EMAIL_LINK_ERROR_DELIVERY = 'Не получилось отправить письмо. Попробуй позже.'
export const EMAIL_LINK_ERROR_EMAIL = 'Проверь адрес почты.'
export const EMAIL_LINK_ERROR_DISABLED = 'Почта для входа сейчас недоступна.'

/*
 * Коды ответа из контракта PR #247: 409 email_in_use, 429 (лимиты минутный,
 * часовой и общий), 422 невалидный адрес, 502/503 доставка письма,
 * 404 email_link_disabled. Всё остальное, включая обрыв сети, — «проверь связь».
 */
export function emailLinkErrorText(error) {
  const status = Number(error?.status) || 0
  if (status === 409) return EMAIL_LINK_ERROR_IN_USE
  if (status === 429) return EMAIL_LINK_ERROR_TOO_MANY
  if (status === 502 || status === 503) return EMAIL_LINK_ERROR_DELIVERY
  if (status === 422) return EMAIL_LINK_ERROR_EMAIL
  if (status === 404) return EMAIL_LINK_ERROR_DISABLED
  return EMAIL_LINK_ERROR_NETWORK
}

/*
 * Отсчёт «Отправить код ещё раз» считается от метки времени окончания
 * (Date.now() + expires_in_minutes), а не от тиков таймера: Telegram
 * глушит таймеры в фоне, и накопленные тики отстают от реального времени.
 */
export function emailLinkSecondsLeft(expiresAt, now = Date.now()) {
  const end = Number(expiresAt)
  if (!Number.isFinite(end)) return 0
  return Math.max(0, Math.ceil((end - now) / 1000))
}

export function formatEmailLinkCountdown(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}
