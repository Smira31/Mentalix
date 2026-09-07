import { useState } from 'react'
import { createPortal } from 'react-dom'

import BackButton from '../components/BackButton'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import SemanticGlyph from '../components/SemanticGlyph'
import {
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import {
  clearGuidedSelfDiscoveryDraft,
  readGuidedSelfDiscoveryDraft,
  saveGuidedSelfDiscoveryDraft,
} from '../lib/guidedSelfDiscoveryDraft'
import { platform, platformName } from '../platform'
import './GuidedSelfDiscoveryFlow.css'

const STEPS = [
  {
    key: 'situation',
    label: 'Ситуация',
    title: 'Что сейчас происходит?',
    hint: 'Опиши ситуацию так, как она выглядит сегодня. Без правильного ответа.',
    placeholder: 'Например: я откладываю разговор или важную задачу...',
  },
  {
    key: 'facts',
    label: 'Факты',
    title: 'Что здесь точно известно?',
    hint: 'Запиши наблюдаемые факты — то, с чем можно было бы согласиться, не споря о смысле.',
    placeholder: 'Что произошло? Что уже сделано? Что известно наверняка?',
  },
  {
    key: 'interpretation',
    label: 'Версия',
    title: 'Что ты предполагаешь?',
    hint: 'Это не окончательная правда о тебе или ситуации. Только одна из возможных интерпретаций.',
    placeholder: 'Как ты сейчас объясняешь происходящее?',
  },
  {
    key: 'unknown',
    label: 'Неизвестное',
    title: 'Чего ты пока не знаешь?',
    hint: 'Назови то, что нельзя честно решить прямо сейчас.',
    placeholder: 'Чего не хватает, чтобы знать больше?',
  },
  {
    key: 'heavy',
    label: 'Главное',
    title: 'Что ощущается самым тяжёлым?',
    hint: 'Выбери одну часть ситуации. Не нужно разбирать всё сразу.',
    placeholder: 'Самое тяжёлое сейчас — это...',
  },
  {
    key: 'control',
    label: 'Сегодня',
    title: 'Что зависит от тебя сегодня?',
    hint: 'Один небольшой шаг, который остаётся в твоём контроле.',
    placeholder: 'Сегодня я могу...',
  },
  {
    key: 'experiment',
    label: 'Эксперимент',
    title: 'Какой маленький эксперимент попробуешь?',
    hint: 'Сделай его обратимым: действие, ожидаемый сигнал и условие остановки.',
    placeholder: 'Действие: ...\nСигнал: ...\nОстановлюсь, если ...',
  },
]

const INTRO_DESCRIPTION =
  'Спокойно отдели факты от предположений и выбери один небольшой эксперимент. Это не тест личности и не диагноз.'

function answered(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function emptyAnswers() {
  return { context: '', ...Object.fromEntries(STEPS.map(step => [step.key, ''])) }
}

function FlowBack({ onClick }) {
  // В Telegram — только native BackButton (компонент сам монтирует hook и не рисует UI).
  // В web — видимый app-back в header slot.
  if (platformName === 'telegram') {
    return <BackButton onClick={onClick} />
  }
  return (
    <div
      className={`${FULLSCREEN_HEADER_SLOT_CLASS} guided-self-discovery__topbar flex items-center px-5`}
    >
      <BackButton onClick={onClick} />
    </div>
  )
}

function Intro({ hasDraft, onClose, onStart }) {
  return (
    <>
      <FlowBack onClick={onClose} />
      <div className="guided-self-discovery__intro">
        <div className="guided-self-discovery__hero" aria-hidden="true">
          <SemanticGlyph
            kind="next-step"
            animated={false}
            className="guided-self-discovery__glyph"
          />
        </div>
        <div className="guided-self-discovery__intro-copy">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">Запись</p>
          <h1 className="guided-self-discovery__intro-title font-display text-cream">
            {hasDraft ? 'Продолжи разбирать ситуацию' : 'Когда непонятно, что делать'}
          </h1>
          <p className="guided-self-discovery__intro-description">{INTRO_DESCRIPTION}</p>
          <p className="guided-self-discovery__intro-note">
            Ответы остаются на этом устройстве. Можно остановиться в любой момент.
          </p>
        </div>
        <div className="guided-self-discovery__intro-actions">
          <button
            type="button"
            onClick={onStart}
            className="guided-self-discovery__intro-cta"
            aria-label={hasDraft ? 'Продолжить' : 'Начать'}
          >
            {hasDraft ? 'Продолжить' : 'Начать'}
          </button>
        </div>
      </div>
    </>
  )
}

function Complete({ onClose, onRestart, experiment, feedback, onFeedback }) {
  return (
    <>
      <FlowBack onClick={onClose} />
      <div className="guided-self-discovery__completion">
        <div className="guided-self-discovery__completion-art" aria-hidden="true">
          <SemanticGlyph
            kind="next-step"
            animated={false}
            className="guided-self-discovery__glyph"
          />
        </div>
        <div className="guided-self-discovery__completion-copy">
          <p className="guided-self-discovery__completion-eyebrow text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
            Эксперимент готов
          </p>
          <h1 className="guided-self-discovery__completion-title font-display text-cream">
            Хорошо. Следующий шаг готов.
          </h1>
          <p className="guided-self-discovery__completion-description">
            Проверь его в реальности, а не пытайся заранее получить идеальную ясность.
          </p>
        </div>
        <div
          className="guided-self-discovery__completion-feedback"
          role="group"
          aria-label="Помогло ли это?"
        >
          <p>Помогло ли это?</p>
          <div className="guided-self-discovery__feedback-options">
            {[
              ['no', 'Нет', '−'],
              ['a-little', 'Немного', '≈'],
              ['yes', 'Да', '✓'],
            ].map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={feedback === value}
                onClick={() => onFeedback(value)}
              >
                <span className="guided-self-discovery__feedback-icon" aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        {answered(experiment) && (
          <div className="guided-self-discovery__completion-result">
            <span>твой эксперимент</span>
            <p>{experiment}</p>
          </div>
        )}
        <div className="guided-self-discovery__completion-actions">
          <button
            type="button"
            onClick={onClose}
            className="cta-pill guided-self-discovery__completion-primary"
          >
            Вернуться в дневник
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="guided-self-discovery__completion-secondary"
          >
            Начать заново
          </button>
        </div>
      </div>
    </>
  )
}

export default function GuidedSelfDiscoveryFlow({ userId, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [initial] = useState(() => readGuidedSelfDiscoveryDraft(userId))
  const [stage, setStage] = useState('intro')
  const [stepIndex, setStepIndex] = useState(0)
  const [completionFeedback, setCompletionFeedback] = useState(null)
  const [answers, setAnswers] = useState(() => ({ ...emptyAnswers(), ...(initial?.answers || {}) }))
  const step = STEPS[stepIndex]
  const value = step ? answers[step.key] || '' : ''

  function updateAnswer(key, nextValue) {
    const nextAnswers = { ...answers, [key]: nextValue }
    setAnswers(nextAnswers)
    try {
      saveGuidedSelfDiscoveryDraft(userId, nextAnswers)
    } catch (error) {
      console.error(error)
    }
  }

  function start() {
    const firstIncomplete = STEPS.findIndex(item => !answered(answers[item.key]))
    setStepIndex(firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete)
    platform.haptic('light')
    setStage('writing')
  }

  function continueFlow() {
    if (!answered(value)) return
    if (stepIndex < STEPS.length - 1) {
      platform.haptic('light')
      setStepIndex(index => index + 1)
      return
    }

    try {
      saveGuidedSelfDiscoveryDraft(userId, answers, 'complete')
    } catch (error) {
      console.error(error)
    }
    platform.haptic('success')
    setStage('complete')
  }

  function goBack() {
    if (stage === 'writing' && stepIndex > 0) {
      platform.haptic('light')
      setStepIndex(index => index - 1)
      return
    }
    if (stage === 'writing') {
      platform.haptic('light')
      setStage('intro')
      return
    }
    onClose()
  }

  function restart() {
    clearGuidedSelfDiscoveryDraft(userId)
    setAnswers(emptyAnswers())
    setStepIndex(0)
    setCompletionFeedback(null)
    platform.haptic('light')
    setStage('writing')
  }

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow mx-practice-flow--guided mx-practice-flow--self-discovery flex flex-col`}
      style={surfaceStyle}
    >
      {stage === 'intro' && <Intro hasDraft={Boolean(initial)} onClose={onClose} onStart={start} />}

      {stage === 'writing' && step && (
        <>
          <FlowBack onClick={goBack} />
          <PracticeWritingCanvas
            value={value}
            onChange={next => updateAnswer(step.key, next)}
            question={step.title}
            description={step.hint}
            placeholder={step.placeholder}
            ariaLabel={step.title}
            autoFocus
            onSubmit={continueFlow}
            submitLabel={
              stepIndex === STEPS.length - 1 ? 'Сохранить эксперимент' : 'Сохранить и продолжить'
            }
            submitDisabled={!answered(value)}
            className="guided-self-discovery__writing min-h-0 flex-1"
          />
        </>
      )}

      {stage === 'complete' && (
        <Complete
          onClose={onClose}
          onRestart={restart}
          experiment={answers.experiment}
          feedback={completionFeedback}
          onFeedback={setCompletionFeedback}
        />
      )}
    </div>,
    document.body
  )
}
