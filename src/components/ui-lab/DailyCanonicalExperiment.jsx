import { useState } from 'react'

import Today from '../../screens/Today'
import SemanticGlyph from '../SemanticGlyph'
import MorningCheckinExperiment from './MorningCheckinExperiment'
import EveningReviewExperiment from './EveningReviewExperiment'
import { getTodayLabFixture, UI_LAB_USER } from './todayLabFixture'

import './DailyCanonicalExperiment.css'

const DEBUG_STATES = [
  { key: 'welcome', label: 'NEW USER' },
  { key: 'checkinPending', label: 'CHECKIN PENDING' },
  { key: 'dayInProgress', label: 'DAY IN PROGRESS' },
  { key: 'reviewPending', label: 'REVIEW PENDING' },
  { key: 'dayClosed', label: 'DAY CLOSED' },
]

function WelcomeScreen({ onStart }) {
  return (
    <section className="mx-daily__welcome" aria-labelledby="daily-welcome-title">
      <span className="mx-daily__wordmark">Mentalix.</span>
      <h2 id="daily-welcome-title">Понять, что важно. Сделать следующий шаг.</h2>
      <p>Один день целиком: чек-ин → первый шаг → разбор вечером.</p>
      <button type="button" className="mx-daily__primary" onClick={onStart}>
        Начать
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

function TodayBaseline({ state, mainRitualName }) {
  return (
    <div className="mx-daily__surface" data-state={state}>
      <Today
        key={`${state}:${mainRitualName || ''}`}
        user={UI_LAB_USER}
        previewFixture={getTodayLabFixture(state, { mainRitualName })}
        previewState={state}
        onOpenPractice={() => {}}
        onGoMentor={() => {}}
        onFlowChange={() => {}}
      />
    </div>
  )
}

function CheckinPendingScreen({ mainRitualName, onStartCheckin }) {
  return (
    <div className="mx-daily__phase">
      <TodayBaseline state="checkinPending" mainRitualName={mainRitualName} />
      <button type="button" className="mx-daily__primary mx-daily__bridge" onClick={onStartCheckin}>
        Начать чек-ин
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

function DayInProgressScreen({ mainRitualName, onComplete }) {
  return (
    <div className="mx-daily__phase">
      <TodayBaseline state="dayInProgress" mainRitualName={mainRitualName} />
      <button type="button" className="mx-daily__primary mx-daily__bridge" onClick={onComplete}>
        Отметить выполненным
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

function CompletionScreen({ onReview }) {
  return (
    <section className="mx-daily__completion" aria-labelledby="daily-completion-title">
      <div className="mx-daily__completion-art" aria-hidden="true">
        <SemanticGlyph kind="finish" animated={false} highlighted={false} />
      </div>
      <span className="mx-daily__eyebrow">Шаг сделан</span>
      <h2 id="daily-completion-title">Хорошо. На сегодня достаточно.</h2>
      <p>Вечером можно спокойно вернуться и разобрать день.</p>
      <button type="button" className="mx-daily__primary" onClick={onReview}>
        К вечернему разбору
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

function ReviewPendingScreen({ mainRitualName, onStartReview }) {
  return (
    <div className="mx-daily__phase">
      <TodayBaseline state="reviewPending" mainRitualName={mainRitualName} />
      <button type="button" className="mx-daily__primary mx-daily__bridge" onClick={onStartReview}>
        Разобрать день
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

function DayClosedScreen({ mainRitualName, onNextDay }) {
  return (
    <div className="mx-daily__phase">
      <TodayBaseline state="dayClosed" mainRitualName={mainRitualName} />
      <button type="button" className="mx-daily__primary mx-daily__bridge" onClick={onNextDay}>
        Следующий день
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

export default function DailyCanonicalExperiment() {
  const [phase, setPhase] = useState('welcome')
  const [firstStep, setFirstStep] = useState('')

  function resetAll() {
    setPhase('welcome')
    setFirstStep('')
  }

  return (
    <section className="mx-daily" data-phase={phase} aria-labelledby="daily-canonical-title">
      <div className="mx-daily__head">
        <span>MXL-DAILY-CANONICAL-UI-LAB-001 · Preview-only</span>
        <h2 id="daily-canonical-title">Дневной цикл целиком</h2>
        <p>
          Welcome → Check-in → первый шаг → день → разбор → закрытие дня. Собрано из существующих UI
          Lab прототипов, API не подключён.
        </p>
      </div>
      <div className="mx-daily__debug" role="group" aria-label="Быстрый переход между состояниями">
        {DEBUG_STATES.map(item => (
          <button
            key={item.key}
            type="button"
            data-active={phase === item.key}
            onClick={() => setPhase(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className="mx-daily__debug-reset" onClick={resetAll}>
          RESET
        </button>
      </div>
      <div className="mx-daily__stage">
        {phase === 'welcome' && <WelcomeScreen onStart={() => setPhase('checkinPending')} />}
        {phase === 'checkinPending' && (
          <CheckinPendingScreen
            mainRitualName={firstStep}
            onStartCheckin={() => setPhase('morningCheckin')}
          />
        )}
        {phase === 'morningCheckin' && (
          <MorningCheckinExperiment
            onComplete={(_main, step) => {
              setFirstStep(step)
              setPhase('dayInProgress')
            }}
          />
        )}
        {phase === 'dayInProgress' && (
          <DayInProgressScreen
            mainRitualName={firstStep}
            onComplete={() => setPhase('completion')}
          />
        )}
        {phase === 'completion' && <CompletionScreen onReview={() => setPhase('reviewPending')} />}
        {phase === 'reviewPending' && (
          <ReviewPendingScreen
            mainRitualName={firstStep}
            onStartReview={() => setPhase('eveningReview')}
          />
        )}
        {phase === 'eveningReview' && (
          <EveningReviewExperiment onDayClosed={() => setPhase('dayClosed')} />
        )}
        {phase === 'dayClosed' && (
          <DayClosedScreen mainRitualName={firstStep} onNextDay={resetAll} />
        )}
      </div>
      <footer className="mx-daily__footer">
        Preview-only · главное свойство теста непрерывности: First Step дословно доходит от Morning
        Check-in до Today/dayInProgress.
      </footer>
    </section>
  )
}
