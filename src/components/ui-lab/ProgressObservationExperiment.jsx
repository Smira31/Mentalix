import { useState } from 'react'
import './ProgressObservationExperiment.css'

const STATES = [
  { key: 'confirmed', label: 'Подтверждено' },
  { key: 'ambiguous', label: 'Неоднозначно' },
  { key: 'empty', label: 'Мало данных' },
  { key: 'loading', label: 'Загрузка' },
  { key: 'error', label: 'Ошибка' },
]

const CONFIRMED_OBSERVATION = {
  text: 'В дни с завершённым вечерним разбором настроение было выше.',
  sampleSize: 12,
  sourceDates: ['2026-09-02', '2026-09-04', '2026-09-06', '2026-09-08'],
  caveat: 'Это описание доступных отметок, а не доказательство причины и не прогноз.',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(
    new Date(`${value}T00:00:00`)
  )
}

function Evidence({ observation }) {
  return (
    <div className="mx-progress-observation__evidence">
      <div>
        <span>Выборка</span>
        <strong>{observation.sampleSize} отметок</strong>
      </div>
      <div>
        <span>Период</span>
        <strong>{observation.sourceDates.length} дат</strong>
      </div>
      <details>
        <summary>Даты в основе</summary>
        <p>{observation.sourceDates.map(formatDate).join(' · ')}</p>
      </details>
    </div>
  )
}

function ObservationCard({ state, onCta }) {
  if (state === 'loading') {
    return (
      <div className="mx-progress-observation__card" role="status" aria-label="Загрузка наблюдения">
        <span className="mx-progress-observation__label">Главное наблюдение</span>
        <div className="mx-progress-observation__skeleton" />
        <div className="mx-progress-observation__skeleton mx-progress-observation__skeleton--short" />
        <p className="mx-progress-observation__muted">Собираем данные за выбранный период…</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="mx-progress-observation__card" role="alert">
        <span className="mx-progress-observation__label">Наблюдение недоступно</span>
        <h3>Не удалось загрузить данные</h3>
        <p className="mx-progress-observation__muted">
          Попробуй обновить экран. Содержимое не заменяется догадкой.
        </p>
        <button type="button" className="mx-progress-observation__secondary" onClick={onCta}>
          Повторить попытку
        </button>
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="mx-progress-observation__card" role="status">
        <span className="mx-progress-observation__label">Главное наблюдение</span>
        <h3>Пока недостаточно данных</h3>
        <p className="mx-progress-observation__muted">
          Нужно ещё несколько отметок, чтобы сравнение было честным. Наблюдение не появляется из
          одного дня.
        </p>
      </div>
    )
  }

  const isAmbiguous = state === 'ambiguous'
  const observation = isAmbiguous
    ? {
        ...CONFIRMED_OBSERVATION,
        text: 'Есть различие между группами дней, но пока неясно, что его объясняет.',
        caveat: 'Данных недостаточно для безопасного следующего шага; причинный вывод не делаем.',
      }
    : CONFIRMED_OBSERVATION

  return (
    <div className="mx-progress-observation__card" data-primary-observation="true">
      <span className="mx-progress-observation__label">Главное наблюдение</span>
      <h3>{observation.text}</h3>
      <Evidence observation={observation} />
      <p className="mx-progress-observation__caveat">{observation.caveat}</p>
      <div className="mx-progress-observation__action">
        <div>
          <span>Следующий шаг</span>
          <p>
            {isAmbiguous
              ? 'Сначала собери ещё отметки — действие не назначается автоматически.'
              : 'Разбор помогает проверить наблюдение на своём опыте.'}
          </p>
        </div>
        <button
          type="button"
          className="mx-progress-observation__primary"
          disabled={isAmbiguous}
          onClick={onCta}
        >
          {isAmbiguous ? 'Пока недоступно' : 'Открыть разбор'}
        </button>
      </div>
    </div>
  )
}

export default function ProgressObservationExperiment() {
  const [state, setState] = useState('confirmed')
  const [message, setMessage] = useState('')

  function handleAction() {
    setMessage(
      state === 'error'
        ? 'В Preview повторный запрос имитируется; production-переход не подключён.'
        : 'CTA показана как candidate; production-переход не подключён.'
    )
  }

  return (
    <section
      className="mx-progress-observation"
      aria-labelledby="progress-observation-title"
      data-experiment-id="MXL-PROGRESS-UX-002"
    >
      <div className="mx-progress-observation__intro">
        <span>UI Lab · MXL-PROGRESS-UX-002</span>
        <h2 id="progress-observation-title">Наблюдение + следующий шаг</h2>
        <p>
          Альтернативный candidate для экрана «Прогресс». Одна описательная карточка показывает
          evidence и предлагает действие только при однозначном состоянии. Production не подключён.
        </p>
      </div>

      <div className="mx-progress-observation__states" aria-label="Состояния candidate">
        {STATES.map(item => (
          <button
            key={item.key}
            type="button"
            aria-pressed={state === item.key}
            onClick={() => {
              setState(item.key)
              setMessage('')
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ObservationCard state={state} onCta={handleAction} />
      <p className="mx-progress-observation__feedback" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  )
}

export { CONFIRMED_OBSERVATION, STATES }
