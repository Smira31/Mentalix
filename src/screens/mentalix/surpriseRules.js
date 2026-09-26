export function insightIntervalElapsed(lastDate, today) {
  if (!lastDate) return true
  const then = Date.parse(`${lastDate}T00:00:00Z`)
  const now = Date.parse(`${today}T00:00:00Z`)
  return Number.isFinite(then) && Number.isFinite(now) &&
    (now - then) / 86400000 >= 4
}

export function shouldShowSurprise({ lastDate, today, random = Math.random, force = false, findings = [] }) {
  return insightIntervalElapsed(lastDate, today) && findings.length > 0 && (force || random() < 0.3)
}
