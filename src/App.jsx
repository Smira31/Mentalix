import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'

export default function App() {
  const [user, setUser] = useState(null)
  const [habits, setHabits] = useState([])
  const [newHabitName, setNewHabitName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
    const tgUser = WebApp.initDataUnsafe?.user
    if (tgUser) {
      setUser(tgUser)
      loadHabits(tgUser.id)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadHabits(userId) {
    try {
      const res = await fetch(`/api/habits?user_id=${userId}`)
      const data = await res.json()
      setHabits(data)
    } catch (e) {
      console.error('Не удалось загрузить привычки', e)
    } finally {
      setLoading(false)
    }
  }

  async function addHabit() {
    const name = newHabitName.trim()
    if (!name || !user) return
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, name }),
      })
      const habit = await res.json()
      setHabits((prev) => [...prev, habit])
      setNewHabitName('')
    } catch (e) {
      console.error('Не удалось добавить привычку', e)
    }
  }

  async function toggleHabit(habitId) {
    if (!user) return
    try {
      const res = await fetch(`/api/habits/${habitId}/toggle?user_id=${user.id}`, {
        method: 'POST',
      })
      const updated = await res.json()
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, streak: updated.streak, done_today: updated.done_today }
            : h
        )
      )
    } catch (e) {
      console.error('Не удалось обновить привычку', e)
    }
  }

  return (
    <div className="min-h-screen bg-emerald-deep text-cream flex flex-col items-center px-6 py-10 font-body">
      <div className="w-16 h-16 rounded-full border border-gold flex items-center justify-center mb-4">
        <span className="font-display text-2xl text-gold">M</span>
      </div>

      <h1 className="font-display text-2xl mb-1">Менталикс</h1>
      <p className="text-cream/60 text-xs mb-8">система, а не мотивация</p>

      <div className="w-full max-w-sm">
        <h2 className="font-display text-lg mb-4 text-cream/90">Привычки</h2>

        {loading && (
          <p className="text-cream/40 text-sm">Загрузка...</p>
        )}

        {!loading && !user && (
          <p className="text-cream/40 text-sm">
            Открой приложение через кнопку в боте, чтобы трекер увидел тебя
          </p>
        )}

        {!loading && user && (
          <>
            <div className="space-y-2 mb-4">
              {habits.length === 0 && (
                <p className="text-cream/40 text-sm">
                  Пока нет ни одной привычки — добавь первую ниже
                </p>
              )}

              {habits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                    h.done_today
                      ? 'bg-cognac/20 border-cognac'
                      : 'bg-emerald-light/30 border-cream/15'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                        h.done_today ? 'bg-cognac border-cognac' : 'border-cream/40'
                      }`}
                    >
                      {h.done_today ? '✓' : ''}
                    </span>
                    {h.name}
                  </span>
                  <span className="font-mono text-xs text-gold whitespace-nowrap">
                    🔥 {h.streak}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                placeholder="Новая привычка..."
                className="flex-1 bg-emerald-light/30 border border-cream/15 rounded-xl px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold"
              />
              <button
                onClick={addHabit}
                className="px-4 py-2 rounded-xl bg-cognac text-cream text-sm font-body"
              >
                +
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
