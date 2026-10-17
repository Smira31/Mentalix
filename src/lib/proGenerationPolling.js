/*
 * PRO-002b/c: ограниченный опрос GET после POST-ответа 409
 * `generation_in_progress`.
 *
 * Контракт backend/pro/router.py: GET отчёта и плана НЕ возвращает
 * состояние generation_in_progress — оно видно только как ошибка POST
 * (JSONResponse с body.code). Поэтому после такого ответа повторная
 * POST-генерация не отправляется: клиент ограниченно опрашивает GET до
 * статуса ready или терминального состояния. `not_generated` во время
 * ожидания — обычный промежуточный ответ (результат ещё не сохранён),
 * опрос продолжается до лимита попыток.
 */

/*
 * Окно ожидания согласовано с таймаутом запроса сборки на клиенте
 * (PRO_GENERATE_TIMEOUT_MS в api.js): бэкенд может сделать до двух вызовов
 * модели (повтор после неудачи) — 2 × 60 с + запас 30 с = 150 с, поэтому опрос
 * GET покрывает те же 150 с (75 попыток × 2 с). Шаг 2 с не меняется: результат
 * появляется на экране в пределах пары секунд после готовности. Текст ожидания
 * на экранах — «это может занять до двух минут».
 */
export const PRO_POLL_INTERVAL_MS = 2000
export const PRO_POLL_MAX_ATTEMPTS = 75
export const PRO_POLL_WINDOW_MS = PRO_POLL_INTERVAL_MS * PRO_POLL_MAX_ATTEMPTS

// Состояния, на которых опрос останавливается: ready — успех; остальные
// требуют действия пользователя (включить согласие, собрать разбор) и не
// изменятся сами. Отсутствие в списке — единственный признак «ещё собирается».
const TERMINAL_STATUSES = new Set([
  'ready',
  'consent_required',
  'insufficient_data',
  'report_required',
])

export class ProPollTimeoutError extends Error {
  constructor() {
    super('Генерация не завершилась в пределах ожидания: опрос остановлен')
    this.name = 'ProPollTimeoutError'
    this.code = 'pro_poll_timeout'
  }
}

export class ProPollCancelledError extends Error {
  constructor() {
    super('Опрос генерации отменён')
    this.name = 'ProPollCancelledError'
    this.code = 'pro_poll_cancelled'
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Опрашивает `getState` (только GET-запросы) до готовности или лимита.
 * Никогда не вызывает POST и не «перегенерирует»: повторная генерация —
 * только явное действие пользователя после таймаута опроса.
 */
export async function pollGenerationReady(getState, options = {}) {
  const {
    intervalMs = PRO_POLL_INTERVAL_MS,
    maxAttempts = PRO_POLL_MAX_ATTEMPTS,
    isCancelled = () => false,
  } = options

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (isCancelled()) throw new ProPollCancelledError()

    const state = await getState()
    if (TERMINAL_STATUSES.has(state?.status)) return state

    if (attempt < maxAttempts) await delay(intervalMs)
  }

  throw new ProPollTimeoutError()
}
