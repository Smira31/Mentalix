import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import BackButton from '../components/BackButton'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
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
import { platform } from '../platform'

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

function answered(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function emptyAnswers() {
  return { context: '', ...Object.fromEntries(STEPS.map(step => [step.key, ''])) }
}

function Intro({ hasDraft, onClose, onStart }) {
  return (
    <>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-5`}>
        <BackButton onClick={onClose} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center px-6 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">Запись</p>
        <h1 className="mt-3 max-w-[18rem] font-display text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-cream">
          {hasDraft ? 'Продолжи разбирать ситуацию' : 'Когда непонятно, что делать'}
        </h1>
        <p className="mt-4 max-w-[22rem] text-[15px] leading-relaxed text-muted">
          Спокойно отдели факты от предположений и выбери один небольшой эксперимент. Это не тест личности и не диагноз.
        </p>
        <p className="mt-6 text-[13px] leading-relaxed text-faint">
          Ответы остаются на этом устройстве. Можно остановиться в любой момент.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="cta-pill mt-10 w-full px-6 py-4 text-[15px]"
        >
          {hasDraft ? 'Продолжить' : 'Начать'}
        </button>
      </div>
    </>
  )
}

function Complete({ onClose, onRestart, experiment }) {
  return (
    <>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-5`}>
        <BackButton onClick={onClose} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center px-6 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">Эксперимент готов</p>
        <h1 className="mt-3 max-w-[18rem] font-display text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-cream">
          У тебя есть следующий шаг
        </h1>
        <p className="mt-4 max-w-[22rem] text-[15px] leading-relaxed text-muted">
          Проверь его в реальности, а не пытайся заранее получить идеальную ясность.
        </p>
        {answered(experiment) && (
          <div className="mt-8 rounded-[28px] border border-gold/25 bg-gold/[0.07] px-5 py-5 text-left">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              твой эксперимент
            </span>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-cream">
              {experiment}
            </p>
          </div>
        )}
        <button type="button" onClick={onClose} className="cta-pill mt-10 w-full px-6 py-4 text-[15px]">
          Вернуться в дневник
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="mx-auto mt-3 min-h-11 px-3 text-[13px] font-semibold text-muted active:text-gold"
        >
          Начать заново
        </button>
      </div>
    </>
  )
}

export default function GuidedSelfDiscoveryFlow({ userId, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [initial] = useState(() => readGuidedSelfDiscoveryDraft(userId))
  const [stage, setStage] = useState('intro')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(() => ({ ...emptyAnswers(), ...(initial?.answers || {}) }))
  const step = STEPS[stepIndex]
  const value = step ? answers[step.key] || '' : ''

  useEffect(() => {
    document.activeElement?.blur?.()
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
    platform.haptic('light')
    setStage('writing')
  }

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow mx-practice-flow--guided flex flex-col`}
      style={surfaceStyle}
    >
      {stage === 'intro' && (
        <Intro hasDraft={Boolean(initial)} onClose={onClose} onStart={start} />
      )}

      {stage === 'writing' && step && (
        <>
          <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-5`}>
            <BackButton onClick={goBack} />
          </div>
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
            className="min-h-0 flex-1"
          />
        </>
      )}

      {stage === 'complete' && (
        <Complete onClose={onClose} onRestart={restart} experiment={answers.experiment} />
      )}
    </div>,
    document.body
  )
}
