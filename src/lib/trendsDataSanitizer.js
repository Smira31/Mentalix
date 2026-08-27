export const ANALYTICS_PERIODS = [7, 14, 30, 90]

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function boundedInteger(value, min, max) {
  if (!finiteNumber(value)) return 0
  return Math.min(max, Math.max(min, Math.round(value)))
}

function scoreOrNull(value) {
  return finiteNumber(value) && Number.isInteger(value) && value >= 1 && value <= 5 ? value : null
}

function validIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function safeId(value) {
  return typeof value === 'string' || finiteNumber(value) ? value : null
}

function uniqueSortedByDate(items) {
  const byDate = new Map()
  for (const item of items) {
    if (validIsoDate(item?.date)) byDate.set(item.date, item)
  }
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date))
}

function sanitizeRituals(rituals) {
  if (!Array.isArray(rituals)) return []

  return rituals
    .map(ritual => ({
      id: safeId(ritual?.id),
      name: typeof ritual?.name === 'string' ? ritual.name.trim() : '',
      completion_rate: boundedInteger(ritual?.completion_rate, 0, 100),
    }))
    .filter(ritual => ritual.id !== null && ritual.name)
}

function sanitizeAscezas(ascezas) {
  if (!Array.isArray(ascezas)) return []

  return ascezas
    .map(asceza => ({
      id: safeId(asceza?.id),
      name: typeof asceza?.name === 'string' ? asceza.name.trim() : '',
      category: typeof asceza?.category === 'string' ? asceza.category : null,
      streak: boundedInteger(asceza?.streak, 0, 90),
      clean_rate: boundedInteger(asceza?.clean_rate, 0, 100),
      held_days: boundedInteger(asceza?.held_days, 0, 90),
      breaks: boundedInteger(asceza?.breaks, 0, 90),
    }))
    .filter(asceza => asceza.id !== null && asceza.name)
}

function sanitizeObservations(observations) {
  if (!Array.isArray(observations)) return []

  return observations
    .filter(item => item && typeof item.text === 'string' && item.text.trim())
    .slice(0, 3)
    .map(item => ({
      kind: typeof item.kind === 'string' ? item.kind : 'observation',
      text: item.text.trim(),
      sampleSize: boundedInteger(item.sampleSize, 0, 10_000),
      sourceDates: uniqueSortedByDate((item.sourceDates || []).map(date => ({ date }))).map(
        item => item.date
      ),
      caveat:
        typeof item.caveat === 'string' && item.caveat.trim()
          ? item.caveat.trim()
          : 'Это описание доступных данных, а не диагноз и не доказательство причины.',
    }))
}

function sanitizeAnalytics(analytics) {
  const source = analytics && typeof analytics === 'object' ? analytics : {}
  const periodDays = ANALYTICS_PERIODS.includes(source.period_days) ? source.period_days : 14
  const dailyActivity = uniqueSortedByDate(
    Array.isArray(source.daily_activity)
      ? source.daily_activity.map(day => ({
          date: day?.date,
          count: boundedInteger(day?.count, 0, 10_000),
          breaks: boundedInteger(day?.breaks, 0, 10_000),
          held_ascezas: boundedInteger(day?.held_ascezas, 0, 10_000),
        }))
      : []
  )

  return {
    period_days: periodDays,
    rituals: sanitizeRituals(source.rituals),
    ascezas: sanitizeAscezas(source.ascezas),
    insights: Array.isArray(source.insights)
      ? source.insights
          .filter(item => typeof item === 'string' && item.trim())
          .map(item => item.trim())
          .slice(0, 3)
      : [],
    observations: sanitizeObservations(source.observations),
    daily_activity: dailyActivity,
  }
}

export function sanitizeCheckins(checkins) {
  if (!Array.isArray(checkins)) return []

  return uniqueSortedByDate(
    checkins.map(checkin => ({
      date: checkin?.date,
      mood: scoreOrNull(checkin?.mood),
      energy: scoreOrNull(checkin?.energy),
      anxiety: scoreOrNull(checkin?.anxiety),
      focus: scoreOrNull(checkin?.focus),
      emotion:
        typeof checkin?.emotion === 'string' && checkin.emotion.trim()
          ? checkin.emotion.trim()
          : null,
      review_completed_at:
        typeof checkin?.review_completed_at === 'string' ? checkin.review_completed_at : null,
    }))
  )
}

export function sanitizeTrendsData(data) {
  return {
    analytics: sanitizeAnalytics(data?.analytics),
    checkins: sanitizeCheckins(data?.checkins),
  }
}
