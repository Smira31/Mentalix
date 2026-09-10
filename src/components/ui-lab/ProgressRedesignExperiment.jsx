import { useMemo, useState } from 'react'
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  House,
  MessageCircle,
  Sparkles,
} from 'lucide-react'

import './ProgressRedesignExperiment.css'

const STATES = [
  ['ready', 'Есть данные'],
  ['insufficient', 'Мало данных'],
  ['empty', 'Пусто'],
  ['loading', 'Загрузка'],
  ['error', 'Ошибка'],
]

const PERIODS = [7, 14, 30, 90]

const MONTH_POINTS = [
  3.1, 3.4, 3.2, 3.8, 4.1, 3.7, 3.9, 3.5, 3.2, 2.8, 3.1, 2.7, 2.5, 2.9, 3.3, 3.1, 3.6, 3.9, 3.7,
  4.2, 4.1, 4.4, 4.0, 4.3, 4.5, 4.2, 4.6, 4.4, 4.7, 4.5,
]

const OBSERVATIONS = [
  {
    label: 'Главное наблюдение',
    title: 'К концу периода настроение стало устойчивее.',
    note: 'Основа: 24 отметки · 18 дат',
  },
  {
    label: 'Ритм недели',
    title: 'После вечернего разбора утро чаще начиналось спокойнее.',
    note: 'Описание совпадений, а не доказательство причины',
  },
  {
    label: 'Следующий шаг',
    title: 'Сохрани короткий вечерний разбор ещё на три дня.',
    note: 'Небольшая проверка наблюдения на своём опыте',
  },
]

const EMOTIONS = [
  ['спокойно', 8, 'high'],
  ['собранно', 6, 'high'],
  ['задумчиво', 5, 'middle'],
  ['устал', 3, 'low'],
]

const ACTIVITIES = [
  ['Ритуалы', '82%', 'выполнено', 82],
  ['Аскезы', '76%', 'удержано', 76],
  ['Энергия', '3.8', 'среднее из 5', 68],
  ['Фокус', '4.1', 'среднее из 5', 78],
]

function pathFor(points, width = 312, height = 126) {
  if (points.length < 2) return ''
  return points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - ((value - 1) / 4) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function BottomNavigation() {
  const items = [
    ['Сегодня', House],
    ['Практики', Sparkles],
    ['Диалог', MessageCircle],
    ['Библиотека', BookOpen],
    ['Прогресс', ChartNoAxesColumnIncreasing],
  ]

  return (
    <nav className="mx-progress-redesign__bottom-nav" aria-label="Демо основной навигации">
      {items.map(([label, Icon]) => (
        <span key={label} data-active={label === 'Прогресс' ? 'true' : undefined}>
          <Icon size={18} strokeWidth={1.7} />
          <small>{label}</small>
        </span>
      ))}
    </nav>
  )
}

function PeriodSelector({ activePeriod, onChange }) {
  return (
    <div className="mx-progress-redesign__periods" aria-label="Период аналитики">
      {PERIODS.map(period => (
        <button
          type="button"
          key={period}
          aria-pressed={period === activePeriod}
          onClick={() => onChange(period)}
        >
          {period} дней
        </button>
      ))}
    </div>
  )
}

function HeroChart({ state, period }) {
  const points = state === 'insufficient' ? MONTH_POINTS.slice(0, 4) : MONTH_POINTS
  const path = pathFor(points)
  const hasData = state === 'ready' || state === 'insufficient'

  return (
    <section className="mx-progress-redesign__hero" aria-labelledby="progress-hero-title">
      <div className="mx-progress-redesign__hero-copy">
        <span>Среднее настроение</span>
        <div>
          <strong>{state === 'ready' ? '4.1' : state === 'insufficient' ? '3.4' : '—'}</strong>
          <small>из 5</small>
        </div>
        <p id="progress-hero-title">
          {state === 'ready'
            ? 'Во второй половине периода настроение чаще было выше.'
            : state === 'insufficient'
              ? 'Первые точки уже есть. Ещё несколько дней — и линия станет честнее.'
              : 'Здесь появится общая картина выбранного периода.'}
        </p>
      </div>

      <div className="mx-progress-redesign__chart" data-state={state}>
        {state === 'loading' ? (
          <div className="mx-progress-redesign__chart-skeleton" aria-label="Загрузка графика" />
        ) : state === 'error' ? (
          <div className="mx-progress-redesign__chart-message" role="alert">
            <strong>График не загрузился</strong>
            <span>Сохранённые отметки не изменились.</span>
            <button type="button">Повторить</button>
          </div>
        ) : hasData ? (
          <>
            <svg viewBox="0 0 312 126" preserveAspectRatio="none" aria-hidden="true">
              <path
                className="mx-progress-redesign__chart-grid"
                d="M 0 31.5 H 312 M 0 63 H 312 M 0 94.5 H 312"
              />
              <path className="mx-progress-redesign__chart-line" d={path} />
              {points.map((value, index) => {
                const x = (index / Math.max(points.length - 1, 1)) * 312
                const y = 126 - ((value - 1) / 4) * 126
                return <circle key={`${index}-${value}`} cx={x} cy={y} r="2.2" />
              })}
            </svg>
            <div className="mx-progress-redesign__chart-axis" aria-hidden="true">
              <span>1</span>
              <span>{Math.round(period / 2)}</span>
              <span>{period}</span>
            </div>
          </>
        ) : (
          <div className="mx-progress-redesign__chart-message">
            <strong>Пока нет точек</strong>
            <span>Отметь настроение — график начнёт собираться день за днём.</span>
          </div>
        )}
      </div>
    </section>
  )
}

function ObservationRail({ state }) {
  const cards = state === 'ready' ? OBSERVATIONS : OBSERVATIONS.slice(0, 1)
  return (
    <section
      className="mx-progress-redesign__section"
      aria-labelledby="progress-observations-title"
    >
      <div className="mx-progress-redesign__section-head">
        <div>
          <span>Что можно заметить</span>
          <h3 id="progress-observations-title">Наблюдения</h3>
        </div>
        <small>{state === 'ready' ? '1 / 3' : '1 / 1'}</small>
      </div>
      <div className="mx-progress-redesign__rail">
        {cards.map(card => (
          <article key={card.label} className="mx-progress-redesign__observation">
            <span>{card.label}</span>
            <strong>
              {state === 'ready'
                ? card.title
                : 'Пока недостаточно данных для устойчивого наблюдения.'}
            </strong>
            <p>
              {state === 'ready'
                ? card.note
                : 'Продолжай отмечать состояние — вывод не будет придуман из одной точки.'}
            </p>
          </article>
        ))}
      </div>
      <p className="mx-progress-redesign__caveat">
        Это описания доступных отметок, а не диагноз, прогноз или доказательство причины.
      </p>
    </section>
  )
}

function Calendar({ state }) {
  const ready = state === 'ready'
  return (
    <section className="mx-progress-redesign__section" aria-labelledby="progress-calendar-title">
      <div className="mx-progress-redesign__section-head">
        <div>
          <span>Одна точка — один день</span>
          <h3 id="progress-calendar-title">Календарь состояния</h3>
        </div>
        <div className="mx-progress-redesign__month-nav" aria-label="Месяц">
          <button type="button" aria-label="Предыдущий месяц">
            <ChevronLeft size={16} />
          </button>
          <small>Сентябрь</small>
          <button type="button" aria-label="Следующий месяц">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="mx-progress-redesign__calendar-card">
        <div className="mx-progress-redesign__weekdays" aria-hidden="true">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mx-progress-redesign__calendar" aria-label="Отметки состояния за месяц">
          {Array.from({ length: 35 }, (_, index) => (
            <i
              key={index}
              data-filled={ready && ![0, 6, 12, 19, 27, 31].includes(index) ? 'true' : undefined}
              data-tone={(index % 4) + 1}
            />
          ))}
        </div>
        {!ready && <p>Календарь заполнится после ежедневных check-in.</p>}
      </div>
    </section>
  )
}

function Emotions({ state }) {
  return (
    <section className="mx-progress-redesign__section" aria-labelledby="progress-emotions-title">
      <div className="mx-progress-redesign__section-head">
        <div>
          <span>Слова из check-in</span>
          <h3 id="progress-emotions-title">Эмоции</h3>
        </div>
      </div>
      <div className="mx-progress-redesign__emotion-card">
        <div className="mx-progress-redesign__emotion-ring" aria-hidden="true">
          <span>22</span>
          <small>отметки</small>
        </div>
        <div className="mx-progress-redesign__emotion-list">
          {(state === 'ready' ? EMOTIONS : [['пока нет данных', 0, 'middle']]).map(
            ([name, count, tone]) => (
              <div key={name} data-tone={tone}>
                <i />
                <span>{name}</span>
                <small>{count || '—'}</small>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}

function Activities({ state }) {
  return (
    <section className="mx-progress-redesign__section" aria-labelledby="progress-activities-title">
      <div className="mx-progress-redesign__section-head">
        <div>
          <span>По существующим данным</span>
          <h3 id="progress-activities-title">Активности</h3>
        </div>
        <small>4</small>
      </div>
      <div className="mx-progress-redesign__activities">
        {ACTIVITIES.map(([title, value, note, progress]) => (
          <article key={title}>
            <span>{title}</span>
            <strong>{state === 'ready' ? value : '—'}</strong>
            <small>{state === 'ready' ? note : 'данные ещё собираются'}</small>
            <i>
              <b style={{ width: state === 'ready' ? `${progress}%` : '4%' }} />
            </i>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProgressScreen({ state, activePeriod, setActivePeriod }) {
  return (
    <>
      <header className="mx-progress-redesign__header">
        <h2>прогресс.</h2>
        <span>{activePeriod} дней</span>
      </header>
      <PeriodSelector activePeriod={activePeriod} onChange={setActivePeriod} />
      <HeroChart state={state} period={activePeriod} />
      {state !== 'loading' && state !== 'error' && (
        <>
          <ObservationRail state={state} />
          <Calendar state={state} />
          <Emotions state={state} />
          <Activities state={state} />
        </>
      )}
    </>
  )
}

export default function ProgressRedesignExperiment() {
  const [state, setState] = useState('ready')
  const [activePeriod, setActivePeriod] = useState(30)
  const screenKey = useMemo(() => `${state}-${activePeriod}`, [state, activePeriod])

  return (
    <section className="mx-progress-redesign" data-experiment-id="MXL-PROGRESS-REDESIGN-001">
      <div className="mx-progress-redesign__intro">
        <span>UI Lab · Preview-only</span>
        <h2>Полный редизайн «Прогресса»</h2>
        <p>
          Композиция Stoic переведена в визуальный язык Mentalix. Здесь только fixtures; production,
          API, вычисления и навигация не изменены.
        </p>
      </div>

      <div className="mx-progress-redesign__states" aria-label="Состояние демо">
        {STATES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={state === key}
            onClick={() => setState(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mx-progress-redesign__device">
        <div className="mx-progress-redesign__top-safe" aria-hidden="true">
          <span>MENTALIX</span>
          <i />
        </div>
        <div className="mx-progress-redesign__scroll" key={screenKey}>
          <ProgressScreen
            state={state}
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod}
          />
        </div>
        <BottomNavigation />
      </div>
    </section>
  )
}

export { PERIODS, STATES }
