import { useMemo, useState } from 'react'

import SemanticGlyph from '../SemanticGlyph'

import './PracticeMotionKit.css'


const SECTIONS = [
  {
    id: 'practices',
    eyebrow: 'Основной экран',
    title: 'Практики',
    note: 'Один процесс — один знак. Все циклы медленные и непрерывные.',
    items: [
      {
        id: 'rituals',
        title: 'Ритуалы',
        subtitle: 'орбиты удерживают повторение',
        kind: 'ritual',
        reference: 'MX-UI-22',
        state: 'Ритм сохраняется',
      },
      {
        id: 'ascezas',
        title: 'Аскезы',
        subtitle: 'коридор сужается до принятой границы',
        kind: 'asceza-boundary',
        reference: 'Вариант 2',
        state: 'Выбор удержан внутри границы',
      },
      {
        id: 'neuro',
        title: 'Нейротренажёр',
        subtitle: 'один сигнал пробуждает целую сеть',
        kind: 'neuro-synapse',
        reference: 'Вариант 2',
        state: 'Связи работают вместе',
      },
      {
        id: 'breath',
        title: 'Дыхание',
        subtitle: 'апертура раскрывается вместе со вдохом',
        kind: 'breath-aperture',
        reference: 'Вариант 2',
        state: 'Дыхание стало просторнее',
      },
      {
        id: 'focus',
        title: 'Фокус',
        subtitle: 'рассеянные лучи сходятся в одно место',
        kind: 'focus-convergence',
        reference: 'Вариант 2',
        state: 'Внимание сошлось в точке',
      },
      {
        id: 'meditation',
        title: 'Медитации',
        subtitle: 'контуры выравниваются вокруг тишины',
        kind: 'meditation-contours',
        reference: 'Вариант 2',
        state: 'Движение внутри утихло',
      },
    ],
  },
  {
    id: 'states',
    eyebrow: 'Переходы',
    title: 'Действие меняет форму',
    note: 'Не заставка: рисунок заранее объясняет, что произойдёт после нажатия.',
    items: [
      {
        id: 'practice-gate',
        title: 'Начать практику',
        subtitle: 'две стороны открывают следующий шаг',
        kind: 'practice-gate',
        reference: 'MX-UI-16',
        state: 'Следующий шаг открыт',
      },
      {
        id: 'path',
        title: 'Путь',
        subtitle: 'две стороны собирают направление',
        kind: 'path-corridor',
        reference: 'Вариант 2',
        state: 'Маршрут открылся',
      },
      {
        id: 'energy',
        title: 'Энергия',
        subtitle: 'импульс проходит через всё поле',
        kind: 'energy-field',
        reference: 'Вариант 2',
        state: 'Поток снова движется',
      },
    ],
  },
  {
    id: 'morning',
    eyebrow: 'Ваши ритуалы',
    title: 'Утренние действия',
    note: 'Каждая карточка показывает смысл конкретного действия, но остаётся частью одной системы.',
    items: [
      {
        id: 'prayer',
        title: 'Утренняя молитва',
        subtitle: 'намерение поднимается над шумом',
        kind: 'prayer',
        reference: 'MX-UI-20',
        state: 'Намерение собрано',
      },
      {
        id: 'shower',
        title: 'Холодный душ',
        subtitle: 'поток пробуждает тело',
        kind: 'shower',
        reference: 'MX-UI-20',
        state: 'Тело проснулось',
      },
      {
        id: 'purpose',
        title: 'Зачем ты проснулся',
        subtitle: 'дуга возвращает к смыслу дня',
        kind: 'purpose',
        reference: 'MX-UI-20',
        state: 'Смысл дня обозначен',
      },
      {
        id: 'exercise',
        title: 'Утренняя нагрузка',
        subtitle: 'тело мягко входит в движение',
        kind: 'morning-exercise',
        reference: 'Новый знак',
        state: 'Тело включилось',
      },
      {
        id: 'water',
        title: 'Стакан воды',
        subtitle: 'простое действие видно буквально',
        kind: 'water',
        reference: 'MX-UI-19',
        state: 'Первый шаг сделан',
      },
    ],
  },
  {
    id: 'abstentions',
    eyebrow: 'Ваши аскезы',
    title: 'Осознанный отказ',
    note: 'Предмет остаётся узнаваемым, а движение показывает не запрет, а принятое решение.',
    items: [
      {
        id: 'alcohol',
        title: 'Отказ от алкоголя',
        subtitle: 'решение пересекает привычный сценарий',
        kind: 'alcohol',
        reference: 'MX-UI-21',
        state: 'Решение подтверждено',
      },
      {
        id: 'smoking',
        title: 'Отказ от курения',
        subtitle: 'дым уходит, выбор остаётся',
        kind: 'smoking',
        reference: 'MX-UI-21',
        state: 'Выбор удержан',
      },
      {
        id: 'conscious-choice',
        title: 'Осознанный отказ',
        subtitle: 'коридор сужается до принятой границы',
        kind: 'asceza-boundary',
        reference: 'Вариант 2',
        state: 'Выбор удержан внутри границы',
      },
    ],
  },
]


function MotionKitGuide() {
  return (
    <g className="mx-motion-glyph__guide">
      <path d="M18 88H142" />
      <path d="M80 12V100" />
    </g>
  )
}


function MotionKitDrawing({ kind }) {
  if (kind === 'asceza-boundary') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__boundary mx-motion-glyph__boundary--outer">
          <path d="M20 22L58 40L72 56L58 72L20 90" />
          <path d="M140 22L102 40L88 56L102 72L140 90" />
        </g>
        <g className="mx-motion-glyph__boundary mx-motion-glyph__boundary--inner">
          <path d="M38 30L66 44L76 56L66 68L38 82" />
          <path d="M122 30L94 44L84 56L94 68L122 82" />
        </g>
        <path className="mx-motion-glyph__threshold" d="M80 24V88" />
        <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4" />
      </>
    )
  }

  if (kind === 'neuro-synapse') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__synapse-network">
          <path d="M22 74L40 48L58 62L78 40L98 56L118 34L140 52" />
          <path d="M40 48L30 26M40 48L54 28M58 62L46 86M58 62L78 82M78 40L74 18M78 40L98 24M98 56L92 86M98 56L118 78M118 34L136 22M118 34L140 52" />
          <circle cx="22" cy="74" r="2.2" /><circle cx="40" cy="48" r="2.8" />
          <circle cx="58" cy="62" r="2.5" /><circle cx="78" cy="40" r="3" />
          <circle cx="98" cy="56" r="2.6" /><circle cx="118" cy="34" r="2.8" />
          <circle cx="140" cy="52" r="2.2" /><circle cx="30" cy="26" r="2" />
          <circle cx="54" cy="28" r="2.1" /><circle cx="46" cy="86" r="2.2" />
          <circle cx="78" cy="82" r="2.4" /><circle cx="74" cy="18" r="2" />
          <circle cx="98" cy="24" r="2.2" /><circle cx="92" cy="86" r="2.1" />
          <circle cx="118" cy="78" r="2.4" /><circle cx="136" cy="22" r="2" />
        </g>
        <path className="mx-motion-glyph__synapse-route" d="M22 74L40 48L58 62L78 40L98 56L118 34L140 52" />
        <circle className="mx-motion-glyph__point mx-motion-glyph__synapse-signal" cx="22" cy="74" r="4" />
      </>
    )
  }

  if (kind === 'breath-aperture') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__breath-aperture">
          <path d="M80 56C54 50 46 31 52 18C68 19 78 34 80 56Z" />
          <path d="M80 56C86 30 105 22 118 28C117 44 102 54 80 56Z" />
          <path d="M80 56C106 62 114 81 108 94C92 93 82 78 80 56Z" />
          <path d="M80 56C74 82 55 90 42 84C43 68 58 58 80 56Z" />
          <path className="mx-motion-glyph__breath-diagonal" d="M50 26L110 86M110 26L50 86" />
        </g>
        <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4" />
      </>
    )
  }

  if (kind === 'focus-convergence') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__focus-beams">
          <path d="M18 22C42 28 58 40 80 56" />
          <path d="M18 39C46 42 62 48 80 56" />
          <path d="M18 56H80" />
          <path d="M18 73C46 70 62 64 80 56" />
          <path d="M18 90C42 84 58 72 80 56" />
        </g>
        <g className="mx-motion-glyph__focus-guides">
          <path d="M36 30L52 36M36 82L52 76" />
        </g>
        <path className="mx-motion-glyph__focus-axis" d="M84 56H142" />
        <path className="mx-motion-glyph__focus-plane" d="M80 42V70" />
        <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4.5" />
      </>
    )
  }

  if (kind === 'meditation-contours') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__contours mx-motion-glyph__contours--outer">
          <path d="M28 56C28 31 49 16 78 19C108 15 134 32 132 58C135 84 108 97 80 93C50 98 25 82 28 56Z" />
        </g>
        <g className="mx-motion-glyph__contours mx-motion-glyph__contours--middle">
          <path d="M43 57C41 39 58 29 79 31C100 28 119 41 117 59C118 77 100 85 80 82C58 86 42 74 43 57Z" />
        </g>
        <g className="mx-motion-glyph__contours mx-motion-glyph__contours--inner">
          <path d="M59 56C59 46 67 40 80 42C93 40 102 47 101 57C102 68 92 73 80 71C67 73 58 67 59 56Z" />
        </g>
        <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4" />
      </>
    )
  }

  if (kind === 'morning-exercise') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__morning-body">
          <path d="M80 34V66M80 44L52 58M80 44L108 58M80 66L58 88M80 66L102 88" />
          <circle cx="80" cy="24" r="7" />
        </g>
        <g className="mx-motion-glyph__morning-radiance">
          <path d="M42 30L32 22M118 30L128 22M34 54H20M126 54H140" />
          <path d="M48 82A40 40 0 0 0 112 82" />
        </g>
        <circle className="mx-motion-glyph__point" cx="80" cy="66" r="4" />
      </>
    )
  }

  if (kind === 'practice-gate') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__gate-left">
          <path d="M24 86C48 82 60 70 66 56C60 42 48 30 24 26" />
          <path d="M38 86C58 78 66 68 72 56C66 44 58 34 38 26" />
        </g>
        <g className="mx-motion-glyph__gate-right">
          <path d="M136 86C112 82 100 70 94 56C100 42 112 30 136 26" />
          <path d="M122 86C102 78 94 68 88 56C94 44 102 34 122 26" />
        </g>
        <path className="mx-motion-glyph__lines" d="M80 30V82" />
        <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4.5" />
      </>
    )
  }

  if (kind === 'path-corridor') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__path-wall mx-motion-glyph__path-wall--left">
          <path d="M18 92C42 84 52 68 64 56C76 44 80 32 84 16" />
          <path d="M34 94C52 82 60 68 70 58C82 46 88 34 92 18" />
        </g>
        <g className="mx-motion-glyph__path-wall mx-motion-glyph__path-wall--right">
          <path d="M142 20C118 28 108 42 96 54C84 66 80 78 76 96" />
          <path d="M126 18C108 30 100 44 90 54C78 66 72 78 68 94" />
        </g>
        <path className="mx-motion-glyph__path-route" d="M26 88C52 80 60 66 80 56C100 46 108 30 134 22" />
        <circle className="mx-motion-glyph__point mx-motion-glyph__path-signal" cx="26" cy="88" r="4" />
      </>
    )
  }

  if (kind === 'energy-field') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__energy-field mx-motion-glyph__energy-field--outer">
          <path d="M16 28C44 28 53 42 80 56C107 70 116 84 144 84" />
          <path d="M16 84C44 84 53 70 80 56C107 42 116 28 144 28" />
        </g>
        <g className="mx-motion-glyph__energy-field mx-motion-glyph__energy-field--inner">
          <path d="M16 42C45 42 58 49 80 56C102 63 115 70 144 70" />
          <path d="M16 70C45 70 58 63 80 56C102 49 115 42 144 42" />
        </g>
        <path className="mx-motion-glyph__energy-axis" d="M16 56H144" />
        <circle className="mx-motion-glyph__point mx-motion-glyph__energy-signal" cx="16" cy="56" r="4.5" />
      </>
    )
  }

  return null
}


function MotionKitGlyph({ kind, paused }) {
  return (
    <svg
      viewBox="0 0 160 112"
      className={`mx-motion-glyph mx-motion-glyph--${kind}`}
      data-animated={!paused}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <MotionKitDrawing kind={kind} />
    </svg>
  )
}


function MotionCard({ item, selected, paused, onSelect }) {
  const isKitOnly = [
    'asceza-boundary',
    'neuro-synapse',
    'breath-aperture',
    'focus-convergence',
    'meditation-contours',
    'morning-exercise',
    'practice-gate',
    'path-corridor',
    'energy-field',
  ].includes(item.kind)

  return (
    <button
      type="button"
      className="mx-motion-card"
      data-selected={selected}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="mx-motion-card__reference">{item.reference}</span>

      <span className="mx-motion-card__art" aria-hidden="true">
        {isKitOnly ? (
          <MotionKitGlyph kind={item.kind} paused={paused} />
        ) : (
          <SemanticGlyph
            kind={item.kind}
            className="mx-motion-kit__semantic-glyph"
            animated={!paused}
            highlighted
          />
        )}
      </span>

      <span className="mx-motion-card__copy">
        <strong>{item.title}</strong>
        <span>{item.subtitle}</span>
      </span>
    </button>
  )
}


export default function PracticeMotionKit() {
  const [paused, setPaused] = useState(false)
  const [selectedId, setSelectedId] = useState('rituals')

  const selectedItem = useMemo(
    () => SECTIONS
      .flatMap((section) => section.items)
      .find((item) => item.id === selectedId),
    [selectedId],
  )

  return (
    <main className="mx-motion-kit" data-paused={paused}>
      <header className="mx-motion-kit__header">
        <div className="mx-motion-kit__mark" aria-hidden="true">
          <span />
        </div>

        <p className="mx-motion-kit__kicker">Mentalix · тестовый набор движения</p>
        <h1>Знаки, которые живут вместе с действием.</h1>
        <p className="mx-motion-kit__intro">
          Отдельная тестовая версия. Реальные экраны приложения не изменены.
          Нажмите на карточку, чтобы почувствовать её смысл и сравнить варианты.
        </p>

        <div className="mx-motion-kit__controls">
          <button
            type="button"
            className="mx-motion-kit__motion-toggle"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
            {paused ? 'Запустить движение' : 'Остановить движение'}
          </button>

          <a href="?ui_lab=1">Исходная лаборатория</a>
        </div>
      </header>

      <div className="mx-motion-kit__selection" aria-live="polite">
        <span>Выбрано</span>
        <strong>{selectedItem?.title}</strong>
        <p>{selectedItem?.state}</p>
      </div>

      {SECTIONS.map((section) => (
        <section className="mx-motion-section" key={section.id}>
          <div className="mx-motion-section__heading">
            <p>{section.eyebrow}</p>
            <h2>{section.title}</h2>
            <span>{section.note}</span>
          </div>

          <div className="mx-motion-grid">
            {section.items.map((item) => (
              <MotionCard
                key={item.id}
                item={item}
                paused={paused}
                selected={selectedId === item.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <footer className="mx-motion-kit__footer">
        <span />
        Тестовый набор · без переноса в приложение и без публикации
      </footer>
    </main>
  )
}
