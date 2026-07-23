import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import Onboarding from './Onboarding'
import Rituals from './Rituals'
import { Moon, Dumbbell, Droplet, BookOpen, Brain, Sparkles, ArrowLeft, Flame, Snowflake, PenLine, Footprints, GraduationCap, Languages, Check, ChevronRight, ListChecks } from 'lucide-react'

const HABIT_PRESETS = [
  {
    key: 'sport', label: 'Спорт', Icon: Dumbbell,
    data: {
      name: 'Спорт',
      goal: 'Больше энергии и здоровое тело',
      min_version: '1 подход',
      optimal_version: '20 минут тренировки',
      skip_consequence: 'Тело теряет тонус, энергия падает',
    },
  },
  {
    key: 'read', label: 'Чтение', Icon: BookOpen,
    data: {
      name: 'Чтение',
      goal: 'Развивать мышление и насмотренность',
      min_version: '1 страница',
      optimal_version: '15 минут чтения',
      skip_consequence: 'Ум остаётся без пищи',
    },
  },
  {
    key: 'water', label: 'Вода', Icon: Droplet,
    data: {
      name: 'Вода',
      goal: 'Держать тело в тонусе и ясную голову',
      min_version: '1 стакан',
      optimal_version: '2 литра за день',
      skip_consequence: 'Обезвоживание, вялость, туман в голове',
    },
  },
  {
    key: 'meditation', label: 'Медитация', Icon: Brain,
    data: {
      name: 'Медитация',
      goal: 'Спокойствие и контроль над вниманием',
      min_version: '1 минута дыхания',
      optimal_version: '10 минут практики',
      skip_consequence: 'Тревога копится, фокус рассеивается',
    },
  },
  {
    key: 'sleep', label: 'Сон', Icon: Moon,
    data: {
      name: 'Ранний сон',
      goal: 'Высыпаться и восстанавливаться',
      min_version: 'Лечь до полуночи',
      optimal_version: 'Лечь до 23:00',
      skip_consequence: 'Завтра меньше сил и хуже фокус',
    },
  },
  {
    key: 'journal', label: 'Дневник', Icon: PenLine,
    data: {
      name: 'Дневник',
      goal: 'Осознанность и разгрузка головы',
      min_version: '1 предложение',
      optimal_version: '5 минут письма',
      skip_consequence: 'Мысли остаются спутанными',
    },
  },
  {
    key: 'walk', label: 'Прогулка', Icon: Footprints,
    data: {
      name: 'Прогулка',
      goal: 'Движение и свежая голова',
      min_version: '5 минут на воздухе',
      optimal_version: '30 минут пешком',
      skip_consequence: 'День проходит взаперти, тело застаивается',
    },
  },
  {
    key: 'study', label: 'Учёба', Icon: GraduationCap,
    data: {
      name: 'Учёба',
      goal: 'Расти в навыке и знаниях',
      min_version: '10 минут занятия',
      optimal_version: '45 минут фокусной учёбы',
      skip_consequence: 'Прогресс останавливается',
    },
  },
  {
    key: 'english', label: 'Английский', Icon: Languages,
    data: {
      name: 'Английский',
      goal: 'Свободно владеть языком',
      min_version: '5 новых слов',
      optimal_version: '20 минут практики',
      skip_consequence: 'Язык забывается без практики',
    },
  },
]

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

function hapticNotify(type = 'success') {
  WebApp.HapticFeedback?.notificationOccurred(type)
}

function StreakBadge({ streak, freezes, bump }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`font-mono text-xs text-gold inline-block ${bump ? 'animate-streak-bounce' : ''}`}>🔥 {streak}</span>
      {freezes > 0 && (
        <span className="flex items-center gap-0.5 font-mono text-xs text-mint">
          <Snowflake size={12} strokeWidth={2} /> {freezes}
        </span>
      )}
    </span>
  )
}

function EntryCard({ Icon, title, subtitle, right, onOpen, accent = 'gold' }) {
  const tone = {
    gold: { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/30', grad: 'from-gold/15' },
    mint: { bg: 'bg-mint/20', text: 'text-mint', border: 'border-mint/30', grad: 'from-mint/15' },
    cognac: { bg: 'bg-cognac/20', text: 'text-cognac', border: 'border-cognac/30', grad: 'from-cognac/15' },
  }[accent]

  return (
    <button
      onClick={() => { haptic('light'); onOpen() }}
      className={`w-full rounded-[24px] border ${tone.border} bg-gradient-to-br ${tone.grad} to-emerald-light/20 p-4 mb-3 flex items-center gap-3 transition-transform active:scale-[0.98]`}
    >
      <div className={`w-11 h-11 rounded-2xl ${tone.bg} flex items-center justify-center shrink-0`}>
        <Icon size={22} className={tone.text} strokeWidth={1.75} />
      </div>
      <div className="flex-1 text-left">
        <div className="font-display text-lg text-cream">{title}</div>
        <div className="text-xs text-cream/50">{subtitle}</div>
      </div>
      {right && <div className="shrink-0 mr-1">{right}</div>}
      <ChevronRight size={20} className="text-cream/40 shrink-0" />
    </button>
  )
}

function derivePriorityAction({ habits }) {
  const undone = habits.filter((h) => !h.today_level)
  if (habits.length === 0) {
    return 'Начни с одной привычки — система работает через регулярность, а не размах'
  }
  if (undone.length > 0) {
    return `Есть незакрытая привычка: «${undone[0].name}» — маленький шаг сейчас удержит серию`
  }
  return 'Все отметки закрыты — можно спокойно жить дальше, система держит фокус за тебя'
}

const EMPTY_DRAFT = {
  name: '', goal: '', min_version: '', optimal_version: '', skip_consequence: '', goal_id: '',
}

function getHabitIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('сон') || n.includes('спать') || n.includes('лож')) return Moon
  if (n.includes('спорт') || n.includes('трениров') || n.includes('зал') || n.includes('бег') || n.includes('отжим') || n.includes('йога') || n.includes('зарядк')) return Dumbbell
  if (n.includes('вод') || n.includes('пить') || n.includes('стакан')) return Droplet
  if (n.includes('книг') || n.includes('чтен') || n.includes('читат')) return BookOpen
  if (n.includes('медита') || n.includes('дыхан') || n.includes('осознан')) return Brain
  if (n.includes('дневник') || n.includes('пис') || n.includes('запис')) return PenLine
  if (n.includes('прогул') || n.includes('ходьб') || n.includes('шаг') || n.includes('улиц') || n.includes('воздух')) return Footprints
  if (n.includes('учёб') || n.includes('учеб') || n.includes('курс') || n.includes('занят')) return GraduationCap
  if (n.includes('англ') || n.includes('язык') || n.includes('слов')) return Languages
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

  function applyPreset(preset) {
    haptic('light')
    setDraft((d) => ({ ...d, ...preset.data }))
  }

  async function submit() {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    await onCreate({ ...draft, goal_id: draft.goal_id ? Number(draft.goal_id) : null })
    setSaving(false)
  }

  const inputCls =
    'w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-3.5 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors'

  return (
    <div className="w-full max-w-sm px-5 pb-6 -mt-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-cream/60 text-sm">
          <ArrowLeft size={16} /> Отмена
        </button>
        <h2 className="font-display text-base text-cream/90">Новая привычка</h2>
      </div>

      <div className="mb-4">
        <p className="text-xs text-cream/50 mb-2">Быстрый старт</p>
        <div className="grid grid-cols-3 gap-2">
          {HABIT_PRESETS.map((p) => {
            const PIcon = p.Icon
            const active = draft.name === p.data.name
            return (
              <button
                key={p.key}
                onClick={() => applyPreset(p)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all active:scale-95 ${
                  active
                    ? 'bg-gold/15 border-gold text-gold'
                    : 'bg-emerald-light/20 border-cream/15 text-cream/60'
                }`}
              >
                <PIcon size={18} strokeWidth={1.75} />
                <span className="text-[10px]">{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <input value={draft.name} onChange={set('name')} placeholder="Название привычки" className={inputCls} />
        <input value={draft.goal} onChange={set('goal')} placeholder="Зачем она нужна" className={inputCls} />
        <input value={draft.min_version} onChange={set('min_version')} placeholder="Минимум" className={inputCls} />
        <input value={draft.optimal_version} onChange={set('optimal_version')} placeholder="Оптимум" className={inputCls} />
        <input value={draft.skip_consequence} onChange={set('skip_consequence')} placeholder="Что теряется при пропуске" className={inputCls} />

        {goals.length > 0 && (
          <select value={draft.goal_id} onChange={set('goal_id')} className={inputCls}>
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
        className="w-full py-3 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 transition-transform active:scale-95"
      >
        {saving ? 'Сохраняю...' : 'Создать привычку'}
      </button>
    </div>
  )
}

function StreakGauge({ streak, freezes = 0, size = 160 }) {
  const target = 21
  const percent = Math.max(0, Math.min(1, streak / target))
  const totalTicks = 40
  const filledTicks = Math.round(percent * totalTicks)
  return (
    <div className="flex flex-col items-center">
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
      {freezes > 0 && (
        <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/25">
          <Snowflake size={14} className="text-mint" strokeWidth={2} />
          <span className="font-mono text-xs text-mint">
            {freezes} {freezes === 1 ? 'заморозка' : 'заморозки'} в запасе
          </span>
        </div>
      )}
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
        <StreakGauge streak={habit.streak} freezes={habit.freezes} />
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
  const [celebrate, setCelebrate] = useState(false)
  const [streakBump, setStreakBump] = useState(false)
  const Icon = getHabitIcon(habit.name)

  function handleLog(lvl) {
    const wasUnset = !level
    haptic('medium')
    if (wasUnset) {
      hapticNotify('success')
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 700)
    }
    onLog(habit.id, lvl)
    setTimeout(() => {
      if (wasUnset) {
        setStreakBump(true)
        setTimeout(() => setStreakBump(false), 500)
      }
    }, 150)
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden mb-2 transition-colors duration-300 ${
        celebrate ? 'animate-glow-pulse' : ''
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
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-black/20">
            <Icon size={16} className="text-cream" strokeWidth={1.75} />
            {celebrate && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-gold animate-celebrate-pop">
                <Check size={16} className="text-emerald-deep" strokeWidth={3} />
              </span>
            )}
          </div>
          <span className="text-sm text-cream">{habit.name}</span>
        </div>
        <span className="flex items-center gap-2">
          <StreakBadge streak={habit.streak} freezes={habit.freezes} bump={streakBump} />
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

function HabitsScreen({ habits, onLog, onDelete, onOpenDetail, onCreate, onBack }) {
  const doneCount = habits.filter((h) => h.today_level).length
  const total = habits.length

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <button onClick={() => { haptic('light'); onBack() }} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Назад
      </button>

      <h2 className="font-display text-2xl text-cream mb-1">Привычки</h2>
      <p className="text-xs text-cream/40 mb-5">регулярность важнее размаха</p>

      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-cream/50 mb-1">
            <span>Сегодня закрыто</span>
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

      {habits.length === 0 ? (
        <EmptyHabits onCreate={onCreate} />
      ) : (
        <>
          {habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onLog={onLog}
              onDelete={onDelete}
              onOpenDetail={onOpenDetail}
            />
          ))}
          <button
            onClick={() => { haptic('light'); onCreate() }}
            className="w-full py-2.5 rounded-xl border border-cream/20 text-cream/60 text-sm mt-2 transition-transform active:scale-95"
          >
            + Новая привычка
          </button>
        </>
      )}
    </div>
  )
}

export default function Today({ user }) {
  const [habits, setHabits] = useState([])
  const [goals, setGoals] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedHabit, setSelectedHabit] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [screen, setScreen] = useState(null) // null | 'habits' | 'rituals'

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const [h, g] = await Promise.all([
        api.habits.list(user.id),
        api.goals.list(user.id),
      ])
      setHabits(h)
      if (h.length === 0) setShowOnboarding(true)
      setGoals(g)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function logHabit(habitId, level) {
    try {
      const updated = await api.habits.log(habitId, user.id, level)
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, streak: updated.streak, freezes: updated.freezes, today_level: updated.today_level }
            : h
        )
      )
      setSelectedHabit((prev) =>
        prev && prev.id === habitId
          ? { ...prev, streak: updated.streak, freezes: updated.freezes, today_level: updated.today_level }
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

  if (habits.length === 0 && showOnboarding) {
    return <Onboarding onFinish={() => { setShowOnboarding(false); setScreen('habits'); setShowCreate(true) }} />
  }

  if (screen === 'rituals') {
    return <Rituals user={user} onBack={() => setScreen(null)} />
  }

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

  if (screen === 'habits') {
    return (
      <HabitsScreen
        habits={habits}
        onLog={logHabit}
        onDelete={deleteHabit}
        onOpenDetail={setSelectedHabit}
        onCreate={() => setShowCreate(true)}
        onBack={() => setScreen(null)}
      />
    )
  }

  const doneCount = habits.filter((h) => h.today_level).length
  const total = habits.length
  const priorityAction = derivePriorityAction({ habits })

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <div className="rounded-[24px] border border-gold/40 bg-gradient-to-br from-gold/10 to-emerald-light/20 px-5 py-4 mb-6 animate-fade-in">
        <div className="text-[11px] text-gold mb-1.5 font-mono uppercase tracking-wide">Сейчас важнее всего</div>
        <p className="text-base text-cream leading-snug">{priorityAction}</p>
      </div>

      <EntryCard
        Icon={Sparkles}
        title="Ритуалы"
        subtitle="обряды, что держат твой день"
        onOpen={() => setScreen('rituals')}
        accent="gold"
      />

      <EntryCard
        Icon={ListChecks}
        title="Привычки"
        subtitle="регулярность важнее размаха"
        right={total > 0 ? <span className="font-mono text-xs text-mint">{doneCount}/{total}</span> : null}
        onOpen={() => setScreen('habits')}
        accent="mint"
      />
    </div>
  )
}