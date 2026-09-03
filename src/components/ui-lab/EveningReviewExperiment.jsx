import { useState } from 'react'

import SemanticGlyph from '../SemanticGlyph'

import './EveningReviewExperiment.css'

const STEPS = [
  {
    key: 'result',
    eyebrow: 'Фактический результат',
    title: 'Что получилось сегодня?',
    options: ['Сделал главное', 'Сделал часть', 'День пошёл иначе'],
  },
  {
    key: 'reflection',
    eyebrow: 'Короткая рефлексия',
    title: 'Что забираешь с собой?',
    options: ['Ясность', 'Опыт', 'Нужно отпустить'],
  },
  {
    key: 'pattern',
    eyebrow: 'Закономерность',
    title: 'Что повторяется?',
    options: ['Маленький шаг помогает', 'Тороплюсь — теряю фокус', 'Сегодня не вижу связи'],
  },
  {
    key: 'next',
    eyebrow: 'Завтра · один шаг',
    title: 'Что будет достаточно сделать?',
    options: ['Начать с пяти минут', 'Оставить место для паузы', 'Вернуться к главному'],
  },
]

function ReviewEntry({ onStart }) {
  return (
    <section className="mx-evening-review__entry" aria-labelledby="evening-review-title">
      <span className="mx-evening-review__eyebrow">Today · reviewPending</span>
      <h2 id="evening-review-title">Разобрать день</h2>
      <p>Посмотреть на факты, заметить главное и оставить завтрашнему дню один шаг.</p>
      <div className="mx-evening-review__entry-art" aria-hidden="true">
        <SemanticGlyph kind="release" animated={false} highlighted={false} />
      </div>
      <span className="mx-evening-review__duration">около 1 минуты</span>
      <button type="button" className="mx-evening-review__primary" onClick={onStart}>
        Разобрать день
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

function ReviewStep({ step, index, answer, onAnswer, onBack, onExit }) {
  const selected = Boolean(answer)

  return (
    <section className="mx-evening-review__step" aria-labelledby="evening-review-step-title">
      <div className="mx-evening-review__topline">
        <button type="button" onClick={onBack} aria-label="Назад">
          ← Назад
        </button>
        <span>
          {index + 1} / {STEPS.length}
        </span>
        <button type="button" onClick={onExit} aria-label="Выйти из разбора">
          Выйти
        </button>
      </div>
      <div className="mx-evening-review__step-progress" aria-hidden="true">
        <span style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
      </div>
      <div className="mx-evening-review__step-center">
        <span className="mx-evening-review__eyebrow">{step.eyebrow}</span>
        <h2 id="evening-review-step-title">{step.title}</h2>
        <div className="mx-evening-review__choices" role="radiogroup" aria-label={step.title}>
          {step.options.map(option => (
            <button
              type="button"
              key={option}
              role="radio"
              aria-checked={answer === option}
              data-selected={answer === option}
              onClick={() => onAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="mx-evening-review__primary"
        disabled={!selected}
        onClick={() => onAnswer('__next__')}
      >
        {index === STEPS.length - 1 ? 'Закрыть день' : 'Дальше'}
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

function ReviewClosed({ onContinue }) {
  return (
    <section className="mx-evening-review__closed" aria-labelledby="evening-review-closed-title">
      <div className="mx-evening-review__closed-art" aria-hidden="true">
        <SemanticGlyph kind="finish" animated={false} highlighted={false} />
      </div>
      <span className="mx-evening-review__eyebrow">День закрыт</span>
      <h2 id="evening-review-closed-title">Главное осталось с тобой</h2>
      <p>Завтра достаточно вернуться к одному выбранному шагу.</p>
      <button type="button" className="mx-evening-review__primary" onClick={onContinue}>
        Продолжить
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

export default function EveningReviewExperiment({ onDayClosed } = {}) {
  const [screen, setScreen] = useState('entry')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  function reset() {
    setScreen('entry')
    setStepIndex(0)
    setAnswers({})
  }

  function choose(value) {
    if (value === '__next__') {
      if (stepIndex === STEPS.length - 1) {
        setScreen('closed')
      } else {
        setStepIndex(current => current + 1)
      }
      return
    }

    setAnswers(current => ({ ...current, [STEPS[stepIndex].key]: value }))
  }

  if (screen === 'entry') {
    return (
      <section className="mx-evening-review" aria-labelledby="evening-review-experiment-title">
        <div className="mx-evening-review__experiment-head">
          <span>Вечерний разбор · Preview-only</span>
          <h2 id="evening-review-experiment-title">Закрыть день без отчёта</h2>
          <p>Один короткий маршрут: факт, вывод, закономерность и следующий шаг.</p>
        </div>
        <div className="mx-evening-review__surface">
          <ReviewEntry onStart={() => setScreen('step')} />
        </div>
      </section>
    )
  }

  if (screen === 'closed') {
    return (
      <div className="mx-evening-review__overlay">
        <ReviewClosed onContinue={onDayClosed || reset} />
      </div>
    )
  }

  const step = STEPS[stepIndex]
  const answer = answers[step.key]

  return (
    <div className="mx-evening-review__overlay">
      <ReviewStep
        step={step}
        index={stepIndex}
        answer={answer}
        onAnswer={choose}
        onBack={() => (stepIndex === 0 ? setScreen('entry') : setStepIndex(current => current - 1))}
        onExit={reset}
      />
    </div>
  )
}
