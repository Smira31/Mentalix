import { useRef, useState } from 'react'

import SemanticGlyph, { semanticKindForPersona } from '../SemanticGlyph'

import './PersonaPickerRedesignExperiment.css'

const PERSONAS = [
  {
    key: 'mayak',
    name: 'Собеседник',
    promise: 'поможет услышать',
    question: 'Что сейчас\nу тебя на душе?',
    description: 'Тёплый и внимательный. Поможет разобраться в чувствах, когда непросто.',
    starters: ['Мне нужно выговориться', 'Помоги назвать, что я чувствую'],
  },
  {
    key: 'kompas',
    name: 'Наставник',
    promise: 'поможет выбрать следующий шаг',
    question: 'Какой шаг\nты сделаешь сегодня?',
    description:
      'Покажет один небольшой шаг, который можно попробовать сегодня и отменить без стыда.',
    starters: ['Я топчусь на месте…', 'Помоги начать с малого'],
  },
  {
    key: 'dnevnik',
    name: 'Следопыт',
    promise: 'поможет заметить паттерн',
    question: 'Что сегодня\nосталось с тобой?',
    description: 'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
    starters: ['Что я сегодня упускаю?', 'Помоги подвести итог дня'],
  },
]

const VARIANTS = [
  {
    id: 'hybrid',
    label: 'Рекомендованный гибрид · направления 1 + 2',
    title: 'Один следующий обратимый шаг',
    summary:
      'Проверяемое обещание роли и одно действие, которое можно попробовать сегодня и отменить без стыда.',
    cta: 'Попробовать шаг',
    helper: 'Можно передумать или закрыть разговор без продолжения.',
  },
  {
    id: 'starter',
    label: 'Контроль · направление 3',
    title: 'Мягкое знакомство через starter-сценарий',
    summary: 'Начните с одного короткого сценария: можно ответить одной фразой или пропустить.',
    cta: 'Начать сценарий',
    helper: 'После первого обмена можно выбрать: продолжить или выбрать другую роль.',
  },
]

function PersonaCard({ persona, variant, active, onAction }) {
  const question = persona.question.split('\n')

  return (
    <article
      className="mx-persona-redesign__card"
      aria-label={`${persona.name}: ${persona.promise}`}
    >
      <div className="mx-persona-redesign__art" aria-hidden="true">
        <SemanticGlyph
          kind={semanticKindForPersona(persona.key)}
          animated={active}
          highlighted={active}
          className="mx-persona-redesign__glyph"
        />
      </div>
      <div className="mx-persona-redesign__content">
        <div className="mx-persona-redesign__identity">
          <h4>{persona.name}</h4>
          <span>{persona.promise}</span>
          <p>
            {question[0]}
            <br />
            {question[1]}
          </p>
        </div>
        <p className="mx-persona-redesign__description">{persona.description}</p>
        <div className="mx-persona-redesign__actions">
          <div className="mx-persona-redesign__starters" aria-label="Стартовые варианты">
            {persona.starters.map(starter => (
              <button
                type="button"
                key={starter}
                onClick={() => onAction(`${persona.name}: ${starter}`)}
              >
                {starter}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mx-persona-redesign__cta"
            onClick={() => onAction(`${persona.name}: ${variant.cta}`)}
          >
            {variant.cta}
          </button>
          <p className="mx-persona-redesign__helper">{variant.helper}</p>
        </div>
      </div>
    </article>
  )
}

function VariantPreview({ variant, onAction, feedback }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef(null)

  function syncActive() {
    const track = trackRef.current
    const card = track?.firstElementChild
    if (!track || !card) return

    setActive(
      Math.max(
        0,
        Math.min(PERSONAS.length - 1, Math.round(track.scrollLeft / (card.offsetWidth + 12)))
      )
    )
  }

  function selectPage(index) {
    const track = trackRef.current
    const card = track?.firstElementChild
    if (!track || !card) return

    track.scrollTo({ left: index * (card.offsetWidth + 12), behavior: 'smooth' })
    setActive(index)
  }

  return (
    <section className="mx-persona-redesign__variant" aria-labelledby={`${variant.id}-title`}>
      <header className="mx-persona-redesign__variant-header">
        <span>{variant.label}</span>
        <h3 id={`${variant.id}-title`}>{variant.title}</h3>
        <p>{variant.summary}</p>
      </header>
      <div
        ref={trackRef}
        className="mx-persona-redesign__track"
        onScroll={syncActive}
        aria-label={`${variant.title}: три персоны`}
      >
        {PERSONAS.map((persona, index) => (
          <PersonaCard
            key={persona.key}
            persona={persona}
            variant={variant}
            active={active === index}
            onAction={onAction}
          />
        ))}
      </div>
      <div
        className="mx-persona-redesign__pagination"
        role="group"
        aria-label={`${variant.title}: страница персоны`}
      >
        {PERSONAS.map((persona, index) => (
          <button
            type="button"
            key={persona.key}
            aria-label={`${persona.name}, страница ${index + 1} из ${PERSONAS.length}`}
            aria-current={active === index ? 'page' : undefined}
            onClick={() => selectPage(index)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="mx-persona-redesign__active-person">
        Сейчас: {PERSONAS[active].name}. Можно передумать.
      </p>
      {feedback && (
        <p className="mx-persona-redesign__feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      )}
    </section>
  )
}

export default function PersonaPickerRedesignExperiment() {
  const [feedback, setFeedback] = useState('')

  function handleAction(action) {
    setFeedback(`Session-local выбор: ${action}`)
  }

  return (
    <section
      className="mx-persona-redesign"
      data-experiment-id="MXL-435-UI-LAB-001"
      aria-labelledby="persona-redesign-title"
    >
      <header className="mx-persona-redesign__intro">
        <span>UI Lab · Preview-only · MXL-435-UI-LAB-001</span>
        <h2 id="persona-redesign-title">Пикер персон: два первых знакомства</h2>
        <p>
          Сравнение двух статических вариантов для трёх существующих персон. Production не изменён;
          выбор хранится только в состоянии этого Preview.
        </p>
      </header>
      <div className="mx-persona-redesign__variants">
        {VARIANTS.map(variant => (
          <VariantPreview
            key={variant.id}
            variant={variant}
            feedback={feedback}
            onAction={handleAction}
          />
        ))}
      </div>
      <p className="mx-persona-redesign__note">
        Общая механика: нативный snap-скролл, верхняя SemanticGlyph-зона, один dot-пагинатор на
        вариант и touch-friendly controls.
      </p>
    </section>
  )
}

export { PERSONAS, VARIANTS }
