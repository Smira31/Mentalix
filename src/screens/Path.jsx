import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Target, ArrowUp, ArrowLeft, Flame, TrendingUp } from 'lucide-react'

const EMPTY_DRAFT = { title: '', description: '', target_date: '' }

// Декоративный фон-гора со светящимися хребтами
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

// Кольцевая шкала с делениями — единый визуальный приём приложения
function TickGauge({ value, max, sublabel, size = 160 }) {
  const percent = Math.max(0, Math.min(1, value / max))
  const totalTicks = 40
  const filledTicks = Math.round(percent * totalTicks)
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        {Array.from({ length: totalTicks }).map((_, i) => {
          const angle = (i / totalTicks) * 360
          const isFilled = i < filledTicks
          const rad = ((angle - 90) * Math.PI) / 180
          const x1 = 100 + 80 * Math.cos(rad)
          const y1 = 100 + 80 * Math.sin(rad)
          const x2 = 100 + 92 * Math.cos(rad)
          const y2 = 100 + 92 * Math.sin(rad)
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isFilled ? '#C9A227' : 'rgba(243,233,221,0.12)'}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="text-center">
        <div className="font-display text-3xl text-cream">{value}%</div>
        <div className="font-body text-xs text-cream/50 mt-1">{sublabel}</div>
      </div>
    </div>
  )
}

// Полноэкранное создание цели с живым превью карточки
function GoalCreateScreen({ onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  function set(field) {
    return (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    await onCreate({ ...draft, target_date: draft.target_date || null })
    setSaving(false)
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Отмена
      </button>

      <h2 className="font-display text-lg mb-4 text-cream/90">Новая цель</h2>

      {/* Живое превью — точно та карточка, что появится в списке */}
      <div className="relative rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-6 h-40">
        <WireframeMountain />
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 text-cream text-xs font-body">
            <Target size={12} /> Цель
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
          <div>
            <h3 className="font-display text-lg text-cream leading-snug">
              {draft.title || 'Название появится здесь'}
            </h3>
            <p className="font-mono text-xs text-gold mt-0.5">0% пройдено</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shrink-0">
            <ArrowUp size={16} className="text-emerald-deep" />
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <input
          value={draft.title}
          onChange={set('title')}
          placeholder="Название цели"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <textarea
          value={draft.description}
          onChange={set('description')}
          placeholder="Описание (необязательно)"
          rows={3}
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors resize-none"
        />
        <input
          type="date"
          value={draft.target_date}
          onChange={set('target_date')}
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream outline-none focus:border-gold transition-colors"
        />
      </div>

      <button
        onClick={submit}
        disabled={!draft.title.trim() || saving}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 transition-transform active:scale-95"
      >
        {saving ? 'Сохраняю...' : 'Создать цель'}
      </button>
    </div>
  )
}

// Компактная карточка в списке — тап открывает детальный экран
function GoalCard({ goal, onOpen }) {
  return (
    <button
      onClick={() => onOpen(goal)}
      className="relative w-full text-left rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-4 h-40"
    >
      <WireframeMountain />
      <div className="absolute top-3 left-3">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 text-cream text-xs font-body">
          <Target size={12} /> Цель
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
        <div>
          <h3 className="font-display text-lg text-cream leading-snug">{goal.title}</h3>
          <p className="font-mono text-xs text-gold mt-0.5">{goal.progress}% пройдено</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shrink-0">
          <ArrowUp size={16} className="text-emerald-deep" />
        </div>
      </div>
    </button>
  )
}

// Полноэкранный детальный вид цели
function GoalDetail({ goal, onBack }) {
  return (
    <div className="w-full max-w-sm px-6 pb-10">
      <button onClick={onBack} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Назад
      </button>

      <div className="relative rounded-[28px] overflow-hidden bg-emerald-deep h-44 mb-5">
        <WireframeMountain />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center mb-3">
            <Target size={26} className="text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-2xl text-cream">{goal.title}</h2>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-cream/60 text-center mb-5 leading-relaxed">{goal.description}</p>
      )}

      <div className="rounded-[28px] bg-emerald-light/20 border border-cream/10 p-6 mb-5 flex justify-center">
        <TickGauge value={goal.progress} max={100} sublabel="прогресс к цели" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-emerald-light/20 p-4">
          <Flame size={18} className="text-gold mb-2" strokeWidth={1.75} />
          <div className="font-body text-sm text-cream">{goal.habits.length}</div>
          <div className="font-body text-xs text-cream/50">связанных привычек</div>
        </div>
        <div className="rounded-2xl bg-emerald-light/20 p-4">
          <TrendingUp size={18} className="text-gold mb-2" strokeWidth={1.75} />
          <div className="font-body text-sm text-cream">{goal.target_date || '—'}</div>
          <div className="font-body text-xs text-cream/50">срок</div>
        </div>
      </div>

      <h3 className="text-sm text-cream/80 mb-2">Привычки</h3>
      {goal.habits.length > 0 ? (
        <div className="rounded-2xl bg-emerald-light/20 border border-cream/10 divide-y divide-cream/10">
          {goal.habits.map((h) => (
            <div key={h.id} className="px-4 py-3 text-sm text-cream/80">
              {h.name}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-cream/30 italic">
          Пока нет привязанных привычек — привяжи их на экране «Сегодня» при создании
        </p>
      )}
    </div>
  )
}

export default function Path({ user }) {
  const [goals, setGoals] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState(null)

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
      setShowCreate(false)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>

  if (showCreate) {
    return <GoalCreateScreen onCreate={createGoal} onCancel={() => setShowCreate(false)} />
  }

  if (selectedGoal) {
    return <GoalDetail goal={selectedGoal} onBack={() => setSelectedGoal(null)} />
  }

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <h2 className="font-display text-lg mb-4 text-cream/90">Мой путь</h2>

      {goals.length === 0 && (
        <p className="text-cream/40 text-sm mb-4">Пока нет ни одной цели</p>
      )}

      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} onOpen={setSelectedGoal} />
      ))}

      <button
        onClick={() => setShowCreate(true)}
        className="w-full py-2.5 rounded-xl border border-cream/20 text-cream/60 text-sm mt-2"
      >
        + Новая цель
      </button>
    </div>
  )
}