/*
 * Метки недель и дней для экранов Mentalix Pro.
 * Даты приходят от backend как ISO-дни (week_start/week_end, dates плана).
 */
const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

export function formatDayLabel(iso) {
  const value = new Date(`${iso}T00:00:00`)
  return `${value.getDate()} ${MONTHS_SHORT[value.getMonth()]}`
}

export function formatWeekRange(start, end) {
  if (!end || end === start) return `неделя ${formatDayLabel(start)}`
  return `неделя ${formatDayLabel(start)} — ${formatDayLabel(end)}`
}

export function formatDayList(days) {
  return Array.isArray(days) ? days.map(formatDayLabel).join(', ') : ''
}

export const STATUS_LABELS = {
  planned: 'не отмечено',
  done: 'выполнено',
  skipped: 'пропущено',
}

export const SOURCE_LABELS = {
  checkins: 'чек-ины',
  habits: 'привычки',
  goals: 'цели',
  rituals: 'ритуалы',
  ascezas: 'аскезы',
  themes: 'темы',
  journal: 'журнал',
  mood: 'настроение',
  focus: 'фокус',
  brain: 'мозг',
  quotes: 'мысли',
}

export function formatSources(sources) {
  if (!sources || typeof sources !== 'object') return ''
  return Object.entries(sources)
    .map(([key, count]) => `${SOURCE_LABELS[key] || key}: ${count}`)
    .join(', ')
}
