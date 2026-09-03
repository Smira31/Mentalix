import { useEffect, useRef, useState } from 'react'

import SemanticGlyph from '../SemanticGlyph'

import './PracticeCatalogExperiment.css'

const CARDS = [
  {
    kind: 'breath',
    title: 'Дыхание',
    description: 'вернуться в ровный ритм',
    meta: '1 минута',
  },
  {
    kind: 'focus',
    title: 'Фокус',
    description: 'собрать внимание в одну точку',
    meta: '25 минут',
  },
  {
    kind: 'anxiety',
    title: 'Эмоции',
    description: 'заметить, что происходит внутри',
    meta: '2 минуты',
  },
  {
    kind: 'journal',
    title: 'Рефлексия',
    description: 'назвать главное за сегодня',
    meta: '5 минут',
  },
  {
    kind: 'companion',
    title: 'Отношения',
    description: 'услышать себя и другого',
    meta: '3 минуты',
  },
  {
    kind: 'meditation',
    title: 'Медитация',
    description: 'побыть с тем, что есть',
    meta: '5 минут',
  },
]

const RUN_DURATION = 60
const BREATH_PHASES = [
  { key: 'inhale', label: 'вдох', seconds: 4 },
  { key: 'pause', label: 'пауза', seconds: 2 },
  { key: 'exhale', label: 'выдох', seconds: 6 },
  { key: 'rest', label: 'пауза', seconds: 2 },
]
const BREATH_CYCLE = BREATH_PHASES.reduce((total, phase) => total + phase.seconds, 0)

function PreviewNavigation() {
  return (
    <nav className="mx-practice-catalog__nav" aria-label="Навигация Preview-карточки">
      {['Сегодня', 'Практики', 'Наставник', 'Библиотека', 'Тренды'].map(label => (
        <span key={label} data-active={label === 'Практики'}>
          {label}
        </span>
      ))}
    </nav>
  )
}

function FlowBack({ onClick, label = 'Назад к практикам' }) {
  return (
    <button type="button" className="mx-practice-flow__back" onClick={onClick}>
      <span aria-hidden="true">←</span>
      {label}
    </button>
  )
}

function PracticeIntro({ onBack, onStart }) {
  return (
    <section className="mx-practice-flow" aria-labelledby="practice-flow-title">
      <FlowBack onClick={onBack} />
      <div className="mx-practice-flow__intro">
        <span className="mx-practice-flow__eyebrow">Практика · 1 минута</span>
        <h2 id="practice-flow-title">Дыхание</h2>
        <p>Мягкий ритм помогает на минуту отойти от шума и заметить, как ты сейчас.</p>
        <div className="mx-practice-flow__hero" aria-hidden="true">
          <SemanticGlyph kind="breath" animated={false} highlighted={false} />
        </div>
        <button type="button" className="mx-practice-flow__primary" onClick={onStart}>
          Начать
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

function getBreathPhase(elapsed) {
  const secondInCycle = elapsed % BREATH_CYCLE
  let cursor = 0

  for (const phase of BREATH_PHASES) {
    cursor += phase.seconds
    if (secondInCycle < cursor) return phase
  }

  return BREATH_PHASES[0]
}

function PracticeRun({ elapsed, onExit, onFinish }) {
  const phase = getBreathPhase(elapsed)
  const progress = Math.min(100, (elapsed / RUN_DURATION) * 100)
  const remaining = Math.max(0, RUN_DURATION - Math.floor(elapsed))

  return (
    <section
      className="mx-practice-flow mx-practice-flow--run"
      aria-labelledby="practice-run-title"
    >
      <div className="mx-practice-flow__run-top">
        <span>Дыхание</span>
        <button type="button" onClick={onExit} aria-label="Выйти из практики">
          Выйти
        </button>
      </div>
      <div className="mx-practice-flow__progress" aria-label={`${remaining} секунд осталось`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="mx-practice-flow__run-center">
        <div className="mx-practice-flow__breath-art" data-phase={phase.key} aria-hidden="true">
          <SemanticGlyph kind="breath" animated={false} highlighted={false} />
          <span />
        </div>
        <h2 id="practice-run-title">{phase.label}</h2>
        <span className="mx-practice-flow__remaining">{remaining} сек</span>
      </div>
      <button type="button" className="mx-practice-flow__finish" onClick={onFinish}>
        Завершить
      </button>
    </section>
  )
}

function PracticeDone({ onContinue }) {
  const [reflection, setReflection] = useState('')
  const answers = ['тише', 'ровнее', 'пока так же']

  return (
    <section
      className="mx-practice-flow mx-practice-flow--done"
      aria-labelledby="practice-done-title"
    >
      <div className="mx-practice-flow__done-mark" aria-hidden="true">
        <SemanticGlyph kind="breath" animated={false} highlighted={false} />
      </div>
      <span className="mx-practice-flow__eyebrow">Минута завершена</span>
      <h2 id="practice-done-title">Ты вернулся к дыханию</h2>
      <p>Что изменилось в твоём состоянии?</p>
      <div className="mx-practice-flow__answers" role="radiogroup" aria-label="Изменение состояния">
        {answers.map(answer => (
          <button
            type="button"
            key={answer}
            role="radio"
            aria-checked={reflection === answer}
            data-selected={reflection === answer}
            onClick={() => setReflection(answer)}
          >
            {answer}
          </button>
        ))}
      </div>
      <button type="button" className="mx-practice-flow__primary" onClick={onContinue}>
        Продолжить
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

export default function PracticeCatalogExperiment() {
  const railRef = useRef(null)
  const [screen, setScreen] = useState('catalog')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (screen !== 'run') return undefined

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const nextElapsed = (Date.now() - startedAt) / 1000
      setElapsed(nextElapsed)
      if (nextElapsed >= RUN_DURATION) setScreen('done')
    }, 200)

    return () => window.clearInterval(timer)
  }, [screen])

  function startPractice() {
    setElapsed(0)
    setScreen('run')
  }

  if (screen === 'intro') {
    return <PracticeIntro onBack={() => setScreen('catalog')} onStart={startPractice} />
  }

  if (screen === 'run') {
    return (
      <PracticeRun
        elapsed={elapsed}
        onExit={() => setScreen('catalog')}
        onFinish={() => setScreen('done')}
      />
    )
  }

  if (screen === 'done') {
    return <PracticeDone onContinue={() => setScreen('catalog')} />
  }

  return (
    <section className="mx-practice-catalog" aria-labelledby="practice-catalog-title">
      <div className="mx-practice-catalog__head">
        <span>Практики · Preview-only</span>
        <h2 id="practice-catalog-title">Шесть способов вернуться к себе</h2>
        <p>
          Две крупные карточки остаются в поле зрения, а следующий ряд мягко выглядывает справа.
        </p>
      </div>

      <div className="mx-practice-catalog__frame">
        <div
          ref={railRef}
          className="mx-practice-catalog__rail"
          aria-label="Каталог практик. Проведи в сторону, чтобы увидеть следующие карточки."
        >
          {CARDS.map(card => (
            <button
              className="mx-practice-catalog__card"
              type="button"
              key={card.title}
              onClick={card.title === 'Дыхание' ? () => setScreen('intro') : undefined}
            >
              <span className="mx-practice-catalog__art" aria-hidden="true">
                <SemanticGlyph kind={card.kind} animated={false} highlighted={false} />
              </span>
              <span className="mx-practice-catalog__copy">
                <span className="mx-practice-catalog__meta">{card.meta}</span>
                <strong>{card.title}</strong>
                <span>{card.description}</span>
              </span>
            </button>
          ))}
        </div>

        <PreviewNavigation />
      </div>
    </section>
  )
}
