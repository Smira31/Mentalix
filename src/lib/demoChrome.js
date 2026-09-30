function isStandaloneDisplayMode(windowLike = typeof window !== 'undefined' ? window : null) {
  if (!windowLike) return false

  return (
    windowLike.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    windowLike.navigator?.standalone === true
  )
}

export function shouldRenderDemoTelegramChrome({
  previewDemoMode,
  platformName,
  realPhone,
  deviceFrameMode = false,
  windowLike,
}) {
  if (!previewDemoMode || platformName === 'telegram' || realPhone) return false

  /*
   * В demo-рамке эмуляция обязана быть: shell имитирует Telegram
   * fullscreen, поэтому проверка display-mode: standalone здесь
   * не применяется — iframe превью (PWA/standalone-контекст) может
   * сообщать standalone ложно, но рамка всё равно рисует iPhone.
   * Standalone Safari/PWA на настоящем телефоне (без рамки) должен
   * выглядеть как обычный Safari: без нарисованной поверх
   * приложения Telegram-панели управления.
   */
  if (deviceFrameMode) return true

  return !isStandaloneDisplayMode(windowLike)
}
