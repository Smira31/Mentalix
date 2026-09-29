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
  windowLike,
}) {
  if (!previewDemoMode || platformName === 'telegram' || realPhone) return false

  // Standalone Safari/PWA должен выглядеть как обычный Safari: без
  // нарисованной поверх приложения Telegram-панели управления.
  return !isStandaloneDisplayMode(windowLike)
}
