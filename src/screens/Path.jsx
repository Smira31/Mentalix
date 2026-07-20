import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Target, ArrowUp } from 'lucide-react'

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

// Декоративный фон-гора со светящимися хребтами — фирменный визуальный приём
function WireframeMountain() {
  const rows = 5
  return (
    <svg viewBox="0 0 400 160" className="absolute inset-0 w-full h-full opacity-70" preserveAspectRatio="none">
      <defs>
        <filter id="mtn-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: rows }).map((_, r) => {
        const baseY = 40 + r * 22
        const amp = 22 - r * 2.5
        const points = Array.from({ length: 18 })
          .map((_, i) => {
            const x = (i / 17) * 400
            const y = baseY - Math.sin(i * 0.7 + r) * amp - Math.sin(i * 0.25 + r * 2) * (amp / 2)
            return `${x},${y}`
          })
          .join(' ')
        return (
          <polyline
            key={r}
            points={points}
            fill="none"
            stroke="#C9A227"
            strokeOpacity={0.3 + r * 0.08}
            strokeWidth={1}
            filter="url(#mtn-glow)"
          />
        )
      })}
    </svg>
  )
}

function GoalCard({ goal }) {
  return (
    <div className="rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-5">
      {/* Верх — wireframe-гора, название и прогресс поверх */}
      <div className="relative h-32">
        <WireframeMountain />
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 text-cream text-xs font-body">
            <Target size={12} /> Цель
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <h3 className="font-display text-lg text-cream leading-snug">{goal.title}</h3>
        </div>
      </div>

      {/* Низ — прогресс, описание, срок, привычки */}
      <div className="p-4 bg-emerald-light/10">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-gold">{goal.progress}% пройдено</span>
          <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center">
            <ArrowUp size={14} className="text-emerald-deep" />
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-emerald-deep overflow-hidden mb-3">
          <div className="h-full bg-gold transition-all duration-500" style={{ width: `${goal.progress}%` }} />
        </div>

        {goal.description && <p className="text-xs text-cream/45 mb-2">{goal.description}</p>}

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