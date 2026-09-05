import { useEffect, useState } from 'react'
import { useVisualViewportHeight } from '../../lib/visualViewport'
import './PracticeFlow.css'

let noBlameFlightPlayed = false

const FEELING_OPTIONS = [
  'Скучно',
  'Тревожно',
  'Боюсь сделать плохо',
  'Просто не хочется',
  'Не знаю почему',
]
const DISTRACTION_OPTIONS = ['Телефон', 'Соцсети', 'Другие дела', 'Уборка', 'Своё']
const OUTCOME_OPTIONS = ['Начал(а)', 'Не начал(а)', 'Остановился — было небезопасно']
const RELEASE_PHRASE =
  'Ты не подводишь себя — это просто мозг защищается от неприятного чувства. Тут не за что себя винить.'
const COMPLETION_COPY = {
  'Начал(а)': ['Первый шаг сделан', 'Ты не давил на себя — ты вернулся к делу.'],
  'Не начал(а)': ['Ты заметил, что мешает', 'Это уже честнее, чем продолжать винить себя.'],
  'Остановился — было небезопасно': [
    'Ты выбрал безопасность',
    'Остановиться вовремя — тоже бережный шаг.',
  ],
}

function OptionList({ options, selected, onPick }) {
  return (
    <div className="practice-flow__choices" role="list">
      {options.map(option => (
        <button
          key={option}
          type="button"
          className={selected === option ? 'is-selected' : ''}
          aria-pressed={selected === option}
          onClick={() => onPick(option)}
        >
          <span>{option}</span>
          <span className="practice-flow__choice-mark" aria-hidden="true">
            ↗
          </span>
        </button>
      ))}
    </div>
  )
}

function NoBlameReleaseScene({ animate = false }) {
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const shouldFly = animate && !reducedMotion && !noBlameFlightPlayed
  const [phase, setPhase] = useState(shouldFly ? 'inside' : 'outside')

  useEffect(() => {
    if (!shouldFly) return undefined
    const launch = window.setTimeout(() => setPhase('flying'), 250)
    const finish = window.setTimeout(() => {
      noBlameFlightPlayed = true
      setPhase('outside')
    }, 1100)
    return () => {
      window.clearTimeout(launch)
      window.clearTimeout(finish)
    }
  }, [shouldFly])

  return (
    <div
      className={`practice-flow__release-scene practice-flow__release-scene--${phase}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 180 130" role="presentation">
        <g className="practice-flow__release-cage">
          <path d="M46 96V48a38 38 0 0 1 76 0v48" />
          <path d="M61 96V50M76 96V46M92 96V44M108 96V48M38 96h92" />
        </g>
        <g className="practice-flow__release-bird">
          <path
            className="practice-flow__release-body"
            d="M70 67c8-13 24-14 35-5-7 16-23 22-35 15Z"
          />
          <path className="practice-flow__release-wing" d="M79 64c7-6 14-5 20 0-8 0-14 5-18 10" />
          <path className="practice-flow__release-beak" d="m104 62 12 4-11 5" />
        </g>
        <circle className="practice-flow__release-accent" cx="133" cy="41" r="3" />
      </svg>
    </div>
  )
}

function ReferenceChrome({ editor = false }) {
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
        <a href="?ui_lab=hub" aria-label="Закрыть">
          ×
        </a>
      </div>
    </div>
  ) : (
    <a className="practice-flow__close" href="?ui_lab=hub" aria-label="Закрыть">
      ×
    </a>
  )
}

export default function PracticeFlow() {
  const [step, setStep] = useState('intro')
  const [task, setTask] = useState('')
  const [feeling, setFeeling] = useState('')
  const [distraction, setDistraction] = useState('')
  const [outcome, setOutcome] = useState('')
  const [reflection, setReflection] = useState('')
  const [endsAt, setEndsAt] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(120)
  const viewportHeight = useVisualViewportHeight()

  useEffect(() => {
    if (!endsAt) return undefined
    const tick = () => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setSecondsLeft(next)
      if (next === 0) {
        setEndsAt(null)
        setStep('outcome')
      }
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [endsAt])

  function startTimer() {
    setSecondsLeft(120)
    setEndsAt(Date.now() + 120000)
    setStep('run')
  }

  function stopTimer() {
    setEndsAt(null)
    setStep('outcome')
  }

  const [completionTitle, completionDescription] =
    COMPLETION_COPY[outcome] || COMPLETION_COPY['Не начал(а)']
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const screenStyle = viewportHeight ? { '--pf-viewport-height': `${viewportHeight}px` } : undefined

  return (
    <main
      className="practice-flow"
      style={screenStyle}
      aria-labelledby="practice-flow-title"
      data-state={step}
    >
      <div className="practice-flow__viewport">
        {step === 'intro' && (
          <div className="practice-flow__screen practice-flow__screen--entry practice-flow__screen--reference-entry">
            <ReferenceChrome />
            <NoBlameReleaseScene animate />
            <h1 id="practice-flow-title">Вернись к делу без давления</h1>
            <p className="practice-flow__lead">
              Начни с одного безопасного шага. Не нужно сделать всё сразу.
            </p>
            <button
              className="practice-flow__round-action practice-flow__entry-action"
              type="button"
              onClick={() => setStep('task')}
              aria-label="Начать практику"
            >
              →
            </button>
          </div>
        )}

        {step === 'task' && (
          <div className="practice-flow__screen practice-flow__screen--write practice-flow__screen--reference-editor">
            <ReferenceChrome editor />
            <h1 id="practice-flow-title">Что сейчас занимает мои мысли?</h1>
            <p className="practice-flow__hint">
              Запиши всё как есть. Не пытайся сразу найти правильный ответ.
            </p>
            <textarea
              value={task}
              onChange={event => setTask(event.target.value)}
              placeholder="Начни писать…"
              aria-label="Что сейчас занимает мои мысли"
              autoFocus
            />
            <div className="practice-flow__editor-bar" aria-label="Действия редактора">
              <div className="practice-flow__editor-tools">
                <button type="button" aria-label="Добавить заметку">
                  •
                </button>
                <button type="button" aria-label="Спокойный режим">
                  ∿
                </button>
                <span className="practice-flow__deeper">Разобрать глубже</span>
              </div>
              <button
                className="practice-flow__round-action"
                type="button"
                disabled={!task.trim()}
                onClick={() => setStep('feeling')}
                aria-label="Дальше"
              >
                ✓
              </button>
            </div>
          </div>
        )}

        {step === 'feeling' && (
          <div className="practice-flow__screen">
            <p className="practice-flow__kicker">Без вины</p>
            <h1 id="practice-flow-title">Что в этом неприятного?</h1>
            <OptionList
              options={FEELING_OPTIONS}
              selected={feeling}
              onPick={value => {
                setFeeling(value)
                setStep('release')
              }}
            />
          </div>
        )}

        {step === 'release' && (
          <div className="practice-flow__screen practice-flow__screen--reflection">
            <NoBlameReleaseScene />
            <p className="practice-flow__kicker">Можно посмотреть мягче</p>
            <h1 id="practice-flow-title">Здесь не за что себя винить</h1>
            <p className="practice-flow__quote">{RELEASE_PHRASE}</p>
            <button
              className="practice-flow__round-action"
              type="button"
              onClick={() => setStep('plan')}
              aria-label="Найти безопасный вход"
            >
              →
            </button>
          </div>
        )}

        {step === 'plan' && !distraction && (
          <div className="practice-flow__screen">
            <p className="practice-flow__kicker">Один честный взгляд</p>
            <h1 id="practice-flow-title">Что обычно отвлекает вместо этого?</h1>
            <OptionList
              options={DISTRACTION_OPTIONS}
              selected={distraction}
              onPick={value => setDistraction(value)}
            />
          </div>
        )}

        {step === 'plan' && distraction && (
          <div className="practice-flow__screen practice-flow__screen--agreement">
            <p className="practice-flow__kicker">Договор с собой</p>
            <h1 id="practice-flow-title">Договорись с собой</h1>
            <p className="practice-flow__lead">
              Как только снова потянет отвлечься — вернись к делу на две минуты.
            </p>
            <button className="practice-flow__primary" type="button" onClick={startTimer}>
              Начать две минуты <span>→</span>
            </button>
          </div>
        )}

        {step === 'run' && (
          <div className="practice-flow__screen practice-flow__screen--timer">
            <p className="practice-flow__kicker">Без рывка</p>
            <h1 id="practice-flow-title">Только эти две минуты</h1>
            <div className="practice-flow__timer" aria-live="polite">
              {minutes}:{seconds}
            </div>
            <NoBlameReleaseScene />
            <p className="practice-flow__lead">Не идеально. Просто начни.</p>
            <button className="practice-flow__quiet-action" type="button" onClick={stopTimer}>
              Остановить
            </button>
          </div>
        )}

        {step === 'outcome' && (
          <div className="practice-flow__screen">
            <p className="practice-flow__kicker">Без вины</p>
            <h1 id="practice-flow-title">Как прошло?</h1>
            <OptionList
              options={OUTCOME_OPTIONS}
              selected={outcome}
              onPick={value => {
                setOutcome(value)
                setStep('complete')
              }}
            />
          </div>
        )}

        {step === 'complete' && (
          <div className="practice-flow__screen practice-flow__screen--done practice-flow__screen--reference-complete">
            <ReferenceChrome />
            <NoBlameReleaseScene />
            <h1 id="practice-flow-title">{completionTitle}</h1>
            <p className="practice-flow__lead">{completionDescription}</p>
            <p className="practice-flow__question">Эта практика была полезна?</p>
            <div className="practice-flow__feedback" role="group" aria-label="Помогло сейчас">
              {['Нет', 'Немного', 'Да'].map((value, index) => (
                <button
                  key={value}
                  type="button"
                  className={reflection === value ? 'is-selected' : ''}
                  onClick={() => setReflection(value)}
                >
                  <span aria-hidden="true">{['·', '∿', '＋'][index]}</span>
                  {value}
                </button>
              ))}
            </div>
            <button
              className="practice-flow__primary practice-flow__finish-action"
              type="button"
              onClick={() => setStep('intro')}
            >
              Сохранить и завершить
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
