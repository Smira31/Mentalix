const STORAGE_KEY = 'mentalix_web_user'
const SESSION_TOKEN_KEY = 'mentalix_session_token'

function getSessionToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY)
  } catch {
    return null
  }
}

function setSessionToken(token) {
  if (!token) return
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token)
  } catch {
    // Private browsing can disable storage; cookie auth remains available.
  }
}

function clearSessionToken() {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY)
  } catch {
    // Cookie auth remains available when storage is blocked.
  }
}

export const webAdapter = {
  name: 'web',
  getSessionToken,
  setSessionToken,
  clearSessionToken,

  init() {
    // фон/цвет статус-бара в браузере не программируется — управляется через CSS/manifest
  },

  getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
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
    const localFixtureMode = import.meta.env.DEV || import.meta.env.VITE_LOCAL_PREVIEW === 'true'
    if (localFixtureMode) return this.getUser()
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)
    let response
    try {
      const token = getSessionToken()
      response = await fetch(`${apiBase}/auth/session`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }
    if (!response.ok) {
      if (response.status === 401) clearSessionToken()
      if (localFixtureMode) return this.getUser()
      throw new Error(`Web session restore failed: ${response.status}`)
    }
    const result = await response.json()
    if (localFixtureMode && !Object.prototype.hasOwnProperty.call(result, 'authenticated')) {
      return this.getUser()
    }
    if (!result.authenticated || !result.user) {
      this.clearUser()
      return null
    }
    this.setUser(result.user)
    return result.user
  },

  setUser(user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } catch {
      // Keep the active session in memory when private storage is unavailable.
    }
  },

  clearUser() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage may be disabled in private browsing.
    }
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

  openTelegramLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  },
}
