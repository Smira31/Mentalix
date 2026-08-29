import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import ThemeScreen from './ThemeScreen'
import { MotifArt } from '../components/Motif'
import EmptyState from '../components/EmptyState'
import { BookOpen, ArrowLeft, Clock, Trash2, Plus, Check } from 'lucide-react'
import { isLinkedWebWriteBlocked } from '../lib/webAuthLimits'

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
          <BookOpen size={28} className="text-gold" strokeWidth={1.5} />
        )}
        <span
          className={`absolute top-3 right-3 text-[10px] font-medium px-2.5 py-1 rounded-full ${
            course.status === 'completed' ? 'bg-gold text-emerald-deep' : 'bg-black/40 text-cream'
          }`}
        >
          {course.status === 'completed' ? 'Пройден' : 'В процессе'}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display mx-type-list-title text-cream leading-snug mb-1">
          {course.title}
        </h3>
        {course.source && <p className="text-xs text-muted mb-2">{course.source}</p>}
        <div className="flex items-center gap-3 text-xs text-muted">
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
  const [error, setError] = useState(null)

  function set(field) {
    return e => setDraft(d => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    setError(null)
    const result = await onCreate({
      title: draft.title,
      source: draft.source || null,
      cover_url: draft.cover_url || null,
      duration_estimate_min: draft.duration_estimate_min
        ? Number(draft.duration_estimate_min)
        : null,
    })
    if (result?.error === 'linked_web_blocked') {
      setError(
        'Открой Mentalix в Telegram, чтобы добавить материал — привязанному аккаунту это пока доступно только там.'
      )
    } else if (!result) {
      setError('Не получилось добавить материал. Проверь соединение и попробуй ещё раз.')
    }
    setSaving(false)
  }

  return (
    <div className="w-full max-w-md px-5">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-muted text-[13px] mb-4">
        <ArrowLeft size={16} /> Отмена
      </button>

      <h2 className="font-display mx-type-card mb-4 text-cream">Новый материал</h2>

      <div className="space-y-2 mb-6">
        <input
          value={draft.title}
          onChange={set('title')}
          placeholder="Название"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.source}
          onChange={set('source')}
          placeholder="Источник / автор (необязательно)"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors"
        />
        <input
          value={draft.duration_estimate_min}
          onChange={set('duration_estimate_min')}
          type="number"
          placeholder="Время прохождения, минут (необязательно)"
          className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors"
        />
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-red-300 leading-relaxed mb-3">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!draft.title.trim() || saving}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep mx-type-flow-action disabled:opacity-40 transition-transform active:scale-95"
      >
        {saving ? 'Сохраняю...' : 'Добавить в библиотеку'}
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
    setNotes(prev => [note, ...prev])
    setNoteText('')
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
              onClick={() => onDelete(course.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-900/60 text-cream"
            >
              Удалить
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-cream/20 text-muted"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-muted p-1.5"
            aria-label="Удалить материал"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="rounded-[28px] overflow-hidden bg-emerald-deep border border-cream/10 mb-5">
        <div className="h-36 bg-emerald-light/20 flex items-center justify-center">
          {course.cover_url ? (
            <img src={course.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={32} className="text-gold" strokeWidth={1.5} />
          )}
        </div>
        <div className="p-5">
          <h2 className="font-display mx-type-section text-cream mb-1">{course.title}</h2>
          {course.source && <p className="text-xs text-muted mb-3">{course.source}</p>}
          <div className="flex items-center gap-3 text-xs text-muted mb-4">
            {duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {duration}
              </span>
            )}
          </div>
          <button
            onClick={() => onToggleStatus(course)}
            className={`w-full py-2.5 rounded-xl mx-type-flow-action flex items-center justify-center gap-2 transition-colors ${
              course.status === 'completed'
                ? 'bg-emerald-light/30 text-muted'
                : 'bg-gold text-emerald-deep'
            }`}
          >
            <Check size={14} />
            {course.status === 'completed' ? 'Пройден' : 'Отметить пройденным'}
          </button>
        </div>
      </div>

      <h3 className="text-[13px] text-cream mb-2">Заметки</h3>
      <div className="flex gap-2 mb-4">
        <input
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Что вынес из материала..."
          className="flex-1 bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-2.5 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors"
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
          {notes.map(n => (
            <div key={n.id} className="px-4 py-3 text-[13px] text-cream">
              {n.text}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-faint italic">Пока нет заметок по этому материалу</p>
      )}
    </div>
  )
}

export default function Courses({ user }) {
  const [themes, setThemes] = useState([])
  const [openTheme, setOpenTheme] = useState(null)

  useEffect(() => {
    if (!user || openTheme) return
    api.themes
      .list(user.id)
      .then(setThemes)
      .catch(() => {})
  }, [user, openTheme])

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return

    let active = true

    ;(async () => {
      try {
        const list = await api.courses.list(user.id)
        if (active) setCourses(list)
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

  async function createCourse(draft) {
    try {
      const course = await api.courses.create(user.id, draft)
      setCourses(prev => [course, ...prev])
      setShowCreate(false)
      return course
    } catch (e) {
      console.error(e)
      if (isLinkedWebWriteBlocked(user, e)) return { error: 'linked_web_blocked' }
      return null
    }
  }

  async function deleteCourse(courseId) {
    try {
      await api.courses.remove(courseId)
      setCourses(prev => prev.filter(c => c.id !== courseId))
      setSelected(null)
    } catch (e) {
      console.error(e)
    }
  }

  async function toggleStatus(course) {
    const newStatus = course.status === 'completed' ? 'in_progress' : 'completed'
    try {
      const updated = await api.courses.updateStatus(course.id, newStatus)
      setCourses(prev => prev.map(c => (c.id === course.id ? updated : c)))
      setSelected(updated)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <p className="text-muted text-[13px] px-6">Загрузка...</p>

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

  const filtered = courses.filter(c => filter === 'all' || c.status === filter)

  if (openTheme) {
    return <ThemeScreen user={user} themeId={openTheme} onBack={() => setOpenTheme(null)} />
  }

  return (
    <div className="w-full max-w-md px-5">
      {/* ── витрина тем недели ── */}
      {themes.length > 0 && (
        <div className="mb-7">
          <h2 className="font-display mx-type-card text-cream mb-3">Темы недели</h2>
          <div className="mx-stagger space-y-2.5">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setOpenTheme(t.id)}
                className="w-full rounded-3xl bg-emerald px-5 py-4 text-left border-0 active:scale-[0.98] transition-transform"
              >
                <span className="block font-display mx-type-card text-cream lowercase leading-tight">
                  {t.title}
                </span>
                <span className="block text-[12px] text-muted mt-1 leading-snug">{t.subtitle}</span>
                <span className="flex items-center gap-1.5 mt-3">
                  {Array.from({ length: t.total_days }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i < t.reflected_days ? 'bg-gold' : 'bg-cream/12'}`}
                    />
                  ))}
                </span>
                <span className="block text-[11px] text-faint font-semibold mt-2">
                  {t.reflected_days > 0
                    ? `${t.reflected_days} из ${t.total_days} дней`
                    : `${t.free_days} дня бесплатно · ${t.total_days} дней всего`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display mx-type-card text-cream">Мои материалы</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="w-8 h-8 rounded-full bg-gold flex items-center justify-center"
        >
          <Plus size={16} className="text-emerald-deep" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              filter === f.key ? 'bg-gold text-emerald-deep' : 'bg-emerald-light/20 text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          {courses.length === 0 ? (
            <EmptyState glyph={<MotifArt name="set" size={120} className="mx-auto mb-3" />}>
              <p className="text-muted text-[13px]">Библиотека пуста — добавь первый материал</p>
            </EmptyState>
          ) : (
            <p className="text-faint text-[13px] py-6">Ничего не найдено</p>
          )}
        </div>
      ) : (
        filtered.map(c => <CourseCard key={c.id} course={c} onOpen={setSelected} />)
      )}
    </div>
  )
}
