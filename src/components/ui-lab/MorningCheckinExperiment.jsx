import { useState } from 'react'
import { createPortal } from 'react-dom'

import SemanticGlyph from '../SemanticGlyph'
import { useFullscreenSurface } from '../../lib/fullscreenSurface'

import './MorningCheckinExperiment.css'

const METRICS = [
  { key: 'mood', label: 'Настроение' },
  { key: 'energy', label: 'Энергия' },
  { key: 'noise', label: 'Шум в голове' },
  { key: 'focus', label: 'Фокус / собранность' },
]

const MAIN_OPTIONS = ['Сделать главное', 'Разобраться с важным', 'Позаботиться о себе']

function Shell({ children, onBack, onExit, progress, label }) {
  const surface = useFullscreenSurface()

  return createPortal(
    <div className="mx-morning__overlay" style={surface.style}>
      <div className="mx-morning__shell">
        <div className="mx-morning__topline">
          <button type="button" onClick={onBack} aria-label="Назад">
            ← Назад
          </button>
          <span>{label}</span>
          <button type="button" onClick={onExit} aria-label="Выйти из чек-ина">
            Выйти
          </button>
        </div>
        <div className="mx-morning__progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

function PrimaryButton({ children, disabled, onClick }) {
  return (
    <button type="button" className="mx-morning__primary" disabled={disabled} onClick={onClick}>
      {children}
      <span aria-hidden="true">→</span>
    </button>
  )
}

function MetricControl({ metric, value, onChange }) {
  return (
    <div className="mx-morning__metric">
      <div className="mx-morning__metric-head">
        <span>{metric.label}</span>
        <strong>{value || '—'} / 5</strong>
      </div>
      <div className="mx-morning__metric-buttons" role="radiogroup" aria-label={metric.label}>
        {[1, 2, 3, 4, 5].map(level => (
          <button
            type="button"
            key={level}
            role="radio"
            aria-label={`${metric.label}: ${level} из 5`}
            aria-checked={value === level}
            data-selected={value === level}
            onClick={() => onChange(level)}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  )
}

function StateScreen({ values, onChange, onNext, onBack, onExit }) {
  const complete = METRICS.every(metric => values[metric.key])
  return (
    <Shell onBack={onBack} onExit={onExit} progress={25} label="Состояние · 1 / 3">
      <section className="mx-morning__screen" aria-labelledby="morning-state-title">
        <span className="mx-morning__eyebrow">Сначала — заметить себя</span>
        <h2 id="morning-state-title">Как ты сегодня?</h2>
        <p className="mx-morning__lead">Четыре короткие шкалы без правильного ответа.</p>
        <div className="mx-morning__metrics">
          {METRICS.map(metric => (
            <MetricControl
              key={metric.key}
              metric={metric}
              value={values[metric.key]}
              onChange={value => onChange(metric.key, value)}
            />
          ))}
        </div>
      </section>
      <PrimaryButton disabled={!complete} onClick={onNext}>
        Дальше
      </PrimaryButton>
    </Shell>
  )
}

function MainScreen({ value, custom, onValue, onCustom, onNext, onBack, onExit }) {
  const selected = custom.trim() || value
  return (
    <Shell onBack={onBack} onExit={onExit} progress={50} label="Главное · 2 / 3">
      <section className="mx-morning__screen" aria-labelledby="morning-main-title">
        <span className="mx-morning__eyebrow">Один смысловой центр</span>
        <h2 id="morning-main-title">Что сегодня действительно важно?</h2>
        <div className="mx-morning__choices" role="radiogroup" aria-label="Главное на сегодня">
          {MAIN_OPTIONS.map(option => (
            <button
              type="button"
              key={option}
              role="radio"
              aria-checked={value === option && !custom}
              data-selected={value === option && !custom}
              onClick={() => {
                onValue(option)
                onCustom('')
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="mx-morning__input-label">
          <span>Своё</span>
          <input
            type="text"
            value={custom}
            maxLength={140}
            placeholder="Напиши коротко"
            onChange={event => {
              onCustom(event.target.value)
              onValue('')
            }}
          />
        </label>
      </section>
      <PrimaryButton disabled={!selected} onClick={onNext}>
        Выбрать шаг
      </PrimaryButton>
    </Shell>
  )
}

function StepScreen({ value, onChange, onNext, onBack, onExit }) {
  return (
    <Shell onBack={onBack} onExit={onExit} progress={75} label="Первый шаг · 3 / 3">
      <section className="mx-morning__screen" aria-labelledby="morning-step-title">
        <span className="mx-morning__eyebrow">Сделать маленьким</span>
        <h2 id="morning-step-title">Что ты можешь начать за 5–10 минут?</h2>
        <label className="mx-morning__input-label mx-morning__input-label--large">
          <span>Первый шаг</span>
          <textarea
            value={value}
            rows={4}
            maxLength={240}
            placeholder="Например: открыть документ и написать первый абзац"
            onChange={event => onChange(event.target.value)}
          />
        </label>
        <p className="mx-morning__hint">Это не весь план. Только действие, с которого можно начать.</p>
      </section>
      <PrimaryButton disabled={!value.trim()} onClick={onNext}>
        Начать день
      </PrimaryButton>
    </Shell>
  )
}

function ResultScreen({ main, firstStep, onConfirm, onBack, onExit }) {
  return (
    <Shell onBack={onBack} onExit={onExit} progress={92} label="Готово">
      <section className="mx-morning__result" aria-labelledby="morning-result-title">
        <div className="mx-morning__result-art" aria-hidden="true">
          <SemanticGlyph kind="next-step" animated={false} highlighted={false} />
        </div>
        <span className="mx-morning__eyebrow">На сегодня достаточно</span>
        <h2 id="morning-result-title">Главное собрано</h2>
        <dl>
          <div>
            <dt>Главное</dt>
            <dd>{main}</dd>
          </div>
          <div>
            <dt>Первый шаг</dt>
            <dd>{firstStep}</dd>
          </div>
        </dl>
      </section>
      <PrimaryButton onClick={onConfirm}>Подтвердить</PrimaryButton>
    </Shell>
  )
}

function TodayScreen({ main, firstStep, onReset }) {
  return (
    <section className="mx-morning__today" aria-labelledby="morning-today-title">
      <div className="mx-morning__today-head">
        <span className="mx-morning__eyebrow">Today · dayInProgress · simulated</span>
        <h2 id="morning-today-title">День начат</h2>
        <p>Главное осталось рядом. Начни с сохранённого действия.</p>
      </div>
      <div className="mx-morning__action">
        <span>Главный action · первый шаг</span>
        <strong>{firstStep}</strong>
        <small>{main}</small>
      </div>
      <button type="button" className="mx-morning__secondary" onClick={onReset}>
        Пройти заново
      </button>
    </section>
  )
}

export default function MorningCheckinExperiment() {
  const [screen, setScreen] = useState('state')
  const [metrics, setMetrics] = useState({})
  const [main, setMain] = useState('')
  const [customMain, setCustomMain] = useState('')
  const [firstStep, setFirstStep] = useState('')

  function reset() {
    setScreen('state')
    setMetrics({})
    setMain('')
    setCustomMain('')
    setFirstStep('')
  }

  const selectedMain = customMain.trim() || main

  if (screen === 'today') return <TodayScreen main={selectedMain} firstStep={firstStep} onReset={reset} />
  if (screen === 'state') {
    return (
      <section className="mx-morning" aria-labelledby="morning-experiment-title">
        <div className="mx-morning__experiment-head">
          <span>Утренний чек-ин · Preview-only</span>
          <h2 id="morning-experiment-title">Собрать день из одного шага</h2>
          <p>Локальная гипотеза для Today/checkinPending. Данные никуда не отправляются.</p>
        </div>
        <StateScreen
          values={metrics}
          onChange={(key, value) => setMetrics(current => ({ ...current, [key]: value }))}
          onNext={() => setScreen('main')}
          onBack={reset}
          onExit={reset}
        />
      </section>
    )
  }
  if (screen === 'main') {
    return (
      <MainScreen
        value={main}
        custom={customMain}
        onValue={setMain}
        onCustom={setCustomMain}
        onNext={() => setScreen('step')}
        onBack={() => setScreen('state')}
        onExit={reset}
      />
    )
  }
  if (screen === 'step') {
    return (
      <StepScreen
        value={firstStep}
        onChange={setFirstStep}
        onNext={() => setScreen('result')}
        onBack={() => setScreen('main')}
        onExit={reset}
      />
    )
  }
  return (
    <ResultScreen
      main={selectedMain}
      firstStep={firstStep.trim()}
      onConfirm={() => setScreen('today')}
      onBack={() => setScreen('step')}
      onExit={reset}
    />
  )
}
