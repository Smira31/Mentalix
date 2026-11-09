import { useEffect, useRef, useState } from 'react'

/*
 * ISSUE #1154 — знакомый человек в web/PWA не проходит знакомство повторно.
 *
 * Отметка «знакомство пройдено» (mx-onboarded-v2 в App.jsx) живёт в двух
 * хранилищах: localStorage и CloudStorage Telegram (src/lib/store.js). Вне
 * Telegram второго хранилища нет — только localStorage, а Safari и PWA на iOS
 * держат его раздельно. Человек проходил знакомство в одной из них и снова
 * видел его в другой.
 *
 * Правило здесь одно: флага локально нет — спрашиваем сервер, есть ли у
 * человека данные. Знакомого помечаем прежним флагом и знакомство не
 * показываем; новый аккаунт без данных проходит его как раньше.
 *
 * Источник «есть ли данные» — существующий GET /api/profile
 * (total_checkins, тот же счётчик, что и «Всего чек-инов» в профиле).
 * Новых полей и эндпоинтов на бэкенде не нужно.
 *
 * Три состояния проверки намеренно разделены, иначе знакомство мелькает:
 *   pending — ответа ещё нет, экран показывает нейтральную загрузку (Splash);
 *   known   — человек знаком, знакомство не показываем;
 *   unknown — данных нет ИЛИ сервер не ответил; знакомство как раньше.
 */

/* Сколько ждём сервер. Дольше — уже не «быстрый старт»: показываем знакомство,
   как если бы проверки не было вообще. Тот же порядок ожидания, что у
   «Нет связи» (src/lib/useSlowConnection.js, 8 с). */
export const ONBOARDED_PROBE_TIMEOUT_MS = 8_000

/*
 * Отметка «человек сам попросил пройти знакомство заново» (Settings →
 * «Пройти знакомство заново»). Без неё серверная проверка вернула бы флаг
 * сразу после сброса, и кнопка молча не работала бы.
 * Значение — id человека: сброс на одном устройстве не распространяется на
 * другой аккаунт в этом же браузере.
 */
const ONBOARDING_RESET_KEY = 'mx-onboarded-reset-v1'

function storage() {
  try {
    return globalThis.localStorage || null
  } catch {
    // Приватный режим: доступа к localStorage нет — живём как раньше.
    return null
  }
}

export function markOnboardingResetRequested(userId) {
  if (userId === null || userId === undefined) return
  try {
    storage()?.setItem(ONBOARDING_RESET_KEY, String(userId))
  } catch {
    // см. storage()
  }
}

export function clearOnboardingResetRequested() {
  try {
    storage()?.removeItem(ONBOARDING_RESET_KEY)
  } catch {
    // см. storage()
  }
}

export function isOnboardingResetRequested(userId) {
  if (userId === null || userId === undefined) return false
  try {
    return storage()?.getItem(ONBOARDING_RESET_KEY) === String(userId)
  } catch {
    return false
  }
}

/* Есть ли у человека данные на сервере: хотя бы один чек-ин. */
export function profileShowsHistory(profile) {
  const total = Number(profile?.total_checkins)

  return Number.isFinite(total) && total > 0
}

/*
 * Знаком ли человек по серверным данным. Любая ошибка (нет сети, таймаут,
 * 401, пустой ответ) — это «не знаем», то есть false: знакомство покажется,
 * как до этой проверки. Ошибка не пробрасывается и не пишется в консоль.
 *
 * `getProfile(userId, { signal })` — транспорт (в App.jsx это api.profile.get
 * с silentDiagnostics), поэтому функция проверяется unit-тестом без сети.
 */
export async function hasServerHistory(userId, getProfile, timeoutMs = ONBOARDED_PROBE_TIMEOUT_MS) {
  if (!userId || typeof getProfile !== 'function') return false

  const controller = new AbortController()
  // Обрыв по бюджету, а не по штатному таймауту API: у GET есть один повтор,
  // и молчащий сервер иначе держал бы старт два таймаута подряд.
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return profileShowsHistory(await getProfile(userId, { signal: controller.signal }))
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/* Нужно ли вообще спрашивать сервер в этом запуске. */
export function shouldProbeServerOnboarding({
  userId,
  onboarded,
  platformName,
  previewDemo,
  showGuestAuth,
  resetRequested,
} = {}) {
  if (!userId) return false
  // Флаг уже есть — знакомство пройдено на этом устройстве.
  if (onboarded) return false
  // Человек сам попросил пройти знакомство заново.
  if (resetRequested) return false
  // Экран входа: текущий user вот-вот сменится, спрашивать не о ком.
  if (showGuestAuth) return false
  // Демо-стенд: данные синтетические, знакомство и так пропускается.
  if (previewDemo) return false
  // Telegram не меняем: там отметку переносит CloudStorage.
  return platformName !== 'telegram'
}

/*
 * Итоговое решение экрана: показывать знакомство, ждать или пускать в
 * приложение. Чистая функция — её и проверяет unit-тест.
 */
export function resolveOnboardingGate({
  flag,
  previewDemo,
  demoOnboardingRequested,
  serverStatus,
} = {}) {
  const flagged = flag === '1' || (Boolean(previewDemo) && !demoOnboardingRequested)

  if (flagged) return { onboarded: true, pending: false }
  if (serverStatus === 'known') return { onboarded: true, pending: false }
  if (serverStatus === 'pending') return { onboarded: false, pending: true }

  return { onboarded: false, pending: false }
}

/*
 * Состояние проверки для конкретного человека: 'off' | 'pending' | 'known' |
 * 'unknown'. Пока ответа нет, возвращается 'pending' и на первом кадре тоже —
 * поэтому знакомство не мелькает перед экраном загрузки.
 */
export function useServerOnboardingStatus({ userId, enabled, getProfile }) {
  const [resolved, setResolved] = useState(null)
  const transportRef = useRef(getProfile)
  const probedRef = useRef(null)

  useEffect(() => {
    transportRef.current = getProfile
  })

  useEffect(() => {
    if (!enabled || !userId) return

    /*
     * Один запрос на человека за запуск: StrictMode запускает эффект дважды,
     * а ответ первого запуска всё равно принадлежит этому же компоненту.
     */
    if (probedRef.current === userId) return
    probedRef.current = userId

    hasServerHistory(userId, (id, options) => transportRef.current(id, options)).then(known => {
      setResolved({ userId, known })
    })
  }, [enabled, userId])

  if (!enabled || !userId) return 'off'
  if (resolved?.userId !== userId) return 'pending'

  return resolved.known ? 'known' : 'unknown'
}
