import { platformName } from '../platform'

/*
 * Known issue (TASKS.md, follow-up backend review): backend
 * require_verified_identity (mentalix-bot/backend/telegram_auth.py)
 * требует подписанный Telegram initData для любого user.id > 0.
 * Привязанный (linked) web-аккаунт получает положительный app_user_id
 * (= linked_telegram_id, mentalix-bot/backend/auth.py:_serialize_user) —
 * но обычный браузер не может сгенерировать Telegram-подпись
 * (src/platform/web.adapter.js:getInitData() всегда '' — нет
 * Telegram-контекста). Итог: любая запись (create/log/save) для
 * привязанного web-аккаунта получает 401 от backend.
 *
 * Постоянный фикс — backend-side маппинг через linked_telegram_id —
 * не сделан здесь: это отдельная, более широкая backend-задача
 * (см. TASKS.md). Этот модуль только помогает экрану отличить именно
 * этот случай от обычной сетевой ошибки, чтобы показать честное
 * сообщение вместо тихого провала кнопки.
 */

export function isLinkedWebAccount(user) {
  return platformName === 'web' && Boolean(user?.linked)
}

/*
 * src/lib/api.js's request() бросает Error с текстом вида
 * "API /path failed: 401. Ответ: ...". Проверяем именно 401, а не любую
 * ошибку — иначе сетевой сбой у привязанного web-пользователя ошибочно
 * показал бы "открой в Telegram" вместо честного "проверь соединение".
 */
export function isUnverifiedTelegramWriteError(error) {
  return /\bfailed: 401\b/.test(error?.message || '')
}

export function isLinkedWebWriteBlocked(user, error) {
  return isLinkedWebAccount(user) && isUnverifiedTelegramWriteError(error)
}
