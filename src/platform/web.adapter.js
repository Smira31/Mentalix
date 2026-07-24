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

  async requestAuth() {
    // реальный флоу подключим на шаге email OTP — пока просто читаем сохранённого пользователя
    return this.getUser()
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