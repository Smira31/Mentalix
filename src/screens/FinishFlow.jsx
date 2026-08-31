import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand, ThumbsDown, ThumbsUp } from 'lucide-react'

import { platform } from '../platform'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import OneFinishArt from '../components/practice-art/OneFinishArt'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { saveOneFinishEntry } from '../lib/oneFinishPractice'
import './FinishFlow.css'

/*
 * MXL-PRB-003, MXL-DEC-015: разовая практика «Один финиш» — не серия, не
 * привязана к дню. Шаги: project → state → reframe → finish → run →
 * outcome → reflect. Работает не с барьером начала (это делает «Первый
 * шаг», FirstStepFlow.jsx) и не с эмоцией избегания («Без вины»,
 * ProcrastinationFlow.jsx), а с зависшим на середине проектом и дефицитом
 * навыка завершения — отсюда акцент на «маленьком куске», который реально
 * можно закрыть сегодня. Переиспользует структуру FirstStepFlow.jsx/
 * ProcrastinationFlow.jsx (fullscreen portal, стейт-машина step) и
 * таймер-паттерн Focus.jsx (endsAt по Date.now(), не тики setInterval —
 * вебвью Telegram душит таймеры в фоне, см. AI_RULES.md §9 «Время»).
 */

const STATE_OPTIONS = [
  { key: 'boring', label: 'Стало скучно' },
  { key: 'shinier_idea', label: 'Появилось что-то новее' },
  { key: 'no_end_visible', label: 'Не вижу конца' },
  { key: 'tired', label: 'Устал(а)' },
  { key: 'unknown', label: 'Не знаю почему' },
]

// Ротация — намеренно не одна статичная фраза, чтобы переформулировка не
// звучала формулой при повторном использовании практики.
const REFRAME_PHRASES = [
  'Один маленький финиш — уже победа.',
  'Не обязательно закончить всё — обязательно закончить что-то одно.',
  'Середина не считается провалом. Считается то, что доведено до точки.',
]

const RUN_SECONDS = 5 * 60

const STEP_PROGRESS = {
  project: 1,
  state: 2,
  reframe: 3,
  finish: 4,
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
    title: 'Кусок завершён',
    description: 'Ты не пытался(ась) закрыть всё — и именно поэтому получилось.',
  },
  not_started: {
    title: 'Ты заметил(а), что мешает закончить',
    description: 'Понять, что мешает, — уже честнее, чем снова отложить.',
  },
  stopped_for_safety: {
    title: 'Ты выбрал(а) безопасность',
    description: 'Остановиться вовремя — тоже бережный шаг.',
  },
}

function Eyebrow() {
  return (
    <span className="block font-label text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
      Один финиш
    </span>
  )
}

function StageHeading({ children }) {
  return (
    <div className="one-finish-stage__anchor">
      <Eyebrow />
      <h2 className="one-finish-stage__title font-display text-cream">{children}</h2>
    </div>
  )
}

function Progress({ step }) {
  const current = STEP_PROGRESS[step]

  if (!current) return null

  return (
    <div className="one-finish-progress" aria-label={`Шаг ${current} из 6`}>
      <div className="one-finish-progress__rail" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className={index < current ? 'one-finish-progress__segment--active' : ''}
          />
        ))}
      </div>
      <span className="one-finish-progress__label">{current} из 6</span>
    </div>
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
          className="w-full rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[14px] font-semibold text-cream active:scale-[0.98] transition-transform"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function FinishFlow({ userId, onClose, onComplete }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('intro')
  const [project, setProject] = useState('')
  const [finish, setFinish] = useState('')
  const [outcome, setOutcome] = useState(null)
  const [reflection, setReflection] = useState(null)

  const [reframePhrase] = useState(
    () => REFRAME_PHRASES[Math.floor(Math.random() * REFRAME_PHRASES.length)]
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
    setStep('project')
  }

  function goToState() {
    if (!project.trim()) return

    platform.haptic('light')
    setStep('state')
  }

  function chooseState() {
    platform.haptic('light')
    setStep('reframe')
  }

  function goToFinish() {
    platform.haptic('light')
    setStep('finish')
  }

  function startRun() {
    if (!finish.trim()) return

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

  function finishSession() {
    platform.haptic('light')
    saveOneFinishEntry(userId, { outcome, reflection })
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
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mx-practice-flow__header flex items-center gap-3 px-5`}
      >
        <BackButton onClick={onClose} />
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} mx-practice-flow__body`}>
        {step === 'intro' && (
          <div className="one-finish-stage one-finish-stage--intro animate-fade-in">
            <div className="one-finish-stage__center text-center">
              <Eyebrow />
              <h2 className="font-display text-[24px] text-cream leading-[1.1] tracking-[-0.03em]">
                Доведи один маленький кусок до конца
              </h2>
              <p className="mx-auto mt-4 max-w-[310px] text-[13px] leading-relaxed text-muted">
                Короткая сессия, чтобы выбрать один кусок, который можно честно проверить сегодня.
              </p>
              <p className="mt-4 text-[12px] font-semibold text-faint">
                5 минут&nbsp;&nbsp;·&nbsp;&nbsp;6 шагов
              </p>
              <div className="one-finish-art" aria-hidden="true">
                <OneFinishArt />
              </div>
            </div>

            <button
              type="button"
              onClick={startPractice}
              aria-label="Начать: найти один финиш"
              className="cta-pill w-full text-[14px] px-6 py-4 mt-6"
            >
              Найти один финиш
            </button>
          </div>
        )}

        {step === 'project' && (
          <div className="one-finish-stage one-finish-stage--writing animate-fade-in">
            <Progress step={step} />
            <StageHeading>Что зависло на середине?</StageHeading>

            <JournalTextarea
              autoFocus
              value={project}
              onChange={setProject}
              placeholder="Например: ремонт в комнате"
              ariaLabel="Проект, который завис на середине"
              className="one-finish-stage__writer min-h-[12rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={goToState}
              submitLabel="Дальше"
              submitDisabled={!project.trim()}
            />
          </div>
        )}

        {step === 'state' && (
          <div className="one-finish-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>На чём застряло?</StageHeading>

            <OptionList options={STATE_OPTIONS} onPick={chooseState} />
          </div>
        )}

        {step === 'reframe' && (
          <div className="one-finish-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>{reframePhrase}</StageHeading>

            <button
              type="button"
              onClick={goToFinish}
              className="cta-pill w-full text-[14px] px-6 py-3.5 mt-5"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 'finish' && (
          <div className="one-finish-stage one-finish-stage--writing animate-fade-in">
            <Progress step={step} />
            <StageHeading>Какой маленький кусок можно завершить сегодня?</StageHeading>

            <JournalTextarea
              autoFocus
              value={finish}
              onChange={setFinish}
              placeholder="Например: докрасить один угол, а не всю комнату"
              ariaLabel="Маленький кусок для завершения"
              className="one-finish-stage__writer min-h-[12rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={startRun}
              submitLabel="Начать пять минут"
              submitDisabled={!finish.trim()}
            />
          </div>
        )}

        {step === 'run' && (
          <div className="one-finish-stage animate-fade-in text-center">
            <Progress step={step} />
            <StageHeading>Только этот кусок</StageHeading>

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
          <div className="one-finish-stage animate-fade-in">
            <Progress step={step} />
            <StageHeading>Как прошло?</StageHeading>

            <OptionList options={OUTCOME_OPTIONS} onPick={chooseOutcome} />
          </div>
        )}

        {step === 'complete' && (
          <div className="one-finish-stage one-finish-stage--complete animate-fade-in">
            <div className="one-finish-stage__center text-center">
              <div className="one-finish-art" aria-hidden="true">
                <OneFinishArt />
              </div>
              <h2 className="font-display text-[22px] text-cream leading-tight">
                {COMPLETION_COPY[outcome]?.title}
              </h2>
              <p className="mx-auto mt-3 max-w-[310px] text-[13px] text-muted leading-relaxed">
                {COMPLETION_COPY[outcome]?.description}
                <span className="mt-3 block text-[12px] text-faint">
                  Следующий шаг: {finish || 'один отдельный кусок проекта'} — финиш наступил, когда
                  результат можно проверить.
                </span>
              </p>

              <p className="mt-7 text-[12px] font-semibold text-muted">Помогло сейчас?</p>
              <div className="one-finish-feedback">
                {REFLECTION_OPTIONS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={reflection === key}
                    onClick={() => {
                      platform.haptic('light')
                      setReflection(key)
                    }}
                    className="one-finish-feedback__option"
                  >
                    <Icon size={23} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={finishSession}
                  className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
                >
                  Пропустить
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={finishSession}
              aria-label="Завершить: продолжить в Сегодня"
              className="cta-pill w-full text-[14px] px-6 py-4 mt-6"
            >
              Продолжить в Сегодня
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
