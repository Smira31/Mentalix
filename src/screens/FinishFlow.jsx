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
import { saveOneFinishEntry } from '../lib/oneFinishPractice'

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
      Один финиш
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

export default function FinishFlow({ userId, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState('project')
  const [project, setProject] = useState('')
  const [finish, setFinish] = useState('')
  const [outcome, setOutcome] = useState(null)

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
    setStep('reflect')
  }

  function finishSession(reflection) {
    platform.haptic('light')
    saveOneFinishEntry(userId, { outcome, reflection })
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
        {step === 'project' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Что зависло на середине?
            </h2>

            <JournalTextarea
              autoFocus
              value={project}
              onChange={setProject}
              placeholder="Например: ремонт в комнате"
              ariaLabel="Проект, который завис на середине"
              className="mt-6 min-h-[18rem]"
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
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">На чём застряло?</h2>

            <OptionList options={STATE_OPTIONS} onPick={chooseState} />
          </div>
        )}

        {step === 'reframe' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[22px] text-cream leading-snug">{reframePhrase}</h2>

            <button
              type="button"
              onClick={goToFinish}
              className="cta-pill w-full text-[15px] px-6 py-3.5 mt-5"
            >
              Дальше
            </button>
          </div>
        )}

        {step === 'finish' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">
              Какой маленький кусок можно завершить сегодня?
            </h2>

            <JournalTextarea
              autoFocus
              value={finish}
              onChange={setFinish}
              placeholder="Например: докрасить один угол, а не всю комнату"
              ariaLabel="Маленький кусок для завершения"
              className="mt-6 min-h-[18rem]"
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
          <div className="w-full max-w-md mx-auto animate-fade-in text-center">
            <Eyebrow />

            <h2 className="font-display text-[24px] text-cream leading-tight">Только этот кусок</h2>

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

            <OptionList options={REFLECTION_OPTIONS} onPick={finishSession} />

            <div className="mt-5">
              <button
                type="button"
                onClick={() => finishSession(null)}
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
