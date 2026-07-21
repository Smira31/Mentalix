import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { Send, Mic } from 'lucide-react'

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

function Monogram({ size = 'w-6 h-6', textSize = 'text-[10px]' }) {
  return (
    <div className={`flex items-center justify-center rounded-full border border-gold text-gold shrink-0 ${size}`}>
      <span className={`font-display ${textSize}`}>M</span>
    </div>
  )
}

export default function Mentalix({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

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

  function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      WebApp.showAlert?.('Голосовой ввод не поддерживается в этом браузере. Попробуйте открыть Mini App в Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ru-RU'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }

    recognitionRef.current = recognition
    haptic('light')
    recognition.start()
  }

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
    <div className="w-full max-w-sm px-6 pb-40 flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <Monogram size="w-9 h-9" textSize="text-sm" />
        <div>
          <h2 className="font-display text-lg text-cream/90 leading-tight">Mentalix</h2>
          <p className="text-[11px] text-cream/40">твой стратегический ассистент</p>
        </div>
      </div>

      <div className="space-y-2 mt-4 mb-4">
        {messages.length === 0 && (
          <div className="rounded-2xl bg-emerald-light/15 border border-gold/20 px-4 py-3">
            <p className="text-cream/70 text-sm">
              Спроси что угодно о своём состоянии, привычках или целях — Mentalix видит твои данные и отвечает честно
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role !== 'user' && <Monogram />}
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] ${
                m.role === 'user'
                  ? 'bg-cognac text-cream rounded-br-md'
                  : 'bg-emerald-light/25 border border-cream/10 text-cream/90 rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-end gap-2 justify-start">
            <Monogram />
            <div className="rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-emerald-light/25 border border-cream/10 text-cream/40 w-fit">
              печатает...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Поднято выше плавающей нижней навигации, чтобы поле было полностью видно */}
      <div className="fixed bottom-32 left-0 right-0 px-6 max-w-sm mx-auto w-full z-30">
        <div className="flex items-center gap-2 rounded-full bg-emerald-light/30 border border-cream/15 pl-4 pr-1.5 py-1.5 focus-within:border-gold transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={isListening ? 'Слушаю...' : 'Написать Mentalix...'}
            className="flex-1 bg-transparent text-sm text-cream placeholder-cream/30 outline-none"
          />
          <button
            onClick={toggleVoiceInput}
            className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${
              isListening ? 'bg-red-500/80 animate-pulse' : 'bg-emerald-light/50'
            }`}
          >
            <Mic size={15} className="text-cream" />
          </button>
          <button
            onClick={send}
            disabled={sending}
            className="w-9 h-9 shrink-0 rounded-full bg-gold flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
          >
            <Send size={15} className="text-emerald-deep" />
          </button>
        </div>
      </div>
    </div>
  )
}