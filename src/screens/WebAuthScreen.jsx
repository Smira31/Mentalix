import { useEffect, useMemo, useState } from 'react'

import { api } from '../lib/api'
import { platform } from '../platform'

function TelegramLogin({ onSuccess, onError }) {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME

  useEffect(() => {
    if (!botUsername || typeof window === 'undefined') return undefined
    window.onTelegramAuth = async user => {
      try {
        const result = await api.auth.telegramLogin(user)
        platform.setUser(result.user)
        onSuccess(result.user)
      } catch (error) {
        onError(error)
      }
    }
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.dataset.telegramLogin = botUsername
    script.dataset.size = 'large'
    script.dataset.userpic = 'false'
    script.dataset.requestAccess = 'write'
    script.dataset.onauth = 'onTelegramAuth(user)'
    const host = document.getElementById('mentalix-telegram-login')
    host?.replaceChildren(script)
    return () => {
      delete window.onTelegramAuth
      host?.replaceChildren()
    }
  }, [botUsername, onError, onSuccess])

  if (!botUsername) {
    return (
      <p className="text-[12px] text-muted text-center">
        Telegram Login будет доступен после настройки bot username.
      </p>
    )
  }
  return <div id="mentalix-telegram-login" className="min-h-[44px] flex justify-center" />
}

export default function WebAuthScreen({ onAuthed }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const directWebVisit = !window.Telegram?.WebApp?.initData
  const emailValid = useMemo(() => /^(?=.{5,254}$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email])

  async function requestCode(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!emailValid) return setError('Укажи корректный email.')
    setBusy(true)
    try {
      await api.auth.requestEmailCode(email.trim().toLowerCase())
      setStep('code')
      setNotice('Код отправлен на почту. Он действует 10 минут.')
    } catch {
      setError('Не удалось отправить код. Проверь email и попробуй ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api.auth.verifyEmailCode(email.trim().toLowerCase(), code.trim())
      if (!result.ok) throw new Error(result.error || 'invalid_code')
      platform.setUser(result.user)
      onAuthed(result.user)
    } catch {
      setError('Неверный или просроченный код. Запроси новый и попробуй ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  const handleTelegramError = () => setError('Не удалось войти через Telegram. Попробуй ещё раз.')
  const handleTelegramSuccess = user => onAuthed(user)

  return (
    <main
      className="w-full max-w-md px-5 flex flex-col items-center pt-16 pb-10"
      aria-labelledby="web-auth-title"
    >
      <div
        className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-6"
        aria-hidden="true"
      >
        <span className="font-display text-[18px] text-gold">M</span>
      </div>
      <h1 id="web-auth-title" className="font-display text-[26px] text-cream mb-2 text-center">
        Вход в Mentalix
      </h1>
      <p className="text-[13px] text-muted text-center leading-relaxed mb-6">
        {directWebVisit
          ? 'Открой Mentalix как приложение на iPhone и войди удобным способом.'
          : 'Подтверди вход, чтобы продолжить.'}
      </p>

      <section
        className="w-full rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-5 mb-4"
        aria-labelledby="email-auth-title"
      >
        <h2 id="email-auth-title" className="font-semibold text-cream text-center mb-4">
          Вход по email
        </h2>
        {step === 'email' ? (
          <form onSubmit={requestCode} className="flex flex-col gap-3">
            <input
              aria-label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-emerald-deep border border-cream/15 px-4 py-3 text-cream"
            />
            <button
              type="submit"
              disabled={busy || !emailValid}
              className="cta-pill min-h-[44px] disabled:opacity-50"
            >
              {busy ? 'Отправляю…' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-3">
            <input
              aria-label="Код из email"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={event => setCode(event.target.value)}
              placeholder="Код из письма"
              className="w-full rounded-xl bg-emerald-deep border border-cream/15 px-4 py-3 text-cream tracking-[0.2em] text-center"
            />
            <button
              type="submit"
              disabled={busy || code.trim().length < 4}
              className="cta-pill min-h-[44px] disabled:opacity-50"
            >
              {busy ? 'Проверяю…' : 'Войти'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-[12px] text-muted"
            >
              Изменить email
            </button>
          </form>
        )}
      </section>

      <section
        className="w-full rounded-2xl border border-cream/10 bg-cream/[0.04] px-4 py-5"
        aria-labelledby="telegram-auth-title"
      >
        <h2 id="telegram-auth-title" className="font-semibold text-cream text-center mb-4">
          Или через Telegram
        </h2>
        <TelegramLogin onSuccess={handleTelegramSuccess} onError={handleTelegramError} />
      </section>
      {notice && (
        <p role="status" className="mt-4 text-[12px] text-gold text-center">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-[12px] text-red-300 text-center">
          {error}
        </p>
      )}
    </main>
  )
}
