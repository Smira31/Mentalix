import { platform } from '../platform'
import { withQuery } from './apiQuery'

const BASE = '/api'

/*
 * MXL-SECURITY-AUDIT-001: подписанный Telegram initData едет в стандартном
 * заголовке Authorization: tma <initData> (схема из документации Telegram
 * Mini Apps) на КАЖДЫЙ запрос — так бэкенду не нужно менять сигнатуры
 * отдельных эндпоинтов, когда появится проверка подписи. Backend её пока
 * не проверяет (см. TASKS.md/CHANGES.md) — заголовок сам по себе от подмены
 * user_id не защищает, это только фронтенд-часть контракта.
 */
function authHeader() {
  const initData = platform.getInitData?.()
  return initData ? { Authorization: `tma ${initData}` } : {}
}

async function download(path, filename) {
  const response = await fetch(`${BASE}${path}`, { headers: authHeader() })
  if (!response.ok) throw new Error(`Export ${path} failed: ${response.status}`)
  const blob = await response.blob()
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(href)
}

async function request(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...authHeader(),
      ...options.headers,
    },
    ...options,
  })

  const raw = await res.text()

  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}. Ответ: ${raw.slice(0, 300)}`)
  }

  if (!raw) {
    throw new Error(`API ${path} вернул пустой ответ при статусе ${res.status}`)
  }

  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`API ${path} вернул не JSON: ${raw.slice(0, 300)}`)
  }
}

export const api = {
  habits: {
    list: userId => request(withQuery('/habits', { user_id: userId })),

    create: (userId, habit) =>
      request('/habits', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          ...habit,
        }),
      }),

    log: (habitId, userId, level) =>
      request(`/habits/${habitId}/log`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          level,
        }),
      }),

    assignGoal: (habitId, userId, goalId) =>
      request(`/habits/${habitId}/goal`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          goal_id: goalId,
        }),
      }),

    remove: habitId =>
      request(`/habits/${habitId}`, {
        method: 'DELETE',
      }),
  },

  rituals: {
    list: userId => request(withQuery('/rituals', { user_id: userId })),

    create: (userId, ritual) =>
      request('/rituals', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          ...ritual,
        }),
      }),

    log: (ritualId, userId, level) =>
      request(`/rituals/${ritualId}/log`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          level,
        }),
      }),

    remove: ritualId =>
      request(`/rituals/${ritualId}`, {
        method: 'DELETE',
      }),

    reorder: (userId, order) =>
      request('/rituals/reorder', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          order,
        }),
      }),
  },

  ascezas: {
    list: userId => request(withQuery('/ascezas', { user_id: userId })),

    create: (userId, asceza) =>
      request('/ascezas', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          ...asceza,
        }),
      }),

    log: (ascezaId, userId, status, breakTrigger = null, breakNote = null) =>
      request(`/ascezas/${ascezaId}/log`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          status,
          break_trigger: breakTrigger,
          break_note: breakNote,
        }),
      }),

    remove: ascezaId =>
      request(`/ascezas/${ascezaId}`, {
        method: 'DELETE',
      }),

    reorder: (userId, order) =>
      request('/ascezas/reorder', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          order,
        }),
      }),
  },

  checkin: {
    today: userId => request(withQuery('/checkin/today', { user_id: userId })),

    history: (userId, days = 14) =>
      request(withQuery('/checkin/history', { user_id: userId, days })),

    save: (
      userId,
      { mood, energy, anxiety, focus, note, emotion, lessons, wins, review_completed }
    ) =>
      request('/checkin', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          mood,
          energy,
          anxiety,
          focus,
          note,
          emotion,
          lessons,
          wins,
          ...(typeof review_completed === 'boolean' ? { review_completed } : {}),
        }),
      }),
  },

  journalTemplates: {
    list: (userId, { q, category } = {}) => request(withQuery('/journal/templates', { user_id: userId, q, category })),
    get: (templateId, userId) => request(withQuery(`/journal/templates/${templateId}`, { user_id: userId })),
    create: (userId, template) => request('/journal/templates', { method: 'POST', body: JSON.stringify({ user_id: userId, ...template }) }),
    update: (templateId, userId, template) => request(`/journal/templates/${templateId}`, { method: 'PATCH', body: JSON.stringify({ user_id: userId, ...template }) }),
    remove: (templateId, userId) => request(withQuery(`/journal/templates/${templateId}`, { user_id: userId }), { method: 'DELETE' }),
    startOrResume: (templateId, userId) => request(`/journal/templates/${templateId}/sessions`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
    updateSession: (sessionId, userId, answers, complete = false) => request(`/journal/templates/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify({ user_id: userId, answers, complete }) }),
    sessions: (userId, status) => request(withQuery('/journal/templates/sessions/mine', { user_id: userId, status })),
  },

  journey: {
    tags: userId => request(withQuery('/journey/tags', { user_id: userId })),
    createTag: (userId, tag) => request('/journey/tags', { method: 'POST', body: JSON.stringify({ user_id: userId, ...tag }) }),
    updateTag: (tagId, userId, tag) => request(`/journey/tags/${tagId}`, { method: 'PATCH', body: JSON.stringify({ user_id: userId, ...tag }) }),
    removeTag: (tagId, userId) => request(withQuery(`/journey/tags/${tagId}`, { user_id: userId }), { method: 'DELETE' }),
    entries: (userId, filters = {}) => request(withQuery('/journey/entries', { user_id: userId, ...filters })),
    entry: (userId, date) => request(withQuery(`/journey/entries/${date}`, { user_id: userId })),
    replaceTags: (userId, date, tagIds) => request(`/journey/entries/${date}/tags`, { method: 'PUT', body: JSON.stringify({ user_id: userId, tag_ids: tagIds }) }),
  },

  goals: {
    list: userId => request(withQuery('/goals', { user_id: userId })),

    create: (userId, goal) =>
      request('/goals', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          ...goal,
        }),
      }),

    remove: goalId =>
      request(`/goals/${goalId}`, {
        method: 'DELETE',
      }),
  },

  analytics: {
    get: (userId, days = 14) => request(withQuery('/analytics', { user_id: userId, days })),
  },

  mentalix: {
    history: (userId, persona = 'mayak') =>
      request(withQuery('/mentalix/messages', { user_id: userId, persona })),

    send: (userId, content, persona = 'mayak') =>
      request('/mentalix/messages', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          content,
          persona,
        }),
      }),

    contextConsent: userId => request(withQuery('/mentalix/consent', { user_id: userId })),

    setContextConsent: (userId, enabled) =>
      request('/mentalix/consent', {
        method: 'PUT',
        body: JSON.stringify({ user_id: userId, enabled }),
      }),

    feedback: (userId, rating, messageId, note) =>
      request('/mentalix/feedback', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, rating, message_id: messageId, note }),
      }),

    deleteData: userId =>
      request(withQuery('/mentalix/data', { user_id: userId }), { method: 'DELETE' }),

    transcribe: (userId, audio) => {
      const form = new FormData()

      form.append('user_id', String(userId))
      form.append('audio', audio, audio.type.includes('mp4') ? 'voice.mp4' : 'voice.webm')

      return request('/mentalix/transcribe', {
        method: 'POST',
        body: form,
      })
    },
  },

  privacy: {
    downloadExport: (userId, { format = 'json', dateFrom, dateTo } = {}) => {
      const extension = format === 'markdown' ? 'md' : format
      const prefix = format === 'csv' ? 'mentalix-metrics' : format === 'markdown' ? 'mentalix-journal' : 'mentalix-export'
      return download(
        withQuery('/privacy/export', { user_id: userId, export_format: format, date_from: dateFrom, date_to: dateTo }),
        `${prefix}-${new Date().toISOString().slice(0, 10)}.${extension}`,
      )
    },
  },

  profile: {
    get: userId => request(withQuery('/profile', { user_id: userId })),

    getSettings: userId => request(withQuery('/profile/settings', { user_id: userId })),

    saveSettings: (userId, settings) =>
      request('/profile/settings', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, ...settings }),
      }),

    snoozeReminders: (userId, hours = 2) =>
      request('/profile/settings/snooze', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, hours }),
      }),

    clearReminderSettings: userId =>
      request(withQuery('/profile/settings', { user_id: userId }), { method: 'DELETE' }),
  },

  pulse: {
    today: () => request('/analytics/pulse'),
  },

  articles: {
    list: () => request('/articles'),
  },

  themes: {
    list: userId => request(withQuery('/themes', { user_id: userId })),

    get: (themeId, userId) => request(withQuery(`/themes/${themeId}`, { user_id: userId })),

    reflect: (themeId, userId, day, text) =>
      request(`/themes/${themeId}/reflect`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          day,
          text,
        }),
      }),
  },

  quotes: {
    list: userId => request(withQuery('/quotes', { user_id: userId })),

    create: (userId, text, tag) =>
      request('/quotes', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          text,
          tag,
        }),
      }),

    remove: quoteId =>
      request(`/quotes/${quoteId}`, {
        method: 'DELETE',
      }),

    today: userId => request(withQuery('/quotes/today', { user_id: userId })),
  },

  courses: {
    list: userId => request(withQuery('/courses', { user_id: userId })),

    create: (userId, course) =>
      request('/courses', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          ...course,
        }),
      }),

    updateStatus: (courseId, status) =>
      request(`/courses/${courseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
        }),
      }),

    notes: courseId => request(`/courses/${courseId}/notes`),

    addNote: (courseId, text) =>
      request(`/courses/${courseId}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          text,
        }),
      }),

    remove: courseId =>
      request(`/courses/${courseId}`, {
        method: 'DELETE',
      }),
  },

  focus: {
    progress: userId => request(withQuery('/focus/progress', { user_id: userId })),

    logSession: (userId, durationMin) =>
      request('/focus', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          duration_min: durationMin,
        }),
      }),
  },

  brain: {
    summary: userId => request(withQuery('/brain/summary', { user_id: userId })),

    logSession: (userId, exerciseType, score, durationSec) =>
      request('/brain/sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          exercise_type: exerciseType,
          score,
          duration_sec: durationSec,
        }),
      }),
  },

  subscription: {
    get: userId => request(withQuery('/subscription', { user_id: userId })),

    donate: (userId, amount, currency = 'RUB') =>
      request('/subscription/donate', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          amount,
          currency,
        }),
      }),
  },

  auth: {
    requestCode: email =>
      request('/auth/email/request-code', {
        method: 'POST',
        body: JSON.stringify({
          email,
        }),
      }),

    verify: (email, code) =>
      request('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
        }),
      }),

    confirmLink: (webUserId, code) =>
      request('/auth/link/confirm', {
        method: 'POST',
        body: JSON.stringify({
          web_user_id: webUserId,
          code,
        }),
      }),
  },

  // MXL-EVENTS: только факт действия (event_type/entity_type/entity_id) —
  // без текстов рефлексии, ответов чек-ина или содержимого чата.
  events: {
    log: (userId, eventType, entityType = null, entityId = null) =>
      request('/events', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          event_type: eventType,
          entity_type: entityType,
          entity_id: entityId,
        }),
      }),
  },
}
