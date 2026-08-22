import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import SceneLayout from '../components/practices/SceneLayout'
import { useFullscreenSurface, FULLSCREEN_SHELL_CLASS } from '../lib/fullscreenSurface'
import { saveFirstStepEntry } from '../lib/firstStepPractice'

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

const OUTCOME_OPTIONS = [
  { key: 'started', label: 'Начал(а)' },
  { key: 'not_started', label: 'Не начал(а)' },
  { key: 'stopped_for_safety', label: 'Остановился — было небезопасно' },
]

const REFLECTION_OPTIONS = [
  { key: 'easier', label: 'Да' },
  { key: 'same', label: 'Не особо' },
  { key: 'harder', label: 'Нет' },
]

function OptionList({ options, onPick }) {
  return (
    <div className="space-y-3">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onPick(option.key)}
          className="practice-scene__choice w-full rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[15px] font-semibold text-cream"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function FirstStepFlow({ userId, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('task')
  const [task, setTask] = useState('')
  const [plan, setPlan] = useState('')
  const [outcome, setOutcome] = useState(null)
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
    setStep('reflect')
  }

  function finish(reflection) {
    platform.haptic('light')
    saveFirstStepEntry(userId, { outcome, reflection })
    onClose()
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      {step === 'task' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Что не двигается?"
          className="practice-scene--input"
          description={
            <>
              Одно дело, которое ты откладываешь — не потому что забыл, а потому что не можешь
              подступиться.
            </>
          }
        >
          <textarea
            autoFocus
            rows={3}
            value={task}
            onChange={event => setTask(event.target.value)}
            placeholder="Например: написать отчёт"
            className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors resize-none"
          />
          <button
            type="button"
            onClick={goToState}
            disabled={!task.trim()}
            className="practice-scene__cta cta-pill w-full text-[15px] px-6 py-3.5 disabled:opacity-35"
          >
            Дальше
          </button>
        </SceneLayout>
      )}

      {step === 'state' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Что сейчас мешает?"
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
            className="practice-scene__cta cta-pill w-full text-[15px] px-6 py-3.5"
          >
            Хорошо
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
          className="practice-scene--input"
          description={<>Не «написать отчёт», а «открыть документ и записать три пункта».</>}
        >
          <textarea
            autoFocus
            rows={3}
            value={plan}
            onChange={event => setPlan(event.target.value)}
            placeholder="Например: открыть документ и записать три пункта"
            className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors resize-none"
          />
          <button
            type="button"
            onClick={startRun}
            disabled={!plan.trim()}
            className="practice-scene__cta cta-pill w-full text-[15px] px-6 py-3.5 disabled:opacity-35"
          >
            Начать пять минут
          </button>
        </SceneLayout>
      )}

      {step === 'run' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Только этот шаг"
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
          className="practice-scene--choice"
        >
          <OptionList options={OUTCOME_OPTIONS} onPick={chooseOutcome} />
        </SceneLayout>
      )}

      {step === 'reflect' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Первый шаг"
          title="Стало ли легче начать?"
          className="practice-scene--choice"
        >
          <OptionList options={REFLECTION_OPTIONS} onPick={finish} />
          <div className="practice-scene__secondary">
            <button
              type="button"
              onClick={() => finish(null)}
              className="practice-scene__choice text-[12px] font-semibold text-muted -m-2 p-2"
            >
              Пропустить
            </button>
          </div>
        </SceneLayout>
      )}
    </div>,
    document.body
  )
}
