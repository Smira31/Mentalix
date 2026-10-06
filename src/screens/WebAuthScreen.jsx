import { useEffect, useMemo, useState } from 'react'

import { api } from '../lib/api'
import { platform } from '../platform'
import { loginAsGuest, attemptGuestMerge } from '../lib/guestAuth'
import './WebAuthScreen.css'

function TelegramLogin({ onSuccess, onError }) {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME

  useEffect(() => {
    if (!botUsername || typeof window === 'undefined') return undefined
    window.onTelegramAuth = async user => {
      try {
        const result = await api.auth.telegramLogin(user)
        platform.setUser(result.user)
        const mergedUser = await attemptGuestMerge(api)
        onSuccess(mergedUser || result.user)
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

const RESEND_COOLDOWN_MS = 60_000

// Поле поднимается над экранной клавиатурой: даём ей время открыться и прокручиваем.
function keepFieldVisible(event) {
  const field = event.currentTarget
  window.setTimeout(() => field.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 300)
}

// Письма с кодом уходят только при своём домене в Resend. Пока домена нет,
// продакшн-сборка выключает вход по email (VITE_EMAIL_LOGIN_ENABLED=false),
// и основной способ входа на вебе — Telegram Login.
const emailLoginEnabled = import.meta.env.VITE_EMAIL_LOGIN_ENABLED !== 'false'
const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME

export default function WebAuthScreen({ onAuthed }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // Повторная отправка кода: отсчёт от метки времени, а не от тиков таймера.
  const [resendAt, setResendAt] = useState(0)
  const [clock, setClock] = useState(() => Date.now())
  const resendLeft = Math.max(0, Math.ceil((resendAt - clock) / 1000))
  const directWebVisit = !window.Telegram?.WebApp?.initData
  const emailValid = useMemo(() => /^(?=.{5,254}$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email])

  useEffect(() => {
    if (resendAt <= Date.now()) return undefined
    const id = window.setInterval(() => {
      const current = Date.now()
      setClock(current)
      if (current >= resendAt) window.clearInterval(id)
    }, 1000)
    return () => window.clearInterval(id)
  }, [resendAt])

  async function sendCode() {
    await api.auth.requestEmailCode(email.trim().toLowerCase())
    const sentAt = Date.now()
    setClock(sentAt)
    setResendAt(sentAt + RESEND_COOLDOWN_MS)
  }

  async function resendCode() {
    if (busy || resendLeft > 0) return
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await sendCode()
      setNotice('Новый код отправлен. Он действует 10 минут.')
    } catch {
      setError('Не удалось отправить код. Попробуй ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  function changeEmail() {
    setStep('email')
    setCode('')
    setError('')
    setNotice('')
    setResendAt(0)
  }

  async function requestCode(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!emailValid) return setError('Укажи корректный email.')
    setBusy(true)
    try {
      await sendCode()
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
      const mergedUser = await attemptGuestMerge(api)
      onAuthed(mergedUser || result.user)
    } catch {
      setError('Неверный или просроченный код. Запроси новый и попробуй ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGuestLogin() {
    setError('')
    setBusy(true)
    try {
      await loginAsGuest(api, onAuthed)
    } catch {
      setError('Не удалось войти как гость. Попробуй ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  const handleTelegramError = () => setError('Не удалось войти через Telegram. Попробуй ещё раз.')

  return (
    <main className="mx-web-auth-page" aria-labelledby="mx-web-auth-title">
      <img
        className="mx-web-auth-illustration"
        src="/web-auth-stoic-illustration.jpg"
        alt=""
        aria-hidden="true"
      />

      <h1 id="web-auth-title">
        <strong>Продолжай расти</strong> даже вне приложения.
      </h1>
      {emailLoginEnabled ? (
        <p className="mx-web-auth-lead">
          Получай вдохновляющие письма Mentalix прямо на почту. Один раз в неделю.
        </p>
      ) : (
        <p className="mx-web-auth-lead">
          Войди через Telegram, чтобы сохранять записи и общаться с собеседником.
        </p>
      )}

      {emailLoginEnabled && (
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
      )}

      {emailLoginEnabled && (
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
                  onFocus={keepFieldVisible}
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
                  onFocus={keepFieldVisible}
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
              <button
                type="button"
                onClick={resendCode}
                disabled={busy || resendLeft > 0}
                className="mx-web-auth-change"
                data-testid="web-auth-resend"
              >
                {resendLeft > 0
                  ? `Отправить код ещё раз (${resendLeft} с)`
                  : 'Отправить код ещё раз'}
              </button>
              <button type="button" onClick={changeEmail} className="mx-web-auth-change">
                Изменить email
              </button>
            </form>
          )}
        </section>
      )}

      <section className="mx-web-auth-telegram-card" aria-labelledby="telegram-auth-title">
        <h2 id="telegram-auth-title">
          {emailLoginEnabled ? 'Или через Telegram' : 'Войти через Telegram'}
        </h2>
        <TelegramLogin onSuccess={onAuthed} onError={handleTelegramError} />
        {!emailLoginEnabled && botUsername && (
          <a
            className="mx-web-auth-change"
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть Mentalix в Telegram
          </a>
        )}
      </section>

      <button
        type="button"
        className="mx-web-auth-guest"
        disabled={busy}
        onClick={handleGuestLogin}
        data-testid="web-auth-guest-button"
      >
        {busy ? 'Подожди…' : 'Продолжить без входа'}
      </button>

      {directWebVisit && (
        <p className="mx-web-auth-hint">
          Открой Mentalix как приложение на iPhone и войди удобным способом.
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
