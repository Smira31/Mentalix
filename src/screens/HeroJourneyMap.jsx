import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight } from 'lucide-react'

import BackButton from '../components/BackButton'
import SemanticGlyph from '../components/SemanticGlyph'
import { platform } from '../platform'
import {
  getFullscreenPortalTarget,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import { HERO_JOURNEY_TRIALS, TRIAL_QUESTIONS, findTrial } from '../data/heroJourney'
import './HeroJourneyMap.css'

function StageShell({ children, onBack }) {
  const { style } = useFullscreenSurface()

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-hero-journey`} style={style}>
      <div className="mx-hero-journey__screen mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-[var(--mx-screen-x)]">
        <div className="mx-hero-journey__header grid h-[52px] shrink-0 grid-cols-[1fr_auto_1fr] items-center">
          <BackButton onClick={onBack} />
          <span className="mx-type-section text-cream">Путь героя</span>
          <span aria-hidden="true" />
        </div>
        <div className={`${FULLSCREEN_SCROLL_CLASS} mx-hero-journey__content`}>{children}</div>
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}

function Intro({ onStart, onBack }) {
  return (
    <StageShell onBack={onBack}>
      <div className="mx-hero-journey__intro">
        <div className="mx-hero-journey__hero" aria-hidden="true">
          <SemanticGlyph kind="path-corridor" animated className="mx-hero-journey__glyph" />
        </div>
        <div className="mx-hero-journey__intro-copy">
          <p className="mx-hero-journey__eyebrow">путь героя</p>
          <h1 className="mx-hero-journey__intro-title font-display text-cream">
            Какое испытание сейчас твоё?
          </h1>
          <p className="mx-hero-journey__intro-description">
            Четыре коротких вопроса — и карта испытаний, через которые проходит современный
            человек. Не тест и не диагноз. Ориентир, с которого можно начать.
          </p>
        </div>
        <div className="mx-hero-journey__intro-actions">
          <button
            type="button"
            onClick={onStart}
            className="mx-hero-journey__cta cta-pill mx-type-flow-action"
          >
            Начать <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </StageShell>
  )
}

function QuestionStep({ step, stepIndex, totalSteps, selected, onPick, onNext, onBack }) {
  return (
    <StageShell onBack={onBack}>
      <div className="mx-hero-journey__question">
        <div className="mx-hero-journey__progress">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`mx-hero-journey__progress-dot ${i <= stepIndex ? 'is-active' : ''}`}
            />
          ))}
        </div>
        <h1 className="mx-hero-journey__question-title font-display text-cream">
          {step.question}
        </h1>
        <div className="mx-hero-journey__options" role="group" aria-label={step.question}>
          {step.options.map(option => (
            <button
              key={option.trialId}
              type="button"
              aria-pressed={selected === option.trialId}
              onClick={() => onPick(option.trialId)}
              className={`mx-hero-journey__option ${selected === option.trialId ? 'is-active' : ''}`}
            >
              <span className="mx-type-card">{option.label}</span>
            </button>
          ))}
        </div>
        <div className="mx-hero-journey__action-zone">
          <button
            type="button"
            onClick={onNext}
            disabled={!selected}
            className="mx-hero-journey__cta cta-pill mx-type-flow-action"
          >
            {stepIndex === totalSteps - 1 ? 'Посмотреть карту' : 'Дальше'}{' '}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </StageShell>
  )
}

function TrialCard({ trial, onPickAnother, onBack }) {
  return (
    <StageShell onBack={onBack}>
      <div className="mx-hero-journey__result">
        <div className="mx-hero-journey__result-art" aria-hidden="true">
          <SemanticGlyph kind="focus-convergence" animated={false} />
        </div>
        <p className="mx-hero-journey__eyebrow">
          испытание {trial.number} из {HERO_JOURNEY_TRIALS.length}
        </p>
        <h1 className="mx-hero-journey__result-title font-display text-cream">{trial.title}</h1>
        <p className="mx-hero-journey__result-subtitle">{trial.subtitle}</p>
        <p className="mx-hero-journey__result-description">{trial.description}</p>

        <div className="mx-hero-journey__prompt-block">
          <span className="mx-hero-journey__prompt-label">спроси себя</span>
          <p className="mx-hero-journey__prompt-text">{trial.prompt}</p>
        </div>

        <div className="mx-hero-journey__action-block">
          <span className="mx-hero-journey__action-label">один шаг</span>
          <p className="mx-hero-journey__action-text">{trial.action}</p>
        </div>

        <div className="mx-hero-journey__shadow-block">
          <span className="mx-hero-journey__shadow-label">как не пройти</span>
          <p className="mx-hero-journey__shadow-text">{trial.shadowAction}</p>
        </div>

        <div className="mx-hero-journey__result-actions">
          <button
            type="button"
            onClick={onPickAnother}
            className="mx-hero-journey__cta cta-pill mx-type-flow-action"
          >
            Другое испытание <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </StageShell>
  )
}

function AllTrials({ onPickTrial, onBack }) {
  return (
    <StageShell onBack={onBack}>
      <div className="mx-hero-journey__all">
        <h1 className="mx-hero-journey__all-title font-display text-cream">
          16 испытаний
        </h1>
        <p className="mx-hero-journey__all-subtitle">
          Каждое можно пройти или отступить. Отступление формирует долг, который потом догоняет.
        </p>
        <div className="mx-hero-journey__trials-list">
          {HERO_JOURNEY_TRIALS.map(trial => (
            <button
              key={trial.id}
              type="button"
              onClick={() => onPickTrial(trial.id)}
              className="mx-hero-journey__trial-row"
            >
              <span className="mx-hero-journey__trial-number">{trial.number}</span>
              <span className="mx-hero-journey__trial-info">
                <span className="mx-type-card text-cream">{trial.title}</span>
                <span className="mx-hero-journey__trial-subtitle">{trial.subtitle}</span>
              </span>
              <ArrowRight size={16} className="mx-hero-journey__trial-arrow" />
            </button>
          ))}
        </div>
      </div>
    </StageShell>
  )
}

export default function HeroJourneyMap({ onBack }) {
  const [stage, setStage] = useState('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selectedTrialId, setSelectedTrialId] = useState(null)

  const totalSteps = TRIAL_QUESTIONS.length
  const currentQuestion = TRIAL_QUESTIONS[questionIndex]

  const resultTrial = useMemo(() => {
    if (!selectedTrialId) return null
    return findTrial(selectedTrialId)
  }, [selectedTrialId])

  function start() {
    platform.haptic('light')
    setStage('questions')
  }

  function pick(trialId) {
    platform.haptic('light')
    setAnswers(prev => ({ ...prev, [questionIndex]: trialId }))
  }

  function next() {
    if (questionIndex < totalSteps - 1) {
      platform.haptic('light')
      setQuestionIndex(idx => idx + 1)
    } else {
      // последний ответ — показываем результат
      const lastAnswer = answers[totalSteps - 1] || answers[questionIndex]
      setSelectedTrialId(lastAnswer)
      platform.haptic('success')
      setStage('result')
    }
  }

  function goBack() {
    if (stage === 'questions' && questionIndex > 0) {
      platform.haptic('light')
      setQuestionIndex(idx => idx - 1)
      return
    }
    if (stage === 'questions') {
      platform.haptic('light')
      setStage('intro')
      return
    }
    if (stage === 'result') {
      setStage('all')
      return
    }
    onBack()
  }

  function pickAnother() {
    setStage('all')
  }

  function pickTrial(trialId) {
    platform.haptic('light')
    setSelectedTrialId(trialId)
    setStage('result')
  }

  if (stage === 'intro') return <Intro onStart={start} onBack={onBack} />

  if (stage === 'questions') {
    return (
      <QuestionStep
        step={currentQuestion}
        stepIndex={questionIndex}
        totalSteps={totalSteps}
        selected={answers[questionIndex]}
        onPick={pick}
        onNext={next}
        onBack={goBack}
      />
    )
  }

  if (stage === 'result' && resultTrial) {
    return (
      <TrialCard
        trial={resultTrial}
        onPickAnother={pickAnother}
        onBack={goBack}
      />
    )
  }

  return <AllTrials onPickTrial={pickTrial} onBack={onBack} />
}
