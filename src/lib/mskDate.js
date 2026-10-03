/*
 * Московская календарная дата (Europe/Moscow) — единая граница суток
 * для «Диалога». Разделители дней в чате и даты в списке разговоров
 * считаются по МСК, а не по часовому поясу устройства, и совпадают
 * между собой.
 */

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function mskDateParts(value) {
  const date = toDate(value)
  if (!date) return null

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const map = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) }
}

export function mskDayKey(value) {
  const parts = mskDateParts(value)
  if (!parts) return null
  // Ключ всегда в ISO-виде (YYYY-MM-DD): день/месяц с ведущим нулём,
  // иначе он не совпадает с датами бэкенда и не сортируется как строка.
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

// Арифметика календарных дат без зависимости от часового пояса устройства.
export function shiftMskDay(value, days) {
  const key = mskDayKey(value)
  if (!key) return null
  const date = new Date(`${key}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function mskDaysBetween(from, to) {
  const start = mskDayKey(from)
  const end = mskDayKey(to)
  if (!start || !end) return null
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000)
}

export function themeOpeningLabel(day, startedOn, serverDate) {
  const opensOn = shiftMskDay(startedOn, day - 1)
  const remaining = opensOn && mskDaysBetween(serverDate, opensOn)
  if (remaining == null) return ''
  return remaining <= 1 ? 'Откроется завтра' : `Откроется через ${remaining} дн.`
}

export function mskCalendarLabel(value) {
  const parts = mskDateParts(value)
  return parts ? `${parts.day} ${MONTHS_GENITIVE[parts.month - 1]}` : ''
}

function dayKeyOf(value) {
  return mskDayKey(value)
}

/*
 * Разделитель дня в чате: «Сегодня» / «Вчера» / «2 октября».
 * Год добавляется только вне текущего года.
 */
export function mskDayLabel(value, now = new Date()) {
  const parts = mskDateParts(value)
  if (!parts) return null

  const key = dayKeyOf(value)
  if (key === dayKeyOf(now)) return 'Сегодня'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === dayKeyOf(yesterday)) return 'Вчера'

  const base = `${parts.day} ${MONTHS_GENITIVE[parts.month - 1]}`
  return parts.year === mskDateParts(now).year ? base : `${base} ${parts.year}`
}

/*
 * Дата в списке разговоров: «сегодня» / «вчера» / «3 окт».
 * Та же МСК-граница суток, что у разделителей чата.
 */
export function mskRelativeListLabel(value, now = new Date()) {
  const parts = mskDateParts(value)
  if (!parts) return ''

  const key = dayKeyOf(value)
  if (key === dayKeyOf(now)) return 'сегодня'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === dayKeyOf(yesterday)) return 'вчера'

  return `${parts.day} ${MONTHS_SHORT[parts.month - 1]}`
}

/*
 * Миллисекунды до ближайшей полуночи по МСК. Москва — фиксированный UTC+3
 * (без перехода на летнее время), поэтому достаточно досчитать остаток
 * текущих суток по часам/минутам/секундам МСК. Используется, чтобы сбросить
 * дневной лимит разговоров ровно в 00:00 по Москве, а не через интервал.
 */
export function msUntilNextMskMidnight(now = new Date()) {
  const date = toDate(now)
  if (!date) return 0

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const hour = Number(map.hour)
  const minute = Number(map.minute)
  const second = Number(map.second)

  const secondsLeft = (23 - hour) * 3600 + (59 - minute) * 60 + (60 - second)
  return Math.max(0, secondsLeft) * 1000
}
