import { useRef } from 'react'

import SemanticGlyph from '../SemanticGlyph'

import './PracticeCatalogExperiment.css'

const CARDS = [
  {
    kind: 'breath',
    title: 'Дыхание',
    description: 'вернуться в ровный ритм',
    meta: '1 минута',
  },
  {
    kind: 'focus',
    title: 'Фокус',
    description: 'собрать внимание в одну точку',
    meta: '25 минут',
  },
  {
    kind: 'anxiety',
    title: 'Эмоции',
    description: 'заметить, что происходит внутри',
    meta: '2 минуты',
  },
  {
    kind: 'journal',
    title: 'Рефлексия',
    description: 'назвать главное за сегодня',
    meta: '5 минут',
  },
  {
    kind: 'companion',
    title: 'Отношения',
    description: 'услышать себя и другого',
    meta: '3 минуты',
  },
  {
    kind: 'meditation',
    title: 'Медитация',
    description: 'побыть с тем, что есть',
    meta: '5 минут',
  },
]

function PreviewNavigation() {
  return (
    <nav className="mx-practice-catalog__nav" aria-label="Навигация Preview-карточки">
      {['Сегодня', 'Практики', 'Наставник', 'Библиотека', 'Тренды'].map(label => (
        <span key={label} data-active={label === 'Практики'}>
          {label}
        </span>
      ))}
    </nav>
  )
}

export default function PracticeCatalogExperiment() {
  const railRef = useRef(null)

  return (
    <section className="mx-practice-catalog" aria-labelledby="practice-catalog-title">
      <div className="mx-practice-catalog__head">
        <span>Практики · Preview-only</span>
        <h2 id="practice-catalog-title">Шесть способов вернуться к себе</h2>
        <p>
          Две крупные карточки остаются в поле зрения, а следующий ряд мягко выглядывает справа.
        </p>
      </div>

      <div className="mx-practice-catalog__frame">
        <div
          ref={railRef}
          className="mx-practice-catalog__rail"
          aria-label="Каталог практик. Проведи в сторону, чтобы увидеть следующие карточки."
        >
          {CARDS.map(card => (
            <button className="mx-practice-catalog__card" type="button" key={card.title}>
              <span className="mx-practice-catalog__art" aria-hidden="true">
                <SemanticGlyph kind={card.kind} animated={false} highlighted={false} />
              </span>
              <span className="mx-practice-catalog__copy">
                <span className="mx-practice-catalog__meta">{card.meta}</span>
                <strong>{card.title}</strong>
                <span>{card.description}</span>
              </span>
            </button>
          ))}
        </div>

        <PreviewNavigation />
      </div>
    </section>
  )
}
