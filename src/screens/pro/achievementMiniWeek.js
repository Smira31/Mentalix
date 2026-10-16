import { isoDay } from './weekLabel.js'

/*
 * Мини-неделя достижения разбора (PRO-002b, редизайн Stoic): 7 точек Пн–Вс.
 *
 * Точка строится только из распознанного ISO-дня начала недели: без даты
 * недели (или с нераспознанной) мини-неделя не строится вовсе — карточка
 * показывает даты достижения текстом, без выдуманных закрашенных дней.
 *
 * Чистая функция без React: тесты проверяют даты → 7 точек напрямую.
 */
export const MINI_WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function shiftIsoDay(day, offset) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

/**
 * Даты достижения → 7 точек недели Пн–Вс.
 * Возвращает массив {label, date, filled} или null, когда неделя
 * не распознана. Нераспознанные даты достижения пропускаются.
 */
export function buildAchievementWeek(weekStart, days) {
  const start = isoDay(weekStart)
  if (!start) return null

  const list = Array.isArray(days) ? days.map(isoDay).filter(Boolean) : []

  return MINI_WEEK_DAYS.map((label, index) => {
    const date = shiftIsoDay(start, index)
    return { label, date, filled: list.includes(date) }
  })
}
