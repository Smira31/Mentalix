import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const SCALE = [1, 2, 3, 4, 5]
const LABELS = {
  mood: 'Настроение',
  energy: 'Энергия',
  anxiety: 'Тревога',
  focus: 'Фокус',
}

function Scale({ label, value, onChange }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-cream/50 mb-1">{label}</div>
      <div className="flex gap-2">
        {SCALE.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-9 rounded-lg border text-sm transition-colors ${
              value === n
                ? 'bg-cognac border-cognac text-cream'
                : 'bg-emerald-light/20 border-cream/15 text-cream/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function derivePriorityAction({ checkin, habits }) {
  if (!checkin) {
    return 'Начни с чек-ина — отметь, как ты сейчас, это займёт 20 секунд'
  }
  if (checkin.anxiety >= 4) {
    return 'Тревога высокая — сделай паузу на 3 минуты и просто подыши, прежде чем продолжать дела'
  }
  const undone = habits.filter((h) => !h.done_today)
  if (undone.length > 0) {
    return `Есть незакрытая привычка: «${undone[0].name}» — маленький шаг сейчас удержит серию`
  }
  if (checkin.energy <= 2) {
    return 'Энергия низкая — сегодня можно снизить темп, это тоже часть системы, а не срыв'
  }
  return 'Все отметки закрыты — можно спокойно жить дальше, система держит фокус за тебя'
}

export default function Today({ user }) {
  const [checkin, setCheckin] = useState(null)
  const [habits, setHabits] = useState([])
  const [draft, setDraft] = useState({ mood: 3, energy: 3, anxiety: 3, focus: 3 })
  const [newHabitName, setNewHabitName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const [c, h] = await Promise.all([
        api.checkin.today(user.id),
        api.habits.list(user.id),
      ])
      setCheckin(c)
      if (c) setDraft({ mood: c.mood, energy: c.energy, anxiety: c.anxiety, focus: c.focus })
      setHabits(h)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function saveCheckin() {
    setSaving(true)
    try {
      const updated = await api.checkin.save(user.id, draft)
      setCheckin(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function toggleHabit(habitId) {
    try {
      const updated = await api.habits.toggle(habitId, user.id)
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, streak: updated.streak, done_today: updated.done_today } : h
        )
      )
    } catch (e) {
      console.error(e)
    }
  }

  async function addHabit() {
    const name = newHabitName.trim()
    if (!name) return
    try {
      const habit = await api.habits.create(user.id, name)
      setHabits((prev) => [...prev, habit])
      setNewHabitName('')
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>

  const doneCount = habits.filter((h) => h.done_today).length
  const total = habits.length
  const priorityAction = derivePriorityAction({ checkin, habits })

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      {/* Приоритетное действие */}
      <div className="rounded-xl border border-gold/40 bg-emerald-light/20 px-4 py-3 mb-6">
        <div className="text-xs text-gold mb-1 font-mono">Сейчас важнее всего</div>
        <p className="text-sm text-cream/90">{priorityAction}</p>
      </div>

      {/* Чек-ин */}
      <h2 className="font-display text-lg mb-3 text-cream/90">Как ты сейчас</h2>
      <Scale label={LABELS.mood} value={draft.mood} onChange={(v) => setDraft({ ...draft, mood: v })} />
      <Scale label={LABELS.energy} value={draft.energy} onChange={(v) => setDraft({ ...draft, energy: v })} />
      <Scale label={LABELS.anxiety} value={draft.anxiety} onChange={(v) => setDraft({ ...draft, anxiety: v })} />
      <Scale label={LABELS.focus} value={draft.focus} onChange={(v) => setDraft({ ...draft, focus: v })} />

      <button
        onClick={saveCheckin}
        disabled={saving}
        className="w-full mb-8 py-2.5 rounded-xl bg-cognac text-cream text-sm disabled:opacity-50"
      >
        {checkin ? 'Обновить отметку' : 'Сохранить отметку'}
      </button>

      {/* Прогресс */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-cream/50 mb-1">
            <span>Привычки сегодня</span>
            <span>{doneCount}/{total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-emerald-light/30 overflow-hidden">
            <div
              className="h-full bg-gold"
              style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Привычки */}
      <h2 className="font-display text-lg mb-3 text-cream/90">Привычки</h2>
      <div className="space-y-2 mb-4">
        {habits.length === 0 && (
          <p className="text-cream/40 text-sm">Пока нет ни одной привычки</p>
        )}
        {habits.map((h) => (
          <button
            key={h.id}
            onClick={() => toggleHabit(h.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
              h.done_today ? 'bg-cognac/20 border-cognac' : 'bg-emerald-light/30 border-cream/15'
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
            <span className="font-mono text-xs text-gold whitespace-nowrap">🔥 {h.streak}</span>
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
        <button onClick={addHabit} className="px-4 py-2 rounded-xl bg-cognac text-cream text-sm">
          +
        </button>
      </div>
    </div>
  )
}
