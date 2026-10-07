function isStandaloneDisplayMode(windowLike = typeof window !== 'undefined' ? window : null) {
  if (!windowLike) return false

  return (
    windowLike.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    windowLike.navigator?.standalone === true
  )
}

/*
 * Состояние левой пилюли эмуляции Telegram: приложение зарегистрировало
 * «назад» (BackButton.show в Telegram) — пилюля «‹ Назад» и по тапу
 * вызывает тот же обработчик; стек пуст (главная вкладка) — «✕ Закрыть»,
 * тап ничего не делает.
 */
export function demoTelegramPillState(hasBackAction) {
  return hasBackAction
    ? { mode: 'back', label: 'Назад', icon: 'chevron-left' }
    : { mode: 'close', label: 'Закрыть', icon: 'close' }
}

/*
 * Активна ли эмуляция Telegram в demo-рамке. Используется там, где
 * собственная кнопка «назад» приложения должна уступать место пилюле
 * Telegram (как на устройстве, где экран видит системную кнопку).
 */
export function isDemoEmulationActive(root = typeof document !== 'undefined' ? document : null) {
  /*
   * Демо-эмуляция Telegram активна, пока нарисована её шапка (data-demo-chrome
   * на shell) — независимо от рамки телефона: при ?frame=0 шапка с пилюлей
   * «‹ Назад» остаётся, а фрейма нет. Старый признак рамки оставляем вторым
   * селектором, чтобы поведение внутри рамки не менялось.
   */
  return Boolean(
    root?.querySelector?.(
      "[data-demo-chrome='true'], [data-mentalix-demo-frame='true'][data-demo-mode='true']"
    )
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
