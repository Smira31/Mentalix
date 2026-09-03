import { useState, useSyncExternalStore } from 'react'

import Today from '../../screens/Today'
import SemanticGlyph from '../SemanticGlyph'
import MorningCheckinExperiment from './MorningCheckinExperiment'
import EveningReviewExperiment from './EveningReviewExperiment'
import { getTodayLabFixture, UI_LAB_USER } from './todayLabFixture'
import { getFullscreenSnapshot, subscribeFullscreen } from '../../lib/tgFullscreen'
import { TG_CONTROLS_HEIGHT } from '../../lib/fullscreenSurface'

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
      {/*
       * TodayBaseline рендерит настоящий prod Today.jsx, у которого на
       * reviewPending есть собственная кнопка «Разобрать день»
       * (Today.jsx:547-556, `changeSub('checkin')` — открывает реальный
       * CheckIn.jsx). Today.jsx не принимает пропа для переопределения этого
       * действия (только onOpenPractice/onGoMentor/onFlowChange/onCloseSeries,
       * ни один их них не покрывает internal changeSub) — трогать production
       * Today.jsx вне scope этой ветки. Прячем именно эту кнопку CSS-таргетингом
       * через уже существующий data-state на .mx-daily__surface
       * (DailyCanonicalExperiment.css, `[data-state='reviewPending'] .mx-today-
       * primary-card .cta-pill`), чтобы остался ровно один явный путь
       * reviewPending → разбор дня — bridge-кнопка ниже, в EveningReviewExperiment,
       * а не в реальный CheckIn.jsx (см. UI-DEC-003).
       */}
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

  // ?ui_lab=* никогда не монтирует App.jsx (main.jsx рендерит <UiLab> вместо него), а
  // Telegram fullscreen/safe-area negotiation (src/lib/tgFullscreen.js) сама по себе
  // стартует только из App.jsx или из первого вызова useFullscreenSurface() — то есть
  // только когда пользователь открывает Morning Check-in. До этого --app-safe-top не
  // учитывает высоту нативной Telegram-шапки, и этот заголовок, стоящий в обычном
  // потоке страницы (не портал), успевает отрисоваться под ней. Подписка здесь и
  // запускает тот же общий store заранее — без дублирования его логики.
  const tgFullscreen = useSyncExternalStore(subscribeFullscreen, getFullscreenSnapshot)
  const headStyle = {
    paddingTop: tgFullscreen
      ? `calc(var(--app-safe-top) + ${TG_CONTROLS_HEIGHT}px)`
      : 'var(--app-safe-top)',
  }

  function resetAll() {
    setPhase('welcome')
    setFirstStep('')
  }

  return (
    <section className="mx-daily" data-phase={phase} aria-labelledby="daily-canonical-title">
      <div className="mx-daily__head" style={headStyle}>
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
            onExit={() => setPhase('checkinPending')}
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
