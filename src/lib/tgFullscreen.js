// ── Полноэкранный режим Telegram (Bot API 8.0) ──
// Работает через универсальную шину window.Telegram.WebView, поэтому
// не зависит от версии @twa-dev/sdk: старый SDK всё равно доносит события.
// Если клиент старый — просто ничего не происходит, вёрстка не ломается.

function bus() {
  return typeof window !== 'undefined' ? window.Telegram?.WebView : null
}

function post(event, data = {}) {
  try {
    bus()?.postEvent?.(event, false, data)
  } catch {}
}

/**
 * Включает полноэкранный режим и следит за безопасными зонами.
 * Выставляет CSS-переменную --tg-top: сколько сверху занимают
 * статус-бар и плавающие кнопки Telegram.
 * @param {(state: {fullscreen: boolean, top: number}) => void} onChange
 * @returns {() => void} функция отписки
 */
export function initFullscreen(onChange) {
  const b = bus()
  if (!b?.onEvent) return () => {}

  const state = { fullscreen: false, safeTop: 0, contentTop: 0 }

  function apply() {
    // в полноэкранном режиме резервируем место под кнопки Telegram
    const measured = state.safeTop + state.contentTop
    const top = state.fullscreen ? measured || 56 : 0
    document.documentElement.style.setProperty('--tg-top', `${top}px`)
    onChange?.({ fullscreen: state.fullscreen, top })
  }

  const onFullscreen = (_e, data) => {
    state.fullscreen = !!(data?.is_fullscreen ?? data?.isFullscreen)
    apply()
  }
  const onSafeArea = (_e, data) => {
    state.safeTop = Number(data?.top) || 0
    apply()
  }
  const onContentSafeArea = (_e, data) => {
    state.contentTop = Number(data?.top) || 0
    apply()
  }
  const onFailed = () => {
    state.fullscreen = false
    apply()
  }

  b.onEvent('fullscreen_changed', onFullscreen)
  b.onEvent('fullscreen_failed', onFailed)
  b.onEvent('safe_area_changed', onSafeArea)
  b.onEvent('content_safe_area_changed', onContentSafeArea)

  post('web_app_request_fullscreen')
  post('web_app_request_safe_area')
  post('web_app_request_content_safe_area')

  return () => {
    try {
      b.offEvent?.('fullscreen_changed', onFullscreen)
      b.offEvent?.('fullscreen_failed', onFailed)
      b.offEvent?.('safe_area_changed', onSafeArea)
      b.offEvent?.('content_safe_area_changed', onContentSafeArea)
    } catch {}
  }
}
