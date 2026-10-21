/*
 * PAY-UI-001: выбор состояния экрана «Подписка» по ответу /api/subscription.
 *
 * Контракт бэкенда: GET /api/subscription возвращает
 *   { tier: "pro"|"base", expires_at: ISO|null, has_pro: bool,
 *     source_provider, auto_renew: false, days_left: int }
 *
 * Состояния экрана:
 *   guest    — гостевой аккаунт, покупка недоступна
 *   base     — постоянный аккаунт без Pro
 *   pro      — Pro активен
 *   expired  — Pro истёк (был Pro, сейчас has_pro=false, но expires_at задан)
 *
 * Состояние 'pending' — локальное UI-состояние после нажатия «Оформить»,
 * не определяется из ответа API. Управляется компонентом.
 *
 * Фронтенд не подтверждает оплату локально и не кэширует has_pro как истину:
 * опирается только на свежий ответ /api/subscription.
 */

/*
 * Определяет состояние экрана по ответу /api/subscription.
 *
 * @param {object|null} subscription — ответ /api/subscription или null
 * @param {boolean} isGuest — гостевой аккаунт
 * @returns {'guest'|'base'|'pro'|'expired'|'loading'}
 */
export function getSubscriptionState(subscription, isGuest) {
  if (isGuest) return 'guest'
  if (!subscription) return 'loading'

  if (subscription.has_pro === true) return 'pro'

  // has_pro=false, но expires_at задан — Pro был активен и истёк
  if (subscription.expires_at) return 'expired'

  return 'base'
}

/*
 * Какой значок-замок показывать для состояния экрана.
 * 'lock' — закрытый замок (PotentialLockArt): только неоплаченные состояния
 *          (guest, base, expired, pending, loading).
 * 'unlock' — открытый замок (ProUnlockedArt): Pro активен или оплата прошла.
 *
 * Замок (закрытый) — только у неоплаченных состояний. У активного Pro и
 * экрана успеха — открытый замок.
 *
 * @param {string} state — состояние экрана (displayState)
 * @returns {'lock'|'unlock'}
 */
export function lockArtKind(state) {
  if (state === 'pro' || state === 'success') return 'unlock'
  return 'lock'
}

/*
 * Демо-режим: ?payState=guest|base|pro|expired|pending|success
 * (success — экран «Оплата прошла»).
 * Только в dev/демо-сборке (как proMock); в production-сборке неактивно.
 *
 * @param {function} isPreviewDemoModeFn — функция isPreviewDemoMode (инъекция для тестов)
 * @returns {string|null}
 */
export function getDemoPayState(isPreviewDemoModeFn) {
  if (typeof window === 'undefined') return null

  const isDemo = isPreviewDemoModeFn ? isPreviewDemoModeFn() : false
  if (!isDemo) return null

  // Только в dev/preview-сборке, не в production
  if (!import.meta.env?.DEV && import.meta.env?.VITE_LOCAL_PREVIEW !== 'true') return null

  const value = new URLSearchParams(window.location.search).get('payState')
  return ['guest', 'base', 'pro', 'expired', 'pending', 'success'].includes(value) ? value : null
}
