import { scopedStorageKey } from './userDataScope.js'
import { currentCheckinStreak, withTodayCheckin } from './series.js'

/*
 * Последнее известное значение серии для огонька в шапке «Сегодня».
 * Пока история чек-инов грузится, withTodayCheckin видит только сегодняшний
 * чек-ин и даёт 1 — огонёк мигал «1» → «6». Храним число по user id
 * (префикс mx-today- чистится при смене пользователя, #780).
 */
const STREAK_PREFIX = 'mx-today-streak:'

export function peekCachedStreak(userId) {
  try {
    const value = Number(localStorage.getItem(scopedStorageKey(STREAK_PREFIX, userId)))
    return Number.isSafeInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function rememberStreak(userId, streak) {
  try {
    const key = scopedStorageKey(STREAK_PREFIX, userId)
    if (Number.isSafeInteger(streak) && streak > 0) localStorage.setItem(key, String(streak))
    else localStorage.removeItem(key)
  } catch {
    // Кэш — оптимизация; приватный режим может запрещать storage.
  }
}

/*
 * Число для огонька. До загрузки истории — кэш этого пользователя или null
 * (огонь без числа); после — честный расчёт по истории + сегодняшнему чек-ину
 * + дням активности (ритуалы, аскезы, настроение).
 */
export function resolveDisplayedStreak({
  historyLoaded,
  history,
  checkin,
  cachedStreak,
  activityDays,
}) {
  if (!historyLoaded) return cachedStreak ?? null
  return currentCheckinStreak(withTodayCheckin(history, checkin), { activityDays })
}
