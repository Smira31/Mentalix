import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { saveNoBlameEntry } from '../lib/noBlamePractice'

/*
 * MXL-PRB-001, MXL-DEC-014: разовая практика «Без вины» — не серия, не
 * привязана к дню. Шаги: task → feeling → release → plan → run → outcome →
 * reflect. Работает не с планом действия (это делает «Первый шаг»,
 * FirstStepFlow.jsx), а с эмоцией избегания и петлёй кратковременного
 * облегчения — поэтому вместо конкретизации шага здесь фраза-разрядка без
 * давления и короткий разрыв паттерна «отвлёкся → вернись на 2 минуты».
 * Переиспользует структуру FirstStepFlow.jsx (fullscreen portal, стейт-машина
 * step) и таймер-паттерн Focus.jsx (endsAt по Date.now(), не тики
 * setInterval — вебвью Telegram душит таймеры в фоне, см. AI_RULES.md §9
 * «Время»).
 */

const FEELING_OPTIONS = [
  { key: 'boring', label: 'Скучно' },
  { key: 'anxious', label: 'Тревожно' },
  { key: 'fear_of_bad_result', label: 'Боюсь сделать плохо' },
  { key: 'no_desire', label: 'Просто не хочется' },
  { key: 'unknown', label: 'Не знаю почему' },
]

// Ротация — намеренно не одна статичная фраза, чтобы разрядка не звучала
// формулой при повторном использовании практики.
const RELEASE_PHRASES = [
  'Ты не тянешь время назло себе — это мозг уводит от неприятного. Бывает у всех.',
  'Ты не подводишь себя — это просто мозг защищается от неприятного чувства. Тут не за что себя винить.',
  'Дело не в силе воли — мозг искал, где полегче. С кем угодно случается.',
]

const DISTRACTION_OPTIONS = [
  { key: 'phone', label: 'Телефон' },
  { key: 'social', label: 'Соцсети' },
  { key: 'other_tasks', label: 'Другие дела' },
  { key: 'cleaning', label: 'Уборка' },
  { key: 'own', label: 'Своё' },
]

const RUN_SECONDS = 2 * 60

const OUTCOME_OPTIONS = [
  { key: 'started', label: 'Начал(а)' },
  { key: 'not_started', label: 'Не начал(а)' },
  { key: 'stopped_for_safety', label: 'Остановился — было небезопасно' },
]

const REFLECTION_OPTIONS = [
  { key: 'easier', label: 'Да' },
  { key: 'same', label: 'Не особо' },
  { key: 'harder', label: 'Нет' },
]

function Eyebrow() {
  return (
    <span className="block text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
      Без вины
    </span>
  )
}

function OptionList({ options, onPick }) {
  return (
    <div className="mt-5 space-y-2">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onPick(option.key)}
          className="w-full rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[15px] font-semibold text-cream active:scale-[0.98] transition-transform"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function ProcrastinationFlow({ userId, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('task')
  const [task, setTask] = useState('')
  const [distraction, setDistraction] = useState(null)
  const [outcome, setOutcome] = useState(null)

  const [releasePhrase] = useState(
    () => RELEASE_PHRASES[Math.floor(Math.random() * RELEASE_PHRASES.length)]
  )

  const [secondsLeft, setSecondsLeft] = useState(RUN_SECONDS)
  const [endsAt, setEndsAt] = useState(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!endsAt) return

    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))

    tick()
    const id = setInterval(tick, 250)

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [endsAt])

  // Завершение — отдельным эффектом с защитой через ref, как в Focus.jsx:
  // в StrictMode апдейтер вызывается дважды.
  useEffect(() => {
    if (!endsAt || secondsLeft > 0 || finishedRef.current) return

    finishedRef.current = true
    platform.haptic('success')
    setStep('outcome')
  }, [secondsLeft, endsAt])

  function goToFeeling() {
    if (!task.trim()) return

    platform.haptic('light')
    setStep('feeling')
  }

  function chooseFeeling() {
    platform.haptic('light')
    setStep('release')
  }

  function goToPlan() {
    platform.haptic('light')
    setStep('plan')
  }

  function chooseDistraction(key) {
    platform.haptic('light')
    setDistraction(key)
  }

  function startRun() {
    platform.haptic('medium')
    finishedRef.current = false
    setSecondsLeft(RUN_SECONDS)
    setEndsAt(Date.now() + RUN_SECONDS * 1000)
    setStep('run')
  }

  function stopRun() {
    platform.haptic('light')
    setEndsAt(null)
    setStep('outcome')
  }

  function chooseOutcome(key) {
    platform.haptic('medium')
    setOutcome(key)
    setStep('reflect')
  }

  function finish(reflection) {
    platform.haptic('light')
    saveNoBlameEntry(userId, { outcome, reflection })
    onClose()
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center gap-3 px-5`}>
        <BackButton onClick={onClose} />
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} px-5 pb-8`}>
        {step === 'task' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Что откладываешь?</h2>

            <JournalTextarea
              autoFocus
              value={task}
              onChange={setTask}
              placeholder="Например: разобрать почту"
              ariaLabel="Дело, которое откладываешь"
              className="mt-6 min-h-[18rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={goToFeeling}
              submitLabel="Дальше"
              submitDisabled={!task.trim()}
            />
          </div>
        )}

        {step === 'feeling' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Что в этом неприятного?
            </h2>

            <OptionList options={FEELING_OPTIONS} onPick={chooseFeeling} />
          </div>
        )}

        {step === 'release' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[22px] text-cream leading-snug">{releasePhrase}</h2>

            <button
              type="button"
              onClick={goToPlan}
              className="cta-pill w-full text-[15px] px-6 py-3.5 mt-5"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 'plan' && !distraction && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Что обычно отвлекает вместо этого?
            </h2>

            <OptionList options={DISTRACTION_OPTIONS} onPick={chooseDistraction} />
          </div>
        )}

        {step === 'plan' && distraction && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Договорись сама с собой
            </h2>

            <p className="text-[13px] text-muted mt-2 leading-relaxed">
              Как только это случится — вернись сюда на две минуты.
            </p>

            <button
              type="button"
              onClick={startRun}
              className="cta-pill w-full text-[15px] px-6 py-3.5 mt-5"
            >
              Начать две минуты
            </button>
          </div>
        )}

        {step === 'run' && (
          <div className="w-full max-w-md mx-auto animate-fade-in text-center">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Только эти две минуты
            </h2>

            <div className="font-display text-[64px] text-cream mt-8 tabular-nums">
              {minutes}:{seconds}
            </div>

            <button
              type="button"
              onClick={stopRun}
              className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60 mt-8"
            >
              Остановить
            </button>
          </div>
        )}

        {step === 'outcome' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Как прошло?</h2>

            <OptionList options={OUTCOME_OPTIONS} onPick={chooseOutcome} />
          </div>
        )}

        {step === 'reflect' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Стало ли легче?</h2>

            <OptionList options={REFLECTION_OPTIONS} onPick={finish} />

            <div className="mt-5">
              <button
                type="button"
                onClick={() => finish(null)}
                className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
              >
                Пропустить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
