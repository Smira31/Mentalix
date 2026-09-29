export const MORNING_RETURN_FLOW = 'morning_v1'
export const EVENING_RETURN_FLOW = 'evening_v1'

const FLOWS = new Set([MORNING_RETURN_FLOW, EVENING_RETURN_FLOW])
const SUFFIXES = new Set(['flow_opened', 'action_started', 'action_completed', 'flow_skipped'])
const claimed = new Set()

export function parseReturnFlow(startParam) {
  return FLOWS.has(startParam) ? startParam : null
}

export function returnFlowEvent(flow, suffix) {
  if (!FLOWS.has(flow) || !SUFFIXES.has(suffix)) throw new Error('Unknown return-flow event')
  return `${flow === EVENING_RETURN_FLOW ? 'evening' : 'morning'}_${suffix}`
}

function storageKey(userId, flow, event) {
  return `mx-return-flow:${userId}:${flow}:${event}`
}

export function returnFlowEventKey(userId, event, flow = MORNING_RETURN_FLOW) {
  if (!FLOWS.has(flow) || !SUFFIXES.has(event.replace(/^(morning|evening)_/, '')) ||
      event !== returnFlowEvent(flow, event.replace(/^(morning|evening)_/, ''))) {
    throw new Error(`Unknown return-flow event: ${event}`)
  }

  const key = storageKey(userId, flow, event)
  try {
    const existing = window.sessionStorage.getItem(key)
    if (existing) return existing
    const generated = globalThis.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(key, generated)
    return generated
  } catch {
    return `${userId}-${flow}-${event}`
  }
}

// Claim before the async request; React StrictMode may replay effects on mount.
export function claimReturnFlowEvent(userId, flow, event) {
  const key = storageKey(userId, flow, event)
  if (claimed.has(key)) return false
  try {
    if (window.sessionStorage.getItem(`${key}:sent`)) return false
    window.sessionStorage.setItem(`${key}:sent`, '1')
  } catch {
    // Memory guard still protects the current page when storage is disabled.
  }
  claimed.add(key)
  return true
}

export function returnFlowOccurredAt() {
  return new Date().toISOString()
}
