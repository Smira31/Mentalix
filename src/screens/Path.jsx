import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const EMPTY_DRAFT = { title: '', description: '', target_date: '' }

function GoalForm({ onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  function set(field) {
    return (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))
  }

  function submit() {
    if (!draft.title.trim()) return
    onCreate({ ...draft, target_date: draft.target_date || null })
    setDraft(EMPTY_DRAFT)
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-emerald-light/20 p-4 mb-4 space-y-2">
      <input
        value={draft.title}
        onChange={set('title')}
        placeholder="Название цели"
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold"
      />
      <input
        value={draft.description}
        onChange={set('description')}
        placeholder="Описание (необязательно)"
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold"
      />
      <input
        type="date"
        value={draft.target_date}
        onChange={set('target_date')}
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-gold"
      />
      <div className="flex gap-2 pt-1">
        <button onClick={submit} className="flex-1 py-2 rounded-lg bg-cognac text-cream text-sm">
          Сохранить цель
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-cream/20 text-cream/60 text-sm">
          Отмена
        </button>
      </div>
    </div>
  )
}

function GoalCard({ goal }) {
  return (
    <div className="rounded-xl border border-cream/15 bg-emerald-light/20 p-4 mb-3">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-medium text-cream">{goal.title}</h3>
        <span className="font-mono text-xs text-gold whitespace-nowrap ml-2">{goal.progress}%</span>
      </div>

      {goal.description && <p className="text-xs text-cream/45 mb-2">{goal.description}</p>}

      <div className="h-1.5 rounded-full bg-emerald-deep overflow-hidden mb-3">
        <div className="h-full bg-gold" style={{ width: `${goal.progress}%` }} />
      </div>

      {goal.target_date && (
        <p className="text-[11px] text-cream/35 mb-2">Срок: {goal.target_date}</p>
      )}

      {goal.habits.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {goal.habits.map((h) => (
            <span
              key={h.id}
              className="text-[11px] px-2 py-1 rounded-md bg-emerald-deep border border-cream/10 text-cream/60"
            >
              {h.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-cream/30 italic">
          Пока нет привязанных привычек — привяжи их на экране «Сегодня» при создании
        </p>
      )}
    </div>
  )
}

export default function Path({ user }) {
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const g = await api.goals.list(user.id)
      setGoals(g)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function createGoal(draft) {
    try {
      const goal = await api.goals.create(user.id, draft)
      setGoals((prev) => [...prev, goal])
      setShowForm(false)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <h2 className="font-display text-lg mb-4 text-cream/90">Мой путь</h2>

      {goals.length === 0 && (
        <p className="text-cream/40 text-sm mb-4">Пока нет ни одной цели</p>
      )}

      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}

      {showForm ? (
        <GoalForm onCreate={createGoal} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-xl border border-cream/20 text-cream/60 text-sm mt-2"
        >
          + Новая цель
        </button>
      )}
    </div>
  )
}
