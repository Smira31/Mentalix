import { pluralize } from '../../lib/pluralize.js'

/*
 * Метки недель и дней для экранов Mentalix Pro.
 * Даты приходят от backend как ISO-дни (week_start/week_end, dates плана).
 *
 * Отсутствующая или нераспознанная дата — не текст: метка тогда просто не
 * строится (пустая строка), а экран показывает своё состояние (загрузка,
 * ошибка с повтором, пусто). Поэтому «неделя NaN undefined» в интерфейсе
 * появиться не может: форматируется только распознанный ISO-день.
 */
const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** Распознанный ISO-день или пустая строка, если даты нет/она не ISO-день. */
export function isoDay(value) {
  if (typeof value !== 'string' || !ISO_DAY.test(value)) return ''

  return Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? '' : value
}

function dayLabel(iso) {
  const day = isoDay(iso)

  if (!day) return ''

  const value = new Date(`${day}T00:00:00`)

  return `${value.getDate()} ${MONTHS_SHORT[value.getMonth()]}`
}

export function formatDayLabel(iso) {
  return dayLabel(iso)
}

export function formatWeekRange(start, end) {
  const from = dayLabel(start)

  // Без начального дня неделя не называется: пустая метка вместо выдумки.
  if (!from) return ''

  const to = end === start ? '' : dayLabel(end)

  return to ? `неделя ${from} — ${to}` : `неделя ${from}`
}

export function formatDayList(days) {
  return Array.isArray(days) ? days.map(dayLabel).filter(Boolean).join(', ') : ''
}

export const STATUS_LABELS = {
  planned: 'ещё впереди',
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

/* Родительный падеж после «На основе N …»: одна строка подписи разбора. */
const SOURCE_FORMS = {
  checkins: ['чек-ина', 'чек-инов', 'чек-инов'],
  habits: ['привычки', 'привычек', 'привычек'],
  themes: ['темы', 'тем', 'тем'],
  goals: ['цели', 'целей', 'целей'],
  rituals: ['ритуала', 'ритуалов', 'ритуалов'],
  ascezas: ['аскезы', 'аскез', 'аскез'],
  journal: ['записи журнала', 'записей журнала', 'записей журнала'],
  mood: ['отметки настроения', 'отметок настроения', 'отметок настроения'],
  focus: ['фокуса', 'фокусов', 'фокусов'],
  brain: ['заметки о мозге', 'заметок о мозге', 'заметок о мозге'],
  quotes: ['мысли', 'мыслей', 'мыслей'],
}

export function formatSources(sources) {
  if (!sources || typeof sources !== 'object') return ''
  const parts = Object.entries(sources).map(([key, count]) => {
    const forms = SOURCE_FORMS[key]
    if (!forms) return `${SOURCE_LABELS[key] || key}: ${count}`
    return `${count} ${pluralize(count, forms)}`
  })
  return parts.length > 0 ? `На основе: ${parts.join(', ')}` : ''
}
