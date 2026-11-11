// src/screens/settings/EmailLinkScreen.jsx
//
// Issue #1189 — «Почта для входа»: экран привязки. Шаг 1 — адрес, шаг 2 —
// код из письма. Все вызовы — api.auth.emailLink (GET/POST/DELETE
// /auth/email-link…, заголовок Authorization: tma <initData>).
//
// Экран собран на <Screen> и деталях src/components/ui/: отступы только
// токенами --mx-space-*, поля ввода 16 px (правило iOS-зума), фокус —
// единственный useAutoFocusField. Отсчёт повторной отправки — 60 с от момента
// отправки (бэкенд разрешает одно письмо в минуту) — считается от метки
// времени кулдауна, а не от тиков таймера: Telegram глушит таймеры в фоне.

import { useEffect, useRef, useState } from 'react'

import Screen from '../../components/Screen'
import CapsLabel from '../../components/ui/CapsLabel'
import GlassButton from '../../components/ui/GlassButton'
import PillButton from '../../components/ui/PillButton'
import { api } from '../../lib/api'
import { useAutoFocusField } from '../../lib/useAutoFocusField'
import {
  EMAIL_LINK_ERROR_INVALID_CODE,
  EMAIL_LINK_REQUEST_CODE_LABEL,
  EMAIL_LINK_RESEND_LABEL,
  EMAIL_LINK_SUBTITLE,
  EMAIL_LINK_VERIFY_LABEL,
  RESEND_COOLDOWN_SECONDS,
  emailLinkErrorText,
  emailLinkSecondsLeft,
  formatEmailLinkCountdown,
} from '../../lib/emailLink'

import './EmailLink.css'

export default function EmailLinkScreen({ onBack, onLinked }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const emailRef = useRef(null)
  const codeRef = useRef(null)
  useAutoFocusField(emailRef, step === 'email')
  useAutoFocusField(codeRef, step === 'code')

  useEffect(() => {
    if (!cooldownUntil) return undefined
    // Тик только перерисовывает: остаток считается из метки времени.
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [cooldownUntil])

  const trimmedEmail = email.trim()
  const trimmedCode = code.trim()
  const secondsLeft = emailLinkSecondsLeft(cooldownUntil, now)

  async function requestCode() {
    if (sending || !trimmedEmail) return
    setSending(true)
    setError('')
    try {
      await api.auth.emailLink.requestCode(trimmedEmail)
      // Кулдаун повтора — 60 с от момента отправки, а не срок жизни кода.
      const sentAt = Date.now()
      setCooldownUntil(sentAt + RESEND_COOLDOWN_SECONDS * 1000)
      setNow(sentAt)
      setCode('')
      setStep('code')
    } catch (requestError) {
      setError(emailLinkErrorText(requestError))
    } finally {
      setSending(false)
    }
  }

  async function resendCode() {
    if (secondsLeft > 0) return
    await requestCode()
  }

  async function verifyCode() {
    if (verifying || !trimmedEmail || !trimmedCode) return
    setVerifying(true)
    setError('')
    try {
      const result = await api.auth.emailLink.verify(trimmedEmail, trimmedCode)
      if (result?.ok) {
        onLinked?.(result.email || trimmedEmail)
        return
      }
      // Неверный или просроченный код — ответ 200 с ok: false, не HTTP-ошибка.
      setError(EMAIL_LINK_ERROR_INVALID_CODE)
    } catch (verifyError) {
      setError(emailLinkErrorText(verifyError))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Screen onBack={onBack} backTestId="email-link-back">
      <div className="mx-email-link" data-testid="email-link-screen">
        <CapsLabel>вход на сайте</CapsLabel>
        <h1 className="font-display mx-type-page text-cream lowercase mx-email-link__title">
          почта для входа.
        </h1>

        {step === 'email' ? (
          <>
            <p className="mx-email-link__hint">{EMAIL_LINK_SUBTITLE}</p>
            <label className="mx-email-link__label" htmlFor="email-link-email">
              Почта
            </label>
            <input
              id="email-link-email"
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck="false"
              placeholder="name@example.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="mx-email-link__input"
              data-testid="email-link-email-field"
            />
            <div className="mx-email-link__actions">
              <PillButton
                testId="email-link-request-code"
                onClick={requestCode}
                disabled={sending || !trimmedEmail}
              >
                {sending ? 'Отправляем код…' : EMAIL_LINK_REQUEST_CODE_LABEL}
              </PillButton>
            </div>
          </>
        ) : (
          <>
            <p className="mx-email-link__hint">Код пришёл на {trimmedEmail}</p>
            <label className="mx-email-link__label" htmlFor="email-link-code">
              Код из письма
            </label>
            <input
              id="email-link-code"
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={event => setCode(event.target.value)}
              className="mx-email-link__input"
              data-testid="email-link-code-field"
            />
            <div className="mx-email-link__actions">
              <PillButton
                testId="email-link-verify"
                onClick={verifyCode}
                disabled={verifying || !trimmedCode}
              >
                {verifying ? 'Проверяем…' : EMAIL_LINK_VERIFY_LABEL}
              </PillButton>
              <GlassButton
                testId="email-link-resend"
                onClick={resendCode}
                disabled={sending || secondsLeft > 0}
              >
                {secondsLeft > 0
                  ? `${EMAIL_LINK_RESEND_LABEL} · ${formatEmailLinkCountdown(secondsLeft)}`
                  : EMAIL_LINK_RESEND_LABEL}
              </GlassButton>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="mx-email-link__error" data-testid="email-link-error">
            {error}
          </p>
        )}
      </div>
    </Screen>
  )
}
