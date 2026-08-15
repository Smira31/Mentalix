import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import BackButton from '../components/BackButton'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
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

function Eyebrow() {
  return (
    <span className="block text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
      Первый шаг
    </span>
  )
}

function OptionList({ options, onPick }) {
  return (
    <div className="mt-5 space-y-2">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onPick(option.key)}
          className="w-full rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[15px] font-semibold text-cream active:scale-[0.98] transition-transform"
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

  const [secondsLeft, setSecondsLeft] = useState(RUN_SECONDS)
  const [endsAt, setEndsAt] = useState(null)
  const finishedRef = useRef(false)

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
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center gap-3 px-5`}>
        <BackButton onClick={onClose} />
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} px-5 pb-8`}>
        {step === 'task' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Что не двигается?</h2>

            <p className="text-[13px] text-muted mt-2 leading-relaxed">
              Одно дело, которое ты откладываешь — не потому что забыл, а потому что не можешь
              подступиться.
            </p>

            <textarea
              autoFocus
              rows={3}
              value={task}
              onChange={event => setTask(event.target.value)}
              placeholder="Например: написать отчёт"
              className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors resize-none mt-5"
            />

            <button
              type="button"
              onClick={goToState}
              disabled={!task.trim()}
              className="cta-pill w-full text-[15px] px-6 py-3.5 mt-5 disabled:opacity-35"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 'state' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Что сейчас мешает?
            </h2>

            <OptionList options={STATE_OPTIONS} onPick={chooseState} />
          </div>
        )}

        {step === 'rest' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Не сейчас — и это нормально
            </h2>

            <p className="text-[13px] text-muted mt-2 leading-relaxed">
              Похоже, сейчас не время давить — если это про усталость, лучше отдохнуть, чем
              заставлять себя. Вернись к этому позже.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="cta-pill w-full text-[15px] px-6 py-3.5 mt-5"
            >
              Хорошо
            </button>
          </div>
        )}

        {step === 'plan' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Что можно сделать за пять минут?
            </h2>

            <p className="text-[13px] text-muted mt-2 leading-relaxed">
              Не «написать отчёт», а «открыть документ и записать три пункта».
            </p>

            <textarea
              autoFocus
              rows={3}
              value={plan}
              onChange={event => setPlan(event.target.value)}
              placeholder="Например: открыть документ и записать три пункта"
              className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-[16px] text-cream placeholder-muted outline-none focus:border-gold transition-colors resize-none mt-5"
            />

            <button
              type="button"
              onClick={startRun}
              disabled={!plan.trim()}
              className="cta-pill w-full text-[15px] px-6 py-3.5 mt-5 disabled:opacity-35"
            >
              Начать пять минут
            </button>
          </div>
        )}

        {step === 'run' && (
          <div className="w-full max-w-md mx-auto animate-fade-in text-center">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Только этот шаг</h2>

            <div className="font-display text-[64px] text-cream mt-8 tabular-nums">
              {minutes}:{seconds}
            </div>

            <button
              type="button"
              onClick={stopRun}
              className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60 mt-8"
            >
              Остановить
            </button>
          </div>
        )}

        {step === 'outcome' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Как прошло?</h2>

            <OptionList options={OUTCOME_OPTIONS} onPick={chooseOutcome} />
          </div>
        )}

        {step === 'reflect' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Стало ли легче начать?
            </h2>

            <OptionList options={REFLECTION_OPTIONS} onPick={finish} />

            <div className="mt-5">
              <button
                type="button"
                onClick={() => finish(null)}
                className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
              >
                Пропустить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
