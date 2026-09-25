/**
 * Блокирует жесты масштабирования (pinch-zoom) на iOS.
 *
 * Telegram iOS и Safari игнорируют user-scalable=no в части случаев.
 * preventDefault на gesture-событиях (iOS-only) глушит зум, не ломая
 * прокрутку одним пальцем.
 *
 * CSS touch-action: pan-x pan-y (в index.css на html/body) отключает
 * pinch-zoom на уровне браузера без JavaScript-слушателей.
 * Здесь — только iOS gesture events как дополнительная защита.
 *
 * ВАЖНО: здесь НЕТ passive:false touchmove на window — такой слушатель
 * заставляет браузер ждать JS перед началом прокрутки одним пальцем,
 * что на iOS выглядит как «страница не скроллится». Прокрутка должна
 * работать без задержек.
 *
 * Вызывается один раз при старте из platform/index.js.
 */
export function installZoomGuard() {
  if (typeof window === 'undefined') return

  // Защита от повторной установки (StrictMode, hot reload)
  if (window.__mxZoomGuardInstalled) return
  window.__mxZoomGuardInstalled = true

  // iOS gesture events — срабатывают только на iOS/Safari.
  // Не влияют на прокрутку одним пальцем.
  const block = e => e.preventDefault()
  const gestureOptions = { passive: false }

  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    window.addEventListener(type, block, gestureOptions)
  }
}
