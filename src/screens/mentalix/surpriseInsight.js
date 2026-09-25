import { api } from '../../lib/api'
import { isPreviewDemoMode } from '../../lib/demoMode'
import { toLocalCalendarDate } from '../../lib/dateTimezonePolicy'
import { deriveConclusions, MIN_CHECKINS } from '../Analytics'
import { readLastInsightDate, writeInsightSeen } from './insightDigest'
import { insightIntervalElapsed, shouldShowSurprise } from './surpriseRules'

export async function maybeBuildSurprise(
  user,
  { random = Math.random, today = toLocalCalendarDate() } = {}
) {
  try {
    const lastDate = await readLastInsightDate()
    if (!insightIntervalElapsed(lastDate, today)) return null
    const [data, checkins] = await Promise.all([
      api.analytics.get(user.id, 14).catch(() => null),
      api.checkin.history(user.id, 14).catch(() => null),
    ])
    if (!Array.isArray(checkins) || checkins.length < MIN_CHECKINS) return null
    const findings = deriveConclusions(checkins, data)
    const force =
      isPreviewDemoMode() && new URLSearchParams(window.location.search).get('surprise') === '1'
    if (!shouldShowSurprise({ lastDate, today, random, force, findings })) return null
    // Общая отметка с дайджестом Следопыта: показали сюрприз —
    // дайджест 4 дня молчит (и наоборот), та же дата в insightDigest.js.
    writeInsightSeen(today)
    return findings[0].text
  } catch {
    return null
  }
}
