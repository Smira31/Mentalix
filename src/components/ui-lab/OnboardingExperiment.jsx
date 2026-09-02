import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react'
import './OnboardingExperiment.css'

const FIRST_NEXT_STEP = 'Записать одну мысль, с которой начнёшь день'

const STEPS = ['welcome', 'today', 'checkin', 'activated']

function FlowHeader({ step, onBack, onRestart }) {
  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="mx-onboarding-lab__flow-head">
      {stepIndex > 0 ? (
        <button
          type="button"
          className="mx-onboarding-lab__icon-button"
          onClick={onBack}
          aria-label="Назад"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <span
        className="mx-onboarding-lab__progress"
        aria-label={`Шаг ${stepIndex + 1} из ${STEPS.length}`}
      >
        {STEPS.map((item, index) => (
          <span key={item} data-active={index <= stepIndex} />
        ))}
      </span>
      <button type="button" className="mx-onboarding-lab__restart" onClick={onRestart}>
        <RotateCcw size={14} aria-hidden="true" />
        Сначала
      </button>
    </div>
  )
}

function PrimaryButton({ children, disabled = false, onClick }) {
  return (
    <button
      type="button"
      className="mx-onboarding-lab__primary"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  )
}

function SimulatedToday({ activated, nextStep, onStartCheckin }) {
  return (
    <div
      className="mx-onboarding-lab__today"
      data-state={activated ? 'dayInProgress' : 'checkinPending'}
    >
      <div className="mx-onboarding-lab__today-topline">
        <span>Сегодня</span>
        <span>{activated ? 'день идёт' : 'утренняя настройка'}</span>
      </div>
      <div className="mx-onboarding-lab__today-mark" aria-hidden="true">
        <span data-active={activated} />
      </div>
      <p className="mx-onboarding-lab__today-eyebrow">
        {activated ? 'Следующий шаг' : 'Сейчас важно'}
      </p>
      <h3>{activated ? nextStep : 'Понять, что действительно важно сегодня'}</h3>
      <p className="mx-onboarding-lab__today-copy">
        {activated
          ? 'Шаг остался тем же — к нему можно вернуться в любой момент.'
          : 'Короткий чек-ин поможет заметить состояние и выбрать одно реалистичное действие.'}
      </p>
      {!activated && <PrimaryButton onClick={onStartCheckin}>Начать чек-ин</PrimaryButton>}
      {activated && (
        <div className="mx-onboarding-lab__saved-step">
          <Check size={17} aria-hidden="true" />
          <span>Шаг сохранён в сегодняшнем дне</span>
        </div>
      )}
    </div>
  )
}

export default function OnboardingExperiment() {
  const [step, setStep] = useState('welcome')
  const [nextStep, setNextStep] = useState('')

  const stepIndex = STEPS.indexOf(step)

  function restart() {
    setStep('welcome')
    setNextStep('')
  }

  function back() {
    setStep(STEPS[Math.max(0, stepIndex - 1)])
  }

  return (
    <section className="mx-onboarding-lab" data-step={step} aria-labelledby="onboarding-lab-title">
      <header className="mx-onboarding-lab__head">
        <p className="mx-onboarding-lab__kicker">MXL-ONBOARDING-UX-001 · Preview-only</p>
        <h2 id="onboarding-lab-title">Первый шаг без анкеты</h2>
        <p>
          Проверка непрерывности: Welcome → Today → Morning Check-in → тот же next step в Today.
        </p>
      </header>

      <div className="mx-onboarding-lab__stage">
        <FlowHeader step={step} onBack={back} onRestart={restart} />

        {step === 'welcome' && (
          <div className="mx-onboarding-lab__screen mx-onboarding-lab__welcome">
            <div>
              <span className="mx-onboarding-lab__wordmark">Mentalix.</span>
              <h3>Понять, что важно. Сделать следующий шаг.</h3>
              <p>
                Короткая утренняя настройка помогает собрать сегодняшний день без лишних решений.
              </p>
            </div>
            <PrimaryButton onClick={() => setStep('today')}>Начать</PrimaryButton>
          </div>
        )}

        {step === 'today' && (
          <div className="mx-onboarding-lab__screen">
            <SimulatedToday
              activated={false}
              nextStep={nextStep}
              onStartCheckin={() => setStep('checkin')}
            />
          </div>
        )}

        {step === 'checkin' && (
          <div className="mx-onboarding-lab__screen mx-onboarding-lab__checkin">
            <div>
              <p className="mx-onboarding-lab__eyebrow">Morning Check-in · главное</p>
              <h3>Что сегодня действительно важно?</h3>
              <p>Сформулируй один реалистичный следующий шаг. Не идеальный план на весь день.</p>
            </div>
            <label>
              <span>Твой следующий шаг</span>
              <textarea
                value={nextStep}
                onChange={event => setNextStep(event.target.value)}
                placeholder="Например: 15 минут спокойно разобрать первую задачу"
                rows={4}
                autoFocus
              />
            </label>
            <PrimaryButton disabled={!nextStep.trim()} onClick={() => setStep('activated')}>
              Показать в Today
            </PrimaryButton>
          </div>
        )}

        {step === 'activated' && (
          <div className="mx-onboarding-lab__screen">
            <div className="mx-onboarding-lab__activation-note">
              <Check size={18} aria-hidden="true" />
              <span>Activation reached · первый результат получен</span>
            </div>
            <SimulatedToday activated nextStep={nextStep.trim()} onStartCheckin={() => {}} />
          </div>
        )}
      </div>

      <p className="mx-onboarding-lab__boundary">
        Локальная simulation: API не вызывается, `mx-onboarded-v2`, `mx-onboarding` и profile
        settings не записываются.
      </p>
    </section>
  )
}
