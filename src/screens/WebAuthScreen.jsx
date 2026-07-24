import { useState } from 'react'
import { api } from '../lib/api'
import { webAdapter } from '../platform/web.adapter'

export default function WebAuthScreen({ onAuthed }) {
  const [step, setStep] = useState('email') // email | code
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function requestCode() {
    if (!email.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.auth.requestCode(email.trim())
      // ВАЖНО: dev_code приходит только пока не подключён реальный email-сервис —
      // после подключения SMTP это поле нужно убрать из ответа бэкенда
      setDevCode(res.dev_code)
      setStep('code')
    } catch (e) {
      setError('Не получилось отправить код, попробуй ещё раз')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    if (!code.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.auth.verify(email.trim(), code.trim())
      if (!res.ok) {
        setError('Неверный или истёкший код')
        return
      }
      webAdapter.setUser(res.user)
      onAuthed(res.user)
    } catch (e) {
      setError('Не получилось войти, попробуй ещё раз')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-16">
      <div className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-6">
        <span className="font-display text-xl text-gold">M</span>
      </div>
      <h1 className="font-display text-2xl text-cream mb-2 text-center">Вход в Mentalix</h1>
      <p className="text-sm text-sage/60 mb-8 text-center">
        {step === 'email'
          ? 'Введи email — пришлём одноразовый код'
          : `Код отправлен на ${email}`}
      </p>

      {step === 'email' ? (
        <>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            autoFocus
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-cream placeholder-sage/40 outline-none focus:border-gold transition-colors mb-4"
          />
          <button
            onClick={requestCode}
            disabled={!email.trim() || loading}
            className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
          >
            {loading ? 'Отправляю...' : 'Получить код'}
          </button>
        </>
      ) : (
        <>
          {devCode && (
            <p className="text-xs text-mint/70 mb-3 text-center">
              Тестовый режим — код: <span className="font-mono text-mint">{devCode}</span>
            </p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            autoFocus
            inputMode="numeric"
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-center text-lg tracking-widest text-cream placeholder-sage/30 outline-none focus:border-gold transition-colors mb-4"
          />
          <button
            onClick={verifyCode}
            disabled={!code.trim() || loading}
            className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform mb-3"
          >
            {loading ? 'Проверяю...' : 'Войти'}
          </button>
          <button
            onClick={() => setStep('email')}
            className="text-xs text-sage/50 active:opacity-60"
          >
            Изменить email
          </button>
        </>
      )}

      {error && <p className="text-xs text-red-400 mt-4 text-center">{error}</p>}
    </div>
  )
}