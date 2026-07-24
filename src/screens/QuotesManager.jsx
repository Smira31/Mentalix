import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'

export default function QuotesManager({ user, onBack }) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const list = await api.quotes.list(user.id)
      setQuotes(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function addQuote() {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      const quote = await api.quotes.create(user.id, text.trim())
      setQuotes((prev) => [quote, ...prev])
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
      setQuotes((prev) => prev.filter((q) => q.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-cream active:opacity-60">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl text-cream">Мои фразы</h1>
      </div>

      <p className="w-full text-sm text-sage/70 mb-4 leading-relaxed">
        Эти фразы будут появляться в карточке «Считка дня» на главном экране — одна фраза в день, по кругу.
      </p>

      <div className="w-full flex gap-2 mb-6">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Добавь свою фразу..."
          className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-cream placeholder-sage/40 outline-none focus:border-gold transition-colors"
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
        <p className="text-sage/50 text-sm">Загрузка...</p>
      ) : quotes.length === 0 ? (
        <p className="text-sage/40 text-sm italic text-center py-8">
          Пока нет ни одной фразы — добавь первую
        </p>
      ) : (
        <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06]">
          {quotes.map((q) => (
            <div key={q.id} className="flex items-center gap-3 px-4 py-3">
              <p className="flex-1 text-sm text-cream/90 leading-snug">{q.text}</p>
              <button
                onClick={() => removeQuote(q.id)}
                className="text-cream/30 shrink-0 active:text-red-400 transition-colors"
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