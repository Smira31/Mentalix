import WebApp from '@twa-dev/sdk'

export const telegramAdapter = {
  name: 'telegram',

  init() {
    WebApp.ready()
    WebApp.expand()
    WebApp.disableVerticalSwipes?.()
  },

  // шапка и фон Telegram синхронизируются с темой приложения (день/ночь)
  setThemeColors(bgHex) {
    WebApp.setHeaderColor(bgHex)
    WebApp.setBackgroundColor(bgHex)
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