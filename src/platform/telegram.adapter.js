import WebApp from '@twa-dev/sdk'

// Цвет фона приложения (--c-bg) для шапки/фона/нижней полосы Telegram.
// Запасной — значение токена по умолчанию из index.css.
const DEFAULT_BG_HEX = '#050403'

function readAppBackground() {
  try {
    const channels = getComputedStyle(document.documentElement)
      .getPropertyValue('--c-bg')
      .trim()
      .split(/\s+/)
      .map(Number)
    if (channels.length === 3 && channels.every(c => Number.isFinite(c) && c >= 0 && c <= 255)) {
      return `#${channels.map(c => c.toString(16).padStart(2, '0')).join('')}`
    }
  } catch {
    // нет DOM/стилей — берём значение по умолчанию
  }
  return DEFAULT_BG_HEX
}

let earlyInitDone = false

/*
 * Вызывается синхронно при загрузке модуля platform — до createRoot и
 * первого кадра: Telegram сразу разворачивает окно и красит шапку, фон и
 * нижнюю полосу в цвет приложения (без белой вспышки). Каждый вызов
 * защищён — вне Telegram или в старых клиентах ничего не падает.
 */
export function earlyInitTelegram() {
  if (earlyInitDone) return
  earlyInitDone = true
  const bg = readAppBackground()
  const run = action => {
    try {
      action()
    } catch {
      // старые версии Telegram SDK/клиента могут не поддерживать вызов — не критично
    }
  }
  run(() => WebApp.ready?.())
  run(() => WebApp.expand?.())
  run(() => WebApp.setHeaderColor?.(bg))
  run(() => WebApp.setBackgroundColor?.(bg))
  run(() => WebApp.setBottomBarColor?.(bg))
  run(() => WebApp.disableVerticalSwipes?.())
}

export const telegramAdapter = {
  name: 'telegram',

  // Всё уже сделано при загрузке; здесь — страховка, если ранний вызов не выполнялся.
  init() {
    earlyInitTelegram()
  },

  // шапка и фон Telegram синхронизируются с темой приложения (день/ночь).
  // Все вызовы защищены: в старых клиентах/версиях SDK методов может не быть
  setThemeColors(bgHex) {
    try {
      WebApp.setHeaderColor?.(bgHex)
      WebApp.setBackgroundColor?.(bgHex)
    } catch {
      // старые версии Telegram SDK/клиента могут не поддерживать вызов — не критично
    }
  },

  getUser() {
    const tgUser = WebApp.initDataUnsafe?.user
    const id = Number(tgUser?.id)
    if (!Number.isSafeInteger(id) || id <= 0) return null
    return {
      id,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      username: tgUser.username,
    }
  },

  /*
   * MXL-SECURITY-AUDIT-001: сырая подписанная строка initData — в отличие
   * от initDataUnsafe (используется только в getUser выше для чтения полей),
   * её можно проверить на бэкенде по HMAC. Backend-валидация пока не
   * подключена (см. TASKS.md) — этот метод только делает данные доступными
   * для отправки, сам по себе от подмены user_id не защищает.
   */
  getInitData() {
    return WebApp.initData || ''
  },

  getStartParam() {
    return WebApp.initDataUnsafe?.start_param || ''
  },

  async requestAuth({ timeoutMs = 3000, intervalMs = 50 } = {}) {
    // В некоторых WebView user и подписанный initData появляются в разные моменты.
    // Не открываем пользовательские экраны до появления обоих: иначе запросы
    // уходят с user_id без Authorization: tma.
    const deadline = Date.now() + timeoutMs
    let user = this.getUser()

    while ((!user || !this.getInitData()) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      user = this.getUser()
    }

    return user && this.getInitData() ? user : null
  },

  haptic(style = 'light') {
    if (style === 'success' || style === 'error' || style === 'warning') {
      WebApp.HapticFeedback?.notificationOccurred(style)
    } else {
      WebApp.HapticFeedback?.impactOccurred(style)
    }
  },

  close() {
    WebApp.close?.()
  },

  showSettingsButton(onClick) {
    WebApp.SettingsButton?.show()
    WebApp.SettingsButton?.onClick(onClick)
  },

  openInvoice(url, callback) {
    WebApp.openInvoice?.(url, callback)
  },

  // t.me-ссылки открываются внутри Telegram; window.open в Telegram iOS
  // уводит во внешний браузер.
  openTelegramLink(url) {
    if (WebApp.openTelegramLink) {
      WebApp.openTelegramLink(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  },

  showConfirm(message) {
    if (WebApp.showConfirm) {
      return new Promise(resolve => {
        WebApp.showConfirm(message, ok => resolve(Boolean(ok)))
      })
    }
    return Promise.resolve(window.confirm(message))
  },
}
