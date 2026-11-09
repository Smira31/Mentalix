/*
 * Локальные данные человека: удаление аккаунта и выход (#1166).
 *
 * Ключи приложения разбросаны по префиксам (mx-*, mx:*, mentalix_*, mentalix:*,
 * черновики, тема/акцент, блокировка, токены гостя и т. д.), и новые появляются
 * постоянно — поэтому вместо списка стираем всё хранилище приложения, кроме
 * служебных ключей самого Telegram SDK (`__telegram__*`), без которых мини-апп
 * теряет параметры запуска до закрытия.
 */
import { WEB_LOGGED_OUT_KEY } from './webLogout.js'

const PRESERVED_PREFIXES = ['__telegram']

/*
 * ISSUE #1166: после «Выйти» на устройстве не остаётся личных данных.
 * Оформление устройства — не чьи-то данные: тема и акцент остаются, чтобы
 * экран входа выглядел так же, как приложение. Отметка «человек вышел сам»
 * (#1163) тоже остаётся: без неё автозапуск гостя вернул бы его в приложение,
 * а «Выйти» вызывается раньше очистки.
 */
const NEUTRAL_KEYS = ['mx-theme', 'mx-accent-color']

function wipe(storage, isPreserved) {
  let removed = 0
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)
      if (!key || isPreserved(key)) continue
      storage.removeItem(key)
      removed += 1
    }
  } catch {
    // Хранилище может быть недоступно (приватный режим) — нечего чистить.
  }
  return removed
}

function isTelegramKey(key) {
  return PRESERVED_PREFIXES.some(prefix => key.startsWith(prefix))
}

export function clearAllLocalUserData() {
  if (typeof window === 'undefined') return 0
  return wipe(window.localStorage, isTelegramKey) + wipe(window.sessionStorage, isTelegramKey)
}

/*
 * Выход из аккаунта — та же очистка, но с нейтральными ключами устройства.
 * IndexedDB и Cache Storage приложение не использует, поэтому хватает двух
 * хранилищ.
 */
export function clearLocalUserData() {
  if (typeof window === 'undefined') return 0
  const isPreserved = key =>
    isTelegramKey(key) || NEUTRAL_KEYS.includes(key) || key === WEB_LOGGED_OUT_KEY
  return wipe(window.localStorage, isPreserved) + wipe(window.sessionStorage, isPreserved)
}
