import { useState } from 'react'
import { Heart, Check } from 'lucide-react'
import { api } from '../lib/api'
import BackButton from '../components/BackButton'

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
        <h2 className="font-display text-[18px] text-cream mb-2">Спасибо!</h2>
        <p className="text-[13px] text-muted mb-8">
          Твоя поддержка помогает Mentalix развиваться дальше.
        </p>
        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-[13px] font-medium active:scale-95 transition-transform"
        >
          Готово
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-6">
        <div className="justify-self-start">
          <BackButton onClick={onBack} />
        </div>
        <h1 className="font-display text-[18px] text-cream">Поддержать проект</h1>
        <span aria-hidden="true" />
      </div>

      <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mb-4">
        <Heart size={26} className="text-mint" />
      </div>

      <p className="text-[13px] text-muted text-center mb-8 px-4">
        Донат не связан с тарифами — просто способ поддержать развитие Mentalix.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full mb-8">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => setSelected(a)}
            className={`py-4 rounded-2xl text-[16px] font-display transition-colors ${
              selected === a ? 'bg-gold text-emerald-deep' : 'bg-cream/[0.05] text-muted'
            }`}
          >
            {a} ₽
          </button>
        ))}
      </div>

      <button
        onClick={send}
        disabled={sending}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-[13px] font-medium disabled:opacity-40 active:scale-95 transition-transform"
      >
        {sending ? 'Отправляю...' : `Поддержать на ${selected} ₽`}
      </button>

      <p className="text-[11px] text-muted text-center mt-4 px-4">
        Оплата через Telegram Payments подключится в следующем обновлении — сейчас донат фиксируется без реального списания средств.
      </p>
    </div>
  )
}
