import { useEffect, useRef, useState } from 'react'
import { platform, platformName } from '../platform'
import { api } from '../lib/api'
import { Check } from 'lucide-react'
import BackButton from '../components/BackButton'
import { DEFAULT_REVIEW_HOUR } from '../lib/todayCardState'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { useGlobalEdgeSwipeBack } from '../lib/gestures/useGlobalEdgeSwipeBack'
import './Onboarding.css'

// ── Онбординг: приветствие → возраст → напоминание → «план готов» ──

const AGE_OPTIONS = ['До 18', '18–24', '25–34', '35–44', '45+']

const REMINDER_OPTIONS = [
  { key: 'morning', label: 'Утро', time: '08:00', hour: 8, note: 'задать курс на день' },
  { key: 'day', label: 'День', time: '14:00', hour: 14, note: 'вернуться к себе в середине дня' },
  { key: 'evening', label: 'Вечер', time: '19:00', hour: DEFAULT_REVIEW_HOUR, note: 'разобрать день, пока свежий' },
]

const PLAN_CARDS = [
  'Твои записи сохраняются в профиле Mentalix',
  'Наставник, Спутник, Наблюдатель и Даймон ждут тебя в «Диалоге»',
  'Первый шаг уже ждёт тебя на главной',
]

const PROGRESS_KEY = 'mx-onboarding-progress'
const TOTAL = 4

// ── сохранение/восстановление прогресса ──

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeProgress(data) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
  } catch {
    // приватный режим/квота — не критично
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY)
  } catch {
    // см. выше
  }
}

// ── шапка: системный Telegram BackButton · прогресс ──
function Head({ step, total, onBack }) {
  return (
    <div className="w-full max-w-md px-[var(--mx-screen-x)] pt-[var(--mx-space-5)] grid grid-cols-[1fr_auto_1fr] items-center">
      <div className="justify-self-start">
        <BackButton onClick={onBack} />
      </div>

      {step < total - 1 ? (
        <div className="flex gap-1.5" aria-label={`Шаг ${step + 1} из ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className="mx-onboarding-progress-dot" data-complete={i <= step} />
          ))}
        </div>
      ) : (
        <span aria-hidden="true" />
      )}

      <span aria-hidden="true" />
    </div>
  )
}

// ── карточка-вариант: выбранная инвертируется ──
function Option({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      data-testid="onboarding-option"
      className="mx-onboarding-option w-full rounded-[var(--mx-radius-card)] px-[var(--mx-screen-x)] py-[var(--mx-space-4)] text-center border-0"
      data-selected={selected}
    >
      <span className="block text-[14px] font-bold">{label}</span>
    </button>
  )
}

export default function Onboarding({ user, onFinish }) {
  const saved = readProgress()
  const [step, setStep] = useState(saved.step || 0)
  const [age, setAge] = useState(saved.age || null)
  const [reminder, setReminder] = useState(saved.reminder || 'morning')
  const [revealed, setRevealed] = useState(0)
  const [underage, setUnderage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const rootRef = useRef(null)

  const { style: surfaceStyle } = useFullscreenSurface()

  // Свайп «назад» от левого края на шагах > 0 (back доступен)
  useGlobalEdgeSwipeBack(rootRef, { enabled: step > 0 })

  // Сохранение прогресса на каждом шаге
  useEffect(() => {
    writeProgress({ step, age, reminder })
  }, [step, age, reminder])

  // На финальном экране карточки набирают контраст по очереди
  useEffect(() => {
    if (step !== TOTAL - 1) return
    const timers = PLAN_CARDS.map((_, i) =>
      setTimeout(
        () => {
          setRevealed(i + 1)
          if (i === PLAN_CARDS.length - 1) {
            platform.haptic('light')
          }
        },
        420 + i * 520
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [step])

  function handleBack() {
    if (underage) {
      setUnderage(false)
    } else {
      setStep(s => Math.max(0, s - 1))
    }
  }

  function next() {
    platform.haptic('light')
    setStep(s => s + 1)
  }

  function selectAge(a) {
    platform.haptic('light')
    setAge(a)
    if (a === 'До 18') {
      setUnderage(true)
    }
  }

  async function finish() {
    if (submitting) return
    platform.haptic('medium')
    setSubmitting(true)
    setSaveError(false)
    const opt = REMINDER_OPTIONS.find(r => r.key === reminder)
    try {
      if (user?.id && opt) {
        await api.profile.saveSettings(user.id, {
          reminder_enabled: true,
          reminder_hour: opt.hour,
          review_hour: DEFAULT_REVIEW_HOUR,
        })
      }
      clearProgress()
      onFinish()
    } catch (e) {
      console.error(e)
      setSaveError(true)
    } finally {
      setSubmitting(false)
    }
  }

  function continueWithoutReminder() {
    platform.haptic('light')
    clearProgress()
    onFinish()
  }

  return (
    <div ref={rootRef} className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={FULLSCREEN_HEADER_SLOT_CLASS}>
        {step > 0 && (
          <Head step={step} total={TOTAL} onBack={handleBack} />
        )}
      </div>
      <div className={FULLSCREEN_SCROLL_CLASS}>
        {/* ── 0. Приветствие ── */}
        {step === 0 && (
          <div className="mx-onboarding-step mx-onboarding-intro-step flex-1 w-full max-w-md flex flex-col items-center justify-center px-[var(--mx-screen-x)] text-center">
            <div className="mx-onboarding-intro-copy flex flex-col items-center">
              {/* Место под иллюстрацию — не ломать вёрстку, чтобы вставить позже */}
              <h2 className="font-display text-[30px] text-cream leading-tight">Mentalix.</h2>
              <p className="text-[14px] text-muted mt-[var(--mx-space-4)] leading-relaxed max-w-xs">
                Пара коротких вопросов — и начнём. Это займёт минуту.
              </p>
              <button
                onClick={next}
                data-testid="onboarding-start"
                className="cta-pill text-[16px] py-[var(--mx-space-4)] mt-[var(--mx-space-10)]"
              >
                Начать
              </button>
            </div>
          </div>
        )}

        {/* ── 1. Возраст ── */}
        {step === 1 && !underage && (
          <div
            key="s1"
            className="mx-onboarding-step mx-onboarding-question-step flex-1 w-full max-w-md flex flex-col justify-center px-[var(--mx-screen-x)] py-[var(--mx-space-8)]"
          >
            <h2 className="font-display text-[22px] text-cream text-center leading-tight">
              Сколько тебе лет?
            </h2>
            <p className="text-[13px] text-muted mt-[var(--mx-space-3)] mb-[var(--mx-space-7)] text-center leading-snug">
              Чтобы говорить с тобой на одном языке.
            </p>
            <div className="mx-onboarding-option-list space-y-2.5">
              {AGE_OPTIONS.map(a => (
                <Option
                  key={a}
                  label={a}
                  selected={age === a}
                  onClick={() => selectAge(a)}
                />
              ))}
            </div>
            <p className="text-[12px] text-muted text-center mt-[var(--mx-space-6)]">
              Возрастная группа сохраняется в настройках знакомства.
            </p>
            <button
              onClick={next}
              disabled={!age || age === 'До 18'}
              data-testid="onboarding-next"
              className="cta-pill text-[16px] py-[var(--mx-space-4)] mx-auto mt-[var(--mx-space-8)] disabled:opacity-30"
            >
              Дальше
            </button>
          </div>
        )}

        {/* ── 1b. Экран 18+ ── */}
        {step === 1 && underage && (
          <div
            key="s1u"
            className="mx-onboarding-step mx-onboarding-question-step flex-1 w-full max-w-md flex flex-col justify-center px-[var(--mx-screen-x)] py-[var(--mx-space-8)] text-center"
          >
            <h2 className="font-display text-[22px] text-cream leading-tight">
              Mentalix доступен с 18 лет
            </h2>
            <p className="text-[13px] text-muted mt-[var(--mx-space-3)] leading-relaxed max-w-xs mx-auto">
              Приложение использует практики саморефлексии, рассчитанные на взрослых пользователей.
            </p>
            {platformName === 'telegram' && (
              <button
                onClick={() => platform.close()}
                data-testid="onboarding-underage-close"
                className="cta-pill text-[16px] py-[var(--mx-space-4)] mx-auto mt-[var(--mx-space-8)]"
              >
                Закрыть
              </button>
            )}
          </div>
        )}

        {/* ── 2. Напоминание ── */}
        {step === 2 && (
          <div
            key="s2"
            className="mx-onboarding-step mx-onboarding-question-step flex-1 w-full max-w-md flex flex-col justify-center px-[var(--mx-screen-x)] py-[var(--mx-space-8)]"
          >
            <h2 className="font-display text-[22px] text-cream text-center leading-tight">
              Когда напомнить о себе?
            </h2>
            <p className="text-[13px] text-muted mt-[var(--mx-space-3)] mb-[var(--mx-space-7)] text-center leading-snug">
              Привычка держится на одном постоянном времени. Бот пришлёт короткое сообщение — не
              спам.
            </p>

            <div className="mx-onboarding-reminder-list space-y-2.5">
              {REMINDER_OPTIONS.map(r => {
                const on = reminder === r.key
                return (
                  <button
                    key={r.key}
                    data-testid="onboarding-reminder-option"
                    onClick={() => {
                      platform.haptic('light')
                      setReminder(r.key)
                    }}
                    className={[
                      'mx-onboarding-reminder w-full rounded-[var(--mx-radius-card)] px-[var(--mx-screen-x)] py-[var(--mx-space-4)] flex items-center gap-[var(--mx-space-4)] border-0 text-left',
                      on ? 'bg-cream text-emerald-deep' : 'bg-emerald text-cream',
                    ].join(' ')}
                  >
                    <span className="flex-1">
                      <span
                        className={`block text-[12px] font-bold ${on ? 'opacity-60' : 'text-muted'}`}
                      >
                        {r.label}
                      </span>
                      <span className="block font-display text-[22px] leading-tight">{r.time}</span>
                      <span
                        className={`block text-[12px] mt-0.5 ${on ? 'opacity-60' : 'text-muted'}`}
                      >
                        {r.note}
                      </span>
                    </span>
                    <span
                      className={[
                        'mx-onboarding-reminder-check w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                        on ? 'bg-emerald-deep text-cream' : 'bg-cream/10 text-transparent',
                      ].join(' ')}
                    >
                      <Check size={14} strokeWidth={3} aria-hidden="true" />
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={next}
              data-testid="onboarding-next"
              className="cta-pill text-[16px] py-[var(--mx-space-4)] mx-auto mt-[var(--mx-space-8)]"
            >
              Дальше
            </button>
          </div>
        )}

        {/* ── 3. Готово ── */}
        {step === 3 && (
          <div
            key="s3"
            className="mx-onboarding-step mx-onboarding-question-step flex-1 w-full max-w-md flex flex-col justify-center px-[var(--mx-screen-x)] py-[var(--mx-space-8)]"
          >
            <h2 className="font-display text-[24px] text-cream text-center leading-tight">
              Готово. Путь размечен.
            </h2>

            <div className="space-y-2.5 mt-[var(--mx-space-8)]">
              {PLAN_CARDS.map((text, i) => {
                const shown = revealed > i
                return (
                  <div
                    key={i}
                    className="mx-onboarding-plan-card rounded-[var(--mx-radius-card)] bg-emerald px-[var(--mx-screen-x)] py-[var(--mx-space-4)] flex items-center gap-[var(--mx-space-3)]"
                    data-revealed={shown}
                  >
                    <span className="flex-1 text-[13px] font-semibold text-cream leading-snug">
                      {text}
                    </span>
                    <Check
                      size={20}
                      strokeWidth={2.5}
                      className="mx-onboarding-plan-check shrink-0"
                      data-revealed={shown}
                      aria-hidden="true"
                    />
                  </div>
                )
              })}
            </div>

            {saveError ? (
              <div className="flex flex-col items-center gap-[var(--mx-space-3)] mt-[var(--mx-space-8)]">
                <p className="text-[13px] text-muted text-center">
                  Не удалось сохранить напоминание
                </p>
                <div className="flex gap-[var(--mx-space-3)]">
                  <button
                    onClick={finish}
                    disabled={submitting}
                    data-testid="onboarding-save-retry"
                    className="cta-pill text-[16px] py-[var(--mx-space-4)]"
                  >
                    {submitting ? 'Сохраняю...' : 'Повторить'}
                  </button>
                  <button
                    onClick={continueWithoutReminder}
                    data-testid="onboarding-save-skip"
                    className="cta-pill text-[16px] py-[var(--mx-space-4)] opacity-60"
                  >
                    Без напоминания
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={finish}
                disabled={revealed < PLAN_CARDS.length || submitting}
                data-testid="onboarding-enter"
                className="cta-pill text-[16px] py-[var(--mx-space-4)] mx-auto mt-[var(--mx-space-8)] disabled:opacity-30"
              >
                Войти
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
