import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import JournalTextarea from '../components/JournalTextarea'
import SceneLayout from '../components/practices/SceneLayout'
import { useFullscreenSurface, FULLSCREEN_SHELL_CLASS } from '../lib/fullscreenSurface'

const STEP_PROGRESS = {
  observe: 1,
  influence: 2,
  action: 3,
  close: 4,
}

function Progress({ step }) {
  const current = STEP_PROGRESS[step]

  if (!current) return null

  return (
    <div className="mb-5" aria-label={`Шаг ${current} из 4`}>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index < current ? 'bg-gold' : 'bg-cream/15'}`}
          />
        ))}
      </div>
      <span className="mt-2 block text-[10px] uppercase tracking-[0.14em] text-faint">
        {current} из 4
      </span>
    </div>
  )
}

export default function MeditationFlow({ onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const sceneScrollRef = useRef(null)
  const [step, setStep] = useState('intro')
  const [observation, setObservation] = useState('')
  const [influence, setInfluence] = useState('')
  const [action, setAction] = useState('')

  useEffect(() => {
    document.activeElement?.blur?.()
    sceneScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [step])

  function next(nextStep) {
    platform.haptic('light')
    setStep(nextStep)
  }

  function finish() {
    platform.haptic('success')
    setStep('complete')
  }

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow`} style={surfaceStyle}>
      {step === 'intro' && (
        <SceneLayout
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Медитация"
          title="Вернись к тому, что действительно зависит от тебя"
          centered
          description={
            <>
              Короткая письменная практика без правильных ответов. Заметь ситуацию, выбери один
              честный шаг и оставь остальное на потом.
              <span className="mt-3 block text-[12px] font-semibold text-faint">
                5–10 минут&nbsp;&nbsp;·&nbsp;&nbsp;4 шага
              </span>
            </>
          }
        >
          <p className="mb-5 text-center text-[12px] leading-relaxed text-faint">
            Если становится тяжелее, остановись и вернись к себе позже.
          </p>
          <button
            type="button"
            onClick={() => next('observe')}
            className="cta-pill w-full px-6 py-4 text-[14px]"
          >
            Начать
          </button>
        </SceneLayout>
      )}

      {step === 'observe' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Медитация"
          title="Что сейчас происходит?"
          progress={<Progress step={step} />}
          className="practice-scene--input practice-scene--input-centered practice-scene--no-blame"
          description="Назови ситуацию так, как она выглядит сейчас. Без объяснений и обвинений — только то, что ты можешь заметить."
        >
          <JournalTextarea
            writingCanvas
            autoFocus
            value={observation}
            onChange={setObservation}
            placeholder="Например: я жду ответа и постоянно проверяю телефон"
            ariaLabel="Что сейчас происходит"
            className="min-h-[14rem]"
            editorClassName="pb-24"
            floatingToolbar
            formatting={false}
            onSubmit={() => next('influence')}
            submitLabel="Дальше"
            submitDisabled={!observation.trim()}
          />
        </SceneLayout>
      )}

      {step === 'influence' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={() => setStep('observe')}
          label="Медитация"
          title="Что из этого зависит от тебя?"
          progress={<Progress step={step} />}
          className="practice-scene--input practice-scene--input-centered practice-scene--no-blame"
          description="Отдели своё действие от чужой реакции, времени и обстоятельств. Здесь не нужно решить всё — достаточно найти свою часть."
        >
          <JournalTextarea
            autoFocus
            value={influence}
            onChange={setInfluence}
            placeholder="Например: я могу отправить один ясный вопрос и перестать проверять телефон"
            ariaLabel="Что зависит от меня"
            className="min-h-[14rem]"
            editorClassName="pb-24"
            floatingToolbar
            formatting={false}
            onSubmit={() => next('action')}
            submitLabel="Дальше"
            submitDisabled={!influence.trim()}
          />
        </SceneLayout>
      )}

      {step === 'action' && (
        <SceneLayout
          showGlyph={false}
          scrollRef={sceneScrollRef}
          onBack={() => setStep('influence')}
          label="Медитация"
          title="Какой один шаг ты выбираешь?"
          progress={<Progress step={step} />}
          className="practice-scene--input practice-scene--input-centered practice-scene--no-blame"
          description="Сделай шаг маленьким и проверяемым. Не обещай себе изменить всё — выбери действие, которое можно выполнить сегодня."
        >
          <JournalTextarea
            autoFocus
            value={action}
            onChange={setAction}
            placeholder="Например: отправить сообщение до 18:00"
            ariaLabel="Один следующий шаг"
            className="min-h-[14rem]"
            editorClassName="pb-24"
            floatingToolbar
            formatting={false}
            onSubmit={finish}
            submitLabel="Завершить"
            submitDisabled={!action.trim()}
          />
        </SceneLayout>
      )}

      {step === 'complete' && (
        <SceneLayout
          scrollRef={sceneScrollRef}
          onBack={onClose}
          label="Медитация завершена"
          title="Ты выбрал(а) свою часть"
          centered
          description={
            <>
              Не всё нужно удерживать и не всё нужно решать прямо сейчас. Вернись к выбранному шагу
              тогда, когда будешь готов(а).
            </>
          }
        >
          <div className="rounded-3xl bg-emerald px-5 py-4 text-left">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-gold">
              твой шаг
            </span>
            <p className="mt-2 text-[14px] leading-relaxed text-cream">{action}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cta-pill mt-5 w-full px-6 py-4 text-[14px]"
          >
            Вернуться к практикам
          </button>
        </SceneLayout>
      )}
    </div>,
    document.body
  )
}
