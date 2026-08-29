import { useState } from 'react'
import { api } from '../lib/api'
import { webAdapter } from '../platform/web.adapter'

function hasTelegramContext() {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData)
}

export default function WebAuthScreen({ onAuthed }) {
  const [step, setStep] = useState('email') // email | code | link
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [webUser, setWebUser] = useState(null)
  const [linkCode, setLinkCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const directWebVisit = !hasTelegramContext()

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
    } catch {
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
        setError('Неверный или истёкший код. Проверь его и отправь ещё раз.')
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
    } catch {
      setError('Не получилось войти, проверь код и попробуй ещё раз')
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
    } catch {
      setError('Не получилось связать аккаунты, попробуй ещё раз')
    } finally {
      setLoading(false)
    }
  }

  function skipLink() {
    finishWith(webUser)
  }

  function editEmail() {
    setStep('email')
    setCode('')
    setError(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (step === 'email') requestCode()
    if (step === 'code') verifyCode()
    if (step === 'link') confirmLink()
  }

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

      {directWebVisit ? (
        <section
          className="w-full rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-4 mb-6"
          aria-labelledby="telegram-guidance-title"
        >
          <h1
            id="telegram-guidance-title"
            className="font-display text-[22px] text-cream mb-2 text-center"
          >
            Лучше открыть Mentalix через Telegram Mini App
          </h1>
          <p className="text-[13px] text-muted text-center leading-relaxed">
            Ты открыл прямую web-ссылку. Основной сценарий Mentalix работает в Telegram Mini App — там
            уже доступен твой Telegram-контекст.
          </p>
        </section>
      ) : (
        <h1 id="web-auth-title" className="font-display text-[22px] text-cream mb-2 text-center">
          Вход в Mentalix
        </h1>
      )}

      <section className="w-full" aria-labelledby={directWebVisit ? 'web-auth-title' : undefined}>
        {directWebVisit && (
          <>
            <h2 id="web-auth-title" className="font-display text-[18px] text-cream mb-2 text-center">
              Вход через браузер
            </h2>
            <p className="text-[12px] text-muted mb-6 text-center leading-relaxed">
              Если сейчас удобнее остаться в браузере, можно войти по email. Это поддерживаемый web-вход;
              он не обходит аутентификацию и не создаёт фиктивного пользователя.
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} aria-busy={loading}>
            {step === 'email' && (
            <>
              <p className="text-[13px] text-muted mb-8 text-center">Введи email — пришлём одноразовый код</p>
              <label htmlFor="web-auth-email" className="sr-only">
                Email для входа
              </label>
              <input
                id="web-auth-email"
                value={email}
                onChange={event => {
                  setEmail(event.target.value)
                  setError(null)
                }}
                type="email"
                placeholder="you@example.com"
                aria-label="Email для входа"
                aria-describedby={error ? 'web-auth-error' : undefined}
                aria-invalid={Boolean(error)}
                autoComplete="email"
                autoFocus
                className="w-full bg-cream/[0.05] border border-cream/[0.1] rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-colors mb-4"
              />
              <button
                type="submit"
                disabled={!email.trim() || loading}
                aria-label="Получить одноразовый код на email"
                className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-[13px] font-medium disabled:opacity-40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-transform"
              >
                {loading ? 'Отправляю...' : 'Получить код'}
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <p className="text-[13px] text-muted mb-4 text-center" id="web-auth-code-hint">
                Код отправлен на {email}
              </p>
              {devCode && (
                <p className="text-[11px] text-muted mb-3 text-center">
                  Тестовый режим — код: <span className="font-mono text-mint">{devCode}</span>
                </p>
              )}
              <label htmlFor="web-auth-code" className="sr-only">
                Одноразовый код
              </label>
              <input
                id="web-auth-code"
                value={code}
                onChange={event => {
                  setCode(event.target.value)
                  setError(null)
                }}
                placeholder="000000"
                aria-label="Одноразовый код"
                aria-describedby={error ? 'web-auth-error' : 'web-auth-code-hint'}
                aria-invalid={Boolean(error)}
                autoComplete="one-time-code"
                autoFocus
                inputMode="numeric"
                className="w-full bg-cream/[0.05] border border-cream/[0.1] rounded-xl px-4 py-3 text-center text-[16px] tracking-widest text-cream placeholder-muted outline-none focus:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-colors mb-4"
              />
              <button
                type="submit"
                disabled={!code.trim() || loading}
                aria-label="Проверить одноразовый код"
                className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-[13px] font-medium disabled:opacity-40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-transform mb-3"
              >
                {loading ? 'Проверяю...' : 'Войти'}
              </button>
              <button
                type="button"
                onClick={editEmail}
                className="text-[11px] text-muted active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Изменить email
              </button>
            </>
          )}

          {step === 'link' && (
            <>
              <p className="text-[13px] text-muted mb-2 text-center">
                Уже пользуешься Mentalix в Telegram?
              </p>
              <p className="text-[11px] text-muted mb-6 text-center leading-relaxed">
                Открой мини-апп в Telegram → Настройки → «Связать с сайтом», введи код здесь — и все твои
                данные подтянутся сюда же.
              </p>
              <label htmlFor="web-auth-link-code" className="sr-only">
                Код связки с Telegram
              </label>
              <input
                id="web-auth-link-code"
                value={linkCode}
                onChange={event => {
                  setLinkCode(event.target.value)
                  setError(null)
                }}
                placeholder="Код из Telegram"
                aria-label="Код связки с Telegram"
                aria-describedby={error ? 'web-auth-error' : undefined}
                aria-invalid={Boolean(error)}
                inputMode="numeric"
                className="w-full bg-cream/[0.05] border border-cream/[0.1] rounded-xl px-4 py-3 text-center text-[16px] tracking-widest text-cream placeholder-muted outline-none focus:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-colors mb-4"
              />
              <button
                type="submit"
                disabled={!linkCode.trim() || loading}
                aria-label="Связать web-аккаунт с Telegram"
                className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-[13px] font-medium disabled:opacity-40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-transform mb-3"
              >
                {loading ? 'Связываю...' : 'Связать аккаунты'}
              </button>
              <button
                type="button"
                onClick={skipLink}
                className="text-[11px] text-muted active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Пропустить — начать с чистого аккаунта
              </button>
            </>
          )}
        </form>
      </section>

      {loading && (
        <p className="text-[11px] text-muted mt-4 text-center" role="status" aria-live="polite">
          Подожди, выполняю запрос…
        </p>
      )}
      {error && (
        <p
          id="web-auth-error"
          className="text-[11px] text-red-400 mt-4 text-center"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </main>
  )
}
