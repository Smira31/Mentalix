import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'

import { platform } from '../platform'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import NarrowFocusArt from '../components/practice-art/NarrowFocusArt'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { saveNarrowFocusEntry } from '../lib/narrowFocusPractice'
import './NarrowFocusFlow.css'

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

const STEP_PROGRESS = {
  dump: 1,
  pick: 2,
  release: 3,
  plan: 4,
  run: 5,
  outcome: 6,
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
    title: 'Ты сузил(а) фокус',
    description: 'Не всё сразу, а что-то одно — этого достаточно.',
  },
  not_started: {
    title: 'Ты заметил(а), что отвлекает',
    description: 'Это уже честнее, чем продолжать держать всё в голове.',
  },
  stopped_for_safety: {
    title: 'Ты выбрал(а) безопасность',
    description: 'Остановиться вовремя — тоже бережный шаг.',
  },
}

function Eyebrow() {
  return (
    <span className="block font-label text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
      Одно из всех
    </span>
  )
}

function StageHeading({ children }) {
  return (
    <div className="narrow-focus-stage__anchor">
      <Eyebrow />
      <h2 className="narrow-focus-stage__title font-display text-cream">{children}</h2>
    </div>
  )
}

function Progress({ step }) {
  const current = STEP_PROGRESS[step]

  if (!current) return null

  return (
    <div className="narrow-focus-progress" aria-label={`Шаг ${current} из 6`}>
      <div className="narrow-focus-progress__rail" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className={index < current ? 'narrow-focus-progress__segment--active' : ''}
          />
        ))}
      </div>
      <span className="narrow-focus-progress__label">{current} из 6</span>
    </div>
  )
}

function OptionList({ options, onPick }) {
  return (
    <div className="mx-practice-flow__choice-list mt-5 space-y-2">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onPick(option.key)}
          className="w-full rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[14px] font-semibold text-cream active:scale-[0.98] transition-transform"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function NarrowFocusFlow({ userId, onClose, onComplete }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('intro')
  const [dump, setDump] = useState('')
  const [pick, setPick] = useState('')
  const [plan, setPlan] = useState('')
  const [outcome, setOutcome] = useState(null)
  const [reflection, setReflection] = useState(null)

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

  function startPractice() {
    platform.haptic('light')
    setStep('dump')
  }

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
    setStep('complete')
  }

  function finish() {
    platform.haptic('light')
    saveNarrowFocusEntry(userId, { outcome, reflection })
    if (onComplete) {
      onComplete()
      return
    }

    onClose()
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow mx-practice-flow--guided`}
      style={surfaceStyle}
    >
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mx-practice-flow__header flex items-center gap-3 px-5`}
      >
        <BackButton onClick={onClose} />
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} mx-practice-flow__body`}>
        {step === 'intro' && (
          <div className="narrow-focus-stage narrow-focus-stage--intro animate-fade-in">
            <div className="narrow-focus-stage__center text-center">
              <Eyebrow />
              <h2 className="font-display text-[24px] text-cream leading-[1.1] tracking-[-0.03em]">
                Сузь всё до одного дела
              </h2>
              <p className="mx-auto mt-4 max-w-[310px] text-[13px] leading-relaxed text-muted">
                Короткая сессия, чтобы выгрузить лишнее и выбрать один проверяемый шаг на сегодня.
              </p>
              <p className="mt-4 text-[12px] font-semibold text-faint">
                5 минут&nbsp;&nbsp;·&nbsp;&nbsp;6 шагов
              </p>
              <div className="narrow-focus-art" aria-hidden="true">
                <NarrowFocusArt />
              </div>
            </div>

            <button
              type="button"
              onClick={startPractice}
              aria-label="Начать"
              className="cta-pill mx-practice-flow__continue w-full text-[14px] px-6 py-4 mt-6"
            >
              Освободить голову
            </button>
          </div>
        )}

        {step === 'dump' && (
          <div className="narrow-focus-stage narrow-focus-stage--writing animate-fade-in">
            <Progress step={step} />
            <StageHeading>Выпиши всё, что крутится в голове</StageHeading>

            <JournalTextarea
              autoFocus
              value={dump}
              onChange={setDump}
              placeholder="Без разбора и порядка — просто всё подряд"
              ariaLabel="Всё, что крутится в голове"
              className="narrow-focus-stage__writer min-h-[12rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              guidedFlow
              onSubmit={goToPick}
              submitLabel="Дальше"
              submitDisabled={!dump.trim()}
            />
          </div>
        )}

        {step === 'pick' && (
          <div className="narrow-focus-stage narrow-focus-stage--writing animate-fade-in">
            <Progress step={step} />
            <StageHeading>Что из этого важнее всего сейчас?</StageHeading>

            <p className="text-[12px] text-muted mt-2 mb-4 leading-relaxed">Назови только одно.</p>

            <JournalTextarea
              autoFocus
              value={pick}
              onChange={setPick}
              placeholder="Одно дело"
              ariaLabel="Одно самое важное дело"
              className="narrow-focus-stage__writer min-h-[12rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              guidedFlow
              onSubmit={goToRelease}
              submitLabel="Дальше"
              submitDisabled={!pick.trim()}
            />
          </div>
        )}

        {step === 'release' && (
          <div className="narrow-focus-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>{releasePhrase}</StageHeading>

            <button
              type="button"
              onClick={goToPlan}
              aria-label="Дальше"
              className="cta-pill mx-practice-flow__continue w-full text-[14px] px-6 py-3.5 mt-5"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 'plan' && (
          <div className="narrow-focus-stage narrow-focus-stage--writing animate-fade-in">
            <Progress step={step} />
            <StageHeading>Какой один шаг можно увидеть готовым через пять минут?</StageHeading>

            <JournalTextarea
              autoFocus
              value={plan}
              onChange={setPlan}
              placeholder="Например: написать первое сообщение"
              ariaLabel="Первое действие по выбранному делу"
              className="narrow-focus-stage__writer min-h-[12rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              guidedFlow
              onSubmit={startRun}
              submitLabel="Начать пять минут"
              submitDisabled={!plan.trim()}
            />
          </div>
        )}

        {step === 'run' && (
          <div className="narrow-focus-stage animate-fade-in text-center">
            <Progress step={step} />
            <StageHeading>Только это одно</StageHeading>

            <div className="mx-practice-flow__timer font-display text-[64px] text-cream mt-8 tabular-nums">
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
          <div className="narrow-focus-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>Как прошло?</StageHeading>

            <OptionList options={OUTCOME_OPTIONS} onPick={chooseOutcome} />
          </div>
        )}

        {step === 'complete' && (
          <div className="narrow-focus-stage narrow-focus-stage--complete mx-practice-flow__completion animate-fade-in">
            <div className="narrow-focus-stage__center text-center">
              <div className="narrow-focus-art" aria-hidden="true">
                <NarrowFocusArt />
              </div>
              <h2 className="font-display text-[22px] text-cream leading-tight">
                {COMPLETION_COPY[outcome]?.title}
              </h2>
              <p className="mx-auto mt-3 max-w-[310px] text-[13px] text-muted leading-relaxed">
                {COMPLETION_COPY[outcome]?.description}
                <span className="mt-3 block text-[12px] text-faint">
                  Следующий шаг: {plan || 'один небольшой фрагмент выбранного дела'} — готово, когда
                  результат можно увидеть.
                </span>
              </p>

              <p className="mt-7 text-[12px] font-semibold text-muted">Помогло сейчас?</p>
              <div className="narrow-focus-feedback">
                {REFLECTION_OPTIONS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={reflection === key}
                    onClick={() => {
                      platform.haptic('light')
                      setReflection(key)
                    }}
                    className="narrow-focus-feedback__option"
                  >
                    <Icon size={23} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={finish}
                  className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
                >
                  Пропустить
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={finish}
              aria-label="Завершить"
              className="cta-pill w-full text-[14px] px-6 py-4 mt-6"
            >
              Вернуться к практикам
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
