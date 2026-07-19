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
  },
}
