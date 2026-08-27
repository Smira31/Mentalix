import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Delete, Fingerprint } from 'lucide-react'

import { platform, platformName } from '../platform'
import { biometric } from '../platform/telegram.hooks'
import {
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  FULLSCREEN_SHELL_CLASS,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import MazeLogo from '../components/MazeLogo'
import BackButton from '../components/BackButton'
import { verifyPin, writePinRecord } from '../lib/appLock'
import './AppLock.css'

const PIN_LENGTH = 4

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'biometric', '0', 'delete']

/*
 * ЭКРАН БЛОКИРОВКИ
 *
 * Один компонент, два режима:
 *   unlock — проверяет уже заданный PIN (+ пробует биометрию первой
 *            в Telegram), вызывается из App.jsx поверх остального UI;
 *   setup  — заводит новый PIN (ввод дважды), вызывается из Settings.
 *
 * Тот же fullscreen-контракт (портал в body, safe-area, 56px контролов
 * Telegram), что у CheckIn/QuoteView — см. src/lib/fullscreenSurface.js.
 */
export default function AppLock({ mode = 'unlock', onUnlock, onSetupDone, onCancel }) {
  const isSetup = mode === 'setup'

  const { style: surfaceStyle } = useFullscreenSurface()

  const [stage, setStage] = useState('enter') // 'enter' | 'confirm' — только setup
  const [digits, setDigits] = useState('')
  const [firstPin, setFirstPin] = useState(null)
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)
  const [biometricOffered, setBiometricOffered] = useState(false)

  const shakeTimer = useRef(null)

  // ── Автопопытка биометрии сразу при входе — только разблокировка в Telegram ──
  useEffect(() => {
    if (isSetup || platformName !== 'telegram') return undefined

    let alive = true

    biometric.isAvailable().then((available) => {
      if (!alive || !available) return

      setBiometricOffered(true)

      biometric.authenticate('Разблокировать Mentalix').then((ok) => {
        if (alive && ok) {
          platform.haptic('success')
          onUnlock?.()
        }
      })
    })

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSetup])

  useEffect(
    () => () => window.clearTimeout(shakeTimer.current),
    [],
  )

  function shake() {
    platform.haptic('error')
    setError(true)
    setDigits('')

    window.clearTimeout(shakeTimer.current)

    shakeTimer.current = window.setTimeout(() => setError(false), 420)
  }

  async function submit(pin) {
    if (isSetup) {
      if (stage === 'enter') {
        setFirstPin(pin)
        setDigits('')
        setStage('confirm')
        platform.haptic('light')

        return
      }

      if (pin !== firstPin) {
        shake()
        setStage('enter')
        setFirstPin(null)

        return
      }

      setChecking(true)
      await writePinRecord(pin)
      setChecking(false)

      platform.haptic('success')
      onSetupDone?.()

      return
    }

    setChecking(true)
    const ok = await verifyPin(pin)
    setChecking(false)

    if (ok) {
      platform.haptic('success')
      onUnlock?.()
    } else {
      shake()
    }
  }

  function press(key) {
    if (checking) return

    if (key === 'delete') {
      platform.haptic('light')
      setDigits((current) => current.slice(0, -1))

      return
    }

    if (key === 'biometric') {
      if (!biometricOffered) return

      platform.haptic('light')

      biometric.authenticate('Разблокировать Mentalix').then((ok) => {
        if (ok) {
          platform.haptic('success')
          onUnlock?.()
        }
      })

      return
    }

    if (digits.length >= PIN_LENGTH) return

    platform.haptic('light')

    const next = digits + key

    setDigits(next)

    if (next.length === PIN_LENGTH) {
      submit(next)
    }
  }

  const title = isSetup
    ? stage === 'enter'
      ? 'придумай код.'
      : 'повтори код.'
    : 'код доступа.'

  const subtitle = isSetup
    ? stage === 'enter'
      ? '4 цифры, которые будут открывать Mentalix'
      : 'ещё раз, чтобы не ошибиться'
    : 'разблокируй, чтобы продолжить'

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-5`}>
        {isSetup && <BackButton onClick={onCancel} />}
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} items-center justify-center px-8 text-center`}>
        <MazeLogo size={64} progress={1} className="mb-6" />

        <h1 className="font-display text-[22px] text-cream lowercase leading-tight">{title}</h1>
        <p className="text-[13px] text-muted mt-2 mb-9">{subtitle}</p>

        <div
          className={`mx-applock-dots flex items-center justify-center gap-4 ${
            error ? 'mx-applock-shake' : ''
          }`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <span key={index} className="mx-applock-dot" data-filled={index < digits.length} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-10 w-full max-w-[280px]">
          {KEYS.map((key, index) => {
            if (key === 'biometric') {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => press('biometric')}
                  disabled={!biometricOffered}
                  aria-label="Войти по биометрии"
                  className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center mx-auto border-0 active:scale-90 transition-transform disabled:opacity-0"
                >
                  <Fingerprint size={22} className="text-gold" />
                </button>
              )
            }

            if (key === 'delete') {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => press('delete')}
                  aria-label="Стереть"
                  className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center mx-auto border-0 active:scale-90 transition-transform"
                >
                  <Delete size={20} className="text-muted" />
                </button>
              )
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => press(key)}
                className="w-16 h-16 rounded-full bg-emerald flex items-center justify-center mx-auto border-0 active:scale-90 transition-transform"
              >
                <span className="font-display text-[20px] text-cream">{key}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
