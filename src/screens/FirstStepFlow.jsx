import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'

import { platform } from '../platform'
import SceneLayout from '../components/practices/SceneLayout'
import JournalTextarea from '../components/JournalTextarea'
import { useFullscreenSurface, FULLSCREEN_SHELL_CLASS } from '../lib/fullscreenSurface'
import { saveFirstStepEntry } from '../lib/firstStepPractice'
import './FirstStepFlow.css'

/*
 * MXL-PRB-002, MXL-DEC-013: разовая практика «Первый шаг» — не серия,
 * не привязана к дню. Шесть шагов: task → state → (rest | plan) → run →
 * outcome → reflect. Переиспользует структуру TodayFocusFlow.jsx (fullscreen
 * portal, стейт-машина step) и таймер-паттерн Focus.jsx (endsAt по
 * Date.now(), а не тиками setInterval — вебвью Telegram душит таймеры в
 * фоне, см. AI_RULES.md §9 «Время»).
 */

const STATE_OPTIONS = [
  { key: 'no_desire', label: 'Просто не хочется' },
  { key: 'no_entry_point', label: 'Не знаю, с чего начать' },
  { key: 'fear_of_bad_result', label: 'Боюсь сделать плохо' },
  { key: 'too_many_decisions', label: 'Слишком много решений сразу' },
  { key: 'tired', label: 'Устал(а)' },
]

const RUN_SECONDS = 5 * 60

const STEP_PROGRESS = {
  task: 1,
  state: 2,
  plan: 3,
  run: 4,
  outcome: 5,
}

const OUTCOME_OPTIONS = [
  { key: 'started', label: 'Начал(а)' },
  { key: 'not_started', label: 'Не начал(а)' },
  { key: 'stopped_for_safety', label: 'Остановился — было небезопасно' },
]

const REFLECTION_OPTIONS = [
  { key: 'harder', label: 'Нет', Icon: ThumbsDown },
  { key: 'same', label: 'Немного', Icon: Hand },
  { key: 'easier', label: 'Да', Icon: ThumbsUp },
]

const COMPLETION_COPY = {
  started: {
    title: 'Ты начал(а)',
    description: 'Дело больше не стоит на месте — этого достаточно на сегодня.',
  },
  not_started: {
    title: 'Ты заметил(а), что мешает',
    description: 'Понять, что мешало начать, — уже честнее, чем корить себя.',
  },
  stopped_for_safety: {
    title: 'Ты выбрал(а) безопасность',
    description: 'Остановиться вовремя — тоже разумный шаг.',
  },
}

function Progress({ step }) {
  const current = STEP_PROGRESS[step]

  if (!current) return null

  return (
    <div className="first-step-progress" aria-label={`Шаг ${current} из 5`}>
      <div className="first-step-progress__rail" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={index < current ? 'first-step-progress__segment--active' : ''}
          />
        ))}
      </div>
      <span className="first-step-progress__label">{current} из 5</span>
    </div>
  )
}

function OptionList({ options, onPick }) {
  return (
    <div className="space-y-3">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onPick(option.key)}
          className="practice-scene__choice w-full rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[14px] font-semibold text-cream"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function FirstStepFlow({ userId, onClose, onComplete }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('intro')
  const [task, setTask] = useState('')
  const [plan, setPlan] = useState('')
  const [outcome, setOutcome] = useState(null)
  const [reflection, setReflection] = useState(null)
  const sceneScrollRef = useRef(null)

  const [secondsLeft, setSecondsLeft] = useState(RUN_SECONDS)
  const [endsAt, setEndsAt] = useState(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    document.activeElement?.blur?.()
    sceneScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [step])

  useEffect(() => {
    if (!endsAt) return

    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))

    tick()
    const id = setInterval(tick, 250)

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [endsAt])

  // Завершение — отдельным эффектом с защитой через ref, как в Focus.jsx:
  // в StrictMode апдейтер вызывается дважды.
  useEffect(() => {
    if (!endsAt || secondsLeft > 0 || finishedRef.current) return

    finishedRef.current = true
    platform.haptic('success')
    setStep('outcome')
  }, [secondsLeft, endsAt])

  function startPractice() {
    platform.haptic('light')
    setStep('task')
  }

  function goToState() {
    if (!task.trim()) return

    platform.haptic('light')
    setStep('state')
  }

  function chooseState(key) {
    platform.haptic('light')

    if (key === 'tired') {
      setStep('rest')
      return
    }

    setStep('plan')
  }

  function startRun() {
    if (!plan.trim()) return

    platform.haptic('medium')
    finishedRef.current = false
    setSecondsLeft(RUN_SECONDS)
    setEndsAt(Date.now() + RUN_SECONDS * 1000)
    setStep('run')
  }

  function stopRun() {
    platform.haptic('light')
    setEndsAt(null)
    setStep('outcome')
  }

  function chooseOutcome(key) {
    platform.haptic('medium')
    setOutcome(key)
    setStep('complete')
  }

  function finish() {
    platform.haptic('light')
    saveFirstStepEntry(userId, { outcome, reflection })
    if (onComplete) {
      onComplete()
      return
    }

    onClose()
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow`} style={surfaceStyle}>
      {step === 'intro' && (
        <SceneLayout
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Сделай маленький шаг, когда трудно начать"
          centered
          description={
            <>
              Пять минут, чтобы найти одно простое действие и начать — без давления сделать всё
              сразу.
              <span className="mt-3 block text-[12px] font-semibold text-faint">
                5 минут&nbsp;&nbsp;·&nbsp;&nbsp;5 шагов
              </span>
            </>
          }
        >
          <button
            type="button"
            onClick={startPractice}
            aria-label="Начать"
            className="cta-pill w-full text-[14px] px-6 py-4"
          >
            Найти первый шаг
          </button>
        </SceneLayout>
      )}

      {step === 'task' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Что не двигается?"
          progress={<Progress step={step} />}
          className="practice-scene--input practice-scene--input-centered"
          description={
            <>
              Одно дело, которое ты откладываешь — не потому что забыл, а потому что не можешь
              подступиться.
            </>
          }
        >
          <JournalTextarea
            writingCanvas
            writingCanvas
            autoFocus
            value={task}
            onChange={setTask}
            placeholder="Например: написать отчёт"
            ariaLabel="Дело, которое не двигается"
            className="min-h-[18rem]"
            editorClassName="pb-24"
            floatingToolbar
            formatting={false}
            onSubmit={goToState}
            submitLabel="Дальше"
            submitDisabled={!task.trim()}
          />
        </SceneLayout>
      )}

      {step === 'state' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Что сейчас мешает?"
          progress={<Progress step={step} />}
          className="practice-scene--choice"
        >
          <OptionList options={STATE_OPTIONS} onPick={chooseState} />
        </SceneLayout>
      )}

      {step === 'rest' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Не сейчас — и это нормально"
          className="practice-scene--choice"
          description={
            <>
              Похоже, сейчас не время давить — если это про усталость, лучше отдохнуть, чем
              заставлять себя. Вернись к этому позже.
            </>
          }
        >
          <button
            type="button"
            onClick={onClose}
            className="practice-scene__cta cta-pill w-full text-[14px] px-6 py-3.5"
          >
            Вернуться позже
          </button>
        </SceneLayout>
      )}

      {step === 'plan' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Что можно сделать за пять минут?"
          progress={<Progress step={step} />}
          className="practice-scene--input practice-scene--input-centered"
          description={<>Не «написать отчёт», а «открыть документ и записать три пункта».</>}
        >
          <JournalTextarea
            autoFocus
            value={plan}
            onChange={setPlan}
            placeholder="Например: открыть документ и записать три пункта"
            ariaLabel="Первый шаг на пять минут"
            className="min-h-[18rem]"
            editorClassName="pb-24"
            floatingToolbar
            formatting={false}
            onSubmit={startRun}
            submitLabel="Начать пять минут"
            submitDisabled={!plan.trim()}
          />
        </SceneLayout>
      )}

      {step === 'run' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Только этот шаг"
          progress={<Progress step={step} />}
          centered
          className="min-h-[58vh] text-center"
        >
          <div className="font-display text-[64px] text-cream tabular-nums">
            {minutes}:{seconds}
          </div>
          <button
            type="button"
            onClick={stopRun}
            className="practice-scene__choice practice-scene__secondary text-[12px] font-semibold text-muted -m-2 p-2"
          >
            Остановить
          </button>
        </SceneLayout>
      )}

      {step === 'outcome' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Как прошло?"
          progress={<Progress step={step} />}
          className="practice-scene--choice"
        >
          <OptionList options={OUTCOME_OPTIONS} onPick={chooseOutcome} />
        </SceneLayout>
      )}

      {step === 'complete' && (
        <SceneLayout
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title={COMPLETION_COPY[outcome]?.title}
          centered
          description={
            <>
              {COMPLETION_COPY[outcome]?.description}
              {plan && (
                <span className="mt-3 block text-[12px] text-faint">Следующий шаг: {plan}</span>
              )}
            </>
          }
        >
          <p className="mt-2 text-center text-[12px] font-semibold text-muted">Помогло сейчас?</p>
          <div className="first-step-feedback">
            {REFLECTION_OPTIONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={reflection === key}
                onClick={() => {
                  platform.haptic('light')
                  setReflection(key)
                }}
                className="first-step-feedback__option"
              >
                <Icon size={23} strokeWidth={1.8} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="practice-scene__secondary">
            <button
              type="button"
              onClick={finish}
              className="text-[12px] font-semibold text-muted -m-2 p-2"
            >
              Пропустить
            </button>
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="Завершить"
            className="practice-scene__cta cta-pill w-full text-[14px] px-6 py-3.5"
          >
            Продолжить в Сегодня
          </button>
        </SceneLayout>
      )}
    </div>,
    document.body
  )
}
