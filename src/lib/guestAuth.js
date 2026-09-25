// src/lib/guestAuth.js
//
// Гостевой режим (веб/PWA): создание гостевой сессии, хранение merge_token,
// перенос гостевых записей в настоящий аккаунт после входа.
// В Telegram Mini App поведение не меняется — этот модуль используется
// только в web-адаптере.

import { platform } from '../platform'

export const GUEST_MERGE_TOKEN_KEY = 'mentalix_guest_merge_token'

export const GUEST_MERGED_EVENT = 'mentalix:guest-merged'

export function isGuestUser(user) {
  return Boolean(user?.is_guest)
}

export function getGuestMergeToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(GUEST_MERGE_TOKEN_KEY)
}

export function setGuestMergeToken(token) {
  if (typeof window === 'undefined' || !token) return
  window.localStorage.setItem(GUEST_MERGE_TOKEN_KEY, token)
}

export function clearGuestMergeToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(GUEST_MERGE_TOKEN_KEY)
}

/**
 * Сбросить гостевое состояние: удалить merge_token и локального user.
 * Вызывается при 401 guest_merged — старая гостевая cookie больше не валидна.
 */
export function resetGuestState() {
  clearGuestMergeToken()
  platform.clearUser?.()
}

/**
 * Уведомить приложение о том, что гостевая сессия устарела (guest_merged).
 * App.jsx слушает событие и сбрасывает user → показывается экран входа.
 */
export function dispatchGuestMerged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GUEST_MERGED_EVENT))
}

/**
 * Перенос гостевых записей в настоящий аккаунт.
 *
 * Вызывается после успешного входа в настоящий аккаунт, если в localStorage
 * есть merge_token. Cookie настоящего аккаунта уже установлена.
 *
 * Коды ответа:
 *   200 ok                       → токен удалить, вернуть обновлённого user
 *   404 guest_not_found           → токен удалить, вернуть null
 *   409 guest_already_merged      → токен удалить, вернуть null
 *   401 authenticated_account_required → токен оставить, вернуть null
 *   409 cannot_merge_into_guest   → токен оставить, вернуть null
 *   прочие ошибки                 → токен оставить, вернуть null
 *
 * Ошибка переноса НЕ блокирует вход и НЕ показывает пользователю ошибку.
 *
 * @param {{ auth: { guestMerge: Function } }} apiInstance
 * @returns {Promise<object|null>} обновлённый user при 200, иначе null
 */
export async function attemptGuestMerge(apiInstance) {
  const token = getGuestMergeToken()
  if (!token) return null

  let result
  try {
    result = await apiInstance.auth.guestMerge(token)
  } catch (error) {
    const status = error?.status
    const detail = error?.message || ''

    // 404 guest_not_found — гостя уже нет, токен больше не нужен.
    if (status === 404 || detail.includes('guest_not_found')) {
      clearGuestMergeToken()
      return null
    }
    // 409 guest_already_merged — перенос уже произошёл, токен устарел.
    if (status === 409 && detail.includes('guest_already_merged')) {
      clearGuestMergeToken()
      return null
    }
    // 401 authenticated_account_required — нет cookie настоящего аккаунта.
    // Токен оставляем, повторим при следующем входе.
    if (status === 401 && detail.includes('authenticated_account_required')) {
      return null
    }
    // 409 cannot_merge_into_guest — целевой аккаунт сам гость.
    // Токен оставляем.
    if (status === 409 && detail.includes('cannot_merge_into_guest')) {
      return null
    }
    // Прочие ошибки — токен оставляем, не блокируем вход.
    return null
  }

  // 200 — перенос успешен, токен больше не нужен.
  clearGuestMergeToken()
  return result?.user || null
}
