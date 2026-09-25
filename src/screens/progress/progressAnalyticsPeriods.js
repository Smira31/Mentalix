/*
 * Модель периода для вкладки «Аналитика» (§5.5 DESIGN_SYSTEM.md).
 *
 * Эталон Stoic: меню периода Неделя / Месяц / Год, нижняя пилюля листает
 * период стрелками. Границы периода — календарные (неделя Пн–Вс, месяц, год),
 * а не скользящее окно «последние N дней».
 *
 * Данные берутся из пула чек-инов за 90 дней (максимум API /checkin/history),
 * поэтому скроллинг назад ограничен глубиной пула; периоды вне пула дают
 * пустой срез → карточки показывают свои пустые состояния.
 */

export const ANALYTICS_GRANULARITIES = Object.freeze([
  { id: 'week', label: 'Неделя', word: 'неделю', days: 7 },
  { id: 'month', label: 'Месяц', word: 'месяц', days: 30 },
  { id: 'year', label: 'Год', word: 'год', days: 90 },
])

export function getGranularity(id) {
  return ANALYTICS_GRANULARITIES.find(item => item.id === id) ?? ANALYTICS_GRANULARITIES[0]
}

const MONTHS_SHORT = [
  'янв', 'февр', 'мар', 'апр', 'мая', 'июня',
  'июля', 'авг', 'сент', 'окт', 'нояб', 'дек',
]
const MONTHS_FULL = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Календарные границы периода для granularity и offset (0 = текущий).
 * Возвращает локальные полуночи { start, end } (end включительно).
 */
export function getPeriodWindow(granularityId, offset = 0) {
  const today = startOfToday()
  if (granularityId === 'week') {
    // Понедельник текущей недели
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const start = new Date(monday)
    start.setDate(monday.getDate() - offset * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }
  if (granularityId === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth() - offset, 1)
    const end = new Date(today.getFullYear(), today.getMonth() - offset + 1, 0)
    return { start, end }
  }
  // year
  const year = today.getFullYear() - offset
  return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) }
}

export function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Срез чек-инов пула, попадающих в окно периода (по ISO-дате). */
export function sliceCheckinsByPeriod(checkins, window) {
  const from = isoDate(window.start)
  const to = isoDate(window.end)
  return (checkins || []).filter(item => item?.date >= from && item?.date <= to)
}

export function formatPeriodRange(window, granularityId) {
  if (granularityId === 'week') {
    const s = window.start
    const e = window.end
    const sameMonth = s.getMonth() === e.getMonth()
    if (sameMonth) {
      return `${s.getDate()}–${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}`
    }
    return `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}`
  }
  if (granularityId === 'month') {
    const m = window.start.getMonth()
    const y = window.start.getFullYear()
    const now = startOfToday()
    if (y === now.getFullYear()) return MONTHS_FULL[m]
    return `${MONTHS_FULL[m]} ${y}`
  }
  return String(window.start.getFullYear())
}

export function periodName(granularityId, offset) {
  if (offset === 0) {
    return granularityId === 'week' ? 'Эта неделя' : granularityId === 'month' ? 'Этот месяц' : 'Этот год'
  }
  if (offset === 1) {
    return granularityId === 'week' ? 'Прошлая неделя' : granularityId === 'month' ? 'Прошлый месяц' : 'Прошлый год'
  }
  const n = offset
  if (granularityId === 'week') {
    const word = n >= 5 ? 'недель' : n >= 2 ? 'недели' : 'неделю'
    return `${n} ${word} назад`
  }
  if (granularityId === 'month') {
    const word = n >= 5 ? 'месяцев' : n >= 2 ? 'месяца' : 'месяц'
    return `${n} ${word} назад`
  }
  const word = n >= 5 ? 'лет' : n >= 2 ? 'года' : 'год'
  return `${n} ${word} назад`
}
