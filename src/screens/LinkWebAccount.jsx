import { useState } from 'react'
import { ChevronLeft, Globe } from 'lucide-react'
import { api } from '../lib/api'

export default function LinkWebAccount({ user, onBack }) {
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.auth.generateLinkCode(user.id)
      setCode(res.code)
    } catch (e) {
      setError('Не получилось создать код, попробуй ещё раз')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md px-4 pt-2 pb-28 flex flex-col items-center">
      <div className="w-full flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-cream active:opacity-60">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl text-cream">Связать с сайтом</h1>
      </div>

      <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mb-4">
        <Globe size={26} className="text-mint" />
      </div>

      <p className="text-sm text-sage/70 text-center mb-8 px-4 leading-relaxed">
        Открой mentalix.vercel.app в браузере, войди по email, и когда попросят код — введи тот, что появится здесь.
      </p>

      {code ? (
        <div className="w-full text-center mb-6">
          <div className="font-display text-4xl text-gold tracking-widest mb-2">{code}</div>
          <p className="text-xs text-sage/50">Код активен 10 минут</p>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? 'Создаю...' : 'Получить код'}
        </button>
      )}

      {error && <p className="text-xs text-red-400 mt-4 text-center">{error}</p>}
    </div>
  )
}