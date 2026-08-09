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
        subtitle: 'выбор сужается до границы',
        kind: 'asceza-lens',
        reference: 'MX-UI-09',
        state: 'Граница удерживается',
      },
      {
        id: 'neuro',
        title: 'Нейротренажёр',
        subtitle: 'связи собираются в сеть',
        kind: 'neuro-network',
        reference: 'MX-UI-22',
        state: 'Сигнал проходит по сети',
      },
      {
        id: 'breath',
        title: 'Дыхание',
        subtitle: 'форма раскрывается и возвращается',
        kind: 'breath',
        reference: 'MX-UI-11',
        state: 'Дыхание выровнялось',
      },
      {
        id: 'focus',
        title: 'Фокус',
        subtitle: 'линза удерживает одну точку',
        kind: 'focus',
        reference: 'MX-UI-12',
        state: 'Область внимания собрана',
      },
      {
        id: 'meditation',
        title: 'Медитации',
        subtitle: 'волны постепенно оседают',
        kind: 'meditation',
        reference: 'MX-UI-14',
        state: 'Внутри стало тише',
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
        subtitle: 'точка следует по живой траектории',
        kind: 'pathfinder',
        reference: 'MX-UI-17',
        state: 'Направление найдено',
      },
      {
        id: 'energy',
        title: 'Энергия',
        subtitle: 'импульс проходит через всю форму',
        kind: 'energy-wave',
        reference: 'MX-UI-18',
        state: 'Импульс восстановлен',
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
        subtitle: 'лишнее отступает от центра',
        kind: 'asceza-lens',
        reference: 'MX-UI-09',
        state: 'Главное осталось в центре',
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
  if (kind === 'asceza-lens') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__lines">
          <path className="mx-motion-glyph__lens-left" d="M24 56C42 28 62 30 76 56C62 82 42 84 24 56Z" />
          <path className="mx-motion-glyph__lens-right" d="M136 56C118 28 98 30 84 56C98 82 118 84 136 56Z" />
          <path d="M80 24V88" />
          <path className="mx-motion-glyph__soft" d="M52 56C62 42 70 42 76 56C70 70 62 70 52 56ZM108 56C98 42 90 42 84 56C90 70 98 70 108 56Z" />
        </g>
        <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4" />
      </>
    )
  }

  if (kind === 'neuro-network') {
    return (
      <>
        <MotionKitGuide />
        <g className="mx-motion-glyph__network mx-motion-glyph__network--left">
          <path d="M22 70L42 42L62 54L74 28M42 42L30 24M62 54L50 82M42 42L50 82" />
          <circle cx="22" cy="70" r="2.6" /><circle cx="42" cy="42" r="3" />
          <circle cx="62" cy="54" r="2.4" /><circle cx="74" cy="28" r="2.6" />
          <circle cx="30" cy="24" r="2.2" /><circle cx="50" cy="82" r="2.8" />
        </g>
        <g className="mx-motion-glyph__network mx-motion-glyph__network--right">
          <path d="M138 72L118 40L98 52L88 84M118 40L130 24M98 52L112 78M118 40L112 78" />
          <circle cx="138" cy="72" r="2.6" /><circle cx="118" cy="40" r="3" />
          <circle cx="98" cy="52" r="2.4" /><circle cx="88" cy="84" r="2.6" />
          <circle cx="130" cy="24" r="2.2" /><circle cx="112" cy="78" r="2.8" />
        </g>
        <path className="mx-motion-glyph__network-bridge" d="M62 54C70 44 74 48 80 56C86 64 92 62 98 52" />
        <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4.5" />
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

  return (
    <>
      <MotionKitGuide />
      <g className="mx-motion-glyph__energy mx-motion-glyph__energy--outer">
        <path d="M18 56C34 20 58 20 80 56C102 92 126 92 142 56" />
        <path d="M18 56C34 92 58 92 80 56C102 20 126 20 142 56" />
      </g>
      <g className="mx-motion-glyph__energy mx-motion-glyph__energy--inner">
        <path d="M38 56C50 34 66 34 80 56C94 78 110 78 122 56" />
        <path d="M38 56C50 78 66 78 80 56C94 34 110 34 122 56" />
      </g>
      <circle className="mx-motion-glyph__point" cx="80" cy="56" r="4.5" />
    </>
  )
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
    'asceza-lens',
    'neuro-network',
    'morning-exercise',
    'practice-gate',
    'energy-wave',
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
