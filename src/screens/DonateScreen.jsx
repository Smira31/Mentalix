import { useState } from 'react'
import { ChevronLeft, Heart, Check } from 'lucide-react'
import { api } from '../lib/api'

const AMOUNTS = [100, 300, 500, 1000]

export default function DonateScreen({ user, onBack }) {
  const [selected, setSelected] = useState(AMOUNTS[1])
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function send() {
    if (sending) return
    setSending(true)
    try {
      // заглушка: реальная оплата подключится через Telegram Payments позже.
      // сейчас донат просто фиксируется в базе как намерение поддержки.
      await api.subscription.donate(user.id, selected)
      setDone(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-md px-6 pt-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
          <Check size={28} className="text-gold" />
        </div>
        <h2 className="font-display text-xl text-cream mb-2">Спасибо!</h2>
        <p className="text-sm text-sage/70 mb-8">
          Твоя поддержка помогает Mentalix развиваться дальше.
        </p>
        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium active:scale-95 transition-transform"
        >
          Готово
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-cream active:opacity-60">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl text-cream">Поддержать проект</h1>
      </div>

      <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mb-4">
        <Heart size={26} className="text-mint" />
      </div>

      <p className="text-sm text-sage/70 text-center mb-8 px-4">
        Донат не связан с тарифами — просто способ поддержать развитие Mentalix.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full mb-8">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => setSelected(a)}
            className={`py-4 rounded-2xl text-lg font-display transition-colors ${
              selected === a ? 'bg-gold text-emerald-deep' : 'bg-white/[0.05] text-cream/70'
            }`}
          >
            {a} ₽
          </button>
        ))}
      </div>

      <button
        onClick={send}
        disabled={sending}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
      >
        {sending ? 'Отправляю...' : `Поддержать на ${selected} ₽`}
      </button>

      <p className="text-xs text-sage/40 text-center mt-4 px-4">
        Оплата через Telegram Payments подключится в следующем обновлении — сейчас донат фиксируется без реального списания средств.
      </p>
    </div>
  )
}
