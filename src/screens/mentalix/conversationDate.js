/*
 * Относительная дата для списка разговоров: «сегодня», «вчера», «3 окт».
 * Граница дня — по МСК (как везде в проекте), не по локальному времени
 * устройства.
 */

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

function mskDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) }
}

export function relativeConversationDate(isoString, now = new Date()) {
  if (!isoString) return ''

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const todayMsk = mskDate(now)
  const dateMsk = mskDate(date)

  const todayKey = `${todayMsk.year}-${todayMsk.month}-${todayMsk.day}`
  const dateKey = `${dateMsk.year}-${dateMsk.month}-${dateMsk.day}`

  if (todayKey === dateKey) return 'сегодня'

  // Вчера
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayMsk = mskDate(yesterday)
  const yesterdayKey = `${yesterdayMsk.year}-${yesterdayMsk.month}-${yesterdayMsk.day}`

  if (yesterdayKey === dateKey) return 'вчера'

  // «3 окт» — без ведущего нуля
  return `${dateMsk.day} ${MONTHS_SHORT[dateMsk.month - 1]}`
}
