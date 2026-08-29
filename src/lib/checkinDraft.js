import { toLocalCalendarDate } from './dateTimezonePolicy.js'

const STORAGE_PREFIX = 'mx-checkin-draft-v1'

export const MORNING_WRITING_MODES = ['brief', 'reflect', 'free']

/*
 * Delegates to the centralized calendar-date policy (see
 * dateTimezonePolicy.js) instead of a local getTimezoneOffset() copy —
 * behavior is unchanged (verified equivalent in
 * tests/unit/date-timezone-policy.test.mjs), signature is unchanged.
 */
export function todayCheckinKey(now = new Date()) {
  return toLocalCalendarDate(now)
}

function draftKey(userId, date) {
  return `${STORAGE_PREFIX}:${String(userId)}:${date}`
}

function emptyDraft() {
  return {
    mode: 'brief',
    brief: '',
    fact: '',
    feeling: '',
    nextStep: '',
    free: '',
    updatedAt: null,
  }
}

function normalizeDraft(value) {
  const draft = emptyDraft()

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return draft
  }

  for (const key of ['brief', 'fact', 'feeling', 'nextStep', 'free']) {
    if (typeof value[key] === 'string') {
      draft[key] = value[key]
    }
  }

  if (MORNING_WRITING_MODES.includes(value.mode)) {
    draft.mode = value.mode
  }

  if (typeof value.updatedAt === 'string') {
    draft.updatedAt = value.updatedAt
  }

  return draft
}

export function readCheckinDraft({ userId, date = todayCheckinKey() }) {
  if (userId === null || userId === undefined) {
    return emptyDraft()
  }

  try {
    const raw = localStorage.getItem(draftKey(userId, date))
    return normalizeDraft(raw ? JSON.parse(raw) : null)
  } catch {
    return emptyDraft()
  }
}

export function saveCheckinDraft({ userId, date = todayCheckinKey(), draft }) {
  if (userId === null || userId === undefined) {
    return false
  }

  const normalized = normalizeDraft(draft)
  normalized.updatedAt = new Date().toISOString()

  try {
    localStorage.setItem(draftKey(userId, date), JSON.stringify(normalized))
    return true
  } catch {
    return false
  }
}

export function clearCheckinDraft({ userId, date = todayCheckinKey() }) {
  if (userId === null || userId === undefined) {
    return false
  }

  try {
    localStorage.removeItem(draftKey(userId, date))
    return true
  } catch {
    return false
  }
}

export function draftHasContent(draft) {
  const normalized = normalizeDraft(draft)
  return ['brief', 'fact', 'feeling', 'nextStep', 'free'].some(key => normalized[key].trim())
}

export function morningDraftToNote(draft) {
  const normalized = normalizeDraft(draft)

  if (normalized.mode === 'reflect') {
    return [
      ['Факт', normalized.fact],
      ['Чувство', normalized.feeling],
      ['Следующий шаг', normalized.nextStep],
    ]
      .filter(([, value]) => value.trim())
      .map(([label, value]) => `**${label}:** ${value.trim()}`)
      .join('\n\n')
  }

  return (normalized.mode === 'free' ? normalized.free : normalized.brief).trim()
}

export { STORAGE_PREFIX }
