/**
 * Блокирует жесты масштабирования (pinch-zoom) на iOS.
 *
 * Telegram iOS и Safari игнорируют user-scalable=no в части случаев.
 * preventDefault на gesture-событиях (iOS-only) и на multi-touch touchmove
 * глушит зум, не ломая прокрутку одним пальцем.
 *
 * Вызывается один раз при старте из platform/index.js.
 */
export function installZoomGuard() {
  if (typeof window === 'undefined') return

  // Защита от повторной установки (StrictMode, hot reload)
  if (window.__mxZoomGuardInstalled) return
  window.__mxZoomGuardInstalled = true

  // iOS gesture events — срабатывают только на iOS/Safari
  const block = e => e.preventDefault()
  const gestureOptions = { passive: false }

  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    window.addEventListener(type, block, gestureOptions)
  }

  // multi-touch touchmove — pinch-zoom через два пальца.
  // Прокрутка одним пальцем не затрагивается (touches.length === 1).
  window.addEventListener(
    'touchmove',
    e => {
      if (e.touches.length > 1) e.preventDefault()
    },
    { passive: false }
  )
}
