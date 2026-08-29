const INSET_NAMES = ['top', 'right', 'bottom', 'left']

/*
 * Сколько ждать подтверждения от Telegram (fullscreenChanged/fullscreenFailed),
 * прежде чем перестать резервировать TG_CONTROLS_HEIGHT «на всякий случай» —
 * см. pessimistic default ниже. Достаточно с запасом для нормального
 * round-trip, но не настолько долго, чтобы держать лишний отступ вечно на
 * клиентах, где подтверждение в принципе не придёт (см. MXL-FULLSCREEN-SURFACE-RACE-001).
 */
const CONFIRMATION_TIMEOUT_MS = 2000

function getTelegram() {
  if (typeof window === 'undefined') {
    return {
      webApp: null,
      webView: null,
    }
  }

  return {
    webApp: window.Telegram?.WebApp ?? null,
    webView: window.Telegram?.WebView ?? null,
  }
}

function toPixels(value) {
  const number = Number(value)

  return Number.isFinite(number) && number > 0 ? `${number}px` : '0px'
}

function writeInsets(prefix, insets) {
  for (const name of INSET_NAMES) {
    document.documentElement.style.setProperty(`${prefix}-${name}`, toPixels(insets?.[name]))
  }
}

function safelyRun(action, label) {
  try {
    return action()
  } catch (error) {
    console.info(`Telegram WebApp ${label} is unavailable.`, error)

    return undefined
  }
}

function postWebViewEvent(webView, event, data = {}) {
  safelyRun(() => webView?.postEvent?.(event, false, data), event)
}

/*
 * MXL-FULLSCREEN-SURFACE-RACE-001 — единый module-level store вместо N
 * независимых per-component useState+onEvent-подписок (было: каждый
 * useFullscreenSurface() сам вызывал webApp.ready()/expand()/requestFullscreen()
 * и сам подписывался на fullscreenChanged в своём useEffect — 19 экранов, 19
 * независимых копий одного и того же negotiation).
 *
 * Negotiation стартует лениво, при первом реальном subscribeFullscreen()
 * вызове — не при импорте модуля (нужно для тестов без DOM/Telegram) — и
 * ровно один раз за весь жизненный цикл страницы, независимо от того,
 * сколько компонентов подписываются или сколько раз StrictMode в dev
 * дважды вызывает subscribe при mount (см. negotiationStarted-guard ниже:
 * без него двойной вызов дал бы двойной requestFullscreen() и задвоенные
 * onEvent-подписки без парного offEvent).
 */

let negotiationStarted = false
let confirmed = false
let snapshot = false
let confirmationTimer = null
const listeners = new Set()

function notifyListeners() {
  for (const listener of listeners) listener()
}

function setSnapshot(value) {
  const next = Boolean(value)

  if (snapshot === next) return

  snapshot = next
  notifyListeners()
}

function clearConfirmationTimer() {
  if (confirmationTimer === null) return

  clearTimeout(confirmationTimer)
  confirmationTimer = null
}

/*
 * Подтверждает реальное fullscreen-состояние и снимает pessimistic default.
 * Вызывается только из событий, которые действительно означают «Telegram
 * сообщил финальное fullscreen-состояние» (fullscreenChanged/fullscreenFailed
 * или fallback-таймаут) — НЕ из safeAreaChanged/contentSafeAreaChanged,
 * которые могут прийти раньше и ничего не говорят о fullscreen как таковом.
 */
function markConfirmed(realValue) {
  confirmed = true
  clearConfirmationTimer()
  setSnapshot(realValue)
}

function startNegotiation() {
  if (negotiationStarted) return

  negotiationStarted = true

  const { webApp, webView } = getTelegram()
  const isTelegram = Boolean(webApp?.initData) || Boolean(webView?.postEvent)

  if (!isTelegram) {
    // Web fallback — Telegram fullscreen controls в принципе не существуют,
    // резервировать TG_CONTROLS_HEIGHT здесь было бы чистой регрессией.
    confirmed = true
    setSnapshot(false)

    return
  }

  /*
   * Pessimistic default (MXL-FULLSCREEN-SURFACE-RACE-001 pre-mortem, «слон»):
   * requestFullscreen() ниже — асинхронный round-trip к нативному Telegram
   * слою, и React обязан отрисовать первый кадр раньше, чем подтверждение
   * физически может прийти. Раньше первый кадр внутри Telegram оптимистично
   * предполагал fullscreen=false (без отступа под controls) — и именно это
   * давало перекрытую/неработающую кнопку на MoodCheckGate. Теперь, пока
   * negotiation не подтверждён, предполагаем худшее (controls, вероятно,
   * будут) и резервируем место сразу — в худшем случае кнопка на первом
   * кадре будет с лишним отступом и слегка сдвинется вверх, если оказалось,
   * что fullscreen не активен; это менее вредно, чем видимая, но
   * перекрытая кнопка.
   */
  setSnapshot(true)

  const state = {
    fullscreen: Boolean(webApp?.isFullscreen),
    safeArea: webApp?.safeAreaInset ?? {},
    contentSafeArea: webApp?.contentSafeAreaInset ?? {},
  }

  const applyInsets = () => {
    writeInsets('--tg-safe-area', state.safeArea)
    writeInsets('--tg-content-safe-area', state.contentSafeArea)
  }

  const onWebAppFullscreen = event => {
    state.fullscreen = Boolean(event?.isFullscreen ?? event?.is_fullscreen ?? webApp?.isFullscreen)
    applyInsets()
    markConfirmed(state.fullscreen)
  }

  const onWebViewFullscreen = (_event, data) => {
    onWebAppFullscreen(data)
  }

  const onWebAppSafeArea = event => {
    state.safeArea = event ?? webApp?.safeAreaInset ?? {}
    applyInsets()
  }

  const onWebViewSafeArea = (_event, data) => {
    onWebAppSafeArea(data)
  }

  const onWebAppContentSafeArea = event => {
    state.contentSafeArea = event ?? webApp?.contentSafeAreaInset ?? {}
    applyInsets()
  }

  const onWebViewContentSafeArea = (_event, data) => {
    onWebAppContentSafeArea(data)
  }

  const onFullscreenFailed = event => {
    const error = event?.error ?? event

    /*
     * requestFullscreen идемпотентен для нашего shell: ALREADY_FULLSCREEN
     * означает, что нужное состояние уже достигнуто. Сбрасывать флаг здесь
     * нельзя — иначе общий top reserve исчезает, хотя controls Telegram всё
     * ещё лежат поверх webview.
     */
    state.fullscreen = error === 'ALREADY_FULLSCREEN' || Boolean(webApp?.isFullscreen)
    markConfirmed(state.fullscreen)

    console.info('Telegram fullscreen request was rejected. Expanded mode remains active.', event)
  }

  safelyRun(() => webApp?.ready?.(), 'ready()')
  safelyRun(() => webApp?.expand?.(), 'expand()')

  applyInsets()

  safelyRun(() => {
    webApp?.onEvent?.('fullscreenChanged', onWebAppFullscreen)
    webApp?.onEvent?.('fullscreenFailed', onFullscreenFailed)
    webApp?.onEvent?.('safeAreaChanged', onWebAppSafeArea)
    webApp?.onEvent?.('contentSafeAreaChanged', onWebAppContentSafeArea)
  }, 'WebApp event subscription')

  safelyRun(() => {
    webView?.onEvent?.('fullscreen_changed', onWebViewFullscreen)
    webView?.onEvent?.('fullscreen_failed', onFullscreenFailed)
    webView?.onEvent?.('safe_area_changed', onWebViewSafeArea)
    webView?.onEvent?.('content_safe_area_changed', onWebViewContentSafeArea)
  }, 'WebView event subscription')

  // Если уже fullscreen (Telegram запомнил состояние с прошлой сессии),
  // ни один negotiation event не обязан прийти — таймаут ниже подтвердит
  // то же значение, никакого видимого эффекта это не даст.
  if (!state.fullscreen && typeof webApp?.requestFullscreen === 'function') {
    const result = safelyRun(() => webApp.requestFullscreen(), 'requestFullscreen()')

    if (result && typeof result.catch === 'function') {
      result.catch(onFullscreenFailed)
    }
  } else if (!state.fullscreen) {
    postWebViewEvent(webView, 'web_app_request_fullscreen')
  }

  postWebViewEvent(webView, 'web_app_request_safe_area')
  postWebViewEvent(webView, 'web_app_request_content_safe_area')

  confirmationTimer = setTimeout(() => {
    if (confirmed) return

    markConfirmed(Boolean(webApp?.isFullscreen))
  }, CONFIRMATION_TIMEOUT_MS)
}

/*
 * useSyncExternalStore-совместимая пара. React вызывает getSnapshot()
 * синхронно во время рендера — ДО commit, до того как subscribe() вообще
 * вызывается (subscribe уходит в эффект, который коммитится после первого
 * рендера). Если стартовать negotiation только из subscribe, самый первый
 * рендер самого первого потребителя (MoodCheckGate на холодном старте)
 * увидел бы ещё не стартовавший store — то есть ровно тот кадр, где
 * pessimistic default важнее всего, остался бы неисправленным. Поэтому
 * startNegotiation() тоже лежит в getSnapshot(), не только в subscribe();
 * идемпотентность (negotiationStarted-guard) делает многократный вызов —
 * в т.ч. спекулятивный, при concurrent-рендерах — безопасным.
 */
function subscribeFullscreen(listener) {
  startNegotiation()
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getFullscreenSnapshot() {
  startNegotiation()

  return snapshot
}

/*
 * Legacy-совместимая обёртка над store — та же сигнатура и то же поведение,
 * что раньше был initFullscreen(onChange): вызывает onChange сразу текущим
 * значением и на каждое последующее изменение, возвращает cleanup.
 * Используется только src/App.jsx (не для useFullscreenSurface — это
 * отдельный, до этой задачи не изменённый top-level потребитель fullscreen
 * state, не пропущенный через useFullscreenSurface()).
 */
function initFullscreen(onChange) {
  const notify = () => onChange?.({ fullscreen: getFullscreenSnapshot() })
  const unsubscribe = subscribeFullscreen(notify)

  notify()

  return unsubscribe
}

export { getFullscreenSnapshot, initFullscreen, subscribeFullscreen }
