import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'
import approvedNoBlameRelease from '../assets/ui-lab/approved-no-blame-release.png'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'

import { platform } from '../platform'
import { useFullscreenSurface, FULLSCREEN_SCROLL_CLASS } from '../lib/fullscreenSurface'
import { saveNoBlameEntry } from '../lib/noBlamePractice'
import './PracticeFlow.css'

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

function OptionList({ options, selected, onPick }) {
  return (
    <div className="practice-flow__choices" role="list">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          className={selected === option.key ? 'is-selected' : ''}
          aria-pressed={selected === option.key}
          onClick={() => onPick(option.key)}
        >
          <span>{option.label}</span>
          <span className="practice-flow__choice-mark" aria-hidden="true">
            •
          </span>
        </button>
      ))}
    </div>
  )
}

function NextAction({ onClick, disabled = false, label = 'Дальше' }) {
  return (
    <button
      className="practice-flow__round-action practice-flow__next-action"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      →
    </button>
  )
}

function NoBlameReleaseScene() {
  return (
    <img
      className="practice-flow__release-scene"
      src={approvedNoBlameRelease}
      alt="Открытая клетка и птица, вылетевшая наружу"
    />
  )
}

function NoBlameKnotGlyph() {
  return (
    <svg className="practice-flow__knot" viewBox="0 0 240 132" aria-hidden="true">
      <path d="M48 72c8-36 38 16 55-25 15-36 51 12 29 34-22 22-59-30-84-9Z" />
      <path d="M55 88c30-69 61 31 107-28" />
      <path d="M70 42c28-22 66 4 57 34-7 24-42 34-63 13" />
      <circle cx="164" cy="59" r="4" />
    </svg>
  )
}

function ReferenceChrome({ editor = false, onClose }) {
  return editor ? (
    <div className="practice-flow__topbar practice-flow__topbar--editor">
      <div className="practice-flow__top-actions" aria-label="Действия редактора">
        <button type="button" aria-label="Добавить заметку">
          •
        </button>
        <button type="button" aria-label="Спокойный режим">
          ∿
        </button>
      </div>
      <div className="practice-flow__identity">
        <span>Mentalix</span>
        <button type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>
    </div>
  ) : (
    <button className="practice-flow__close" type="button" onClick={onClose} aria-label="Закрыть">
      ×
    </button>
  )
}

export default function ProcrastinationFlow({ userId, onClose, onComplete }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('intro')
  const [task, setTask] = useState('')
  const [feeling, setFeeling] = useState(null)
  const [distraction, setDistraction] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [reflection, setReflection] = useState(null)

  const [releasePhrase] = useState(
    () => RELEASE_PHRASES[Math.floor(Math.random() * RELEASE_PHRASES.length)]
  )

  const [secondsLeft, setSecondsLeft] = useState(RUN_SECONDS)
  const [endsAt, setEndsAt] = useState(null)
  const finishedRef = useRef(false)
  const [editorFocused, setEditorFocused] = useState(false)
  const [layoutViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : null
  )
  const [visualViewportMetrics, setVisualViewportMetrics] = useState({
    height: null,
    offsetTop: 0,
    pageTop: 0,
  })

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined
    const update = () =>
      setVisualViewportMetrics({
        height: Math.round(viewport.height),
        offsetTop: Math.round(viewport.offsetTop),
        pageTop: Math.round(viewport.pageTop),
      })
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

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

  function chooseFeeling(key) {
    platform.haptic('light')
    setFeeling(key)
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
    if (onComplete) {
      onComplete()
      return
    }

    onClose()
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  const keyboardOpen =
    editorFocused &&
    visualViewportMetrics.height !== null &&
    layoutViewportHeight !== null &&
    visualViewportMetrics.height < layoutViewportHeight - 80
  const screenStyle = visualViewportMetrics.height
    ? {
        '--pf-viewport-height': `${visualViewportMetrics.height}px`,
        '--pf-visual-viewport-height': `${visualViewportMetrics.height}px`,
        '--pf-visual-viewport-offset-top': `${visualViewportMetrics.offsetTop}px`,
        '--pf-visual-viewport-page-top': `${visualViewportMetrics.pageTop}px`,
        '--pf-visual-viewport-top': `${visualViewportMetrics.pageTop + visualViewportMetrics.offsetTop}px`,
      }
    : undefined
  useLayoutEffect(() => {
    document.querySelector('.practice-flow__body')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [])
  useLayoutEffect(() => {
    if (keyboardOpen) {
      document.querySelector('.practice-flow__body')?.scrollTo(0, 0)
      window.scrollTo(0, 0)
    }
  }, [keyboardOpen])

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-emerald-deep"
      style={{ ...surfaceStyle, paddingTop: '0px' }}
    >
      <div className={`${FULLSCREEN_SCROLL_CLASS} practice-flow__body`}>
        <main
          className="practice-flow"
          style={screenStyle}
          aria-labelledby="practice-flow-title"
          data-state={step}
          data-keyboard-open={keyboardOpen}
        >
          <div className="practice-flow__viewport">
            {step === 'intro' && (
              <div className="practice-flow__screen practice-flow__screen--entry practice-flow__screen--reference-entry">
                <ReferenceChrome onClose={onClose} />
                <NoBlameReleaseScene />
                <h1 id="practice-flow-title">Вернись к делу без давления</h1>
                <p className="practice-flow__lead">
                  Начни с одного безопасного шага. Не нужно сделать всё сразу.
                </p>
                <button
                  className="practice-flow__round-action practice-flow__entry-action"
                  type="button"
                  onClick={startPractice}
                  aria-label="Начать практику"
                >
                  →
                </button>
              </div>
            )}
            {step === 'task' && (
              <PracticeWritingCanvas
                value={task}
                onChange={setTask}
                question="Что сейчас занимает мои мысли?"
                description="Запиши всё как есть. Не пытайся сразу найти правильный ответ."
                placeholder="Начни писать…"
                ariaLabel="Что сейчас занимает мои мысли"
                onSubmit={goToFeeling}
                submitLabel="Дальше"
                contextLabel="Mentalix"
                onClose={onClose}
                autoFocus
                className="practice-flow__writing-canvas"
              />
            )}
            {step === 'feeling' && (
              <div className="practice-flow__screen">
                <p className="practice-flow__kicker">Без вины</p>
                <h1 id="practice-flow-title">Что в этом неприятного?</h1>
                <OptionList options={FEELING_OPTIONS} selected={feeling} onPick={chooseFeeling} />
                <NextAction
                  onClick={() => {
                    if (feeling) {
                      platform.haptic('light')
                      setStep('release')
                    }
                  }}
                  disabled={!feeling}
                  label="Продолжить"
                />
              </div>
            )}
            {step === 'release' && (
              <div className="practice-flow__screen practice-flow__screen--reflection">
                <NoBlameKnotGlyph />
                <p className="practice-flow__kicker">Можно посмотреть мягче</p>
                <h1 id="practice-flow-title">Здесь не за что себя винить</h1>
                <p className="practice-flow__quote">{releasePhrase}</p>
                <NextAction onClick={goToPlan} label="Найти безопасный вход" />
              </div>
            )}
            {step === 'plan' && (
              <div className="practice-flow__screen">
                <p className="practice-flow__kicker">Один честный взгляд</p>
                <h1 id="practice-flow-title">
                  {distraction ? 'Договорись с собой' : 'Что обычно отвлекает вместо этого?'}
                </h1>
                {!distraction ? (
                  <>
                    <OptionList
                      options={DISTRACTION_OPTIONS}
                      selected={distraction}
                      onPick={chooseDistraction}
                    />
                    <NextAction
                      onClick={() => {
                        if (distraction) {
                          platform.haptic('light')
                          setStep('plan-ready')
                        }
                      }}
                      disabled={!distraction}
                      label="Продолжить"
                    />
                  </>
                ) : (
                  <>
                    <p className="practice-flow__lead">
                      Как только снова потянет отвлечься — вернись к делу на две минуты.
                    </p>
                    <NextAction onClick={startRun} label="Начать две минуты" />
                  </>
                )}
              </div>
            )}
            {step === 'plan-ready' && (
              <div className="practice-flow__screen">
                <p className="practice-flow__kicker">Договор с собой</p>
                <h1 id="practice-flow-title">Договорись с собой</h1>
                <p className="practice-flow__lead">
                  Как только снова потянет отвлечься — вернись к делу на две минуты.
                </p>
                <NextAction onClick={startRun} label="Начать две минуты" />
              </div>
            )}
            {step === 'run' && (
              <div className="practice-flow__screen practice-flow__screen--timer">
                <p className="practice-flow__kicker">Без рывка</p>
                <h1 id="practice-flow-title">Только эти две минуты</h1>
                <div className="practice-flow__timer" aria-live="polite">
                  {minutes}:{seconds}
                </div>
                <p className="practice-flow__lead">Не идеально. Просто начни.</p>
                <NextAction onClick={stopRun} label="Остановить" />
              </div>
            )}
            {step === 'outcome' && (
              <div className="practice-flow__screen">
                <p className="practice-flow__kicker">Без вины</p>
                <h1 id="practice-flow-title">Как прошло?</h1>
                <OptionList options={OUTCOME_OPTIONS} selected={outcome} onPick={chooseOutcome} />
                <NextAction
                  onClick={() => {
                    if (outcome) {
                      platform.haptic('light')
                      setStep('complete')
                    }
                  }}
                  disabled={!outcome}
                  label="Продолжить"
                />
              </div>
            )}
            {step === 'complete' && (
              <div className="practice-flow__screen practice-flow__screen--done practice-flow__screen--reference-complete">
                <ReferenceChrome onClose={onClose} />
                <h1 id="practice-flow-title">{COMPLETION_COPY[outcome]?.title}</h1>
                <p className="practice-flow__lead">{COMPLETION_COPY[outcome]?.description}</p>
                <p className="practice-flow__question">Эта практика была полезна?</p>
                <div className="practice-flow__feedback" role="group" aria-label="Помогло сейчас">
                  {REFLECTION_OPTIONS.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      className={reflection === key ? 'is-selected' : ''}
                      aria-pressed={reflection === key}
                      onClick={() => {
                        platform.haptic('light')
                        setReflection(key)
                      }}
                    >
                      <Icon size={23} strokeWidth={1.8} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="practice-flow__primary practice-flow__finish-action"
                  type="button"
                  onClick={finish}
                >
                  Сохранить и завершить
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>,
    document.body
  )
}
