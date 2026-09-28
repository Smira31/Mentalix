import { parseReturnFlow } from './returnFlow.js'
import { resolveTodayCardStates } from './todayCardState.js'

// В Telegram start_param приходит из initDataUnsafe, в браузере — из ?startapp=.
export function parseContextualDeepLink(search, startParam) {
  const action = new URLSearchParams(search).get('action')
  const returnFlow = parseReturnFlow(startParam)
  if (returnFlow) return { sub: returnFlow === 'evening_v1' ? 'evening' : 'checkin', returnFlow }
  if (action === 'checkin') return { sub: 'contextualCheckin', returnFlow: null }
  if (action === 'evening' || action === 'breathing') return { sub: action, returnFlow: null }
  if (action === 'theme') return { sub: 'theme', returnFlow: null }
  // Demo-only: ?demo=1&action=focus_step — открывает шаг «Главный фокус на сегодня?»
  if (action === 'focus_step') return { sub: 'contextualCheckin', returnFlow: null }
  // Демо-превью экранов завершения (?demo=1&action=complete_morning|complete_evening):
  // открывают тот же подэкран, что и соответствующий поток, а CheckIn сам
  // переключается на финальный экран через previewDemoAction().
  if (action === 'complete_morning') return { sub: 'checkin', returnFlow: null }
  if (action === 'complete_evening') return { sub: 'evening', returnFlow: null }
  return { sub: null, returnFlow: null }
}

export function resolveContextualCheckin({ now, reviewHour, checkin }) {
  const { morning, review } = resolveTodayCardStates({ now, reviewHour, checkin })
  return morning === 'done' && review === 'active' ? 'evening' : 'checkin'
}
