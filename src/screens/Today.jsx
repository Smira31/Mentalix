import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'

const SCALE = [1, 2, 3, 4, 5]
const LABELS = {
  mood: 'Настроение',
  energy: 'Энергия',
  anxiety: 'Тревога',
  focus: 'Фокус',
}

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

function hapticNotify(type = 'success') {
  WebApp.HapticFeedback?.notificationOccurred(type)
}

function Scale({ label, value, onChange }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-cream/50 mb-1">{label}</div>
      <div className="flex gap-2">
        {SCALE.map((n) => (
          <button
            key={n}
            onClick={() => {
              haptic('light')
              onChange(n)
            }}
            className={`flex-1 h-9 rounded-lg border text-sm transition-all duration-150 active:scale-90 ${
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
  const undone = habits.filter((h) => !h.today_level)
  if (undone.length > 0) {
    return `Есть незакрытая привычка: «${undone[0].name}» — маленький шаг сейчас удержит серию`
  }
  if (checkin.energy <= 2) {
    return 'Энергия низкая — сегодня можно снизить темп, это тоже часть системы, а не срыв'
  }
  return 'Все отметки закрыты — можно спокойно жить дальше, система держит фокус за тебя'
}

const EMPTY_DRAFT = {
  name: '', goal: '', min_version: '', optimal_version: '', skip_consequence: '', goal_id: '',
}

function HabitForm({ goals, onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  function set(field) {
    return (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))
  }

  function submit() {
    if (!draft.name.trim()) return
    haptic('medium')
    onCreate({ ...draft, goal_id: draft.goal_id ? Number(draft.goal_id) : null })
    setDraft(EMPTY_DRAFT)
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-emerald-light/20 p-4 mb-4 space-y-2 animate-fade-in">
      <input
        value={draft.name}
        onChange={set('name')}
        placeholder="Название привычки"
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
      />
      <input
        value={draft.goal}
        onChange={set('goal')}
        placeholder="Зачем она нужна (цель)"
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
      />
      <input
        value={draft.min_version}
        onChange={set('min_version')}
        placeholder="Минимум (напр. «1 отжимание»)"
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
      />
      <input
        value={draft.optimal_version}
        onChange={set('optimal_version')}
        placeholder="Оптимум (напр. «20 минут спорта»)"
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
      />
      <input
        value={draft.skip_consequence}
        onChange={set('skip_consequence')}
        placeholder="Что теряется при пропуске"
        className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
      />

      {goals.length > 0 && (
        <select
          value={draft.goal_id}
          onChange={set('goal_id')}
          className="w-full bg-emerald-deep border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-gold transition-colors"
        >
          <option value="">Без привязки к цели</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          className="flex-1 py-2 rounded-lg bg-cognac text-cream text-sm transition-transform active:scale-95"
        >
          Сохранить привычку
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-cream/20 text-cream/60 text-sm transition-transform active:scale-95"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

function HabitCard({ habit, onLog, onDelete }) {
  const level = habit.today_level
  const [confirming, setConfirming] = useState(false)
  const [pulsing, setPulsing] = useState(false)

  function handleLog(lvl) {
    haptic('medium')
    if (!level) hapticNotify('success')
    setPulsing(true)
    setTimeout(() => setPulsing(false), 320)
    onLog(habit.id, lvl)
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 mb-2 transition-colors duration-300 ${
        pulsing ? 'animate-pulse-once' : ''
      } ${level ? 'bg-cognac/15 border-cognac/60' : 'bg-emerald-light/30 border-cream/15'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-cream">{habit.name}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-gold whitespace-nowrap">🔥 {habit.streak}</span>
          {confirming ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => { haptic('rigid'); onDelete(habit.id) }}
                className="text-[10px] px-2 py-0.5 rounded bg-red-900/60 text-cream/90 transition-transform active:scale-90"
              >
                Удалить
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[10px] px-2 py-0.5 rounded border border-cream/20 text-cream/50 transition-transform active:scale-90"
              >
                Отмена
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-cream/30 text-sm leading-none px-1 transition-transform active:scale-90"
              aria-label="Удалить привычку"
            >
              ×
            </button>
          )}
        </span>
      </div>

      {habit.goal && <p className="text-xs text-cream/45 mb-2">{habit.goal}</p>}

      <div className="flex gap-2">
        {habit.min_version && (
          <button
            onClick={() => handleLog('min')}
            className={`flex-1 py-1.5 rounded-lg border text-xs transition-all duration-150 active:scale-95 ${
              level === 'min'
                ? 'bg-cognac border-cognac text-cream'
                : 'border-cream/20 text-cream/50'
            }`}
          >
            Минимум{habit.min_version ? `: ${habit.min_version}` : ''}
          </button>
        )}
        {habit.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`flex-1 py-1.5 rounded-lg border text-xs transition-all duration-150 active:scale-95 ${
              level === 'optimal'
                ? 'bg-gold border-gold text-emerald-deep'
                : 'border-cream/20 text-cream/50'
            }`}
          >
            Оптимум{habit.optimal_version ? `: ${habit.optimal_version}` : ''}
          </button>
        )}
        {!habit.min_version && !habit.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`flex-1 py-1.5 rounded-lg border text-xs transition-all duration-150 active:scale-95 ${
              level ? 'bg-cognac border-cognac text-cream' : 'border-cream/20 text-cream/50'
            }`}
          >
            {level ? 'Сделано' : 'Отметить'}
          </button>
        )}
      </div>

      {!level && habit.skip_consequence && (
        <p className="text-xs text-cream/35 mt-2 italic">При пропуске: {habit.skip_consequence}</p>
      )}
    </div>
  )
}

export default function Today({ user }) {
  const [checkin, setCheckin] = useState(null)
  const [habits, setHabits] = useState([])
  const [goals, setGoals] = useState([])
  const [draft, setDraft] = useState({ mood: 3, energy: 3, anxiety: 3, focus: 3 })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const [c, h, g] = await Promise.all([
        api.checkin.today(user.id),
        api.habits.list(user.id),
        api.goals.list(user.id),
      ])
      setCheckin(c)
      if (c) setDraft({ mood: c.mood, energy: c.energy, anxiety: c.anxiety, focus: c.focus })
      setHabits(h)
      setGoals(g)
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
      hapticNotify('success')
    } catch (e) {
      console.error(e)
      hapticNotify('error')
    } finally {
      setSaving(false)
    }
  }

  async function logHabit(habitId, level) {
    try {
      const updated = await api.habits.log(habitId, user.id, level)
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, streak: updated.streak, today_level: updated.today_level } : h
        )
      )
    } catch (e) {
      console.error(e)
    }
  }

  async function createHabit(draftHabit) {
    try {
      const habit = await api.habits.create(user.id, draftHabit)
      setHabits((prev) => [...prev, habit])
      setShowForm(false)
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteHabit(habitId) {
    try {
      await api.habits.remove(habitId)
      setHabits((prev) => prev.filter((h) => h.id !== habitId))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>

  const doneCount = habits.filter((h) => h.today_level).length
  const total = habits.length
  const priorityAction = derivePriorityAction({ checkin, habits })

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <div className="rounded-xl border border-gold/40 bg-emerald-light/20 px-4 py-3 mb-6 animate-fade-in">
        <div className="text-xs text-gold mb-1 font-mono">Сейчас важнее всего</div>
        <p className="text-sm text-cream/90">{priorityAction}</p>
      </div>

      <h2 className="font-display text-lg mb-3 text-cream/90">Как ты сейчас</h2>
      <Scale label={LABELS.mood} value={draft.mood} onChange={(v) => setDraft({ ...draft, mood: v })} />
      <Scale label={LABELS.energy} value={draft.energy} onChange={(v) => setDraft({ ...draft, energy: v })} />
      <Scale label={LABELS.anxiety} value={draft.anxiety} onChange={(v) => setDraft({ ...draft, anxiety: v })} />
      <Scale label={LABELS.focus} value={draft.focus} onChange={(v) => setDraft({ ...draft, focus: v })} />

      <button
        onClick={saveCheckin}
        disabled={saving}
        className="w-full mb-8 py-2.5 rounded-xl bg-cognac text-cream text-sm disabled:opacity-50 transition-transform active:scale-95"
      >
        {checkin ? 'Обновить отметку' : 'Сохранить отметку'}
      </button>

      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-cream/50 mb-1">
            <span>Привычки сегодня</span>
            <span>{doneCount}/{total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-emerald-light/30 overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500 ease-out"
              style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      <h2 className="font-display text-lg mb-3 text-cream/90">Привычки</h2>

      {habits.length === 0 && (
        <p className="text-cream/40 text-sm mb-4">Пока нет ни одной привычки</p>
      )}

      {habits.map((h) => (
        <HabitCard key={h.id} habit={h} onLog={logHabit} onDelete={deleteHabit} />
      ))}

      {showForm ? (
        <HabitForm goals={goals} onCreate={createHabit} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => { haptic('light'); setShowForm(true) }}
          className="w-full py-2.5 rounded-xl border border-cream/20 text-cream/60 text-sm mt-2 transition-transform active:scale-95"
        >
          + Новая привычка
        </button>
      )}
    </div>
  )
}
