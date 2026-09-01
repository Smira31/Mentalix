export const MORNING_RETURN_FLOW = 'morning_v1'

const EVENT_NAMES = new Set([
  'morning_flow_opened',
  'morning_action_started',
  'morning_action_completed',
  'morning_flow_skipped',
])

export function parseReturnFlow(startParam) {
  return startParam === MORNING_RETURN_FLOW ? MORNING_RETURN_FLOW : null
}

function storageKey(userId, event) {
  return `mx-return-flow:${userId}:${MORNING_RETURN_FLOW}:${event}`
}

export function returnFlowEventKey(userId, event) {
  if (!EVENT_NAMES.has(event)) throw new Error(`Unknown return-flow event: ${event}`)

  const key = storageKey(userId, event)
  try {
    const existing = window.sessionStorage.getItem(key)
    if (existing) return existing

    const generated =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(key, generated)
    return generated
  } catch {
    return `${userId}-${event}`
  }
}

export function returnFlowOccurredAt() {
  return new Date().toISOString()
}
