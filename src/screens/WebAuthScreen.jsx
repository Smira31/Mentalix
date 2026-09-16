import { useEffect, useMemo, useState } from 'react'

import { api } from '../lib/api'
import { platform } from '../platform'
import './WebAuthScreen.css'

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
      <p className="mx-web-auth-telegram-note">
        Telegram Login будет доступен после настройки bot username.
      </p>
    )
  }
  return <div id="mentalix-telegram-login" className="mx-web-auth-telegram" />
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

  return (
    <main className="mx-web-auth-page" aria-labelledby="web-auth-title">
      <button
        type="button"
        className="mx-web-auth-close"
        aria-label="Закрыть"
        onClick={() => window.history.back()}
      >
        ×
      </button>

      <img
        className="mx-web-auth-illustration"
        src="/web-auth-stoic-illustration.jpg"
        alt=""
        aria-hidden="true"
      />

      <h1 id="web-auth-title">
        <strong>Продолжай расти</strong> даже вне приложения.
      </h1>
      <p className="mx-web-auth-lead">
        Получай вдохновляющие письма Mentalix прямо на почту. Один раз в неделю.
      </p>

      <div className="mx-web-auth-benefits" aria-label="Что будет в письме">
        <span>
          короткая
          <br />
          <b>рефлексия</b>
        </span>
        <span>
          тема
          <br />
          <b>на неделю</b>
        </span>
        <span>
          вдумчивая
          <br />
          <b>цитата</b>
        </span>
      </div>

      <section className="mx-web-auth-form" aria-labelledby="email-auth-title">
        <h2 id="email-auth-title" className="sr-only">
          Вход по email
        </h2>
        {step === 'email' ? (
          <form onSubmit={requestCode}>
            <label className="mx-web-auth-input-wrap">
              <span aria-hidden="true">✉</span>
              <input
                aria-label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Введи свой email"
              />
            </label>
            <p className="mx-web-auth-quote">Ты становишься тем, чему отдаёшь своё внимание.</p>
            <p className="mx-web-auth-author">— Эпиктет</p>
            <button type="submit" disabled={busy || !emailValid} className="mx-web-auth-submit">
              {busy ? 'Отправляю…' : 'Получить письмо'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <label className="mx-web-auth-input-wrap">
              <span aria-hidden="true">✉</span>
              <input
                aria-label="Код из email"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder="Код из письма"
              />
            </label>
            <p className="mx-web-auth-quote">Ты становишься тем, чему отдаёшь своё внимание.</p>
            <p className="mx-web-auth-author">— Эпиктет</p>
            <button
              type="submit"
              disabled={busy || code.trim().length < 4}
              className="mx-web-auth-submit"
            >
              {busy ? 'Проверяю…' : 'Войти'}
            </button>
            <button type="button" onClick={() => setStep('email')} className="mx-web-auth-change">
              Изменить email
            </button>
          </form>
        )}
      </section>

      {!directWebVisit && (
        <section className="mx-web-auth-telegram-card" aria-labelledby="telegram-auth-title">
          <h2 id="telegram-auth-title">Или через Telegram</h2>
          <TelegramLogin onSuccess={onAuthed} onError={handleTelegramError} />
        </section>
      )}

      {directWebVisit && (
        <p className="mx-web-auth-hint">
          В Safari доступен безопасный вход по email. Telegram-кнопка работает только внутри
          Telegram.
        </p>
      )}
      {notice && (
        <p role="status" className="mx-web-auth-status">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mx-web-auth-error">
          {error}
        </p>
      )}
    </main>
  )
}
