
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
    create: (userId, name) =>
      request('/habits', { method: 'POST', body: JSON.stringify({ user_id: userId, name }) }),
    toggle: (habitId, userId) =>
      request(`/habits/${habitId}/toggle?user_id=${userId}`, { method: 'POST' }),
  },
  checkin: {
    today: (userId) => request(`/checkin/today?user_id=${userId}`),
    save: (userId, { mood, energy, anxiety, focus, note }) =>
      request('/checkin', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, mood, energy, anxiety, focus, note }),
      }),
  },
}
