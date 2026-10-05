import { useLayoutEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, Ellipsis, X } from 'lucide-react'
import { demoTelegramPillState } from '../lib/demoChrome'
import {
  getCurrentBackAction,
  invokeBackAction,
  subscribeBackStack,
} from '../platform/telegram.hooks'

/*
 * ДЕМО-ЭМУЛЯЦИЯ TELEGRAM (?demo=1)
 * iOS-статус-бар + пилюли Telegram — как в Telegram fullscreen
 * на iPhone. Чисто визуальный слой: z-index выше fullscreen-порталов,
 * всегда поверх любых экранов приложения.
 *
 * Левая пилюля повторяет поведение системной BackButton Telegram:
 * приложение зарегистрировало «назад» (стек useBackButton) — пилюля
 * показывает «‹ Назад» и по тапу вызывает тот же обработчик, что
 * системная кнопка; стек пуст — «✕ Закрыть», тап ничего не делает.
 * Правая пилюля декоративная.
 */
export default function DemoTelegramChrome() {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const [hasBackAction, setHasBackAction] = useState(() => Boolean(getCurrentBackAction()))

  useLayoutEffect(() => {
    const update = () => setHasBackAction(Boolean(getCurrentBackAction()))
    const unsubscribe = subscribeBackStack(update)
    update()
    return unsubscribe
  }, [])

  const pill = demoTelegramPillState(hasBackAction)

  return (
    <div className="mx-demo-telegram-chrome">
      <div className="mx-demo-telegram-chrome__status" aria-hidden="true">
        <div className="mx-demo-telegram-chrome__status-zone mx-demo-telegram-chrome__status-zone--time">
          <span className="mx-demo-telegram-chrome__time">{time}</span>
        </div>
        <div className="mx-demo-telegram-chrome__status-zone mx-demo-telegram-chrome__status-zone--icons">
          <span className="mx-demo-telegram-chrome__status-icons">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
              <rect x="0" y="7.5" width="3.4" height="4.5" rx="1" />
              <rect x="4.8" y="5" width="3.4" height="7" rx="1" />
              <rect x="9.6" y="2.5" width="3.4" height="9.5" rx="1" />
              <rect x="14.4" y="0" width="3.4" height="12" rx="1" />
            </svg>
            <svg
              width="17"
              height="12"
              viewBox="0 0 17 12"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M1.5 4.2a10.5 10.5 0 0 1 14 0" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M4 7a7 7 0 0 1 9 0" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M6.6 9.7a3.4 3.4 0 0 1 3.8 0" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
              <rect
                x="0.5"
                y="0.5"
                width="21"
                height="11"
                rx="3.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.4"
              />
              <rect x="2.5" y="2.5" width="17" height="7" rx="2" fill="currentColor" />
              <path
                d="M23 4v4c1-.2 1.6-1 1.6-2S24 4.2 23 4z"
                fill="currentColor"
                fillOpacity="0.4"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className="mx-demo-telegram-chrome__controls" aria-hidden="false">
        {pill.mode === 'back' ? (
          <button
            type="button"
            className="mx-demo-telegram-chrome__pill"
            data-testid="demo-chrome-back"
            onClick={invokeBackAction}
            aria-label="Назад"
          >
            <ChevronLeft size={14} strokeWidth={2.4} aria-hidden="true" />
            <span>{pill.label}</span>
          </button>
        ) : (
          <span className="mx-demo-telegram-chrome__pill" aria-label={pill.label}>
            <X size={14} strokeWidth={2.4} aria-hidden="true" />
            <span>{pill.label}</span>
          </span>
        )}
        <span
          className="mx-demo-telegram-chrome__pill mx-demo-telegram-chrome__pill--menu"
          aria-hidden="true"
        >
          <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
          <Ellipsis size={16} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </div>
      {/* Dynamic Island — чёрная капсула как на iPhone 15 Pro / 16 Pro Max */}
      <div className="mx-demo-telegram-chrome__island" aria-hidden="true" />
      {/* Home indicator — полоса жестов внизу экрана */}
      <div className="mx-demo-telegram-chrome__home-indicator" aria-hidden="true" />
    </div>
  )
}
