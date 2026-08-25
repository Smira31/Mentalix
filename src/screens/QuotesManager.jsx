import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Plus, Trash2 } from 'lucide-react'
import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'

export default function QuotesManager({ user, onBack }) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    let active = true

    ;(async () => {
      try {
        const list = await api.quotes.list(user.id)
        if (active) setQuotes(list)
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

  async function addQuote() {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      const quote = await api.quotes.create(user.id, text.trim())
      setQuotes(prev => [quote, ...prev])
      setText('')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function removeQuote(id) {
    try {
      await api.quotes.remove(id)
      setQuotes(prev => prev.filter(q => q.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-6">
        <div className="justify-self-start">
          <BackButton onClick={onBack} />
        </div>
        <h1 className="font-display text-xl text-cream">Мои фразы</h1>
        <span aria-hidden="true" />
      </div>

      <p className="w-full text-sm text-muted mb-4 leading-relaxed">
        Эти фразы будут появляться в карточке «Считка дня» на главном экране — одна фраза в день, по
        кругу.
      </p>

      <div className="w-full flex gap-2 mb-6">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Добавь свою фразу..."
          className="flex-1 bg-cream/[0.05] border border-cream/[0.1] rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={addQuote}
          disabled={!text.trim() || saving}
          className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center shrink-0 disabled:opacity-40"
        >
          <Plus size={20} className="text-emerald-deep" />
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Загрузка...</p>
      ) : quotes.length === 0 ? (
        <EmptyState className="mt-2">
          <h3 className="font-display text-lg text-cream mb-1">Пока нет твоих фраз</h3>
          <p className="text-sm text-muted leading-relaxed">
            Добавь первую в поле выше — она начнёт появляться в «Мысли дня».
          </p>
        </EmptyState>
      ) : (
        <div className="w-full bg-cream/[0.03] border border-cream/[0.08] rounded-2xl divide-y divide-cream/[0.06]">
          {quotes.map(q => (
            <div key={q.id} className="flex items-center gap-3 px-4 py-3">
              <p className="flex-1 text-sm text-cream leading-snug">{q.text}</p>
              <button
                onClick={() => removeQuote(q.id)}
                className="text-faint shrink-0 active:text-red-400 transition-colors"
                aria-label="Удалить фразу"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
