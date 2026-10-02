import { useEffect, useRef, useState } from 'react'

import Screen from '../components/Screen'
import CapsLabel from '../components/ui/CapsLabel'
import JournalField from '../components/ui/JournalField'
import RoundNextButton from '../components/ui/RoundNextButton'
import { illustrations } from '../assets/illustrations'
import CheckInCompletion from '../components/CheckInCompletion'
import { useBackButton } from '../platform/telegram.hooks'
import { platform } from '../platform'
import {
  clearGuidedSelfDiscoveryDraft,
  readGuidedSelfDiscoveryDraft,
  saveGuidedSelfDiscoveryDraft,
} from '../lib/guidedSelfDiscoveryDraft'
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

function IntroContent({ hasDraft }) {
  const IntroArt = illustrations.recordIntro
  return (
    <>
      {IntroArt && (
        <div className="guided-self-discovery__intro-art" aria-hidden="true">
          <IntroArt className="guided-self-discovery__intro-art-svg" />
        </div>
      )}
      <CapsLabel className="guided-self-discovery__intro-eyebrow">Запись</CapsLabel>
      <h1 className="guided-self-discovery__intro-title font-display text-cream">
        {hasDraft ? 'Продолжи разбирать ситуацию' : 'Когда непонятно, что делать'}
      </h1>
      <p className="guided-self-discovery__intro-description">{INTRO_DESCRIPTION}</p>
      <p className="guided-self-discovery__intro-note">
        Ответы остаются на этом устройстве. Можно остановиться в любой момент.
      </p>
    </>
  )
}

function WritingContent({ step, stepIndex, totalSteps, value, onChange, fieldRef }) {
  return (
    <>
      <CapsLabel className="guided-self-discovery__step-label">
        Запись · {stepIndex + 1} / {totalSteps}
      </CapsLabel>
      <JournalField
        question={step.title}
        hint={step.hint}
        className="guided-self-discovery__field-group"
      />
      <textarea
        ref={fieldRef}
        className="guided-self-discovery__field"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={step.placeholder}
        aria-label={step.title}
        data-testid={`gsd-input-${stepIndex}`}
      />
    </>
  )
}

/* Финал «Записи» использует CheckInCompletion — тот же компонент, что у
   завершения вечернего разбора (#967): размеры картинки, шрифты, отступы,
   плитки отзыва с lucide-иконками, плашка даты, кнопка внизу. */

export default function GuidedSelfDiscoveryFlow({ userId, onClose }) {
  const [initial] = useState(() => readGuidedSelfDiscoveryDraft(userId))
  const [stage, setStage] = useState('intro')
  const [stepIndex, setStepIndex] = useState(0)
  const [completionFeedback, setCompletionFeedback] = useState(null)
  const [answers, setAnswers] = useState(() => ({ ...emptyAnswers(), ...(initial?.answers || {}) }))
  const [pendingComplete, setPendingComplete] = useState(false)
  const fieldRef = useRef(null)
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

    // Blur the active field so the soft keyboard closes before we swap
    // to the completion screen — without this the completion renders
    // under the still-open keyboard and the header overlaps the title.
    const active = document.activeElement
    if (active && typeof active.blur === 'function') {
      active.blur()
    }

    const vv = window.visualViewport
    if (!vv || vv.height >= window.innerHeight - 80) {
      setStage('complete')
      return
    }

    // Keyboard is open — defer completion until visualViewport stabilises.
    setPendingComplete(true)
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

  // System back button — handled here, not in <Screen> (registerSystemBack={false})
  useBackButton(goBack)

  // Auto-focus textarea when entering writing stage or changing step
  useEffect(() => {
    if (stage !== 'writing') return
    const focusField = () => fieldRef.current?.focus({ preventScroll: true })
    const frame = window.requestAnimationFrame(focusField)
    const retry = window.setTimeout(focusField, 80)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [stage, stepIndex])

  // Wait for the soft keyboard to close (visualViewport resize) before
  // showing the completion screen.
  useEffect(() => {
    if (!pendingComplete) return

    const vv = window.visualViewport
    const isStable = () => !vv || vv.height >= window.innerHeight - 80

    if (isStable()) {
      setPendingComplete(false)
      setStage('complete')
      return
    }

    function onViewportResize() {
      if (isStable()) {
        setPendingComplete(false)
        setStage('complete')
      }
    }

    vv.addEventListener('resize', onViewportResize)
    const fallback = setTimeout(() => {
      if (isStable()) {
        setPendingComplete(false)
        setStage('complete')
      }
    }, 400)

    return () => {
      vv.removeEventListener('resize', onViewportResize)
      clearTimeout(fallback)
    }
  }, [pendingComplete])

  const isLastStep = stepIndex === STEPS.length - 1

  const footerContent = (() => {
    if (stage === 'intro') {
      return (
        <div className="guided-self-discovery__footer-bar">
          <RoundNextButton
            onClick={start}
            icon="arrow"
            label={initial ? 'Продолжить' : 'Начать'}
            testId="gsd-start"
          />
        </div>
      )
    }
    if (stage === 'writing' && !pendingComplete) {
      return (
        <div className="guided-self-discovery__footer-bar">
          <RoundNextButton
            onClick={answered(value) ? continueFlow : goBack}
            icon={answered(value) ? 'check' : 'close'}
            label={isLastStep ? (answered(value) ? 'Сохранить' : 'Назад') : (answered(value) ? 'Далее' : 'Назад')}
            disabled={pendingComplete}
            testId="gsd-next"
          />
        </div>
      )
    }
    if (stage === 'complete') {
      return (
        <div className="mx-completion-action mx-completion-action--evening">
          <button
            type="button"
            onClick={onClose}
            className="cta-pill"
            data-testid="gsd-complete-close"
          >
            Сохранить и выйти
          </button>
        </div>
      )
    }
    return null
  })()

  return (
    <Screen
      onBack={goBack}
      registerSystemBack={false}
      scroll={stage === 'intro'}
      fullFrame={stage !== 'intro'}
      footer={footerContent}
      footerClassName={
        stage === 'complete'
          ? 'guided-self-discovery__footer--complete'
          : 'guided-self-discovery__footer'
      }
      bodyClassName={stage === 'complete' ? 'guided-self-discovery__body--complete' : ''}
    >
      {stage === 'intro' && <IntroContent hasDraft={Boolean(initial)} />}

      {stage === 'writing' && step && (
        <WritingContent
          step={step}
          stepIndex={stepIndex}
          totalSteps={STEPS.length}
          value={value}
          onChange={next => updateAnswer(step.key, next)}
          fieldRef={fieldRef}
        />
      )}

      {stage === 'complete' && (
        <CheckInCompletion
          evening
          art={(() => {
            const Art = illustrations.recordComplete
            return Art ? <Art /> : undefined
          })()}
          title={
            <>
              <strong>Готово!</strong>
              <span>Следующий шаг готов.</span>
            </>
          }
          feedbackQuestion="Помогло ли это?"
          onFeedback={label => {
            platform.haptic('light')
            setCompletionFeedback(label)
          }}
          body={
            answered(answers.experiment) ? (
              <p
                className="mx-type-body text-muted mt-6 max-w-sm mx-auto"
                data-testid="gsd-experiment-text"
              >
                {answers.experiment}
              </p>
            ) : null
          }
        />
      )}
    </Screen>
  )
}
