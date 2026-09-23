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

export function resolveTodayCardStates({
  now = new Date(),
  reviewHour = DEFAULT_REVIEW_HOUR,
  checkin = null,
  timeZone,
} = {}) {
  const { hour, minute } = localHourAndMinute(now, timeZone)
  const minutes = hour * 60 + minute
  const reviewStarts = Math.max(0, Math.min(23, Number(reviewHour) || DEFAULT_REVIEW_HOUR)) * 60
  const morningDone = Boolean(checkin)
  const reviewDone = Boolean(checkin?.review_completed_at)
  const morningWindow = minutes >= 5 * 60 && minutes < reviewStarts
  const morning = morningDone
    ? 'done'
    : morningWindow
      ? 'active'
      : minutes >= reviewStarts
        ? 'missed'
        : 'missed'
  const review = reviewDone ? 'done' : minutes >= reviewStarts ? 'active' : 'locked'

  return { morning, review, hour, minute }
}

export function formatReviewTime(reviewHour = DEFAULT_REVIEW_HOUR) {
  return `${String(Number(reviewHour) || DEFAULT_REVIEW_HOUR).padStart(2, '0')}:00`
}
