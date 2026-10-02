/*
 * Полная очистка локальных данных пользователя после удаления аккаунта.
 *
 * Ключи приложения разбросаны по префиксам (mx-*, mx:*, mentalix_*, mentalix:*,
 * черновики, тема/акцент, блокировка, токены гостя и т. д.), и новые появляются
 * постоянно — поэтому вместо списка стираем всё хранилище приложения, кроме
 * служебных ключей самого Telegram SDK (`__telegram__*`), без которых мини-апп
 * теряет параметры запуска до закрытия.
 */
const PRESERVED_PREFIXES = ['__telegram']

function wipe(storage) {
  let removed = 0
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)
      if (!key || PRESERVED_PREFIXES.some(prefix => key.startsWith(prefix))) continue
      storage.removeItem(key)
      removed += 1
    }
  } catch {
    // Хранилище может быть недоступно (приватный режим) — нечего чистить.
  }
  return removed
}

export function clearAllLocalUserData() {
  if (typeof window === 'undefined') return 0
  return wipe(window.localStorage) + wipe(window.sessionStorage)
}
