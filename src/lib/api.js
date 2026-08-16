const BASE = '/api'

async function request(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
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
    list: userId => request(`/habits?user_id=${userId}`),

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
    list: userId => request(`/rituals?user_id=${userId}`),

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
    list: userId => request(`/ascezas?user_id=${userId}`),

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
    today: userId => request(`/checkin/today?user_id=${userId}`),

    history: (userId, days = 14) => request(`/checkin/history?user_id=${userId}&days=${days}`),

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

  goals: {
    list: userId => request(`/goals?user_id=${userId}`),

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
    get: (userId, days = 14) => request(`/analytics?user_id=${userId}&days=${days}`),
  },

  mentalix: {
    history: (userId, persona = 'mayak') =>
      request(`/mentalix/messages?user_id=${userId}&persona=${persona}`),

    send: (userId, content, persona = 'mayak') =>
      request('/mentalix/messages', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          content,
          persona,
        }),
      }),

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

  profile: {
    get: userId => request(`/profile?user_id=${userId}`),

    getSettings: userId => request(`/profile/settings?user_id=${userId}`),

    saveSettings: (userId, { reminder_enabled, reminder_hour, review_hour }) =>
      request('/profile/settings', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          reminder_enabled,
          reminder_hour,
          review_hour,
        }),
      }),
  },

  pulse: {
    today: () => request('/analytics/pulse'),
  },

  articles: {
    list: () => request('/articles'),
  },

  themes: {
    list: userId => request(`/themes?user_id=${userId}`),

    get: (themeId, userId) => request(`/themes/${themeId}?user_id=${userId}`),

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
    list: userId => request(`/quotes?user_id=${userId}`),

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

    today: userId => request(`/quotes/today?user_id=${userId}`),
  },

  courses: {
    list: userId => request(`/courses?user_id=${userId}`),

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
    progress: userId => request(`/focus/progress?user_id=${userId}`),

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
    summary: userId => request(`/brain/summary?user_id=${userId}`),

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
    get: userId => request(`/subscription?user_id=${userId}`),

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

    generateLinkCode: telegramUserId =>
      request('/auth/link/generate', {
        method: 'POST',
        body: JSON.stringify({
          user_id: telegramUserId,
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
}
