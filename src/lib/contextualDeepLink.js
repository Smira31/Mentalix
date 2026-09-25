import { parseReturnFlow } from './returnFlow.js'
import { resolveTodayCardStates } from './todayCardState.js'

// В Telegram start_param приходит из initDataUnsafe, в браузере — из ?startapp=.
export function parseContextualDeepLink(search, startParam) {
  const action = new URLSearchParams(search).get('action')
  const returnFlow = parseReturnFlow(startParam)
  if (returnFlow) return { sub: 'checkin', returnFlow }
  if (action === 'checkin') return { sub: 'contextualCheckin', returnFlow: null }
  if (action === 'evening' || action === 'breathing') return { sub: action, returnFlow: null }
  return { sub: null, returnFlow: null }
}

export function resolveContextualCheckin({ now, reviewHour, checkin }) {
  const { morning, review } = resolveTodayCardStates({ now, reviewHour, checkin })
  return morning === 'done' && review === 'active' ? 'evening' : 'checkin'
}
