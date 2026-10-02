/*
 * Черновики подэкранов «Сегодня» — вечерний разбор, тема недели, мысль дня.
 *
 * Образец — checkinDraft.js: localStorage, ключ scoped по userId,
 * восстановление при возврате, удаление после успешного сохранения,
 * устаревание (старше 2 дней — игнорируем, не восстанавливаем).
 *
 * Три независимых набора, каждый со своим префиксом ключа:
 *   eveningDraft  — lessons (done, hard, lesson), ключ userId + дата
 *   themeDraft    — text, ключ userId + themeId + day
 *   thoughtDraft  — text, ключ userId + дата
 */

import { toLocalCalendarDate } from './dateTimezonePolicy.js'

const MAX_AGE_DAYS = 2
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000

// ── общая механика ──

function isStale(updatedAt) {
  if (!updatedAt) return true
  const age = Date.now() - new Date(updatedAt).getTime()
  return age > MAX_AGE_MS
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function removeKey(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// ── вечерний разбор (lessons) ──

const EVENING_PREFIX = 'mx-evening-draft-v1'

function eveningKey(userId, date) {
  return `${EVENING_PREFIX}:${String(userId)}:${date}`
}

export function readEveningDraft({ userId, date = toLocalCalendarDate() }) {
  if (userId == null) return null
  const raw = readJson(eveningKey(userId, date))
  if (!raw || isStale(raw.updatedAt)) return null
  return {
    done: typeof raw.done === 'string' ? raw.done : '',
    hard: typeof raw.hard === 'string' ? raw.hard : '',
    lesson: typeof raw.lesson === 'string' ? raw.lesson : '',
  }
}

export function saveEveningDraft({ userId, date = toLocalCalendarDate(), lessons }) {
  if (userId == null) return false
  return writeJson(eveningKey(userId, date), {
    ...lessons,
    updatedAt: new Date().toISOString(),
  })
}

export function clearEveningDraft({ userId, date = toLocalCalendarDate() }) {
  if (userId == null) return false
  return removeKey(eveningKey(userId, date))
}

export function eveningDraftHasContent(lessons) {
  if (!lessons) return false
  return ['done', 'hard', 'lesson'].some(k => typeof lessons[k] === 'string' && lessons[k].trim())
}

// ── тема недели (text) ──

const THEME_PREFIX = 'mx-theme-draft-v1'

function themeKey(userId, themeId, day) {
  return `${THEME_PREFIX}:${String(userId)}:${themeId}:${day}`
}

export function readThemeDraft({ userId, themeId, day }) {
  if (userId == null || themeId == null || day == null) return null
  const raw = readJson(themeKey(userId, themeId, day))
  if (!raw || isStale(raw.updatedAt)) return null
  return typeof raw.text === 'string' ? raw.text : ''
}

export function saveThemeDraft({ userId, themeId, day, text }) {
  if (userId == null || themeId == null || day == null) return false
  return writeJson(themeKey(userId, themeId, day), {
    text,
    updatedAt: new Date().toISOString(),
  })
}

export function clearThemeDraft({ userId, themeId, day }) {
  if (userId == null || themeId == null || day == null) return false
  return removeKey(themeKey(userId, themeId, day))
}

// ── мысль дня (text) ──

const THOUGHT_PREFIX = 'mx-thought-draft-v1'

function thoughtKey(userId, date) {
  return `${THOUGHT_PREFIX}:${String(userId)}:${date}`
}

export function readThoughtDraft({ userId, date = toLocalCalendarDate() }) {
  if (userId == null) return null
  const raw = readJson(thoughtKey(userId, date))
  if (!raw || isStale(raw.updatedAt)) return null
  return typeof raw.text === 'string' ? raw.text : ''
}

export function saveThoughtDraft({ userId, date = toLocalCalendarDate(), text }) {
  if (userId == null) return false
  return writeJson(thoughtKey(userId, date), {
    text,
    updatedAt: new Date().toISOString(),
  })
}

export function clearThoughtDraft({ userId, date = toLocalCalendarDate() }) {
  if (userId == null) return false
  return removeKey(thoughtKey(userId, date))
}
