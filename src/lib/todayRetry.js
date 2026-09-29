/*
 * Автоповтор запросов — переживает сон бесплатного Render.
 *
 * Вынесено в отдельный модуль без браузерных зависимостей,
 * чтобы unit-тесты могли импортировать и проверять поведение.
 */

export const RETRY_DELAYS_MS = [3_000, 8_000, 20_000]
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429])

/*
 * Тестовый шов: smoke-тесты (Playwright) подменяют задержки через
 * window.__MX_TODAY_RETRY_DELAYS_MS__ = [0, 0, 0], чтобы автоповтор
 * не ждал реальные 3/8/20 секунд. Поведение в проде не меняется.
 */
function activeRetryDelays() {
  if (typeof window !== 'undefined' && Array.isArray(window.__MX_TODAY_RETRY_DELAYS_MS__)) {
    return window.__MX_TODAY_RETRY_DELAYS_MS__
  }
  return RETRY_DELAYS_MS
}

export function isRetryableError(error) {
  if (!error) return false
  if (error.kind === 'network' || error.kind === 'timeout') return true
  if (typeof error.status === 'number') {
    if (error.status >= 500) return true
    if (RETRYABLE_STATUS_CODES.has(error.status)) return true
  }
  return false
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * withRetry вызывает fn, при retryable-ошибке ждёт и повторяет.
 * Задержки: 3, 8, 20 с (4 попытки всего). Общий срок ожидания ≥ 60 с
 * (с учётом таймаута api.js 10 с × 2 повтора = 20 с на попытку).
 *
 * Неритребельные ошибки (4xx) выбрасываются сразу, без повтора.
 */
export async function withRetry(fn, { sleepFn = sleep } = {}) {
  const delays = activeRetryDelays()
  let lastError = null

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < delays.length && isRetryableError(error)) {
        await sleepFn(delays[attempt])
        continue
      }
      throw error
    }
  }

  throw lastError
}
