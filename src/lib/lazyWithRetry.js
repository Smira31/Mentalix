import { lazy } from 'react'

/*
 * ЛЕНИВАЯ ЗАГРУЗКА ЭКРАНОВ БЕЗ «ЧЁРНОГО ЭКРАНА»
 *
 * Под-экраны грузятся отдельными чанками. В Telegram WebView чанк может:
 *  - не прийти вовсе (запрос «висит» на плохой сети) — Suspense с
 *    fallback={null} тогда бесконечно показывает пустой тёмный shell без
 *    кнопок, а системная «Назад» ещё не зарегистрирована экраном;
 *  - исчезнуть после деплоя (в WebView открыта старая версия index.html,
 *    а на хостинге уже новые хэши чанков).
 *
 * Поэтому: у импорта есть срок, один повтор, а при окончательной ошибке
 * загрузки чанка — одна перезагрузка страницы (не чаще раза в минуту).
 * Если и это не помогло, ошибка уходит в ScreenErrorBoundary, и человек
 * видит «Что-то пошло не так» с кнопкой «На главную».
 */

export const IMPORT_TIMEOUT_MS = 15_000
const RELOAD_GUARD_KEY = 'mx-chunk-reload-at'
const RELOAD_GUARD_MS = 60_000

const CHUNK_ERROR_PATTERN =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch|Load failed|ChunkLoadError|Unable to preload CSS|Module import timed out/i

export function isChunkLoadError(error) {
  return CHUNK_ERROR_PATTERN.test(String(error?.message || error || ''))
}

function withTimeout(promise, timeoutMs) {
  if (!timeoutMs) return promise

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Module import timed out')), timeoutMs)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      error => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

function reloadOnce() {
  if (typeof window === 'undefined') return false

  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || 0)
    if (Date.now() - last < RELOAD_GUARD_MS) return false
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()))
  } catch {
    return false
  }

  window.location.reload()
  return true
}

export async function loadWithRetry(
  factory,
  { retries = 1, timeoutMs = IMPORT_TIMEOUT_MS, onFinalChunkError = reloadOnce } = {}
) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withTimeout(factory(), timeoutMs)
    } catch (error) {
      lastError = error
      if (!isChunkLoadError(error)) throw error
    }
  }

  // Перезагрузка уже запущена — не показываем ошибку на долю секунды.
  if (onFinalChunkError(lastError)) return new Promise(() => {})

  throw lastError
}

/*
 * React.lazy + повтор. У компонента есть .preload(): Today прогревает
 * чанки в простое, чтобы тап по карточке не ждал сеть.
 */
export function lazyWithRetry(factory, options) {
  let pending = null

  const load = () => {
    if (!pending) {
      pending = loadWithRetry(factory, options).catch(error => {
        pending = null
        throw error
      })
    }
    return pending
  }

  const Component = lazy(load)
  Component.preload = () => load().catch(() => {})

  return Component
}
