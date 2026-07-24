import { useState } from 'react'
import { api } from '../lib/api'
import { webAdapter } from '../platform/web.adapter'

export default function WebAuthScreen({ onAuthed }) {
  const [step, setStep] = useState('email') // email | code | link
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [webUser, setWebUser] = useState(null)
  const [linkCode, setLinkCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function finishWith(user) {
    webAdapter.setUser(user)
    onAuthed(user)
  }

  async function requestCode() {
    if (!email.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.auth.requestCode(email.trim())
      // ВАЖНО: dev_code приходит только пока не подключён реальный email-сервис
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
      const user = {
        id: res.user.app_user_id,
        web_user_id: res.user.web_user_id,
        first_name: res.user.first_name,
        email: res.user.email,
        linked: res.user.linked,
      }
      if (user.linked) {
        finishWith(user)
      } else {
        setWebUser(user)
        setStep('link')
      }
    } catch (e) {
      setError('Не получилось войти, попробуй ещё раз')
    } finally {
      setLoading(false)
    }
  }

  async function confirmLink() {
    if (!linkCode.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.auth.confirmLink(webUser.web_user_id, linkCode.trim())
      if (!res.ok) {
        setError('Неверный или истёкший код связки')
        return
      }
      finishWith({
        id: res.user.app_user_id,
        web_user_id: res.user.web_user_id,
        first_name: res.user.first_name,
        email: res.user.email,
        linked: res.user.linked,
      })
    } catch (e) {
      setError('Не получилось связать аккаунты, попробуй ещё раз')
    } finally {
      setLoading(false)
    }
  }

  function skipLink() {
    finishWith(webUser)
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-16">
      <div className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-6">
        <span className="font-display text-xl text-gold">M</span>
      </div>
      <h1 className="font-display text-2xl text-cream mb-2 text-center">Вход в Mentalix</h1>

      {step === 'email' && (
        <>
          <p className="text-sm text-sage/60 mb-8 text-center">Введи email — пришлём одноразовый код</p>
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
      )}

      {step === 'code' && (
        <>
          <p className="text-sm text-sage/60 mb-4 text-center">Код отправлен на {email}</p>
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
          <button onClick={() => setStep('email')} className="text-xs text-sage/50 active:opacity-60">
            Изменить email
          </button>
        </>
      )}

      {step === 'link' && (
        <>
          <p className="text-sm text-sage/60 mb-2 text-center">
            Уже пользуешься Mentalix в Telegram?
          </p>
          <p className="text-xs text-sage/40 mb-6 text-center leading-relaxed">
            Открой мини-апп в Telegram → Настройки → «Связать с сайтом», введи код здесь — и все твои данные подтянутся сюда же.
          </p>
          <input
            value={linkCode}
            onChange={(e) => setLinkCode(e.target.value)}
            placeholder="Код из Telegram"
            inputMode="numeric"
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-center text-lg tracking-widest text-cream placeholder-sage/30 outline-none focus:border-gold transition-colors mb-4"
          />
          <button
            onClick={confirmLink}
            disabled={!linkCode.trim() || loading}
            className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform mb-3"
          >
            {loading ? 'Связываю...' : 'Связать аккаунты'}
          </button>
          <button onClick={skipLink} className="text-xs text-sage/50 active:opacity-60">
            Пропустить — начать с чистого аккаунта
          </button>
        </>
      )}

      {error && <p className="text-xs text-red-400 mt-4 text-center">{error}</p>}
    </div>
  )
}