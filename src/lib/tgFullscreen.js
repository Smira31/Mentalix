const INSET_NAMES = ['top', 'right', 'bottom', 'left']

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

  return Number.isFinite(number) && number > 0
    ? `${number}px`
    : '0px'
}

function writeInsets(prefix, insets) {
  for (const name of INSET_NAMES) {
    document.documentElement.style.setProperty(
      `${prefix}-${name}`,
      toPixels(insets?.[name]),
    )
  }
}

function safelyRun(action, label) {
  try {
    return action()
  } catch (error) {
    console.info(
      `Telegram WebApp ${label} is unavailable.`,
      error,
    )

    return undefined
  }
}

function postWebViewEvent(
  webView,
  event,
  data = {},
) {
  safelyRun(
    () =>
      webView?.postEvent?.(
        event,
        false,
        data,
      ),
    event,
  )
}

export function initFullscreen(onChange) {
  const {
    webApp,
    webView,
  } = getTelegram()

  const isTelegram =
    Boolean(webApp?.initData) ||
    Boolean(webView?.postEvent)

  if (!isTelegram) {
    return () => {}
  }

  const state = {
    fullscreen: Boolean(
      webApp?.isFullscreen
    ),
    safeArea:
      webApp?.safeAreaInset ?? {},
    contentSafeArea:
      webApp?.contentSafeAreaInset ?? {},
  }

  const apply = () => {
    writeInsets(
      '--tg-safe-area',
      state.safeArea,
    )

    writeInsets(
      '--tg-content-safe-area',
      state.contentSafeArea,
    )

    onChange?.({
      fullscreen:
        state.fullscreen,
    })
  }

  const onWebAppFullscreen = (event) => {
    state.fullscreen = Boolean(
      event?.isFullscreen ??
      event?.is_fullscreen ??
      webApp?.isFullscreen
    )

    apply()
  }

  const onWebViewFullscreen = (
    _event,
    data,
  ) => {
    onWebAppFullscreen(data)
  }

  const onWebAppSafeArea = (event) => {
    state.safeArea =
      event ??
      webApp?.safeAreaInset ??
      {}

    apply()
  }

  const onWebViewSafeArea = (
    _event,
    data,
  ) => {
    onWebAppSafeArea(data)
  }

  const onWebAppContentSafeArea = (
    event,
  ) => {
    state.contentSafeArea =
      event ??
      webApp?.contentSafeAreaInset ??
      {}

    apply()
  }

  const onWebViewContentSafeArea = (
    _event,
    data,
  ) => {
    onWebAppContentSafeArea(data)
  }

  const onFullscreenFailed = (event) => {
    const error =
      event?.error ?? event

    /*
     * requestFullscreen идемпотентен для нашего shell: ALREADY_FULLSCREEN
     * означает, что нужное состояние уже достигнуто. Сбрасывать флаг здесь
     * нельзя — иначе общий top reserve исчезает, хотя controls Telegram всё
     * ещё лежат поверх webview.
     */
    state.fullscreen =
      error === 'ALREADY_FULLSCREEN' ||
      Boolean(webApp?.isFullscreen)

    apply()

    console.info(
      'Telegram fullscreen request was rejected. Expanded mode remains active.',
      event,
    )
  }

  safelyRun(
    () => webApp?.ready?.(),
    'ready()',
  )

  safelyRun(
    () => webApp?.expand?.(),
    'expand()',
  )

  apply()

  safelyRun(
    () => {
      webApp?.onEvent?.(
        'fullscreenChanged',
        onWebAppFullscreen,
      )

      webApp?.onEvent?.(
        'fullscreenFailed',
        onFullscreenFailed,
      )

      webApp?.onEvent?.(
        'safeAreaChanged',
        onWebAppSafeArea,
      )

      webApp?.onEvent?.(
        'contentSafeAreaChanged',
        onWebAppContentSafeArea,
      )
    },
    'WebApp event subscription',
  )

  safelyRun(
    () => {
      webView?.onEvent?.(
        'fullscreen_changed',
        onWebViewFullscreen,
      )

      webView?.onEvent?.(
        'fullscreen_failed',
        onFullscreenFailed,
      )

      webView?.onEvent?.(
        'safe_area_changed',
        onWebViewSafeArea,
      )

      webView?.onEvent?.(
        'content_safe_area_changed',
        onWebViewContentSafeArea,
      )
    },
    'WebView event subscription',
  )

  if (
    !state.fullscreen &&
    typeof webApp?.requestFullscreen ===
    'function'
  ) {
    const result = safelyRun(
      () =>
        webApp.requestFullscreen(),
      'requestFullscreen()',
    )

    if (
      result &&
      typeof result.catch === 'function'
    ) {
      result.catch(
        onFullscreenFailed,
      )
    }
  } else if (!state.fullscreen) {
    postWebViewEvent(
      webView,
      'web_app_request_fullscreen',
    )
  }

  postWebViewEvent(
    webView,
    'web_app_request_safe_area',
  )

  postWebViewEvent(
    webView,
    'web_app_request_content_safe_area',
  )

  return () => {
    safelyRun(
      () => {
        webApp?.offEvent?.(
          'fullscreenChanged',
          onWebAppFullscreen,
        )

        webApp?.offEvent?.(
          'fullscreenFailed',
          onFullscreenFailed,
        )

        webApp?.offEvent?.(
          'safeAreaChanged',
          onWebAppSafeArea,
        )

        webApp?.offEvent?.(
          'contentSafeAreaChanged',
          onWebAppContentSafeArea,
        )

        webView?.offEvent?.(
          'fullscreen_changed',
          onWebViewFullscreen,
        )

        webView?.offEvent?.(
          'fullscreen_failed',
          onFullscreenFailed,
        )

        webView?.offEvent?.(
          'safe_area_changed',
          onWebViewSafeArea,
        )

        webView?.offEvent?.(
          'content_safe_area_changed',
          onWebViewContentSafeArea,
        )
      },
      'event cleanup',
    )
  }
}
