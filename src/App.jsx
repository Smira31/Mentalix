import { useEffect, useMemo, useState } from 'react'

const STORE = 'mentalix-v2'
const todayKey = () => new Date().toISOString().slice(0, 10)
const dayLabel = () => new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

const initialState = {
  profile: { name: '' },
  checkins: {},
  habits: [
    { id: 'morning', name: 'Утренний ритуал', why: 'Начинать день с опоры, а не с хаоса.', minimum: '2 минуты', ideal: '15 минут', streak: 0, completed: [] },
    { id: 'walk', name: 'Прогуляться', why: 'Снижать напряжение и возвращать энергию.', minimum: '5 минут', ideal: '30 минут', streak: 0, completed: [] },
  ],
  tasks: [
    { id: 'plan', text: 'Определить один главный шаг на сегодня', done: false },
    { id: 'move', text: 'Сделать его до вечера', done: false },
  ],
  notes: [],
}

function loadState() {
  try { return { ...initialState, ...JSON.parse(localStorage.getItem(STORE)) } } catch { return initialState }
}

function saveState(data) { localStorage.setItem(STORE, JSON.stringify(data)) }

function Score({ label, icon, value, onChange, inverted = false }) {
  const labels = inverted ? ['Спокойно', 'Легко', 'Есть напряжение', 'Тяжело', 'Очень тревожно'] : ['Очень низко', 'Низко', 'Нормально', 'Хорошо', 'Отлично']
  return <div className="score-card">
    <div className="score-title"><span>{icon}</span>{label}</div>
    <div className="score-buttons">{[1, 2, 3, 4, 5].map((score) => <button key={score} onClick={() => onChange(score)} className={value === score ? 'active' : ''} aria-label={`${label}: ${labels[score - 1]}`}>{score}</button>)}</div>
    <small>{value ? labels[value - 1] : 'Выбери состояние'}</small>
  </div>
}

function App() {
  const [data, setData] = useState(loadState)
  const [tab, setTab] = useState('today')
  const [habitEditor, setHabitEditor] = useState(null)
  const [newHabit, setNewHabit] = useState('')
  const [reflection, setReflection] = useState('')
  const today = todayKey()
  const userName = data.profile.name || window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'друг'
  const checkin = data.checkins[today] || {}
  const doneTasks = data.tasks.filter((task) => task.done).length
  const doneHabits = data.habits.filter((habit) => habit.completed.includes(today)).length

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.()
    window.Telegram?.WebApp?.expand?.()
  }, [])
  useEffect(() => { saveState(data) }, [data])

  const insight = useMemo(() => {
    if (!checkin.mood) return 'Сначала коротко отметь состояние. Тогда Mentalix сможет заметить, что действительно на тебя влияет.'
    if (checkin.anxiety >= 4 && checkin.energy <= 2) return 'Сегодня высокая тревога и мало энергии. Не пытайся «догнать всё»: выбери минимальную версию одного важного действия.'
    if (doneHabits === data.habits.length && data.habits.length) return 'Ты держишь обещание себе даже в обычный день. Это и есть система — без рывка и чувства вины.'
    if (checkin.focus <= 2) return 'Фокус сейчас рассеян. Убери одну лишнюю задачу и сделай первый шаг настолько маленьким, чтобы его было трудно отложить.'
    return 'День выглядит устойчиво. Закрепи это одним завершённым важным действием, а не новым списком задач.'
  }, [checkin, data.habits.length, doneHabits])

  function updateCheckin(field, value) {
    setData((previous) => ({ ...previous, checkins: { ...previous.checkins, [today]: { ...previous.checkins[today], [field]: value } } }))
  }
  function toggleTask(id) { setData((previous) => ({ ...previous, tasks: previous.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) })) }
  function toggleHabit(id) {
    setData((previous) => ({ ...previous, habits: previous.habits.map((habit) => {
      if (habit.id !== id) return habit
      const done = habit.completed.includes(today)
      const completed = done ? habit.completed.filter((date) => date !== today) : [...habit.completed, today]
      return { ...habit, completed, streak: done ? Math.max(0, habit.streak - 1) : habit.streak + 1 }
    }) }))
  }
  function addHabit() {
    const name = newHabit.trim()
    if (!name) return
    setData((previous) => ({ ...previous, habits: [...previous.habits, { id: crypto.randomUUID(), name, why: 'Помогает двигаться по выбранному пути.', minimum: '5 минут', ideal: '30 минут', streak: 0, completed: [] }] }))
    setNewHabit('')
  }
  function addReflection() {
    if (!reflection.trim()) return
    setData((previous) => ({ ...previous, notes: [{ id: crypto.randomUUID(), text: reflection.trim(), date: today }, ...previous.notes] }))
    setReflection('')
  }

  const nav = [['today', '⌂', 'Сегодня'], ['path', '↗', 'Мой путь'], ['analytics', '◌', 'Аналитика'], ['mentalix', '✦', 'Mentalix'], ['profile', '◉', 'Профиль']]

  return <main className="app-shell">
    <header className="brand"><div className="mark">M</div><div><h1>Mentalix</h1><p>система, а не мотивация</p></div></header>
    {tab === 'today' && <section className="screen">
      <p className="eyebrow">Сегодня · {dayLabel()}</p><h2>Добрый день, {userName}.</h2><p className="intro">Не нужно менять всю жизнь. Достаточно заметить себя и сделать следующий посильный шаг.</p>
      <section className="section"><h3>Как ты сейчас?</h3><div className="scores">
        <Score label="Настроение" icon="☻" value={checkin.mood} onChange={(value) => updateCheckin('mood', value)} />
        <Score label="Энергия" icon="ϟ" value={checkin.energy} onChange={(value) => updateCheckin('energy', value)} />
        <Score label="Тревога" icon="◒" value={checkin.anxiety} inverted onChange={(value) => updateCheckin('anxiety', value)} />
        <Score label="Фокус" icon="◎" value={checkin.focus} onChange={(value) => updateCheckin('focus', value)} />
      </div></section>
      <section className="section"><div className="section-head"><h3>Сегодня важно</h3><span>{doneTasks}/{data.tasks.length}</span></div>{data.tasks.map((task) => <button className={`check-row ${task.done ? 'done' : ''}`} key={task.id} onClick={() => toggleTask(task.id)}><span className="check">{task.done && '✓'}</span>{task.text}</button>)}</section>
      <section className="insight"><span>✦</span><div><b>Mentalix заметил</b><p>{insight}</p></div></section>
    </section>}
    {tab === 'path' && <section className="screen"><p className="eyebrow">Мой путь</p><h2>Твои опоры</h2><p className="intro">Привычка нужна не ради галочки. У каждой есть причина и посильная версия на сложный день.</p>
      <div className="habit-list">{data.habits.map((habit) => <article className={`habit ${habit.completed.includes(today) ? 'done' : ''}`} key={habit.id}><button className="habit-main" onClick={() => toggleHabit(habit.id)}><span className="check">{habit.completed.includes(today) && '✓'}</span><span><b>{habit.name}</b><small>{habit.why}</small></span><em>🔥 {habit.streak}</em></button><div className="habit-meta"><span>Минимум: {habit.minimum}</span><span>Оптимум: {habit.ideal}</span><button onClick={() => setHabitEditor(habit)}>Изменить</button></div></article>)}</div>
      <div className="add-row"><input value={newHabit} onChange={(event) => setNewHabit(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addHabit()} placeholder="Новая опора…" /><button onClick={addHabit}>+</button></div>
    </section>}
    {tab === 'analytics' && <Analytics data={data} checkin={checkin} />}
    {tab === 'mentalix' && <section className="screen"><p className="eyebrow">Mentalix</p><h2>Обсудим сегодняшний день?</h2><section className="insight large"><span>✦</span><div><b>Прямо и с заботой</b><p>{insight}</p></div></section><div className="prompt-list"><button onClick={() => setReflection('Сегодня мне тяжело, потому что ')}>Почему сегодня тяжело?</button><button onClick={() => setReflection('Мне мешает двигаться вперёд ')}>Разобрать ситуацию</button><button onClick={() => setReflection('Сегодня у меня получилось ')}>Зафиксировать победу</button></div><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Напиши, что происходит…" /><button className="primary" onClick={addReflection}>Сохранить мысль</button>{data.notes[0] && <p className="last-note">Последняя мысль: «{data.notes[0].text}»</p>}</section>}
    {tab === 'profile' && <section className="screen"><p className="eyebrow">Профиль</p><h2>Твой ритм</h2><p className="intro">Mentalix хранит отметки на этом устройстве. Подключение сервера — следующий шаг, чтобы данные были доступны с любого устройства.</p><label className="field-label">Как к тебе обращаться?<input value={data.profile.name} onChange={(event) => setData((previous) => ({ ...previous, profile: { name: event.target.value } }))} placeholder="Твоё имя" /></label><div className="profile-stat"><b>{data.notes.length}</b><span>заметок сохранено</span></div></section>}
    <nav>{nav.map(([id, icon, label]) => <button key={id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}</nav>
    {habitEditor && <HabitEditor habit={habitEditor} onClose={() => setHabitEditor(null)} onSave={(updated) => { setData((previous) => ({ ...previous, habits: previous.habits.map((habit) => habit.id === updated.id ? updated : habit) })); setHabitEditor(null) }} />}
  </main>
}

function Analytics({ data, checkin }) {
  const completed = data.habits.reduce((total, habit) => total + habit.completed.length, 0)
  const rate = data.habits.length ? Math.round((data.habits.filter((habit) => habit.completed.includes(todayKey())).length / data.habits.length) * 100) : 0
  return <section className="screen"><p className="eyebrow">Аналитика</p><h2>Ты уже двигаешься.</h2><p className="intro">Не идеальный отчёт, а следы реальной жизни, которые помогают замечать изменения.</p><div className="metric-grid"><article><b>{rate}%</b><span>опор выполнено сегодня</span></article><article><b>{completed}</b><span>всего выполнений</span></article><article><b>{checkin.mood || '—'}/5</b><span>настроение сейчас</span></article><article><b>{data.notes.length}</b><span>наблюдений о себе</span></article></div><section className="insight large"><span>↗</span><div><b>Тенденция</b><p>{rate >= 50 ? 'Ты не ждёшь идеального дня, чтобы действовать. Это устойчивее, чем мотивация.' : 'Сначала выбери одну минимальную привычку. Регулярность начинается с действия, которое не пугает.'}</p></div></section></section>
}

function HabitEditor({ habit, onClose, onSave }) {
  const [draft, setDraft] = useState(habit)
  return <div className="modal-backdrop"><section className="modal"><h3>Смысл привычки</h3><label>Название<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Зачем она тебе?<textarea value={draft.why} onChange={(event) => setDraft({ ...draft, why: event.target.value })} /></label><label>Минимальная версия<input value={draft.minimum} onChange={(event) => setDraft({ ...draft, minimum: event.target.value })} /></label><label>Оптимальная версия<input value={draft.ideal} onChange={(event) => setDraft({ ...draft, ideal: event.target.value })} /></label><div className="modal-actions"><button onClick={onClose}>Отмена</button><button className="primary" onClick={() => onSave(draft)}>Сохранить</button></div></section></div>
}

export default App
