// Best-effort telemetry: never send synthetic users or unauthenticated guests.
const claimed = new Set()

export function logEngagementEvent({ user, demo, event, entityType = null, entityId = null, once = null, send, hasSession = false }) {
  if (!user?.id || demo || user.demo || (user.is_guest && !hasSession)) return

  if (once) {
    const key = `mx-engagement:${user.id}:${event}:${once}`
    if (claimed.has(key)) return
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      // Storage may be unavailable; the in-memory guard still handles StrictMode.
    }
    claimed.add(key)
  }

  try {
    Promise.resolve(send(user.id, event, entityType, entityId)).catch(() => {})
  } catch {
    // Telemetry must never block the screen.
  }
}
