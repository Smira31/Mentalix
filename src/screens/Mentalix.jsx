import { useEffect, useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { Send, ArrowLeft, MessageCircle, Mountain, Footprints } from 'lucide-react'

const PERSONAS = [
  {
    key: 'mayak',
    name: 'Собеседник',
    tagline: 'выслушает без оценки',
    desc: 'Тёплый и внимательный. Поможет разобраться в чувствах, когда непросто.',
    Icon: MessageCircle,
    accent: 'text-gold',
    ring: 'border-cream/15',
    glow: 'bg-gold/10',
    starters: ['Сегодня было тяжело', 'Не могу выключить голову'],
  },
  {
    key: 'kompas',
    name: 'Наставник',
    tagline: 'вернёт к действию',
    desc: 'Строгий и честный. Разложит цель на шаги и не даст себя жалеть.',
    Icon: Mountain,
    accent: 'text-gold',
    ring: 'border-cream/15',
    glow: 'bg-gold/10',
    starters: ['Разложи цель на шаги', 'Я топчусь на месте'],
  },
  {
    key: 'dnevnik',
    name: 'Следопыт',
    tagline: 'видит твои паттерны',
    desc: 'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
    Icon: Footprints,
    accent: 'text-gold',
    ring: 'border-cream/15',
    glow: 'bg-gold/10',
    starters: ['Подведи итоги дня', 'Что я упускаю?'],
  },
]

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

function trim(text, max = 90) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max).trimEnd() + '…' : clean
}

// ── Выбор собеседника ──
// Карточка занимает всю ширину и показывает состояние разговора:
// либо последнюю реплику, либо две подсказки, с чего начать.
function PersonaPicker({ user, onPick }) {
  const [previews, setPreviews] = useState({})

  useEffect(() => {
    if (!user) return
    let alive = true

    Promise.all(
      PERSONAS.map((p) =>
        api.mentalix
          .history(user.id, p.key)
          .then((msgs) => [p.key, Array.isArray(msgs) ? msgs[msgs.length - 1] : null])
          .catch(() => [p.key, null])
      )
    ).then((pairs) => {
      if (!alive) return
      const next = {}
      pairs.forEach(([key, last]) => {
        if (last?.content) next[key] = last
      })
      setPreviews(next)
    })

    return () => { alive = false }
  }, [user])

  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <h2 className="font-display text-lg mb-1 text-cream/90">С кем поговорим</h2>
      <p className="text-[11px] text-cream/40 mb-5">три собеседника, три разговора</p>

      <div className="space-y-3">
        {PERSONAS.map((p) => {
          const Icon = p.Icon
          const last = previews[p.key]

          return (
            <div
              key={p.key}
              className={`rounded-[24px] border ${p.ring} bg-emerald-light/15 overflow-hidden`}
            >
              <button
                onClick={() => { haptic('light'); onPick(p.key, '') }}
                className="w-full text-left p-4 flex items-start gap-4 transition-transform active:scale-[0.99] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              >
                <div className={`w-12 h-12 rounded-2xl ${p.glow} flex items-center justify-center shrink-0`}>
                  <Icon size={24} className={p.accent} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-display text-lg text-cream">{p.name}</span>
                    <span className={`text-[11px] ${p.accent}`}>{p.tagline}</span>
                  </div>
                  <p className="text-xs text-cream/50 leading-snug mt-1">{p.desc}</p>
                </div>
              </button>

              <div className="px-4 pb-4 pt-0">
                {last ? (
                  <button
                    onClick={() => { haptic('light'); onPick(p.key, '') }}
                    className="w-full text-left rounded-2xl bg-emerald-light/25 border border-cream/10 px-3.5 py-3 transition-transform active:scale-[0.99] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
                  >
                    <div className={`text-[10px] uppercase tracking-wide ${p.accent} mb-1`}>
                      Продолжить разговор
                    </div>
                    <p className="text-xs text-cream/55 leading-snug">
                      {last.role === 'user' ? 'Ты: ' : ''}{trim(last.content)}
                    </p>
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {p.starters.map((s) => (
                      <button
                        key={s}
                        onClick={() => { haptic('light'); onPick(p.key, s) }}
                        className="rounded-full border border-cream/15 bg-emerald-light/25 px-3.5 py-2 text-xs text-cream/70 transition-transform active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-cream/30 leading-snug mt-5 px-1">
        У каждого своя история — разговоры не смешиваются.
      </p>
    </div>
  )
}

function Chat({ user, persona, initialText = '', onBack }) {
  const meta = PERSONAS.find((p) => p.key === persona)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialText)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (!user) return
    api.mentalix.history(user.id, persona)
      .then(setMessages)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user, persona])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    haptic('light')
    try {
      const reply = await api.mentalix.send(user.id, text, persona)
      setMessages((prev) => [...prev, reply])
    } catch (e) {
      console.error(e)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Не удалось получить ответ, попробуй ещё раз.' }])
    } finally {
      setSending(false)
    }
  }

  const Icon = meta.Icon

  return (
    <div className="w-full max-w-sm px-4 pb-24 flex flex-col h-[calc(100vh-180px)] animate-fade-in">
      <div className="flex items-center gap-3 px-2 pb-3 mb-2 border-b border-cream/10">
        <button onClick={() => { haptic('light'); onBack() }} className="text-cream/60 shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className={`w-9 h-9 rounded-xl ${meta.glow} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={meta.accent} strokeWidth={1.75} />
        </div>
        <div>
          <div className="font-display text-base text-cream leading-tight">{meta.name}</div>
          <div className={`text-[10px] ${meta.accent}`}>{meta.tagline}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-3">
        {loading && <p className="text-cream/40 text-sm text-center pt-4">Загрузка...</p>}

        {!loading && messages.length === 0 && (
          <p className="text-cream/40 text-sm text-center pt-8 leading-relaxed">
            {meta.desc}<br /><br />Напиши первым — {meta.name} ответит.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto bg-cognac text-cream'
                : 'mr-auto bg-emerald-light/40 text-cream/90'
            }`}
          >
            {m.content}
          </div>
        ))}

        {sending && (
          <div className="mr-auto bg-emerald-light/40 text-cream/50 rounded-2xl px-4 py-2.5 text-sm">
            {meta.name} печатает…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 px-2 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder={`Написать ${meta.name}…`}
          className="flex-1 bg-emerald-light/25 border border-cream/15 rounded-full px-4 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="w-10 h-10 rounded-full bg-gold text-emerald-deep flex items-center justify-center shrink-0 disabled:opacity-40 transition-transform active:scale-90"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

export default function MentalixChat({ user }) {
  const [persona, setPersona] = useState(null)
  const [draft, setDraft] = useState('')

  if (!persona) {
    return (
      <PersonaPicker
        user={user}
        onPick={(key, text) => { setDraft(text || ''); setPersona(key) }}
      />
    )
  }

  return (
    <Chat
      user={user}
      persona={persona}
      initialText={draft}
      onBack={() => { setDraft(''); setPersona(null) }}
    />
  )
}