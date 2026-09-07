import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import JournalTextarea from '../components/JournalTextarea'
import SceneLayout from '../components/practices/SceneLayout'
import { FULLSCREEN_SHELL_CLASS, useFullscreenSurface } from '../lib/fullscreenSurface'
import {
  clearGuidedSelfDiscoveryDraft,
  readGuidedSelfDiscoveryDraft,
  saveGuidedSelfDiscoveryDraft,
} from '../lib/guidedSelfDiscoveryDraft'
import { platform } from '../platform'

const CONTEXTS = ['задача', 'конфликт', 'усталость', 'тревога', 'выбор', 'потеря направления']

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

const STEP_COUNT = STEPS.length

function answered(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function emptyAnswers() {
  return { context: '', ...Object.fromEntries(STEPS.map(step => [step.key, ''])) }
}

function GuidedProgress({ current }) {
  const display = current + 1

  return (
    <div className="mx-practice-flow__progress" aria-label={`Шаг ${display} из ${STEP_COUNT}`}>
      <div className="mx-practice-flow__progress-rail" aria-hidden="true">
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <span key={index} data-active={index <= current ? 'true' : 'false'} />
        ))}
      </div>
      <span className="mx-practice-flow__progress-label">
        {display} из {STEP_COUNT}
      </span>
    </div>
  )
}

function Intro({ hasDraft, onClose, onStart, scrollRef }) {
  return (
    <SceneLayout
      scrollRef={scrollRef}
      onBack={onClose}
      label="Разобраться сейчас"
      title={hasDraft ? 'Продолжи разбирать ситуацию' : 'Когда непонятно, что делать'}
      description="Спокойно отдели факты от предположений и выбери один небольшой эксперимент. Это не тест личности и не диагноз."
      centered
      showGlyph={false}
    >
      <div className="mx-practice-flow__complete text-left">
        <p className="text-[13px] leading-relaxed text-muted">
          Ответы остаются на этом устройстве. Ты можешь изменить их, остановиться в любой момент или
          удалить локальный черновик.
        </p>
      </div>
      <div className="mx-practice-flow__actions">
        <button
          type="button"
          onClick={onStart}
          className="cta-pill mx-practice-flow__continue w-full px-6 py-4 text-[14px]"
        >
          {hasDraft ? 'Продолжить' : 'Начать'}
        </button>
      </div>
    </SceneLayout>
  )
}

function ContextStep({ value, onChange }) {
  return (
    <div className="mx-practice-flow__choices" aria-label="Контекст ситуации">
      {CONTEXTS.map(context => (
        <button
          key={context}
          type="button"
          aria-pressed={value === context}
          onClick={() => onChange(context)}
          className="mx-practice-flow__choice"
        >
          {context}
        </button>
      ))}
    </div>
  )
}

function Complete({ onClose, onRestart, scrollRef, experiment }) {
  return (
    <SceneLayout
      scrollRef={scrollRef}
      onBack={onClose}
      label="Эксперимент готов"
      title="У тебя есть следующий шаг"
      description="Проверь его в реальности, а не пытайся заранее получить идеальную ясность. Завтра можно отметить: помогло, частично помогло, не помогло или не пробовал."
      centered
      showGlyph={false}
      className="mx-practice-flow__completion"
    >
      {answered(experiment) && (
        <div className="mx-practice-flow__complete">
          <span className="block text-[11px] uppercase tracking-[0.14em] text-gold">
            твой эксперимент
          </span>
          <p className="mt-2 text-[14px] leading-relaxed text-cream whitespace-pre-wrap">
            {experiment}
          </p>
        </div>
      )}
      <div className="rounded-3xl border border-gold/25 bg-gold/[0.07] p-5 text-left">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gold">
          Сохранено локально
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Это рабочая карта текущей ситуации, а не утверждение о том, какой ты человек.
        </p>
      </div>
      <div className="mx-practice-flow__actions">
        <button type="button" onClick={onClose} className="cta-pill w-full px-6 py-4 text-[14px]">
          Вернуться к практикам
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="mx-auto min-h-11 px-3 text-[13px] font-semibold text-muted active:text-gold"
        >
          Начать заново
        </button>
      </div>
    </SceneLayout>
  )
}

export default function GuidedSelfDiscoveryFlow({ userId, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const sceneScrollRef = useRef(null)
  const [initial] = useState(() => readGuidedSelfDiscoveryDraft(userId))
  const [stage, setStage] = useState('intro')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(() => ({ ...emptyAnswers(), ...(initial?.answers || {}) }))
  const step = STEPS[stepIndex]
  const value = step ? answers[step.key] || '' : ''

  useEffect(() => {
    document.activeElement?.blur?.()
    sceneScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [stage, stepIndex])

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
    onClose()
  }

  function restart() {
    clearGuidedSelfDiscoveryDraft(userId)
    setAnswers(emptyAnswers())
    setStepIndex(0)
    platform.haptic('light')
    setStage('writing')
  }

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow mx-practice-flow--guided`}
      style={surfaceStyle}
    >
      {stage === 'intro' && (
        <Intro
          hasDraft={Boolean(initial)}
          onClose={onClose}
          onStart={start}
          scrollRef={sceneScrollRef}
        />
      )}

      {stage === 'writing' && step && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={goBack}
          label={step.label}
          title={step.title}
          description={step.hint}
          progress={<GuidedProgress current={stepIndex} />}
          className="practice-scene--input practice-scene--input-centered"
        >
          {step.key === 'situation' && (
            <ContextStep value={answers.context} onChange={next => updateAnswer('context', next)} />
          )}
          <JournalTextarea
            writingCanvas
            autoFocus
            value={value}
            onChange={next => updateAnswer(step.key, next)}
            placeholder={step.placeholder}
            ariaLabel={step.title}
            className="min-h-[18rem]"
            editorClassName="pb-24"
            floatingToolbar
            formatting={false}
            guidedFlow
            onSubmit={continueFlow}
            submitLabel={
              stepIndex === STEPS.length - 1 ? 'Сохранить эксперимент' : 'Сохранить и продолжить'
            }
            submitDisabled={!answered(value)}
          />
          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Ты можешь вернуться назад и изменить любой ответ. Здесь нет скрытого вывода о тебе.
          </p>
        </SceneLayout>
      )}

      {stage === 'complete' && (
        <Complete
          onClose={onClose}
          onRestart={restart}
          scrollRef={sceneScrollRef}
          experiment={answers.experiment}
        />
      )}
    </div>,
    document.body
  )
}
