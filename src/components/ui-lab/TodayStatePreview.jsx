import { ArrowRight } from 'lucide-react'
import SemanticGlyph from '../SemanticGlyph'
import Today from '../../screens/Today'
import { getTodayLabFixture, UI_LAB_USER } from './todayLabFixture'
import './TodayStatePreview.css'

export const TODAY_STATES = [
  {
    key: 'checkinPending',
    label: 'Чек-ин',
    eyebrow: 'Состояние дня',
    title: 'Сначала понять, как ты сегодня',
    description: 'Коротко зафиксируй состояние, чтобы выбрать бережный первый шаг.',
    cta: 'Начать чек-ин',
    glyph: 'journal',
    dayArc: { state: 'empty', done: 0, total: 3 },
    context: 'утренний вход',
  },
  {
    key: 'dayInProgress',
    label: 'В процессе',
    eyebrow: 'Один следующий шаг',
    title: 'Записать главную мысль',
    description: 'Один небольшой шаг, который поддерживает то, что сейчас важно.',
    cta: 'Начать',
    glyph: 'next-step',
    dayArc: { state: 'dayInProgress', done: 1, total: 3 },
    context: 'ритуал · 5 минут',
  },
  {
    key: 'reviewPending',
    label: 'Разбор',
    eyebrow: 'Сверить день',
    title: 'Что получилось заметить и сделать?',
    description: 'Сопоставь план и фактический результат без отчётности и оценки.',
    cta: 'Разобрать день',
    glyph: 'release',
    dayArc: { state: 'reviewPending', done: 3, total: 3 },
    context: 'вечерний разбор',
  },
  {
    key: 'dayClosed',
    label: 'Завершён',
    eyebrow: 'День завершён',
    title: 'Оставить вывод и увидеть завтрашний шаг',
    description: 'Сегодня уже завершён. Спокойно сохрани главное и вернись завтра.',
    cta: 'Посмотреть завтрашний шаг',
    glyph: 'finish',
    dayArc: { state: 'dayClosed', done: 3, total: 3 },
    context: 'итог дня',
  },
]

function StatePicker({ value, onChange }) {
  return (
    <div className="mx-lab-state-picker" role="tablist" aria-label="Состояние Today">
      {TODAY_STATES.map(state => (
        <button
          key={state.key}
          type="button"
          role="tab"
          aria-selected={value === state.key}
          data-active={value === state.key}
          onClick={() => onChange(state.key)}
        >
          {state.label}
        </button>
      ))}
    </div>
  )
}

function BaselineToday({ state }) {
  return (
    <div className="mx-lab-today-baseline" data-state={state.key}>
      <Today
        key={state.key}
        user={UI_LAB_USER}
        previewFixture={getTodayLabFixture(state.key)}
        previewState={state.key}
        onOpenPractice={() => {}}
        onGoMentor={() => {}}
        onFlowChange={() => {}}
      />
    </div>
  )
}

function ExperimentToday({ state }) {
  return (
    <div className="mx-lab-today-experiment" data-state={state.key}>
      <div className="mx-lab-experiment-art" aria-hidden="true">
        <SemanticGlyph kind={state.glyph} animated highlighted />
      </div>
      <small>{state.eyebrow}</small>
      <h3>{state.title}</h3>
      <p>{state.description}</p>
      <button type="button" className="mx-lab-experiment-cta">
        {state.cta}
        <ArrowRight size={16} />
      </button>
      <span>{state.context}</span>
    </div>
  )
}

export default function TodayStatePreview({
  mode = 'experiments',
  selectedState = 'checkinPending',
  onStateChange,
}) {
  const state = TODAY_STATES.find(item => item.key === selectedState) || TODAY_STATES[0]
  const setState = onStateChange || (() => {})

  return (
    <section className="mx-lab-today-route" aria-labelledby="today-preview-title">
      <div className="mx-lab-route-heading">
        <span>Первый собранный маршрут</span>
        <h2 id="today-preview-title">Today · четыре состояния</h2>
        <p>
          Одна фикстура состояния применяется к production-компоненту эталона и эксперименту. API не
          подключен.
        </p>
      </div>
      <StatePicker value={state.key} onChange={setState} />
      {mode === 'baseline' && <BaselineToday state={state} />}
      {mode === 'experiments' && <ExperimentToday state={state} />}
      {mode === 'compare' && (
        <div className="mx-lab-compare-grid">
          <article>
            <header>
              <strong>Эталон</strong>
              <span>из текущего main</span>
            </header>
            <BaselineToday state={state} />
          </article>
          <article>
            <header>
              <strong>Эксперимент</strong>
              <span>Preview-only гипотеза</span>
            </header>
            <ExperimentToday state={state} />
          </article>
        </div>
      )}
    </section>
  )
}
