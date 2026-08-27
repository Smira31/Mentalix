const AUTH_STATUSES = new Set(['unknown', 'anonymous', 'authenticated', 'expired', 'error'])
const AUTH_PROVIDERS = new Set(['telegram', 'web', 'native'])

function normalizeSession(session) {
  if (!session || typeof session !== 'object') {
    return { status: 'anonymous', provider: 'web' }
  }

  const status = AUTH_STATUSES.has(session.status) ? session.status : 'error'
  const provider = AUTH_PROVIDERS.has(session.provider) ? session.provider : 'web'

  return {
    status,
    provider,
    ...(session.userId == null ? {} : { userId: Number(session.userId) }),
    ...(session.accessToken ? { accessToken: session.accessToken } : {}),
  }
}

/**
 * Port for authentication/session capabilities.
 * Implementations may be Telegram, web or native, but feature code only sees
 * the normalized SessionContext and never a raw Telegram payload.
 */
export function createAuthPort(adapter) {
  if (!adapter || typeof adapter.requestAuth !== 'function') {
    throw new TypeError('AuthPort requires an adapter with requestAuth()')
  }

  let current = { status: 'unknown', provider: adapter.name || 'web' }
  const listeners = new Set()

  const publish = next => {
    current = normalizeSession(next)
    listeners.forEach(listener => listener(current))
    return current
  }

  return {
    async restore() {
      try {
        const user = await adapter.requestAuth()
        if (!user) return publish({ status: 'anonymous', provider: adapter.name || 'web' })

        return publish({
          status: 'authenticated',
          provider: adapter.name || 'web',
          userId: user.id,
        })
      } catch (error) {
        publish({ status: 'error', provider: adapter.name || 'web' })
        throw error
      }
    },

    getSession() {
      return current
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    clear() {
      adapter.clearUser?.()
      return publish({ status: 'anonymous', provider: adapter.name || 'web' })
    },
  }
}

export function createAuthSnapshot(authPort) {
  return () => authPort.getSession()
}

export const authStatuses = Object.freeze([...AUTH_STATUSES])
export const authProviders = Object.freeze([...AUTH_PROVIDERS])
