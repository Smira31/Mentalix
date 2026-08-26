const UNSAFE_INSIGHT_PATTERNS = [
  /диагноз/i,
  /расстройств/i,
  /депресс/i,
  /паническ/i,
  /лечит/i,
  /вылеч/i,
  /вызывает/i,
  /приводит к/i,
  /из-за/i,
  /потому что/i,
  /гарант/i,
]

const MAX_INSIGHTS = 3
const MAX_LENGTH = 240

export function isDescriptiveInsight(value) {
  if (typeof value !== 'string') return false

  const text = value.trim()
  if (!text || text.length > MAX_LENGTH) return false

  return !UNSAFE_INSIGHT_PATTERNS.some(pattern => pattern.test(text))
}

export function selectDescriptiveInsights(insights) {
  if (!Array.isArray(insights)) return []

  return insights.filter(isDescriptiveInsight).map(text => text.trim()).slice(0, MAX_INSIGHTS)
}
