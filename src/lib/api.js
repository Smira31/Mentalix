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
    history: (userId) => request(`/mentalix/messages?user_id=${userId}`),
    send: (userId, content) =>
      request('/mentalix/messages', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, content }),
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
}