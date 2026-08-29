/*
 * MXL-date-policy — single, centralized calendar-date/timezone policy.
 *
 * docs/architecture/MXL-JOURNAL-PERSISTENCE-001_ENTRY_CONTRACT.md §5 found
 * two independent copies of the same `date.getTimezoneOffset()` trick
 * (journalStorage.js `todayKey()`, checkinDraft.js `todayCheckinKey()`) —
 * both correct in isolation, but a third divergent copy is exactly how that
 * kind of bug compounds. This module is the one place that decides what
 * "today" means locally, so nothing else needs to reimplement it.
 *
 * Two concepts this module keeps deliberately separate:
 *   - a UTC instant: an exact point in time (`toUtcInstant`), unaffected by
 *     any timezone;
 *   - a user-local calendar date: which day it is on the device's clock
 *     (`toLocalCalendarDate`), a string like "2026-08-27" with no time
 *     component. Two different UTC instants can map to the same local date,
 *     or the same instant can map to different local dates depending on
 *     device timezone — that's expected, not a bug.
 *
 * `toLocalCalendarDate` deliberately does NOT use the
 * `getTimezoneOffset()`-shift-then-slice trick that `todayKey()` and
 * `todayCheckinKey()` use — it reads local calendar components
 * (`getFullYear`/`getMonth`/`getDate`) directly. Same result (see
 * `dateTimezonePolicy.test.mjs`'s equivalence tests), but applying the
 * offset zero times is safer than applying it once — there's no arithmetic
 * to accidentally apply twice if this function is later composed into
 * something else.
 *
 * There is no server-side calendar-date policy yet — the backend
 * (`mentalix-bot`) is not connected to this session, and MXL-JOURNAL-PERSISTENCE-001's
 * entry contract §5/§9 leaves "does the backend return a canonical local
 * date, or just a policy" as an explicitly open question. `resolveCalendarDate`'s
 * `policy: 'server'` branch is a placeholder that says so out loud (throws a
 * clear, typed error) instead of inventing a backend behavior.
 */

const DEVICE_LOCAL_POLICY = 'device_local'
const SERVER_POLICY = 'server'
const CALENDAR_DATE_POLICIES = [DEVICE_LOCAL_POLICY, SERVER_POLICY]

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/*
 * Coerces Date | timestamp-number | ISO string into a Date, or null if the
 * input can't represent a real instant. Never throws.
 */
function toDate(input) {
  if (input === undefined) return new Date()
  if (isValidDate(input)) return input
  if (typeof input === 'number' || typeof input === 'string') {
    const candidate = new Date(input)
    return isValidDate(candidate) ? candidate : null
  }
  return null
}

/* The exact instant, as UTC. Returns null for an invalid/unparseable input. */
function toUtcInstant(input) {
  const date = toDate(input)
  return date ? date.toISOString() : null
}

/*
 * The device-local calendar date ("today" on this device's clock), as
 * "YYYY-MM-DD". Returns null for an invalid/unparseable input — never
 * "NaN-NaN-NaN".
 */
function toLocalCalendarDate(input) {
  const date = toDate(input)
  if (!date) return null

  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

class UnimplementedDatePolicyError extends Error {
  constructor(policy) {
    super(
      `Calendar date policy "${policy}" is not implemented — no backend is connected to confirm a canonical server-side calendar date. See MXL-JOURNAL-PERSISTENCE-001 entry contract §5/§9.`
    )
    this.name = 'UnimplementedDatePolicyError'
    this.policy = policy
  }
}

/*
 * Single entry point for "what calendar date is this, per policy". Today
 * only `device_local` is implemented (delegates to `toLocalCalendarDate`).
 * `server` is a deliberate placeholder: it throws `UnimplementedDatePolicyError`
 * rather than silently falling back to device-local or fabricating a
 * backend contract that hasn't been confirmed.
 */
function resolveCalendarDate(input, { policy = DEVICE_LOCAL_POLICY } = {}) {
  if (policy === DEVICE_LOCAL_POLICY) return toLocalCalendarDate(input)
  if (policy === SERVER_POLICY) throw new UnimplementedDatePolicyError(policy)
  throw new Error(
    `Unknown calendar date policy: "${policy}". Known policies: ${CALENDAR_DATE_POLICIES.join(', ')}`
  )
}

export {
  CALENDAR_DATE_POLICIES,
  DEVICE_LOCAL_POLICY,
  SERVER_POLICY,
  UnimplementedDatePolicyError,
  isValidDate,
  resolveCalendarDate,
  toLocalCalendarDate,
  toUtcInstant,
}
