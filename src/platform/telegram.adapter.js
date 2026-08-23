import WebApp from '@twa-dev/sdk'

export const telegramAdapter = {
  name: 'telegram',

  init() {
    try {
      WebApp.ready?.()
      WebApp.expand?.()
      WebApp.disableVerticalSwipes?.()
    } catch {
      // старые версии Telegram SDK/клиента могут не поддерживать вызов — не критично
    }
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
    if (!tgUser) return null
    return {
      id: tgUser.id,
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

  async requestAuth() {
    // в Telegram пользователь уже известен через initData, отдельного входа не требуется
    return this.getUser()
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
}
