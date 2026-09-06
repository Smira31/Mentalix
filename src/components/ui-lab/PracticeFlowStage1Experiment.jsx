import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

import './PracticeFlowStage1Experiment.css'

const FLOWS = {
  firstStep: {
    label: 'Первый шаг',
    stages: [
      {
        key: 'intro',
        label: 'Вход',
        title: 'Сделай маленький шаг, когда трудно начать',
        copy: 'Пять минут, чтобы найти одно простое действие и начать — без давления сделать всё сразу.',
        visualZone: true,
      },
      {
        key: 'input',
        label: 'Ввод',
        title: 'Что не двигается?',
        copy: 'Одно дело, которое ты откладываешь — не потому что забыл, а потому что не можешь подступиться.',
        input: true,
      },
      {
        key: 'state',
        label: 'Состояние',
        title: 'Что сейчас мешает?',
        choices: [
          'Просто не хочется',
          'Не знаю, с чего начать',
          'Боюсь сделать плохо',
          'Слишком много решений сразу',
          'Устал(а)',
        ],
      },
      {
        key: 'plan',
        label: 'План',
        title: 'Что можно сделать за пять минут?',
        copy: 'Не «написать отчёт», а «открыть документ и записать три пункта».',
        input: true,
      },
      { key: 'timer', label: 'Таймер', title: 'Только этот шаг', timer: true, duration: '05:00' },
      {
        key: 'outcome',
        label: 'Результат',
        title: 'Как прошло?',
        choices: ['Начал(а)', 'Не начал(а)', 'Остановился — было небезопасно'],
      },
      {
        key: 'complete',
        label: 'Завершение',
        title: 'Ты начал(а)',
        copy: 'Дело больше не стоит на месте — этого достаточно на сегодня.',
        feedback: true,
      },
    ],
  },
  noBlame: {
    label: 'Вернись к делу без давления',
    stages: [
      {
        key: 'intro',
        label: 'Вход',
        title: 'Вернись к делу без давления',
        copy: 'Короткая сессия, чтобы заметить, что мешает, и найти один безопасный вход.',
        visualZone: true,
      },
      {
        key: 'input',
        label: 'Ввод',
        title: 'Что откладываешь?',
        copy: 'Запиши дело как есть. Не пытайся сразу найти правильный ответ.',
        input: true,
      },
      {
        key: 'feeling',
        label: 'Выбор',
        title: 'Что в этом неприятного?',
        choices: [
          'Скучно',
          'Тревожно',
          'Боюсь сделать плохо',
          'Просто не хочется',
          'Не знаю почему',
        ],
      },
      {
        key: 'reframing',
        label: 'Разбор',
        title: 'Здесь не за что себя винить',
        copy: 'Мозг искал, где полегче. С кем угодно случается.',
        visualZone: true,
      },
      {
        key: 'distraction',
        label: 'Выбор',
        title: 'Что обычно отвлекает вместо этого?',
        choices: ['Телефон', 'Соцсети', 'Другие дела', 'Уборка', 'Своё'],
      },
      {
        key: 'agreement',
        label: 'Договор',
        title: 'Договорись с собой',
        copy: 'Как только снова потянет отвлечься — вернись к делу на две минуты.',
      },
      {
        key: 'timer',
        label: 'Таймер',
        title: 'Только эти две минуты',
        timer: true,
        duration: '02:00',
      },
      {
        key: 'outcome',
        label: 'Результат',
        title: 'Как прошло?',
        choices: ['Начал(а)', 'Не начал(а)', 'Остановился — было небезопасно'],
      },
      {
        key: 'complete',
        label: 'Завершение',
        title: 'Первый шаг сделан',
        copy: 'Ты не давил на себя — ты вернулся к делу.',
        feedback: true,
      },
    ],
  },
}

function RoundAction({ onClick, disabled = false, label = 'Дальше', direction = 'right' }) {
  return (
    <button
      type="button"
      className="mx-stage1__round-action"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {direction === 'left' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
    </button>
  )
}

function StageCanvas({ flow, stageIndex, setStageIndex, onExit }) {
  const stage = flow.stages[stageIndex]
  const [draft, setDraft] = useState('')
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [keyboard, setKeyboard] = useState({ open: false, bottom: 10 })
  const isFirst = stageIndex === 0
  const isLast = stageIndex === flow.stages.length - 1
  const canAdvance = stage.input ? Boolean(draft.trim()) : stage.choices ? Boolean(selected) : true

  useEffect(() => {
    setCompleted(false)
  }, [stageIndex])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined

    const syncViewport = () => {
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - (viewport.height + viewport.offsetTop)
      )
      setKeyboard({
        open: keyboardHeight > 120,
        bottom: Math.max(10, keyboardHeight + 10),
      })
      if (keyboardHeight > 120 && document.activeElement instanceof HTMLElement) {
        document.activeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }
    }

    syncViewport()
    viewport.addEventListener('resize', syncViewport)
    viewport.addEventListener('scroll', syncViewport)
    return () => {
      viewport.removeEventListener('resize', syncViewport)
      viewport.removeEventListener('scroll', syncViewport)
    }
  }, [])

  function next() {
    if (!canAdvance || isLast) return
    setStageIndex(index => Math.min(index + 1, flow.stages.length - 1))
  }

  function previous() {
    if (isFirst) {
      onExit?.()
      return
    }
    setStageIndex(index => Math.max(index - 1, 0))
  }

  return (
    <section
      className={`mx-stage1__canvas ${keyboard.open ? 'is-keyboard-open' : ''}`}
      aria-label={`${flow.label}: ${stage.label}`}
    >
      <header className="mx-stage1__topbar">
        <button type="button" className="mx-stage1__back" onClick={previous} aria-label="Назад">
          <ArrowLeft size={18} />
          <span>{isFirst ? 'Закрыть' : 'Назад'}</span>
        </button>
        <span className="mx-stage1__stage-label">{stage.label}</span>
      </header>

      <div className={`mx-stage1__content ${stage.feedback ? 'mx-stage1__content--complete' : ''}`}>
        {stage.visualZone && (
          <div className="mx-stage1__visual-zone" aria-hidden="true">
            <span />
          </div>
        )}
        <div className="mx-stage1__meta font-label">{flow.label}</div>
        <h3 className="font-display">{stage.title}</h3>
        {stage.copy && <p className="mx-stage1__copy font-body">{stage.copy}</p>}

        {stage.input && (
          <label className="mx-stage1__input-wrap">
            <span className="sr-only">Текст ответа</span>
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder="Начни писать…"
              rows={5}
              aria-label="Текст ответа"
            />
          </label>
        )}

        {stage.choices && (
          <div className="mx-stage1__choices font-body" role="group" aria-label={stage.title}>
            {stage.choices.map(choice => (
              <button
                key={choice}
                type="button"
                className={selected === choice ? 'is-selected' : ''}
                aria-pressed={selected === choice}
                onClick={() => setSelected(choice)}
              >
                <span>{choice}</span>
                <span className="mx-stage1__choice-dot" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {stage.timer && (
          <div className="mx-stage1__timer" aria-label={stage.duration}>
            <strong>{stage.duration}</strong>
            <span>Не идеально. Просто начни.</span>
          </div>
        )}

        {stage.feedback && !completed && (
          <div className="mx-stage1__feedback font-body" role="group" aria-label="Помогло сейчас?">
            {['Нет', 'Немного', 'Да'].map(value => (
              <button
                key={value}
                type="button"
                className={feedback === value ? 'is-selected' : ''}
                aria-pressed={feedback === value}
                onClick={() => setFeedback(value)}
              >
                {value}
              </button>
            ))}
          </div>
        )}
        {completed && (
          <div className="mx-stage1__completion-status" role="status" aria-live="polite">
            Завершено в Preview. Можно вернуться к началу практики.
          </div>
        )}
      </div>

      <div
        className={`mx-stage1__footer ${keyboard.open ? 'is-keyboard-open' : ''}`}
        style={keyboard.open ? { bottom: `${keyboard.bottom}px` } : undefined}
      >
        <span className="mx-stage1__progress">
          {stageIndex + 1} / {flow.stages.length}
        </span>
        {isLast ? (
          <button
            type="button"
            className="mx-stage1__completion-action"
            onClick={() => setCompleted(true)}
            disabled={!feedback || completed}
          >
            {completed ? 'Завершено' : 'Сохранить и завершить'}
          </button>
        ) : (
          <RoundAction onClick={next} disabled={!canAdvance} label="Продолжить" />
        )}
      </div>
    </section>
  )
}

function BaselineUnavailable() {
  return (
    <div className="mx-stage1__baseline-card" role="note">
      <div className="mx-stage1__baseline-header">
        <span>Baseline</span>
        <strong>Unavailable</strong>
      </div>
      <div className="mx-stage1__baseline-unavailable">
        <h3>Baseline недоступен для live-preview</h3>
        <p>
          Production flow использует portal, user context, сохранение и Telegram shell. Безопасная
          extraction boundary для монтирования здесь ещё не выделена.
        </p>
        <p>
          Минимальная граница: вынести pure flow state machine и read-only callbacks, затем
          подключить production renderer без `save*Entry`, haptics и внешней навигации.
        </p>
      </div>
    </div>
  )
}

export default function PracticeFlowStage1Experiment({ mode = 'candidate', focusPractice = null }) {
  const initialFlowKey = focusPractice === 'no-blame' ? 'noBlame' : 'firstStep'
  const [flowKey, setFlowKey] = useState(initialFlowKey)
  const [stageIndex, setStageIndex] = useState(0)
  const [surfaceMode, setSurfaceMode] = useState(mode === 'compare' ? 'compare' : 'candidate')
  const flow = FLOWS[flowKey]

  function changeFlow(nextFlow) {
    setFlowKey(nextFlow)
    setStageIndex(0)
  }

  if (focusPractice) {
    return (
      <main className="mx-stage1 mx-stage1--focus" aria-label={flow.label}>
        <StageCanvas
          flow={flow}
          stageIndex={stageIndex}
          setStageIndex={setStageIndex}
          onExit={() => setStageIndex(0)}
        />
      </main>
    )
  }

  return (
    <section id="practice-flow-stage1" className="mx-stage1" aria-labelledby="stage1-title">
      <div className="mx-stage1__intro">
        <span>UI-EXP · Guided practice pilot</span>
        <h2 id="stage1-title">Stage 1 · Guided practices</h2>
        <p>Только Preview/UI Lab. Production flow, данные и сохранение не подключены.</p>
      </div>
      <div className="mx-stage1__flow-switch" role="tablist" aria-label="Практика пилота">
        {Object.entries(FLOWS).map(([key, item]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === flowKey}
            className={key === flowKey ? 'is-active' : ''}
            onClick={() => changeFlow(key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="mx-stage1__surface-switch"
        role="tablist"
        aria-label="Поверхность эксперимента"
      >
        {['candidate', 'compare'].map(nextMode => (
          <button
            key={nextMode}
            type="button"
            role="tab"
            aria-selected={surfaceMode === nextMode}
            className={surfaceMode === nextMode ? 'is-active' : ''}
            onClick={() => setSurfaceMode(nextMode)}
          >
            {nextMode === 'candidate' ? 'Candidate' : 'Compare'}
          </button>
        ))}
      </div>
      <div className={surfaceMode === 'compare' ? 'mx-stage1__compare' : 'mx-stage1__single'}>
        {surfaceMode === 'compare' && (
          <div>
            <div className="mx-stage1__column-label">Baseline</div>
            <BaselineUnavailable />
          </div>
        )}
        <div>
          <div className="mx-stage1__column-label">Candidate · Stage 1</div>
          <StageCanvas
            key={`${flowKey}-${stageIndex}`}
            flow={flow}
            stageIndex={stageIndex}
            setStageIndex={setStageIndex}
            onExit={() => setStageIndex(0)}
          />
        </div>
      </div>
      {surfaceMode === 'candidate' && (
        <div className="mx-stage1__stage-strip" aria-label="Шаги сценария">
          {flow.stages.map((item, index) => (
            <button
              key={item.key}
              type="button"
              className={index === stageIndex ? 'is-active' : ''}
              onClick={() => setStageIndex(index)}
            >
              {index + 1}. {item.label}
            </button>
          ))}
        </div>
      )}
      {surfaceMode === 'compare' && (
        <p className="mx-stage1__compare-note">
          <Check size={16} /> Один и тот же сценарий и контент; изменены только shell, grid, CTA и
          interaction grammar.
        </p>
      )}
    </section>
  )
}

export { FLOWS }
