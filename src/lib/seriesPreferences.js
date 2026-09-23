const PREFIX = 'mx-series-preferences:'
const TOOLTIP_SUFFIX = ':tooltip-seen'

function key(userId) {
  return `${PREFIX}${userId || 'anonymous'}`
}

function read(userId) {
  try {
    const raw = localStorage.getItem(key(userId))
    const parsed = raw ? JSON.parse(raw) : null
    return {
      showStreak: parsed?.showStreak !== false,
      showBadges: parsed?.showBadges !== false,
    }
  } catch {
    return { showStreak: true, showBadges: true }
  }
}

export function getSeriesPreferences(userId) {
  return read(userId)
}

export function saveSeriesPreference(userId, name, value) {
  const next = { ...read(userId), [name]: Boolean(value) }
  try {
    localStorage.setItem(key(userId), JSON.stringify(next))
  } catch {
    // Настройка остаётся только в текущем состоянии при недоступном storage.
  }
  return next
}

export function shouldShowSeriesTooltip(userId) {
  try {
    return localStorage.getItem(`${key(userId)}${TOOLTIP_SUFFIX}`) !== '1'
  } catch {
    return false
  }
}

export function markSeriesTooltipSeen(userId) {
  try {
    localStorage.setItem(`${key(userId)}${TOOLTIP_SUFFIX}`, '1')
  } catch {
    // Подсказка не должна блокировать экран.
  }
}
