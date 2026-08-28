import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'

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
import './ProcrastinationFlow.css'

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
  { key: 'harder', label: 'Нет', Icon: ThumbsDown },
  { key: 'same', label: 'Немного', Icon: Hand },
  { key: 'easier', label: 'Да', Icon: ThumbsUp },
]

const STEP_PROGRESS = {
  task: 1,
  feeling: 2,
  release: 3,
  plan: 4,
  run: 5,
  outcome: 6,
}

const COMPLETION_COPY = {
  started: {
    title: 'Первый шаг сделан',
    description: 'Ты не давил на себя — ты вернулся к делу.',
  },
  not_started: {
    title: 'Ты заметил, что мешает',
    description: 'Это уже честнее, чем продолжать винить себя.',
  },
  stopped_for_safety: {
    title: 'Ты выбрал безопасность',
    description: 'Остановиться вовремя — тоже бережный шаг.',
  },
}

function Eyebrow({ children = 'Без вины', centered = false }) {
  return (
    <span
      className={`block font-label text-[11px] font-bold uppercase tracking-wider text-gold mb-2 ${centered ? 'text-center' : ''}`}
    >
      {children}
    </span>
  )
}

function StageHeading({ children }) {
  return (
    <div className="no-blame-stage__anchor">
      <Eyebrow centered />
      <h2 className="no-blame-stage__title font-display text-cream">{children}</h2>
    </div>
  )
}

function Progress({ step }) {
  const current = STEP_PROGRESS[step]

  if (!current) return null

  return (
    <div className="no-blame-progress" aria-label={`Шаг ${current} из 6`}>
      <div className="no-blame-progress__rail" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className={index < current ? 'no-blame-progress__segment--active' : ''}
          />
        ))}
      </div>
      <span className="no-blame-progress__label">{current} из 6</span>
    </div>
  )
}

function NoBlameArtwork({ stage }) {
  return (
    <svg viewBox="0 0 240 132" className={`no-blame-art no-blame-art--${stage}`} aria-hidden="true">
      {stage === 'knot' && (
        <>
          <path d="M48 72c8-36 38 16 55-25 15-36 51 12 29 34-22 22-59-30-84-9Z" />
          <path d="M55 88c30-69 61 31 107-28" />
          <path d="M70 42c28-22 66 4 57 34-7 24-42 34-63 13" />
          <circle cx="164" cy="59" r="4" />
        </>
      )}

      {stage === 'release' && (
        <>
          <path d="M31 73c8-31 35 14 48-21 12-31 41 10 24 29-18 20-50-25-72-8Z" />
          <path d="M39 87c23-58 49 21 78-13 17-20 34-13 48-8 15 5 29 2 44-13" />
          <circle cx="210" cy="52" r="4" />
        </>
      )}

      {stage === 'line' && (
        <>
          <path d="M24 75c31-8 48 11 78 3 31-9 50-23 83-12 12 4 21 2 31-4" />
          <circle cx="216" cy="62" r="4" />
        </>
      )}

      {stage === 'complete' && (
        <>
          <path d="M24 86c35-6 51 7 79-2 34-12 43-43 78-36 13 3 23-2 34-15" />
          <path className="no-blame-art__star" d="m216 23 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" />
          <circle cx="216" cy="34" r="3.5" />
        </>
      )}
    </svg>
  )
}

function OptionList({ options, onPick }) {
  return (
    <div className="mt-6 space-y-2.5">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onPick(option.key)}
          className="w-full min-h-14 rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[14px] font-semibold text-cream active:scale-[0.98] transition-transform"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function ProcrastinationFlow({ userId, onClose, onComplete }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('intro')
  const [task, setTask] = useState('')
  const [distraction, setDistraction] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [reflection, setReflection] = useState(null)

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

  function startPractice() {
    platform.haptic('light')
    setStep('task')
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
    setStep('complete')
  }

  function finish() {
    platform.haptic('light')
    saveNoBlameEntry(userId, { outcome, reflection })
    onComplete?.()
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
        {step === 'intro' && (
          <div className="no-blame-stage no-blame-stage--intro animate-fade-in">
            <div className="no-blame-stage__center">
              <Eyebrow centered />
              <h2 className="font-display text-[24px] text-cream text-center leading-[1.08] tracking-[-0.035em]">
                Вернись к делу без давления
              </h2>
              <p className="mx-auto mt-4 max-w-[310px] text-center text-[13px] leading-relaxed text-muted">
                Три минуты, чтобы заметить избегание и сделать один безопасный шаг.
              </p>
              <p className="mt-4 text-center text-[12px] font-semibold text-faint">
                3 минуты&nbsp;&nbsp;·&nbsp;&nbsp;6 шагов
              </p>
              <NoBlameArtwork stage="knot" />
            </div>

            <button
              type="button"
              onClick={startPractice}
              className="cta-pill w-full text-[14px] px-6 py-4 mt-6"
            >
              Начать
            </button>
          </div>
        )}

        {step === 'task' && (
          <div className="no-blame-stage no-blame-stage--writing animate-fade-in">
            <Progress step={step} />
            <StageHeading>Что откладываешь?</StageHeading>

            <JournalTextarea
              autoFocus
              value={task}
              onChange={setTask}
              placeholder="Например: разобрать почту"
              ariaLabel="Дело, которое откладываешь"
              className="no-blame-stage__writer min-h-[12rem]"
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
          <div className="no-blame-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>Что в этом неприятного?</StageHeading>
            <div className="no-blame-stage__scene no-blame-stage__scene--choices">
              <OptionList options={FEELING_OPTIONS} onPick={chooseFeeling} />
            </div>
          </div>
        )}

        {step === 'release' && (
          <div className="no-blame-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>{releasePhrase}</StageHeading>
            <div className="no-blame-stage__scene">
              <NoBlameArtwork stage="release" />
            </div>
            <button
              type="button"
              onClick={goToPlan}
              className="cta-pill w-full text-[14px] px-6 py-4 mt-6"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 'plan' && !distraction && (
          <div className="no-blame-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>Что обычно отвлекает вместо этого?</StageHeading>
            <div className="no-blame-stage__scene no-blame-stage__scene--choices">
              <OptionList options={DISTRACTION_OPTIONS} onPick={chooseDistraction} />
            </div>
          </div>
        )}

        {step === 'plan' && distraction && (
          <div className="no-blame-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>Договорись с собой</StageHeading>
            <div className="no-blame-stage__scene">
              <p className="mx-auto mt-3 max-w-[310px] text-center text-[13px] text-muted leading-relaxed">
                Как только снова потянет отвлечься — вернись к делу на две минуты.
              </p>
            </div>

            <button
              type="button"
              onClick={startRun}
              className="cta-pill w-full text-[14px] px-6 py-4 mt-6"
            >
              Начать две минуты
            </button>
          </div>
        )}

        {step === 'run' && (
          <div className="no-blame-stage animate-fade-in text-center">
            <Progress step={step} />
            <StageHeading>Только эти две минуты</StageHeading>
            <div className="no-blame-stage__scene">
              <div className="font-display text-[68px] text-gold tabular-nums leading-none">
                {minutes}:{seconds}
              </div>
              <NoBlameArtwork stage="line" />
              <p className="mt-3 text-[13px] text-muted">Не идеально. Просто начни.</p>
            </div>

            <button
              type="button"
              onClick={stopRun}
              className="mx-auto text-[12px] font-semibold text-muted -m-2 p-3 active:opacity-60 mt-6"
            >
              Остановить
            </button>
          </div>
        )}

        {step === 'outcome' && (
          <div className="no-blame-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>Как прошло?</StageHeading>
            <div className="no-blame-stage__scene no-blame-stage__scene--choices">
              <OptionList options={OUTCOME_OPTIONS} onPick={chooseOutcome} />
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="no-blame-stage no-blame-stage--complete animate-fade-in">
            <div className="no-blame-stage__center">
              <NoBlameArtwork stage="complete" />
              <h2 className="font-display text-[24px] text-center text-cream leading-tight">
                {COMPLETION_COPY[outcome]?.title}
              </h2>
              <p className="mx-auto mt-3 max-w-[310px] text-center text-[13px] text-muted leading-relaxed">
                {COMPLETION_COPY[outcome]?.description}
              </p>

              <p className="mt-7 text-center text-[12px] font-semibold text-muted">
                Помогло сейчас?
              </p>
              <div className="no-blame-feedback">
                {REFLECTION_OPTIONS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={reflection === key}
                    onClick={() => {
                      platform.haptic('light')
                      setReflection(key)
                    }}
                    className="no-blame-feedback__option"
                  >
                    <Icon size={23} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={finish}
              className="cta-pill w-full text-[14px] px-6 py-4 mt-6"
            >
              Завершить
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
