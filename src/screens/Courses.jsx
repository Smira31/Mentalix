import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { BookOpen, ArrowLeft, Clock, Trash2, Plus, Check } from 'lucide-react'

const EMPTY_DRAFT = { title: '', source: '', duration_estimate_min: '', cover_url: '' }
const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'in_progress', label: 'В процессе' },
  { key: 'completed', label: 'Пройденные' },
]

function formatDuration(min) {
  if (!min) return null
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

function CourseCard({ course, onOpen }) {
  const duration = formatDuration(course.duration_estimate_min)
  return (
    <button
      onClick={() => onOpen(course)}
      className="w-full text-left rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-4"
    >
      <div className="h-32 relative bg-emerald-light/20 flex items-center justify-center">
        {course.cover_url ? (
          <img src={course.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={28} className="text-gold/60" strokeWidth={1.5} />
        )}
        <span
          className={`absolute top-3 right-3 text-[10px] font-medium px-2.5 py-1 rounded-full ${
            course.status === 'completed'
              ? 'bg-gold text-emerald-deep'
              : 'bg-black/40 text-cream/80'
          }`}
        >
          {course.status === 'completed' ? 'Пройден' : 'В процессе'}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-base text-cream leading-snug mb-1">{course.title}</h3>
        {course.source && (
          <p className="text-xs text-cream/40 mb-2">{course.source}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-cream/50">
          {duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {duration}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function CourseCreateScreen({ onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  function set(field) {
    return (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    await onCreate({
      title: draft.title,
      source: draft.source || null,
      cover_url: draft.cover_url || null,
      duration_estimate_min: draft.duration_estimate_min ? Number(draft.duration_estimate_min) : null,
    })
    setSaving(false)
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-cream/60 text-sm mb-4">
        <ArrowLeft size={16} /> Отмена
      </button>

      <h2 className="font-display text-lg mb-4 text-cream/90">Новый курс</h2>

      <div className="space-y-2 mb-6">
        <input
          value={draft.title}
          onChange={set('title')}
          placeholder="Название курса"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.source}
          onChange={set('source')}
          placeholder="Источник / автор (необязательно)"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.duration_estimate_min}
          onChange={set('duration_estimate_min')}
          type="number"
          placeholder="Время прохождения, минут (необязательно)"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
      </div>

      <button
        onClick={submit}
        disabled={!draft.title.trim() || saving}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 transition-transform active:scale-95"
      >
        {saving ? 'Сохраняю...' : 'Добавить курс'}
      </button>
    </div>
  )
}

function CourseDetail({ course, onBack, onDelete, onToggleStatus }) {
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const duration = formatDuration(course.duration_estimate_min)

  useEffect(() => {
    api.courses.notes(course.id).then(setNotes).catch(console.error)
  }, [course.id])

  async function addNote() {
    if (!noteText.trim()) return
    const note = await api.courses.addNote(course.id, noteText.trim())
    setNotes((prev) => [note, ...prev])
    setNoteText('')
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-cream/60 text-sm">
          <ArrowLeft size={16} /> Назад
        </button>
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(course.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-900/60 text-cream/90"
            >
              Удалить
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-cream/20 text-cream/50"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-cream/40 p-1.5" aria-label="Удалить курс">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-5">
        <div className="h-36 bg-emerald-light/20 flex items-center justify-center">
          {course.cover_url ? (
            <img src={course.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={32} className="text-gold/60" strokeWidth={1.5} />
          )}
        </div>
        <div className="p-5">
          <h2 className="font-display text-xl text-cream mb-1">{course.title}</h2>
          {course.source && <p className="text-xs text-cream/40 mb-3">{course.source}</p>}
          <div className="flex items-center gap-3 text-xs text-cream/50 mb-4">
            {duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {duration}
              </span>
            )}
          </div>
          <button
            onClick={() => onToggleStatus(course)}
            className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              course.status === 'completed'
                ? 'bg-emerald-light/30 text-cream/70'
                : 'bg-gold text-emerald-deep'
            }`}
          >
            <Check size={14} />
            {course.status === 'completed' ? 'Пройден' : 'Отметить пройденным'}
          </button>
        </div>
      </div>

      <h3 className="text-sm text-cream/80 mb-2">Заметки</h3>
      <div className="flex gap-2 mb-4">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Что вынес из курса..."
          className="flex-1 bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={addNote}
          className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shrink-0"
        >
          <Plus size={18} className="text-emerald-deep" />
        </button>
      </div>

      {notes.length > 0 ? (
        <div className="rounded-2xl bg-emerald-light/20 border border-cream/10 divide-y divide-cream/10">
          {notes.map((n) => (
            <div key={n.id} className="px-4 py-3 text-sm text-cream/80">
              {n.text}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-cream/30 italic">Пока нет заметок по этому курсу</p>
      )}
    </div>
  )
}

export default function Courses({ user }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const list = await api.courses.list(user.id)
      setCourses(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function createCourse(draft) {
    try {
      const course = await api.courses.create(user.id, draft)
      setCourses((prev) => [course, ...prev])
      setShowCreate(false)
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteCourse(courseId) {
    try {
      await api.courses.remove(courseId)
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
      setSelected(null)
    } catch (e) {
      console.error(e)
    }
  }

  async function toggleStatus(course) {
    const newStatus = course.status === 'completed' ? 'in_progress' : 'completed'
    try {
      const updated = await api.courses.updateStatus(course.id, newStatus)
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)))
      setSelected(updated)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>

  if (showCreate) {
    return <CourseCreateScreen onCreate={createCourse} onCancel={() => setShowCreate(false)} />
  }

  if (selected) {
    return (
      <CourseDetail
        course={selected}
        onBack={() => setSelected(null)}
        onDelete={deleteCourse}
        onToggleStatus={toggleStatus}
      />
    )
  }

  const filtered = courses.filter((c) => filter === 'all' || c.status === filter)

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-cream/90">Курсы</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="w-8 h-8 rounded-full bg-gold flex items-center justify-center"
        >
          <Plus size={16} className="text-emerald-deep" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              filter === f.key ? 'bg-gold text-emerald-deep' : 'bg-emerald-light/20 text-cream/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-cream/30 text-sm text-center py-10">
          {courses.length === 0 ? 'Пока нет ни одного курса — добавь первый' : 'Ничего не найдено'}
        </p>
      ) : (
        filtered.map((c) => <CourseCard key={c.id} course={c} onOpen={setSelected} />)
      )}
    </div>
  )
}