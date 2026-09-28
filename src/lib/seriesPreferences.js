const PREFIX = 'mx-series-preferences:'
const TOOLTIP_SUFFIX = ':tooltip-seen'

function key(userId) {
  return `${PREFIX}${userId || 'anonymous'}`
}

/*
 * Огонёк серии и значки в шапке «Сегодня» видны всегда — настройки
 * «Показывать серию» и «Показывать значки» больше нет. От prefs
 * осталась только подсказка-тултип об огоньке (показывается один раз).
 */

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
