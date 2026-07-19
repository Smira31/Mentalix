import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

export default function Mentalix({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user) return
    api.mentalix.history(user.id)
      .then(setMessages)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    haptic('light')
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content }])
    setSending(true)
    try {
      const reply = await api.mentalix.send(user.id, content)
      setMessages((prev) => [...prev, reply])
    } catch (e) {
      console.error(e)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Не удалось получить ответ, попробуй ещё раз.' }])
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>

  return (
    <div className="w-full max-w-sm px-6 pb-28 flex flex-col animate-fade-in">
      <h2 className="font-display text-lg mb-1 text-cream/90">Mentalix</h2>
      <p className="text-[11px] text-cream/40 mb-4">твой стратегический ассистент</p>

      <div className="space-y-2 mb-4">
        {messages.length === 0 && (
          <p className="text-cream/40 text-sm">
            Спроси что угодно о своём состоянии, привычках или целях — Mentalix видит твои данные и отвечает честно
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-2.5 text-sm max-w-[85%] ${
              m.role === 'user'
                ? 'bg-cognac text-cream ml-auto'
                : 'bg-emerald-light/25 border border-cream/10 text-cream/90'
            }`}
          >
            {m.content}
          </div>
        ))}

        {sending && (
          <div className="rounded-xl px-4 py-2.5 text-sm bg-emerald-light/25 border border-cream/10 text-cream/40 w-fit">
            печатает...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-6 max-w-sm mx-auto w-full flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Написать Mentalix..."
          className="flex-1 bg-emerald-light/30 border border-cream/15 rounded-xl px-3 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={send}
          disabled={sending}
          className="px-4 py-2.5 rounded-xl bg-cognac text-cream text-sm disabled:opacity-50 transition-transform active:scale-95"
        >
          →
        </button>
      </div>
    </div>
  )
}
