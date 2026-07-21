import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { Moon, Dumbbell, Droplet, BookOpen, Brain, Sparkles, ArrowLeft, Flame } from 'lucide-react'

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

function getHabitIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('сон') || n.includes('спать') || n.includes('лож')) return Moon
  if (n.includes('спорт') || n.includes('трениров') || n.includes('зал')) return Dumbbell
  if (n.includes('вод') || n.includes('пить')) return Droplet
  if (n.includes('книг') || n.includes('чтен') || n.includes('читат')) return BookOpen
  if (n.includes('медита') || n.includes('дыхан')) return Brain
  return Sparkles
}

function Monogram({ size = 'w-6 h-6', textSize = 'text-[10px]' }) {
  return (
    <div className={`flex items-center justify-center rounded-full border border-gold text-gold shrink-0 ${size}`}>
      <span className={`font-display ${textSize}`}>M</span>
    </div>
  )
}

function EmptyHabits({ onCreate }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-emerald-light/15 p-6 text-center mb-4 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-emerald-light/40 flex items-center justify-center mx-auto mb-3">
        <Sparkles size={22} className="text-gold" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg text-cream mb-1">Пока нет ни одной привычки</h3>
      <p className="font-body text-sm text-cream/50 mb-4 leading-relaxed">
        Начни с одной маленькой — система работает через регулярность, а не размах
      </p>
      <button
        onClick={onCreate}
        className="px-5 py-2.5 rounded-xl bg-gold text-emerald-deep text-sm font-medium transition-transform active:scale-95"
      >
        Создать привычку
      </button>
    </div>
  )
}

function HabitCreateScreen({ goals, onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)
  const PreviewIcon = getHabitIcon(draft.name)

  function set(field) {
    return (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    await onCreate({ ...draft, goal_id: draft.goal_id ? Number(draft.goal_id) : null })
    setSaving(false)
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Отмена
      </button>

      <h2 className="font-display text-lg mb-4 text-cream/90">Новая привычка</h2>

      <div className="rounded-xl border overflow-hidden mb-6 bg-emerald-light/30 border-cream/15">
        <div className="w-full flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-br from-cream/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/20">
              <PreviewIcon size={16} className="text-cream" strokeWidth={1.75} />
            </div>
            <span className="text-sm text-cream">{draft.name || 'Название появится здесь'}</span>
          </div>
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs text-gold whitespace-nowrap">🔥 0</span>
            <Monogram />
          </span>
        </div>
        <div className="px-4 pb-3">
          {draft.goal && <p className="text-xs text-cream/45 mb-2">{draft.goal}</p>}
          <div className="flex gap-2">
            {(draft.min_version || draft.optimal_version) ? (
              <>
                {draft.min_version && (
                  <span className="flex-1 py-1.5 rounded-lg border border-cream/20 text-cream/50 text-xs text-center">
                    Минимум: {draft.min_version}
                  </span>
                )}
                {draft.optimal_version && (
                  <span className="flex-1 py-1.5 rounded-lg border border-cream/20 text-cream/50 text-xs text-center">
                    Оптимум: {draft.optimal_version}
                  </span>
                )}
              </>
            ) : (
              <span className="flex-1 py-1.5 rounded-lg border border-cream/20 text-cream/50 text-xs text-center">
                Отметить
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <input
          value={draft.name}
          onChange={set('name')}
          placeholder="Название привычки"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.goal}
          onChange={set('goal')}
          placeholder="Зачем она нужна (цель)"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.min_version}
          onChange={set('min_version')}
          placeholder="Минимум (напр. «1 отжимание»)"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.optimal_version}
          onChange={set('optimal_version')}
          placeholder="Оптимум (напр. «20 минут спорта»)"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.skip_consequence}
          onChange={set('skip_consequence')}
          placeholder="Что теряется при пропуске"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />

        {goals.length > 0 && (
          <select
            value={draft.goal_id}
            onChange={set('goal_id')}
            className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream outline-none focus:border-gold transition-colors"
          >
            <option value="">Без привязки к цели</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!draft.name.trim() || saving}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 transition-transform active:scale-95"
      >
        {saving ? 'Сохраняю...' : 'Создать привычку'}
      </button>
    </div>
  )
}

function StreakGauge({ streak, size = 160 }) {
  const target = 21
  const percent = Math.max(0, Math.min(1, streak / target))
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
        <div className="font-display text-3xl text-cream flex items-center gap-1 justify-center">
          <Flame size={20} className="text-gold" /> {streak}
        </div>
        <div className="font-body text-xs text-cream/50 mt-1">
          {streak >= target ? 'привычка сформирована' : `до устойчивой: ${Math.max(0, target - streak)} дн.`}
        </div>
      </div>
    </div>
  )
}

function HabitDetail({ habit, onBack, onLog }) {
  const Icon = getHabitIcon(habit.name)
  const level = habit.today_level

  function handleLog(lvl) {
    haptic('medium')
    if (!level) hapticNotify('success')
    onLog(habit.id, lvl)
  }

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <button onClick={onBack} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Назад
      </button>

      <div className="rounded-[28px] bg-emerald-light/20 border border-cream/10 p-6 mb-5 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-11 h-11 rounded-xl bg-black/20 flex items-center justify-center">
            <Icon size={22} className="text-cream" strokeWidth={1.75} />
          </div>
          <Monogram />
        </div>
        <h2 className="font-display text-2xl text-cream mb-1">{habit.name}</h2>
        {habit.goal && <p className="font-body text-sm text-cream/50">{habit.goal}</p>}
      </div>

      <div className="rounded-[28px] bg-emerald-light/20 border border-cream/10 p-6 mb-5 flex justify-center">
        <StreakGauge streak={habit.streak} />
      </div>

      <div className="flex gap-2 mb-5">
        {habit.min_version && (
          <button
            onClick={() => handleLog('min')}
            className={`flex-1 py-3 rounded-xl border text-sm transition-all active:scale-95 ${
              level === 'min' ? 'bg-cognac border-cognac text-cream' : 'border-cream/20 text-cream/60'
            }`}
          >
            Минимум{habit.min_version ? `: ${habit.min_version}` : ''}
          </button>
        )}
        {habit.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`flex-1 py-3 rounded-xl border text-sm transition-all active:scale-95 ${
              level === 'optimal' ? 'bg-gold border-gold text-emerald-deep' : 'border-cream/20 text-cream/60'
            }`}
          >
            Оптимум{habit.optimal_version ? `: ${habit.optimal_version}` : ''}
          </button>
        )}
        {!habit.min_version && !habit.optimal_version && (
          <button
            onClick={() => handleLog('optimal')}
            className={`flex-1 py-3 rounded-xl border text-sm transition-all active:scale-95 ${
              level ? 'bg-cognac border-cognac text-cream' : 'border-cream/20 text-cream/60'
            }`}
          >
            {level ? 'Сделано сегодня' : 'Отметить'}
          </button>
        )}
      </div>

      {habit.skip_consequence && (
        <div className="rounded-2xl bg-emerald-light/15 border border-cream/10 p-4">
          <p className="font-body text-xs text-cream/40 mb-1">При пропуске</p>
          <p className="font-body text-sm text-cream/75 leading-relaxed">{habit.skip_consequence}</p>
        </div>
      )}
    </div>
  )
}

function HabitCard({ habit, onLog, onDelete, onOpenDetail }) {
  const level = habit.today_level
  const [confirming, setConfirming] = useState(false)
  const [pulsing, setPulsing] = useState(false)
  const Icon = getHabitIcon(habit.name)

  function handleLog(lvl) {
    haptic('medium')
    if (!level) hapticNotify('success')
    setPulsing(true)
    setTimeout(() => setPulsing(false), 320)
    onLog(habit.id, lvl)
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden mb-2 transition-colors duration-300 ${
        pulsing ? 'animate-pulse-once' : ''
      } ${level ? 'bg-cognac/15 border-cognac/60' : 'bg-emerald-light/30 border-cream/15'}`}
    >
      <button
        onClick={() => onOpenDetail(habit)}
        className={`w-full flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-br ${
          level === 'optimal'
            ? 'from-gold/20 to-transparent'
            : level === 'min'
            ? 'from-cognac/20 to-transparent'
            : 'from-cream/5 to-transparent'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/20">
            <Icon size={16} className="text-cream" strokeWidth={1.75} />
          </div>
          <span className="text-sm text-cream">{habit.name}</span>
        </div>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-gold whitespace-nowrap">🔥 {habit.streak}</span>
          <Monogram />
          {confirming ? (
            <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
            <span
              onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
              className="text-cream/30 text-sm leading-none px-1 transition-transform active:scale-90"
              aria-label="Удалить привычку"
            >
              ×
            </span>
          )}
        </span>
      </button>

      <div className="px-4 pb-3">
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
    </div>
  )
}

export default function Today({ user }) {
  const [checkin, setCheckin] = useState(null)
  const [habits, setHabits] = useState([])
  const [goals, setGoals] = useState([])
  const [draft, setDraft] = useState({ mood: 3, energy: 3, anxiety: 3, focus: 3 })
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState(null)

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
      setSelectedHabit((prev) =>
        prev && prev.id === habitId
          ? { ...prev, streak: updated.streak, today_level: updated.today_level }
          : prev
      )
    } catch (e) {
      console.error(e)
    }
  }

  async function createHabit(draftHabit) {
    try {
      const habit = await api.habits.create(user.id, draftHabit)
      setHabits((prev) => [...prev, habit])
      setShowCreate(false)
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

  if (showCreate) {
    return (
      <HabitCreateScreen
        goals={goals}
        onCreate={createHabit}
        onCancel={() => setShowCreate(false)}
      />
    )
  }

  if (selectedHabit) {
    return (
      <HabitDetail
        habit={selectedHabit}
        onBack={() => setSelectedHabit(null)}
        onLog={logHabit}
      />
    )
  }

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

      {habits.length === 0 ? (
        <EmptyHabits onCreate={() => setShowCreate(true)} />
      ) : (
        <>
          {habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onLog={logHabit}
              onDelete={deleteHabit}
              onOpenDetail={setSelectedHabit}
            />
          ))}
          <button
            onClick={() => { haptic('light'); setShowCreate(true) }}
            className="w-full py-2.5 rounded-xl border border-cream/20 text-cream/60 text-sm mt-2 transition-transform active:scale-95"
          >
            + Новая привычка
          </button>
        </>
      )}
    </div>
  )
}
