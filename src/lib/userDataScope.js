const USER_DATA_PREFIXES = [
  'mentalix:today:snapshot:',
  'mentalix:trends:snapshot:',
  'mx-series-snapshot:',
  'mx-series-preferences:',
  'mx-journal-',
  'mx-today-',
  'mx-morning-',
  'mx-guided-',
  'mx-mood-check-',
]

let activeUserId = null

function isUserDataKey(key) {
  return USER_DATA_PREFIXES.some(prefix => key.startsWith(prefix))
}

function clearStorageExcept(storage, userId) {
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)
      if (!key || !isUserDataKey(key)) continue
      // User-scoped records are retained only for the user entering this scope.
      // Unscoped legacy keys are always removed during the first switch.
      if (!key.includes(`:${userId}`)) storage.removeItem(key)
    }
  } catch {
    // Storage may be disabled in private mode; memory caches still have guards.
  }
}

export function switchUserDataScope(userId) {
  const normalized = Number(userId)
  if (!Number.isSafeInteger(normalized) || normalized <= 0) return false
  if (activeUserId === normalized) return false

  if (typeof window !== 'undefined') {
    clearStorageExcept(window.localStorage, normalized)
    clearStorageExcept(window.sessionStorage, normalized)
  }
  activeUserId = normalized
  return true
}

export function resetUserDataScopeForTests() {
  activeUserId = null
}

export function getUserDataScope() {
  return activeUserId
}

export function scopedStorageKey(prefix, userId) {
  const normalized = Number(userId)
  if (!Number.isSafeInteger(normalized) || normalized <= 0) {
    throw new TypeError('A positive user id is required for user-scoped storage')
  }
  return `${prefix}${normalized}`
}
