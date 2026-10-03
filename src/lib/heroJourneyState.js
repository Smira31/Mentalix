import { mskDayKey } from './mskDate.js'
import { scopedStorageKey } from './userDataScope.js'

export const HERO_PROGRESS_KEY = 'mx-hero-journey-progress'

export function heroProgressKey(userId, courseId = 'hero-journey') {
  return courseId === 'hero-journey'
    ? scopedStorageKey(`${HERO_PROGRESS_KEY}:`, userId, true)
    : `${scopedStorageKey('mx-course-progress:', userId, true)}:${courseId}`
}

export function heroDraftKey(userId, stepId, courseId = 'hero-journey') {
  return courseId === 'hero-journey'
    ? `${scopedStorageKey('mx-hero-journey-draft:', userId, true)}:${stepId}`
    : `${scopedStorageKey('mx-course-draft:', userId, true)}:${courseId}:${stepId}`
}

export function emptyProgress() {
  return { completed: {}, signs: {}, reflections: {}, actions: {} }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function parseProgress(raw) {
  if (typeof raw === 'string') {
    try {
      return parseProgress(JSON.parse(raw))
    } catch {
      return emptyProgress()
    }
  }
  if (!isObject(raw)) return emptyProgress()
  return Object.fromEntries(
    Object.keys(emptyProgress()).map(key => [key, isObject(raw[key]) ? raw[key] : {}])
  )
}

// Оба хранилища и состояние хука используют одну JSON-строку.
export function mergeProgress(local, remote) {
  const a = parseProgress(local)
  const b = parseProgress(remote)
  return JSON.stringify(
    Object.fromEntries(Object.keys(a).map(key => [key, { ...a[key], ...b[key] }]))
  )
}

export function isStepAvailable(stepNumber, prevStepId, progress, demo = false, now = new Date()) {
  if (stepNumber === 1) return true
  const completedAt = progress.completed[prevStepId]
  if (!completedAt) return false
  if (demo) return true
  const previousDay = mskDayKey(completedAt)
  const today = mskDayKey(now)
  return Boolean(previousDay && today && previousDay < today)
}

export function isStepCompleted(stepId, progress) {
  return Boolean(progress.completed[stepId])
}
