const PREFIX = 'mx-series-preferences:'
const TOOLTIP_SUFFIX = ':tooltip-seen'

function key(userId) {
  return `${PREFIX}${userId || 'anonymous'}`
}

/*
 * Огонёк серии в шапке «Сегодня» виден всегда — решение владельца от
 * 24.09.2026, настройка «Показывать серию» удалена. Старое значение
 * showStreak в localStorage игнорируется: при чтении поле удаляется
 * из сохранённого объекта. Остаётся только показ значков.
 */
function read(userId) {
  try {
    const raw = localStorage.getItem(key(userId))
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && 'showStreak' in parsed) {
      delete parsed.showStreak
      localStorage.setItem(key(userId), JSON.stringify(parsed))
    }
    return {
      showBadges: parsed?.showBadges !== false,
    }
  } catch {
    return { showBadges: true }
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
