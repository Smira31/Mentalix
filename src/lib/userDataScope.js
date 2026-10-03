const USER_DATA_PREFIXES = [
  'mentalix:today:snapshot:',
  'mentalix:trends:snapshot:',
  'mentalix:streak:snapshot:',
  'mentalix:theme-detail:v1:',
  'mx-series-snapshot:',
  'mx-series-preferences:',
  'mx-journal-',
  'mx-today-',
  'mx-morning-',
  'mx-guided-',
  'mx-mood-check-',
  'mx-hero-journey-',
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
      const belongsToUser = key.startsWith('mx-hero-journey-')
        ? key.split(':')[1] === String(userId)
        : key.includes(`:${userId}`)
      if (!belongsToUser) storage.removeItem(key)
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
    migrateHeroJourneyProgress(normalized)
    clearStorageExcept(window.localStorage, normalized)
    clearStorageExcept(window.sessionStorage, normalized)
  }
  activeUserId = normalized
  return true
}

// До очистки legacy-ключ один раз получает текущий пользователь.
export function migrateHeroJourneyProgress(userId) {
  const key = scopedStorageKey('mx-hero-journey-progress:', userId, true)
  try {
    const storage = window.localStorage
    const legacy = storage.getItem('mx-hero-journey-progress')
    if (legacy !== null) {
      if (storage.getItem(key) === null) storage.setItem(key, legacy)
      storage.removeItem('mx-hero-journey-progress')
    }
  } catch {
    // Недоступное хранилище не блокирует облачное восстановление.
  }
  return key
}

export function resetUserDataScopeForTests() {
  activeUserId = null
}

export function getUserDataScope() {
  return activeUserId
}

export function scopedStorageKey(prefix, userId, allowGuest = false) {
  const normalized = Number(userId)
  if (!Number.isSafeInteger(normalized) || normalized === 0 || (!allowGuest && normalized < 0)) {
    throw new TypeError('A positive user id is required for user-scoped storage')
  }
  return `${prefix}${normalized}`
}
