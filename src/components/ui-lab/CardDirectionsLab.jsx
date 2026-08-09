import { useState } from 'react'

import SemanticGlyph from '../SemanticGlyph'
import { MotionKitGlyph } from './PracticeMotionKit'

import './CardDirectionsLab.css'


const DIRECTIONS = [
  {
    id: 'quiet-grid',
    short: 'Тихая сетка',
    title: 'Тихая сетка',
    summary: 'Ровный каталог, где все практики имеют одинаковый вес и легко сравниваются взглядом.',
    specs: [
      ['Размер', 'Две карточки по ~170 × 238 px на экране 390 px; зазор 10–12 px.'],
      ['Вложение', 'Иллюстрация 142–150 px → заголовок → описание; прогресс только в углу.'],
      ['Движение', 'Один смысловой процесс внутри выбранной SVG; цикл 4–7 секунд.'],
      ['Лучше для', 'Каталог практик, ритуалов, аскез и статей одного уровня.'],
      ['Механика', 'Карточные каталоги 21st.dev, адаптированные к текущему PracticeCard.'],
    ],
  },
  {
    id: 'meaning-bento',
    short: 'Смысловая мозаика',
    title: 'Смысловая мозаика',
    summary: 'Размер показывает приоритет: один следующий шаг доминирует, а быстрые действия остаются рядом.',
    recommended: true,
    specs: [
      ['Размер', 'Главная 350 × 276 px; вторичные по ~170 × 160 px.'],
      ['Вложение', 'Метка состояния → геометрия ~50% → короткий смысл → одна CTA.'],
      ['Движение', 'Анимируется только главная карточка; вторичные оживают после выбора.'],
      ['Лучше для', 'Экран «Сегодня»: check-in, следующий шаг, разбор и быстрые практики.'],
      ['Механика', 'Bento-композиция 21st.dev и направляющие линии React Bits.'],
    ],
  },
  {
    id: 'morph-card',
    short: 'Карточка → экран',
    title: 'Карточка раскрывает действие',
    summary: 'Знакомая карточка остаётся на месте и становится подробным состоянием без резкого перехода.',
    specs: [
      ['Размер', 'Закрытая 350 × 104–112 px; раскрытая 350 × 340–380 px.'],
      ['Вложение', 'Знак + название + статус; после раскрытия рисунок 40–44%, детали и CTA.'],
      ['Движение', 'Раскрытие 280 ms; подробности проявляются после изменения размера.'],
      ['Лучше для', 'Ритуалы, аскезы, темы недели и короткие действия.'],
      ['Механика', 'Motion Primitives Morphing Dialog и Animate UI Accordion.'],
    ],
  },
  {
    id: 'living-lens',
    short: 'Живая линза',
    title: 'Живая линза',
    summary: 'Геометрия становится пространством самой карточки — без маленького рисунка в дополнительной рамке.',
    specs: [
      ['Размер', 'Полная ширина 350 × 340–370 px; поле рисунка ~310 × 235 px.'],
      ['Вложение', 'Фоновая SVG-геометрия → нижний смысловой блок → CTA снаружи.'],
      ['Движение', 'Один медленный процесс 5–7 секунд; нажатие 160–220 ms.'],
      ['Лучше для', 'Дыхание, фокус, медитация, энергия и ключевые состояния.'],
      ['Механика', 'React Bits Shape Grid / Line Waves, очищенные от декоративного шума.'],
    ],
  },
  {
    id: 'story-layers',
    short: 'История слоями',
    title: 'История слоями',
    summary: 'Крупная карточка даёт место характеру, контексту и одному следующему решению.',
    specs: [
      ['Размер', '294–320 × 440–480 px; следующая карточка видна краем.'],
      ['Вложение', 'Рисунок 40–42% → роль → контекст → продолжение → одна CTA.'],
      ['Движение', 'Плавная смена карточки; SVG оживает только у выбранной роли.'],
      ['Лучше для', 'Собеседник, Наставник, Следопыт, курсы и большие материалы.'],
      ['Механика', 'Animate UI Motion Carousel и layout-переходы Motion Primitives.'],
    ],
  },
]


const PERSONAS = [
  {
    id: 'companion',
    kind: 'companion',
    title: 'Собеседник',
    promise: 'выслушает без оценки',
    copy: 'Тёплый и внимательный. Поможет разобрать чувства, когда непросто.',
    continuation: 'Сегодня было тяжело…',
  },
  {
    id: 'mentor',
    kind: 'mentor',
    title: 'Наставник',
    promise: 'вернёт к действию',
    copy: 'Строгий и честный. Разложит цель на шаги и не даст себя жалеть.',
    continuation: 'Я топчусь на месте…',
  },
  {
    id: 'pathfinder',
    kind: 'pathfinder',
    title: 'Следопыт',
    promise: 'покажет твой паттерн',
    copy: 'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
    continuation: 'Что я сегодня упускаю?',
  },
]


function BreathFlowGlyph({ paused = false }) {
  return (
    <svg
      className="mx-card-lab-glyph mx-card-lab-glyph--breath"
      data-animated={!paused}
      viewBox="0 0 160 112"
      fill="none"
      aria-hidden="true"
    >
      <g className="mx-card-lab-glyph__guide">
        <path d="M18 88H142" />
        <path d="M80 14V98" />
      </g>
      <g className="mx-card-lab-glyph__breath-upper">
        <path d="M26 54C45 30 62 22 80 22C98 22 115 30 134 54" />
        <path d="M42 54C55 39 67 34 80 34C93 34 105 39 118 54" />
      </g>
      <g className="mx-card-lab-glyph__breath-lower">
        <path d="M26 58C45 82 62 90 80 90C98 90 115 82 134 58" />
        <path d="M42 58C55 73 67 78 80 78C93 78 105 73 118 58" />
      </g>
      <path className="mx-card-lab-glyph__breath-axis" d="M80 22V90" />
      <circle className="mx-card-lab-glyph__point" cx="80" cy="56" r="4.5" />
    </svg>
  )
}


function LabGlyph({ kind, paused = false }) {
  if (kind === 'breath-flow') {
    return <BreathFlowGlyph paused={paused} />
  }

  if (
    [
      'asceza-boundary',
      'neuro-synapse',
      'focus-convergence',
      'path-corridor',
    ].includes(kind)
  ) {
    return <MotionKitGlyph kind={kind} paused={paused} />
  }

  return (
    <SemanticGlyph
      kind={kind}
      className="mx-card-lab__semantic-glyph"
      animated={!paused}
      highlighted
    />
  )
}


function AppNavigation({ active }) {
  return (
    <nav className="mx-card-phone__nav" aria-label="Навигация макета">
      {[
        ['today', 'Сегодня'],
        ['practices', 'Практики'],
        ['mentor', 'Наставник'],
        ['library', 'Книги'],
        ['trends', 'Тренды'],
      ].map(([id, label]) => (
        <span key={id} data-active={active === id}>{label}</span>
      ))}
    </nav>
  )
}


function QuietGridPreview({ paused }) {
  const cards = [
    ['ritual', 'Ритуалы', 'обряды, что держат день'],
    ['asceza-boundary', 'Аскезы', 'выбрать ясную границу'],
    ['neuro-synapse', 'Нейротренажёр', 'связи собираются в сеть'],
    ['breath-flow', 'Дыхание', 'найти ровный внутренний ритм'],
  ]

  return (
    <div className="mx-card-phone" aria-label="Тихая сетка практик">
      <p className="mx-card-phone__kicker">Mentalix</p>
      <h2 className="mx-card-phone__title">практики.</h2>
      <div className="mx-card-grid">
        {cards.map(([kind, title, copy]) => (
          <button className="mx-card-grid__card" type="button" key={kind}>
            <span className="mx-card-grid__art">
              <LabGlyph kind={kind} paused={paused} />
            </span>
            <span className="mx-card-grid__copy">
              <strong>{title}</strong>
              <span>{copy}</span>
            </span>
          </button>
        ))}
      </div>
      <AppNavigation active="practices" />
    </div>
  )
}


function MeaningBentoPreview({ paused }) {
  return (
    <div className="mx-card-phone" aria-label="Смысловая мозаика экрана Сегодня">
      <p className="mx-card-phone__kicker">Сегодня</p>
      <h2 className="mx-card-phone__title">один следующий шаг.</h2>
      <button className="mx-card-bento__hero" type="button">
        <span className="mx-card-label">Главное сейчас</span>
        <span className="mx-card-bento__hero-art">
          <LabGlyph kind="path-corridor" paused={paused} />
        </span>
        <strong>Начать с того, что важно</strong>
        <span>Один ясный шаг вместо списка задач.</span>
        <span className="mx-card-primary">Начать</span>
      </button>
      <div className="mx-card-bento__minis">
        <button type="button">
          <span className="mx-card-bento__mini-art"><BreathFlowGlyph paused /></span>
          <strong>Дыхание</strong>
        </button>
        <button type="button">
          <span className="mx-card-bento__mini-art"><LabGlyph kind="focus-convergence" paused /></span>
          <strong>Фокус</strong>
        </button>
      </div>
      <AppNavigation active="today" />
    </div>
  )
}


function MorphCardPreview({ paused, open, onToggle }) {
  return (
    <div className="mx-card-phone" aria-label="Раскрывающиеся карточки ритуалов">
      <p className="mx-card-phone__kicker">Практики</p>
      <h2 className="mx-card-phone__title">ритуалы.</h2>
      <article className="mx-card-morph" data-open={open}>
        <button
          type="button"
          className="mx-card-morph__trigger"
          onClick={onToggle}
          aria-expanded={open}
        >
          <span className="mx-card-morph__thumb">
            <LabGlyph kind="shower" paused={paused} />
          </span>
          <span className="mx-card-morph__trigger-copy">
            <strong>Холодный душ</strong>
            <span>утро · ежедневно</span>
          </span>
          <span className="mx-card-morph__chevron" aria-hidden="true">⌄</span>
        </button>
        <div className="mx-card-morph__reveal" aria-hidden={!open}>
          <div>
            <span className="mx-card-label">Открыто из карточки</span>
            <span className="mx-card-morph__art">
              <LabGlyph kind="shower" paused={paused} />
            </span>
            <strong>Вернуть телу ясность</strong>
            <p>Начать день с выбранного действия, а не с автоматической реакции.</p>
            <span className="mx-card-morph__meta">Серия 6 дней · 07:30</span>
            <button type="button" className="mx-card-primary mx-card-primary--button">
              Отметить выполнение
            </button>
          </div>
        </div>
      </article>
      <button type="button" className="mx-card-morph__secondary" onClick={onToggle}>
        {open ? 'Свернуть карточку' : 'Раскрыть карточку'}
      </button>
      <AppNavigation active="practices" />
    </div>
  )
}


function LivingLensPreview({ paused }) {
  return (
    <div className="mx-card-phone" aria-label="Живая линза практики Фокус">
      <p className="mx-card-phone__kicker">Практика</p>
      <h2 className="mx-card-phone__title">вернуть внимание.</h2>
      <button className="mx-card-lens" type="button">
        <span className="mx-card-lens__art">
          <LabGlyph kind="focus-convergence" paused={paused} />
        </span>
        <span className="mx-card-lens__copy">
          <span className="mx-card-label">Одна точка внимания</span>
          <strong>Фокус · 25 минут</strong>
          <span>Лишние направления собираются в одно действие.</span>
        </span>
      </button>
      <p className="mx-card-lens__note">
        Геометрия занимает пространство самой карточки — без рамки внутри рамки.
      </p>
      <button type="button" className="mx-card-primary mx-card-primary--button">
        Начать фокус
      </button>
      <AppNavigation active="practices" />
    </div>
  )
}


function StoryLayersPreview({ paused, activePersona, onPersonaChange }) {
  const persona = PERSONAS[activePersona]
  const nextPersona = PERSONAS[(activePersona + 1) % PERSONAS.length]

  return (
    <div className="mx-card-phone" aria-label="Карточки ролей Mentalix">
      <p className="mx-card-phone__kicker">Mentalix</p>
      <h2 className="mx-card-phone__title">с кем говорим.</h2>
      <div className="mx-card-deck">
        <article className="mx-card-deck__card" key={persona.id}>
          <span className="mx-card-deck__art">
            <LabGlyph kind={persona.kind} paused={paused} />
          </span>
          <span className="mx-card-deck__copy">
            <span className="mx-card-label">{persona.promise}</span>
            <strong>{persona.title}</strong>
            <span>{persona.copy}</span>
            <span className="mx-card-deck__continuation">
              Продолжить: «{persona.continuation}»
            </span>
          </span>
          <button type="button" className="mx-card-primary mx-card-primary--button">
            Говорить
          </button>
        </article>
        <div className="mx-card-deck__peek" aria-hidden="true">
          <LabGlyph kind={nextPersona.kind} paused />
        </div>
      </div>
      <div className="mx-card-deck__pager" aria-label="Выбор роли">
        {PERSONAS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            aria-label={item.title}
            aria-pressed={index === activePersona}
            onClick={() => onPersonaChange(index)}
          />
        ))}
      </div>
      <AppNavigation active="mentor" />
    </div>
  )
}


function DirectionPreview({ direction, paused, morphOpen, onMorphToggle, activePersona, onPersonaChange }) {
  if (direction === 'quiet-grid') {
    return <QuietGridPreview paused={paused} />
  }

  if (direction === 'meaning-bento') {
    return <MeaningBentoPreview paused={paused} />
  }

  if (direction === 'morph-card') {
    return (
      <MorphCardPreview
        paused={paused}
        open={morphOpen}
        onToggle={onMorphToggle}
      />
    )
  }

  if (direction === 'living-lens') {
    return <LivingLensPreview paused={paused} />
  }

  return (
    <StoryLayersPreview
      paused={paused}
      activePersona={activePersona}
      onPersonaChange={onPersonaChange}
    />
  )
}


function Specs({ direction }) {
  return (
    <aside className="mx-card-specs">
      <div className="mx-card-specs__heading">
        <span>{direction.recommended ? 'Рекомендованный каркас' : 'Вариант композиции'}</span>
        <h2>{direction.title}</h2>
        <p>{direction.summary}</p>
      </div>
      <dl>
        {direction.specs.map(([term, definition]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{definition}</dd>
          </div>
        ))}
      </dl>
      <p className="mx-card-specs__rule">
        В каждом рисунке одна золотая точка и один главный процесс. Реальные экраны не изменены.
      </p>
    </aside>
  )
}


export default function CardDirectionsLab() {
  const [directionId, setDirectionId] = useState('meaning-bento')
  const [paused, setPaused] = useState(false)
  const [morphOpen, setMorphOpen] = useState(true)
  const [activePersona, setActivePersona] = useState(0)

  const direction = DIRECTIONS.find((item) => item.id === directionId) ?? DIRECTIONS[0]

  return (
    <main className="mx-card-lab">
      <header className="mx-card-lab__header">
        <div className="mx-card-lab__mark" aria-hidden="true"><span /></div>
        <p>Лаборатория карточек · пять направлений</p>
        <h1>Как может собираться экран Mentalix</h1>
        <span>
          Одна дизайн-система, разные способы показать приоритет, действие и внутреннее состояние.
        </span>
        <div className="mx-card-lab__actions">
          <button type="button" onClick={() => setPaused((value) => !value)}>
            <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
            {paused ? 'Запустить движение' : 'Остановить движение'}
          </button>
          <a href="?motion_kit=1">Открыть Motion Kit</a>
        </div>
      </header>

      <nav className="mx-card-lab__tabs" aria-label="Направления карточек">
        {DIRECTIONS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            data-selected={item.id === directionId}
            aria-pressed={item.id === directionId}
            onClick={() => setDirectionId(item.id)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {item.short}
          </button>
        ))}
      </nav>

      <section className="mx-card-lab__stage">
        <DirectionPreview
          direction={directionId}
          paused={paused}
          morphOpen={morphOpen}
          onMorphToggle={() => setMorphOpen((value) => !value)}
          activePersona={activePersona}
          onPersonaChange={setActivePersona}
        />
        <Specs direction={direction} />
      </section>

      <footer className="mx-card-lab__footer">
        <span aria-hidden="true" />
        Выбор в этой лаборатории не меняет настоящее приложение.
      </footer>
    </main>
  )
}
