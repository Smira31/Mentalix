import { useEffect, useState } from 'react'
import approvedNoBlameRelease from '../../assets/ui-lab/approved-no-blame-release.png'
import { NoBlameKnotGlyph } from './NoBlameGlyphs'
import './PracticeFlow.css'

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
  const [editorFocused, setEditorFocused] = useState(false)
  const [layoutViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : null
  )
  const [visualViewportMetrics, setVisualViewportMetrics] = useState({
    height: null,
    offsetTop: 0,
  })

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined

    const update = () => {
      setVisualViewportMetrics({
        height: Math.round(viewport.height),
        offsetTop: Math.round(viewport.offsetTop),
      })
    }

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
      }
    : undefined

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
            <NoBlameReleaseScene />
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
              onFocus={() => setEditorFocused(true)}
              onBlur={() => setEditorFocused(false)}
            />
            <div
              className={`practice-flow__editor-bar${keyboardOpen ? ' practice-flow__editor-bar--keyboard' : ''}`}
              aria-label="Действия редактора"
            >
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
                className="practice-flow__round-action practice-flow__next-action"
                type="button"
                disabled={!task.trim()}
                onClick={() => setStep('feeling')}
                aria-label="Дальше"
              >
                →
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
              onPick={value => setFeeling(value)}
            />
            <NextAction onClick={() => setStep('release')} disabled={!feeling} label="Продолжить" />
          </div>
        )}

        {step === 'release' && (
          <div className="practice-flow__screen practice-flow__screen--reflection">
            <NoBlameKnotGlyph />
            <p className="practice-flow__kicker">Можно посмотреть мягче</p>
            <h1 id="practice-flow-title">Здесь не за что себя винить</h1>
            <p className="practice-flow__quote">{RELEASE_PHRASE}</p>
            <NextAction onClick={() => setStep('plan')} label="Найти безопасный вход" />
          </div>
        )}

        {step === 'plan' && (
          <div className="practice-flow__screen">
            <p className="practice-flow__kicker">Один честный взгляд</p>
            <h1 id="practice-flow-title">Что обычно отвлекает вместо этого?</h1>
            <OptionList
              options={DISTRACTION_OPTIONS}
              selected={distraction}
              onPick={value => setDistraction(value)}
            />
            <NextAction
              onClick={() => setStep('agreement')}
              disabled={!distraction}
              label="Продолжить"
            />
          </div>
        )}

        {step === 'agreement' && (
          <div className="practice-flow__screen practice-flow__screen--agreement">
            <p className="practice-flow__kicker">Договор с собой</p>
            <h1 id="practice-flow-title">Договорись с собой</h1>
            <p className="practice-flow__lead">
              Как только снова потянет отвлечься — вернись к делу на две минуты.
            </p>
            <NextAction onClick={startTimer} label="Начать две минуты" />
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
            <NextAction onClick={stopTimer} label="Остановить" />
          </div>
        )}

        {step === 'outcome' && (
          <div className="practice-flow__screen">
            <p className="practice-flow__kicker">Без вины</p>
            <h1 id="practice-flow-title">Как прошло?</h1>
            <OptionList
              options={OUTCOME_OPTIONS}
              selected={outcome}
              onPick={value => setOutcome(value)}
            />
            <NextAction
              onClick={() => setStep('complete')}
              disabled={!outcome}
              label="Продолжить"
            />
          </div>
        )}

        {step === 'complete' && (
          <div className="practice-flow__screen practice-flow__screen--done practice-flow__screen--reference-complete">
            <ReferenceChrome />
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
