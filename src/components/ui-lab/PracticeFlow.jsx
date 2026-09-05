import { useEffect, useState } from 'react'
import SemanticGlyph from '../SemanticGlyph'
import { useVisualViewportHeight } from '../../lib/visualViewport'
import './PracticeFlow.css'

const CHOICES = [
  'Боюсь ошибиться',
  'Не понимаю, с чего начать',
  'Слишком много всего',
  'Не хочу себя заставлять',
  'Другое',
]
const STATE_TITLES = {
  entry: 'Вернись к делу без давления',
  choice: 'Что в этом неприятного?',
  reflection: 'Можно посмотреть мягче',
  write: 'Назови то, что сейчас есть',
  timer: 'Только эти две минуты',
  done: 'Ты выбрал безопасность',
}

function PathLine({ state, pulse = false }) {
  return (
    <div
      className={`practice-flow__path practice-flow__path--${state} ${pulse ? 'is-pulsing' : ''}`}
      aria-hidden="true"
    >
      <span className="practice-flow__path-dot practice-flow__path-dot--start" />
      <span className="practice-flow__path-stroke" />
      <span className="practice-flow__path-dot practice-flow__path-dot--end" />
    </div>
  )
}

function BirdCage({ open = false, entry = false }) {
  return (
    <div
      className={`practice-flow__scene ${open ? 'is-open' : ''} ${entry ? 'is-entry' : ''}`}
      aria-hidden="true"
    >
      <div className="practice-flow__cage">
        <i />
        <i />
        <i />
        <i />
        <b />
      </div>
      <div className="practice-flow__bird">
        <span />
        <i />
        <b />
      </div>
      <SemanticGlyph kind={open ? 'release' : 'asceza'} animated={false} highlighted={false} />
    </div>
  )
}

function ChoiceList({ selected, onSelect }) {
  return (
    <div className="practice-flow__choices" role="list">
      {CHOICES.map(choice => (
        <button
          key={choice}
          type="button"
          className={selected === choice ? 'is-selected' : ''}
          aria-pressed={selected === choice}
          onClick={() => onSelect(choice)}
        >
          <span>{choice}</span>
          <span className="practice-flow__choice-mark" aria-hidden="true">
            ↗
          </span>
        </button>
      ))}
    </div>
  )
}

export default function PracticeFlow() {
  const [state, setState] = useState('entry')
  const [choice, setChoice] = useState('')
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [pulse, setPulse] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [remaining, setRemaining] = useState(120)
  const viewportHeight = useVisualViewportHeight()

  function go(next) {
    setPulse(true)
    window.setTimeout(() => setPulse(false), 420)
    setState(next)
    if (next === 'timer') {
      setStartedAt(Date.now())
      setRemaining(120)
    }
  }

  useEffect(() => {
    if (state !== 'timer' || !startedAt) return undefined
    const interval = window.setInterval(() => {
      const next = Math.max(0, 120 - Math.floor((Date.now() - startedAt) / 1000))
      setRemaining(next)
      if (next === 0) window.clearInterval(interval)
    }, 250)
    return () => window.clearInterval(interval)
  }, [state, startedAt])

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')
  const screenStyle = viewportHeight ? { '--pf-viewport-height': `${viewportHeight}px` } : undefined

  return (
    <main
      className="practice-flow"
      style={screenStyle}
      aria-labelledby="practice-flow-title"
      data-state={state}
    >
      <div className="practice-flow__viewport">
        {state === 'entry' && (
          <div className="practice-flow__screen practice-flow__screen--entry">
            <BirdCage entry />
            <p className="practice-flow__kicker">Короткая практика</p>
            <h1 id="practice-flow-title">{STATE_TITLES.entry}</h1>
            <p className="practice-flow__lead">
              Не нужно быть готовым. Достаточно дать себе две спокойные минуты.
            </p>
            <button className="practice-flow__primary" type="button" onClick={() => go('choice')}>
              Начать практику <span>→</span>
            </button>
          </div>
        )}

        {state === 'choice' && (
          <div className="practice-flow__screen">
            <p className="practice-flow__kicker">Сначала — заметить</p>
            <h1 id="practice-flow-title">{STATE_TITLES.choice}</h1>
            <p className="practice-flow__lead">
              Выбери то, что ближе. Здесь нет неправильного ответа.
            </p>
            <ChoiceList selected={choice} onSelect={setChoice} />
            <button
              className="practice-flow__round-action"
              type="button"
              disabled={!choice}
              onClick={() => go('reflection')}
              aria-label="Продолжить"
            >
              →
            </button>
          </div>
        )}

        {state === 'reflection' && (
          <div className="practice-flow__screen practice-flow__screen--reflection">
            <SemanticGlyph kind="release" animated={false} highlighted />
            <PathLine state="reflection" pulse={pulse} />
            <p className="practice-flow__kicker">Один взгляд изнутри</p>
            <h1 id="practice-flow-title">{STATE_TITLES.reflection}</h1>
            <p className="practice-flow__quote">
              «{choice || 'То, что ты заметил'}» — это сигнал, а не приговор. Можно не чинить всё
              сразу. Можно выбрать маленький безопасный шаг.
            </p>
            <button
              className="practice-flow__round-action"
              type="button"
              onClick={() => go('write')}
              aria-label="Перейти к записи"
            >
              →
            </button>
          </div>
        )}

        {state === 'write' && (
          <div className="practice-flow__screen practice-flow__screen--write">
            <p className="practice-flow__kicker">Дай этому место</p>
            <h1 id="practice-flow-title">{STATE_TITLES.write}</h1>
            <p className="practice-flow__hint">
              Пара слов или целый поток — пиши так, как получается.
            </p>
            <textarea
              value={text}
              onChange={event => setText(event.target.value)}
              placeholder="Что ты замечаешь прямо сейчас?"
              aria-label="Текст практики"
            />
            {/* UI Lab owns this editor dock and circular continuation action; iOS/WebView owns only the keyboard chrome. */}
            <div className="practice-flow__editor-bar" aria-label="Инструменты редактора">
              <button type="button" aria-label="Добавить">
                +
              </button>
              <button type="button" aria-label="Форматирование">
                Aa
              </button>
              <button
                type="button"
                className="practice-flow__deeper"
                onClick={() =>
                  setText(value =>
                    value ? `${value}\n\nЧто ещё важно не потерять?` : 'Что ещё важно не потерять?'
                  )
                }
              >
                Разобрать глубже
              </button>
              <button
                className="practice-flow__round-action"
                type="button"
                onClick={() => go('timer')}
                aria-label="Начать две минуты"
              >
                →
              </button>
            </div>
          </div>
        )}

        {state === 'timer' && (
          <div className="practice-flow__screen practice-flow__screen--timer">
            <p className="practice-flow__kicker">Без рывка</p>
            <h1 id="practice-flow-title">{STATE_TITLES.timer}</h1>
            <div className="practice-flow__timer" aria-live="polite">
              {minutes}:{seconds}
            </div>
            <PathLine state="timer" pulse={pulse} />
            <p className="practice-flow__lead">
              Можно просто оставаться рядом с тем, что уже появилось.
            </p>
            <button
              className="practice-flow__quiet-action"
              type="button"
              onClick={() => go('done')}
            >
              Остановить
            </button>
          </div>
        )}

        {state === 'done' && (
          <div className="practice-flow__screen practice-flow__screen--done">
            <BirdCage open />
            <p className="practice-flow__kicker">Практика завершена</p>
            <h1 id="practice-flow-title">{STATE_TITLES.done}</h1>
            <p className="practice-flow__lead">
              Ты не стал давить на себя. Это уже забота о том, что важно.
            </p>
            <div className="practice-flow__feedback" role="group" aria-label="Обратная связь">
              {['Стало легче', 'Просто заметил', 'Хочу повторить'].map(item => (
                <button
                  key={item}
                  type="button"
                  className={feedback === item ? 'is-selected' : ''}
                  onClick={() => setFeedback(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button className="practice-flow__primary" type="button" onClick={() => go('entry')}>
              Вернуться к практикам <span>→</span>
            </button>
            <a href="?ui_lab=hub" className="practice-flow__secondary">
              В Сегодня
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
