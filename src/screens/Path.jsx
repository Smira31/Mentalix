import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Target, ArrowUp, ArrowLeft, ArrowRight, Flame, TrendingUp, Trash2 } from 'lucide-react'
import JourneyLineArt from '../components/JourneyLineArt'

const EMPTY_DRAFT = { title: '', description: '', target_date: '' }


export function TickGauge({ value, max, sublabel, size = 160 }) {
  const percent = Math.max(0, Math.min(1, value / max))
  const totalTicks = 40
  const filledTicks = Math.round(percent * totalTicks)
  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size }}
    >
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
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isFilled ? '#C9A227' : 'rgba(243,233,221,0.12)'}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="text-center">
        <div className="font-display text-3xl text-cream">{value}%</div>
        <div className="font-body text-[11px] text-muted mt-1">{sublabel}</div>
      </div>
    </div>
  )
}

function EmptyGoals({ onCreate }) {
  return (
    <div className="relative rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-4 animate-fade-in">
      <div className="relative h-32">
        <JourneyLineArt progress={0} className="absolute inset-0 w-full h-full opacity-80" />
      </div>
      <div className="px-6 pb-6 pt-2 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-light/30 flex items-center justify-center mx-auto mb-3 -mt-8 relative">
          <Target size={22} className="text-gold" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-[16px] text-cream mb-1">Пока нет ни одной цели</h3>
        <p className="font-body text-[13px] text-muted mb-4 leading-relaxed">
          Создай первую — и увидишь линию движения к ней прямо здесь
        </p>
        <button
          onClick={onCreate}
          className="px-5 py-2.5 rounded-xl bg-gold text-emerald-deep text-[13px] font-medium transition-transform active:scale-95"
        >
          Создать цель
        </button>
      </div>
    </div>
  )
}

function GoalCreateScreen({ onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  function set(field) {
    return e => setDraft(d => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    await onCreate({ ...draft, target_date: draft.target_date || null })
    setSaving(false)
  }

  return (
    <div className="w-full max-w-md px-5">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-muted text-[13px] mb-4">
        <ArrowLeft size={16} /> Отмена
      </button>

      <h2 className="font-display text-[16px] mb-4 text-cream">Новая цель</h2>

      <div className="relative rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-6 h-40">
        <JourneyLineArt progress={0} className="absolute inset-0 w-full h-full opacity-80" />
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 text-cream text-[11px] font-body">
            <Target size={12} /> Цель
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
          <div>
            <h3 className="font-display text-[16px] text-cream leading-snug">
              {draft.title || 'Название появится здесь'}
            </h3>
            <p className="font-mono text-[11px] text-gold mt-0.5">0% пройдено</p>
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
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors"
        />
        <textarea
          value={draft.description}
          onChange={set('description')}
          placeholder="Описание (необязательно)"
          rows={3}
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors resize-none"
        />
        <input
          type="date"
          value={draft.target_date}
          onChange={set('target_date')}
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream outline-none focus:border-gold transition-colors"
        />
      </div>

      <button
        onClick={submit}
        disabled={!draft.title.trim() || saving}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-[13px] font-medium disabled:opacity-40 transition-transform active:scale-95"
      >
        {saving ? 'Сохраняю...' : 'Создать цель'}
      </button>
    </div>
  )
}

function GoalCard({ goal, onOpen }) {
  return (
    <button
      onClick={() => onOpen(goal)}
      className="relative w-full text-left rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-4 h-40"
    >
      <JourneyLineArt progress={goal.progress} className="absolute inset-0 w-full h-full opacity-80" />
      <div className="absolute top-3 left-3">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 text-cream text-[11px] font-body">
          <Target size={12} /> Цель
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
        <div>
          <h3 className="font-display text-[16px] text-cream leading-snug">{goal.title}</h3>
          <p className="font-mono text-[11px] text-gold mt-0.5">{goal.progress}% пройдено</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shrink-0">
          <ArrowUp size={16} className="text-emerald-deep" />
        </div>
      </div>
    </button>
  )
}

function GoalDetail({ goal, onBack, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await onDelete(goal.id)
    setDeleting(false)
  }

  return (
    <div className="w-full max-w-md px-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted text-[13px]">
          <ArrowLeft size={16} /> Назад
        </button>

        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-red-900/60 text-cream transition-transform active:scale-95 disabled:opacity-50"
            >
              {deleting ? 'Удаляю...' : 'Удалить'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-cream/20 text-muted transition-transform active:scale-95"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-muted p-1.5 transition-transform active:scale-90"
            aria-label="Удалить цель"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="relative rounded-[28px] overflow-hidden bg-emerald-deep h-44 mb-5">
        <JourneyLineArt progress={goal.progress} className="absolute inset-0 w-full h-full opacity-80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center mb-3">
            <Target size={26} className="text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-[22px] text-cream">{goal.title}</h2>
        </div>
      </div>

      {goal.description && (
        <p className="text-[13px] text-muted text-center mb-5 leading-relaxed">{goal.description}</p>
      )}

      <div className="rounded-[28px] bg-emerald-light/20 border border-cream/10 p-6 mb-5 flex justify-center">
        <TickGauge value={goal.progress} max={100} sublabel="прогресс к цели" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-emerald-light/20 p-4">
          <Flame size={18} className="text-gold mb-2" strokeWidth={1.75} />
          <div className="font-body text-[13px] text-cream">{goal.habits.length}</div>
          <div className="font-body text-[11px] text-muted">связанных привычек</div>
        </div>
        <div className="rounded-2xl bg-emerald-light/20 p-4">
          <TrendingUp size={18} className="text-gold mb-2" strokeWidth={1.75} />
          <div className="font-body text-[13px] text-cream">{goal.target_date || '—'}</div>
          <div className="font-body text-[11px] text-muted">срок</div>
        </div>
      </div>

      <h3 className="text-[13px] text-cream mb-2">Привычки</h3>
      {goal.habits.length > 0 ? (
        <div className="rounded-2xl bg-emerald-light/20 border border-cream/10 divide-y divide-cream/10">
          {goal.habits.map(h => (
            <div key={h.id} className="px-4 py-3 text-[13px] text-cream">
              {h.name}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-faint italic">
          Пока нет привязанных привычек — привяжи их на экране «Сегодня» при создании
        </p>
      )}
    </div>
  )
}

export default function Path({ user, onContinueToday }) {
  const [goals, setGoals] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState(null)

  useEffect(() => {
    if (!user) return

    let active = true

    ;(async () => {
      try {
        const g = await api.goals.list(user.id)
        if (active) setGoals(g)
      } catch (e) {
        console.error(e)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [user])

  async function createGoal(draft) {
    try {
      const goal = await api.goals.create(user.id, draft)
      setGoals(prev => [...prev, goal])
      setShowCreate(false)
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteGoal(goalId) {
    try {
      await api.goals.remove(goalId)
      setGoals(prev => prev.filter(g => g.id !== goalId))
      setSelectedGoal(null)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-muted text-[13px] px-6">Загрузка...</p>

  if (showCreate) {
    return <GoalCreateScreen onCreate={createGoal} onCancel={() => setShowCreate(false)} />
  }

  if (selectedGoal) {
    return (
      <GoalDetail goal={selectedGoal} onBack={() => setSelectedGoal(null)} onDelete={deleteGoal} />
    )
  }

  return (
    <div className="w-full max-w-md px-5 pb-24">
      <div className="mb-5 rounded-[28px] bg-emerald-deep border border-cream/10 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[16px] text-cream">Мой путь</h2>
            <p className="text-sm text-muted mt-1 leading-relaxed">
              Регулярность складывается из возвращений. Следующий шаг уже ждёт тебя сегодня.
            </p>
          </div>
          <ArrowRight size={20} className="text-gold mt-1 shrink-0" strokeWidth={1.8} />
        </div>
        <button
          type="button"
          onClick={onContinueToday}
          className="w-full mt-4 py-3 rounded-2xl bg-gold text-emerald-deep text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          Продолжить сегодня
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyGoals onCreate={() => setShowCreate(true)} />
      ) : (
        <>
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onOpen={setSelectedGoal} />
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2.5 rounded-xl border border-cream/20 text-muted text-[13px] mt-2"
          >
            + Новая цель
          </button>
        </>
      )}
    </div>
  )
}
