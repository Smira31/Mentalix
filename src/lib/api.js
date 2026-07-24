const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json()
}

export const api = {
  habits: {
    list: (userId) => request(`/habits?user_id=${userId}`),
    create: (userId, habit) =>
      request('/habits', { method: 'POST', body: JSON.stringify({ user_id: userId, ...habit }) }),
    log: (habitId, userId, level) =>
      request(`/habits/${habitId}/log`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, level }),
      }),
    assignGoal: (habitId, userId, goalId) =>
      request(`/habits/${habitId}/goal`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, goal_id: goalId }),
      }),
    remove: (habitId) => request(`/habits/${habitId}`, { method: 'DELETE' }),
  },
  rituals: {
    list: (userId) => request(`/rituals?user_id=${userId}`),
    create: (userId, ritual) =>
      request('/rituals', { method: 'POST', body: JSON.stringify({ user_id: userId, ...ritual }) }),
    log: (ritualId, userId, level) =>
      request(`/rituals/${ritualId}/log`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, level }),
      }),
    remove: (ritualId) => request(`/rituals/${ritualId}`, { method: 'DELETE' }),
    reorder: (userId, order) =>
      request('/rituals/reorder', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, order }),
      }),
  },
  ascezas: {
    list: (userId) => request(`/ascezas?user_id=${userId}`),
    create: (userId, asceza) =>
      request('/ascezas', { method: 'POST', body: JSON.stringify({ user_id: userId, ...asceza }) }),
    log: (ascezaId, userId, status) =>
      request(`/ascezas/${ascezaId}/log`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, status }),
      }),
    remove: (ascezaId) => request(`/ascezas/${ascezaId}`, { method: 'DELETE' }),
    reorder: (userId, order) =>
      request('/ascezas/reorder', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, order }),
      }),
  },
  checkin: {
    today: (userId) => request(`/checkin/today?user_id=${userId}`),
    save: (userId, { mood, energy, anxiety, focus, note }) =>
      request('/checkin', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, mood, energy, anxiety, focus, note }),
      }),
  },
  goals: {
    list: (userId) => request(`/goals?user_id=${userId}`),
    create: (userId, goal) =>
      request('/goals', { method: 'POST', body: JSON.stringify({ user_id: userId, ...goal }) }),
    remove: (goalId) => request(`/goals/${goalId}`, { method: 'DELETE' }),
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
        body: JSON.stringify({ user_id: userId, content, persona }),
      }),
  },
  profile: {
    get: (userId) => request(`/profile?user_id=${userId}`),
    getSettings: (userId) => request(`/profile/settings?user_id=${userId}`),
    saveSettings: (userId, { reminder_enabled, reminder_hour }) =>
      request('/profile/settings', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, reminder_enabled, reminder_hour }),
      }),
  },
  courses: {
    list: (userId) => request(`/courses?user_id=${userId}`),
    create: (userId, course) =>
      request('/courses', { method: 'POST', body: JSON.stringify({ user_id: userId, ...course }) }),
    updateStatus: (courseId, status) =>
      request(`/courses/${courseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    notes: (courseId) => request(`/courses/${courseId}/notes`),
    addNote: (courseId, text) =>
      request(`/courses/${courseId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    remove: (courseId) => request(`/courses/${courseId}`, { method: 'DELETE' }),
  },
}