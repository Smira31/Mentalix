import { useEffect, useState } from 'react'
import { ChevronDown, Plus, Search, X } from 'lucide-react'

import MarkdownText from '../components/MarkdownText'
import { api } from '../lib/api'

const MOODS = [
  ['', 'Любое настроение'],
  ['1', 'Тяжко'],
  ['2', 'Так себе'],
  ['3', 'Нормально'],
  ['4', 'Хорошо'],
  ['5', 'Отлично'],
]

export default function JourneySearch({ user }) {
  const [query, setQuery] = useState('')
  const [tags, setTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [mood, setMood] = useState('')
  const [emotion, setEmotion] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sort, setSort] = useState('newest')
  const [result, setResult] = useState(null)
  const [tagName, setTagName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadEntries({ cursor, append = false } = {}) {
    setLoading(true)
    setError('')
    try {
      const response = await api.journey.entries(user.id, {
        q: query || undefined,
        tag_id: selectedTagIds,
        mood: mood || undefined,
        emotion: emotion || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        sort,
        cursor,
      })
      setResult(previous => append ? {
        ...response,
        items: [...(previous?.items || []), ...response.items],
      } : response)
    } catch {
      if (!append) setResult({ items: [], hasNext: false, nextCursor: null })
      setError('Не удалось найти записи. Попробуй ещё раз, когда появится связь.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const timeoutId = window.setTimeout(async () => {
      try {
        const nextTags = await api.journey.tags(user.id)
        if (active) setTags(nextTags)
      } catch {
        if (active) setError('Не удалось загрузить теги. Записи не были изменены.')
      }
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [user.id])

  useEffect(() => {
    let active = true
    const timeoutId = window.setTimeout(async () => {
      if (active) {
        setLoading(true)
        setError('')
      }
      try {
        const response = await api.journey.entries(user.id, {
          q: query || undefined,
          tag_id: selectedTagIds,
          mood: mood || undefined,
          sort,
        })
        if (active) setResult(response)
      } catch {
        if (active) {
          setResult({ items: [], hasNext: false, nextCursor: null })
          setError('Не удалось найти записи. Попробуй ещё раз, когда появится связь.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [query, selectedTagIds, mood, emotion, fromDate, toDate, sort, user.id])

  async function createTag() {
    if (!tagName.trim()) return
    setError('')
    try {
      const tag = await api.journey.createTag(user.id, { name: tagName.trim(), color: 'gold', icon: 'bookmark' })
      setTags(current => [...current, tag].sort((left, right) => left.name.localeCompare(right.name, 'ru')))
      setTagName('')
    } catch {
      setError('Не удалось создать тег. Такое имя уже может существовать.')
    }
  }

  async function deleteTag(tag) {
    setError('')
    try {
      await api.journey.removeTag(tag.id, user.id)
      setTags(current => current.filter(item => item.id !== tag.id))
      setSelectedTagIds(current => current.filter(id => id !== tag.id))
    } catch {
      setError('Не удалось удалить тег. Записи не были изменены.')
    }
  }

  function toggleTag(tagId) {
    setSelectedTagIds(current => current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId])
  }

  return (
    <section className="mt-1 animate-fade-in" aria-label="Поиск по истории">
      <div className="rounded-3xl bg-emerald p-4">
        <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-emerald-light px-3 text-muted">
          <Search size={17} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по записям" aria-label="Поиск по тексту и эмоциям" className="min-w-0 flex-1 bg-transparent text-[16px] text-cream outline-none placeholder:text-muted" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[12px] text-muted">
            Настроение
            <select value={mood} onChange={event => setMood(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl bg-emerald-light px-2 text-[14px] text-cream">
              {MOODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-[12px] text-muted">
            Порядок
            <select value={sort} onChange={event => setSort(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl bg-emerald-light px-2 text-[14px] text-cream">
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-[12px] text-muted">Эмоция<input value={emotion} onChange={event => setEmotion(event.target.value)} maxLength={60} placeholder="Например, спокойно" className="mt-1 min-h-10 w-full rounded-xl bg-emerald-light px-2 text-[14px] text-cream outline-none placeholder:text-faint" /></label>
          <div className="grid grid-cols-2 gap-1"><label className="text-[11px] text-muted">С<input type="date" value={fromDate} max={toDate || undefined} onChange={event => setFromDate(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl bg-emerald-light px-1 text-[12px] text-cream" /></label><label className="text-[11px] text-muted">По<input type="date" value={toDate} min={fromDate || undefined} onChange={event => setToDate(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl bg-emerald-light px-1 text-[12px] text-cream" /></label></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Фильтр по тегам">
          {tags.map(tag => {
            const selected = selectedTagIds.includes(tag.id)
            return (
              <span key={tag.id} className={['inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-[12px] font-semibold', selected ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted'].join(' ')}>
                <button type="button" onClick={() => toggleTag(tag.id)} aria-pressed={selected}>{tag.name}</button>
                <button type="button" onClick={() => deleteTag(tag)} aria-label={`Удалить тег ${tag.name}`} className="ml-1 opacity-70 active:opacity-100"><X size={13} /></button>
              </span>
            )
          })}
          <label className="inline-flex min-h-9 items-center gap-1 rounded-full bg-cream/5 px-3 text-[12px] text-muted">
            <Plus size={13} />
            <input value={tagName} onChange={event => setTagName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); createTag() } }} placeholder="Новый тег" aria-label="Новый личный тег" className="w-20 bg-transparent text-[13px] text-cream outline-none placeholder:text-faint" />
          </label>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-[13px] text-muted">{error}</p>}
      {loading && result === null ? (
        <p className="mt-6 text-[14px] text-muted">Ищем в твоих записях…</p>
      ) : result?.items.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-emerald p-5">
          <p className="text-[15px] font-semibold text-cream">Ничего не найдено</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">Измени запрос или фильтры. Поиск работает только по твоим сохранённым записям.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {result?.items.map(entry => (
            <article key={entry.id} className="rounded-3xl bg-emerald p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-bold text-gold">{entry.date}</span>
                <span className="rounded-full bg-cream/5 px-2.5 py-1 text-[11px] text-muted">настроение {entry.mood}/5</span>
                {entry.emotion && <span className="rounded-full bg-cream/5 px-2.5 py-1 text-[11px] text-muted">{entry.emotion}</span>}
              </div>
              {entry.note && <MarkdownText content={entry.note} className="mt-3 space-y-2 text-[14px] leading-relaxed text-cream" />}
              {entry.lessons && <MarkdownText content={entry.lessons} className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted" />}
              {entry.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{entry.tags.map(tag => <span key={tag.id} className="rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold">{tag.name}</span>)}</div>}
            </article>
          ))}
          {result?.hasNext && <button type="button" disabled={loading} onClick={() => loadEntries({ cursor: result.nextCursor, append: true })} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald text-[14px] font-semibold text-cream disabled:opacity-40">Показать ещё <ChevronDown size={17} /></button>}
        </div>
      )}
    </section>
  )
}
