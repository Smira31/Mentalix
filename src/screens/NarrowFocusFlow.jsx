import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { saveNarrowFocusEntry } from '../lib/narrowFocusPractice'

/*
 * MXL-PRB-015, MXL-DEC-016: разовая практика «Одно из всех» — не серия, не
 * привязана к дню. Шаги: dump → pick → release → plan → run → outcome →
 * reflect. Работает с перегрузкой одновременностью (всё держится в голове
 * разом), а не с барьером старта, эмоцией избегания или незавершённостью —
 * поэтому сначала физическая выгрузка списка (сам факт записи снимает
 * часть тревоги), затем сознательное сужение до одного пункта. Переиспользует
 * структуру FirstStepFlow.jsx/ProcrastinationFlow.jsx/FinishFlow.jsx
 * (fullscreen portal, стейт-машина step) и таймер-паттерн Focus.jsx (endsAt
 * по Date.now(), не тики setInterval — вебвью Telegram душит таймеры в
 * фоне, см. AI_RULES.md §9 «Время»).
 */

// Ротация — намеренно не одна статичная фраза, чтобы разрядка не звучала
// формулой при повторном использовании практики.
const RELEASE_PHRASES = [
  'Остальное подождёт. Правда.',
  'Ты не забываешь остальное — просто откладываешь его на потом.',
  'Всё не помещается в одну голову сразу. И не должно.',
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
      Одно из всех
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

export default function NarrowFocusFlow({ userId, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('dump')
  const [dump, setDump] = useState('')
  const [pick, setPick] = useState('')
  const [plan, setPlan] = useState('')
  const [outcome, setOutcome] = useState(null)

  const [releasePhrase] = useState(
    () => RELEASE_PHRASES[Math.floor(Math.random() * RELEASE_PHRASES.length)]
  )

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

  function goToPick() {
    if (!dump.trim()) return

    platform.haptic('light')
    setStep('pick')
  }

  function goToRelease() {
    if (!pick.trim()) return

    platform.haptic('light')
    setStep('release')
  }

  function goToPlan() {
    platform.haptic('light')
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
    saveNarrowFocusEntry(userId, { outcome, reflection })
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
        {step === 'dump' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Выпиши всё, что крутится в голове
            </h2>

            <JournalTextarea
              autoFocus
              value={dump}
              onChange={setDump}
              placeholder="Без разбора и порядка — просто всё подряд"
              ariaLabel="Всё, что крутится в голове"
              className="mt-6 min-h-[18rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={goToPick}
              submitLabel="Дальше"
              submitDisabled={!dump.trim()}
            />
          </div>
        )}

        {step === 'pick' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Что из этого важнее всего сейчас?
            </h2>

            <p className="text-[13px] text-muted mt-2 leading-relaxed">Назови только одно.</p>

            <JournalTextarea
              autoFocus
              value={pick}
              onChange={setPick}
              placeholder="Одно дело"
              ariaLabel="Одно самое важное дело"
              className="mt-6 min-h-[18rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={goToRelease}
              submitLabel="Дальше"
              submitDisabled={!pick.trim()}
            />
          </div>
        )}

        {step === 'release' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[22px] text-cream leading-snug">{releasePhrase}</h2>

            <button
              type="button"
              onClick={goToPlan}
              className="cta-pill w-full text-[15px] px-6 py-3.5 mt-5"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 'plan' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Что можно сделать по этому одному прямо сейчас?
            </h2>

            <JournalTextarea
              autoFocus
              value={plan}
              onChange={setPlan}
              placeholder="Например: написать первое сообщение"
              ariaLabel="Первое действие по выбранному делу"
              className="mt-6 min-h-[18rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={startRun}
              submitLabel="Начать пять минут"
              submitDisabled={!plan.trim()}
            />
          </div>
        )}

        {step === 'run' && (
          <div className="w-full max-w-md mx-auto animate-fade-in text-center">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Только это одно</h2>

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

            <h2 className="font-display text-[24px] text-cream leading-tight">Стало ли легче?</h2>

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
