import { now as clockNow } from './clock.js'

const DEFAULT_REVIEW_HOUR = 19

function localHourAndMinute(date, timeZone) {
  if (!timeZone) return { hour: date.getHours(), minute: date.getMinutes() }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  return {
    hour: Number(parts.find(part => part.type === 'hour')?.value || 0),
    minute: Number(parts.find(part => part.type === 'minute')?.value || 0),
  }
}

/**
 * Утренний чек-ин «пройден», если в записи есть утренние поля:
 * mood, energy или «Что на уме» (note). Если человек сначала прошёл
 * разбор (review_completed_at), но утренних полей нет — утро остаётся
 * доступным (active), а не «пройденным».
 */
function hasMorningFields(checkin) {
  if (!checkin) return false
  return checkin.mood != null || checkin.energy != null || Boolean(checkin.note)
}

export function resolveTodayCardStates({
  now = clockNow(),
  reviewHour = DEFAULT_REVIEW_HOUR,
  checkin = null,
  timeZone,
} = {}) {
  const { hour, minute } = localHourAndMinute(now, timeZone)
  const minutes = hour * 60 + minute
  const reviewStarts = Math.max(0, Math.min(24, Number(reviewHour ?? DEFAULT_REVIEW_HOUR))) * 60
  const isNight = hour < 5
  const morningDone = hasMorningFields(checkin)
  const reviewDone = Boolean(checkin?.review_completed_at)

  // Утро доступно весь день (до 04:59), пока не пройдено.
  // Состояния 'missed' для сегодняшних карточек нет.
  const morning = morningDone ? 'done' : 'active'

  // Ночью до 05:00 вечерний разбор остаётся доступен для вчерашнего дня.
  // Дату записи этот расчёт не меняет.
  const review = reviewDone ? 'done' : isNight || minutes >= reviewStarts ? 'active' : 'locked'

  return { morning, review, hour, minute, isNight }
}

/**
 * Какая карточка главная (та, что сейчас актуальна и не пройдена).
 * После времени разбора — разбор, иначе — утро.
 * Если обе пройдены — null.
 */
export function primaryCardKind({ morning, review }) {
  if (review === 'active') return 'evening'
  if (morning === 'active') return 'morning'
  return null
}

/**
 * Время открытия разбора для подписи «Откроется в HH:00».
 * Час вне 1..23 (0, 24, мусор) не показываем — подставляем 19:00 по умолчанию.
 */
export function formatReviewTime(reviewHour = DEFAULT_REVIEW_HOUR) {
  const hour = Number(reviewHour)
  const valid = Number.isInteger(hour) && hour > 0 && hour < 24
  return `${String(valid ? hour : DEFAULT_REVIEW_HOUR).padStart(2, '0')}:00`
}
