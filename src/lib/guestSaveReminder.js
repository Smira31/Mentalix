const HIDDEN_PREFIX = 'mx-guest-save-reminder-hidden-until:'
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export function shouldShowGuestSaveReminder({ user, platformName, hasEntries, demoGuest = false, storage = globalThis.localStorage, now = Date.now() }) {
  if (platformName !== 'web' || !user?.is_guest || user.email || (!hasEntries && !demoGuest)) return false
  try {
    const hiddenUntil = storage.getItem(`${HIDDEN_PREFIX}${user.id}`)
    return !hiddenUntil || Number(hiddenUntil) <= now
  } catch {
    return true
  }
}

export function hideGuestSaveReminder(userId, storage = globalThis.localStorage, now = Date.now()) {
  try {
    storage.setItem(`${HIDDEN_PREFIX}${userId}`, String(now + SEVEN_DAYS))
  } catch {
    // Private browsing can disable storage; hide for this session regardless.
  }
}
