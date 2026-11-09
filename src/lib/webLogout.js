// src/lib/webLogout.js
//
// ISSUE #1163: явный выход из аккаунта в вебе и PWA.
//
// На боевых хостах (src/lib/guestAuth.js) приложение автоматически создаёт
// гостя, если сессии нет. Без этого маркера после «Выйти» и обновления
// страницы человек снова попадал бы в приложение уже гостем, а не на экран
// входа. Маркер живёт только на этом устройстве и снимается при любом
// намеренном входе.

export const WEB_LOGGED_OUT_KEY = 'mx-web-logged-out'

export function markWebLoggedOut() {
  try {
    localStorage.setItem(WEB_LOGGED_OUT_KEY, '1')
  } catch {
    // Приватный режим: экран входа всё равно покажет текущее состояние App.
  }
}

export function isWebLoggedOut() {
  try {
    return localStorage.getItem(WEB_LOGGED_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function clearWebLoggedOut() {
  try {
    localStorage.removeItem(WEB_LOGGED_OUT_KEY)
  } catch {
    // Нечего чистить, если storage недоступен.
  }
}
