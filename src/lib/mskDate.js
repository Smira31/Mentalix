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
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : null
}

function dayKeyOf(value) {
  const parts = mskDateParts(value)
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : null
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
