const STORAGE_KEY = 'mentalix_web_user'

export const webAdapter = {
  name: 'web',

  init() {
    // фон/цвет статус-бара в браузере не программируется — управляется через CSS/manifest
  },

  getUser() {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  },

  // нет Telegram-контекста в браузере — подписанного initData не существует
  getInitData() {
    return ''
  },

  getStartParam() {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('startapp') || ''
  },

  async requestAuth() {
    const response = await fetch('/api/auth/session', { credentials: 'include' })
    if (!response.ok) throw new Error(`Web session restore failed: ${response.status}`)
    const result = await response.json()
    if (!result.authenticated || !result.user) {
      this.clearUser()
      return null
    }
    this.setUser(result.user)
    return result.user
  },

  setUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  },

  clearUser() {
    localStorage.removeItem(STORAGE_KEY)
  },

  haptic() {
    // нет тактильной обратной связи в браузере — просто ничего не делаем
  },

  close() {
    // нет аналога закрытия мини-аппа в браузере
  },

  showSettingsButton() {
    // в вебе кнопка настроек будет своя, в самом интерфейсе — обрабатывается в App.jsx напрямую
  },

  openInvoice() {
    // оплата в вебе будет отдельным потоком (Stripe/ЮKassa checkout), подключим позже
    console.warn('openInvoice недоступен в веб-версии — используйте отдельный чекаут-флоу')
  },
}
