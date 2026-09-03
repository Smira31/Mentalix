import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  EyeOff,
  Search,
  Send,
  SlidersHorizontal,
} from 'lucide-react'
import SemanticGlyph from '../SemanticGlyph'
import './HistoryTrendsJournalExperiment.css'

const historyEntries = [
  {
    date: 'Сегодня',
    type: 'Вечерний разбор',
    time: '21:36',
    preview: 'Что сегодня действительно требовало внимания?',
    answer: 'Я сделал один следующий шаг, вместо того чтобы ждать ясности.',
    tag: 'рефлексия',
  },
  {
    date: 'Сегодня',
    type: 'Дыхание',
    time: '18:12',
    preview: '5 минут · завершено',
    answer: 'Вернулся к спокойному ритму и продолжил работу.',
    tag: 'восстановление',
  },
  {
    date: 'Вчера',
    type: 'Утренний check-in',
    time: '09:04',
    preview: 'Состояние: рассеянность · фокус: один шаг',
    answer: 'Сначала записать мысль, потом открыть задачу.',
    tag: 'один шаг',
  },
]

const insightCards = [
  { title: 'Распределение настроения', note: 'За этот месяц', kind: 'bars' },
  { title: 'Календарь состояния', note: 'Одна точка — один день', kind: 'heatmap' },
  { title: 'Практики, которые поддерживают', note: 'На основе отмеченных дней', kind: 'ring' },
]

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="mx-history-trends__heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  )
}

function Chart({ kind }) {
  if (kind === 'heatmap')
    return (
      <div
        className="mx-history-trends__chart mx-history-trends__chart--heatmap"
        aria-label="Календарь состояния"
      >
        {Array.from({ length: 35 }, (_, index) => (
          <i key={index} data-level={(index * 3) % 5} />
        ))}
      </div>
    )
  if (kind === 'ring')
    return (
      <div className="mx-history-trends__chart mx-history-trends__chart--ring">
        <span>
          12<small>сессий</small>
        </span>
      </div>
    )
  return (
    <div className="mx-history-trends__chart mx-history-trends__chart--bars">
      {[32, 58, 44, 74, 52].map(height => (
        <i key={height} style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

function HistoryPreview() {
  const [selected, setSelected] = useState(null)
  return (
    <section className="mx-history-trends__section" aria-labelledby="history-preview-title">
      <SectionHeading
        eyebrow="Новый паттерн · хронологическая лента"
        title="История"
        copy="События собраны по датам. Системные вехи живут в той же ленте, а деталь открывается отдельным экраном."
      />
      <div className="mx-history-trends__toolbar">
        <button type="button">
          Месяц <ChevronDown size={14} />
        </button>
        <button type="button">
          <SlidersHorizontal size={14} /> Фильтры
        </button>
        <button type="button" aria-label="Поиск">
          <Search size={15} />
        </button>
      </div>
      <div className="mx-history-trends__history" id="history-preview-title">
        {historyEntries.map((entry, index) => (
          <div className="mx-history-trends__day" key={`${entry.date}-${entry.type}`}>
            <div className="mx-history-trends__date">
              <strong>{entry.date}</strong>
              <span>{index === 0 ? '3 события' : '1 событие'}</span>
              <ChevronDown size={14} />
            </div>
            <button
              type="button"
              className="mx-history-trends__entry"
              onClick={() => setSelected(entry)}
            >
              <span>
                <strong>{entry.type}</strong>
                <time>{entry.time}</time>
              </span>
              <em>{entry.preview}</em>
              <small>{entry.tag}</small>
            </button>
            {index === 1 && (
              <div className="mx-history-trends__milestone">
                <SemanticGlyph kind="purpose" animated={false} />
                <div>
                  <strong>Первый следующий шаг</strong>
                  <span>Ты возвращаешься к действию уже 7 дней.</span>
                </div>
                <Check size={16} />
              </div>
            )}
          </div>
        ))}
      </div>
      {selected && (
        <div className="mx-history-trends__detail">
          <button type="button" onClick={() => setSelected(null)}>
            <ArrowLeft size={15} /> История
          </button>
          <span>
            {selected.date.toUpperCase()} · {selected.time}
          </span>
          <h3>{selected.type}</h3>
          <p className="question">{selected.preview}</p>
          <p>{selected.answer}</p>
          <button type="button" onClick={() => setSelected(null)}>
            Закрыть
          </button>
        </div>
      )}
    </section>
  )
}

function TrendsPreview() {
  const [hidden, setHidden] = useState([])
  const [state, setState] = useState('data')
  const visibleCards = insightCards.filter((_, index) => !hidden.includes(index))
  const activation =
    state === 'data'
      ? ['Твой месяц становится видимым', 'Здесь появятся повторяющиеся закономерности.']
      : state === 'empty'
        ? ['Добавь первую точку', 'Отметь настроение прямо здесь, без нового экрана.']
        : ['Ещё немного данных', 'Отметь состояние ещё в 4 днях, чтобы открыть инсайты.']
  return (
    <section className="mx-history-trends__section" aria-labelledby="trends-preview-title">
      <SectionHeading
        eyebrow="Новый паттерн · insight-карточка"
        title="Тренды"
        copy="Модульный дашборд: каждый блок можно скрыть, а состояние всегда объясняет, что делать дальше."
      />
      <div className="mx-history-trends__states" role="group" aria-label="Состояние данных">
        {[
          ['data', 'Есть данные'],
          ['empty', 'Нет данных'],
          ['progress', 'Нужно ещё 4 дня'],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={state === value}
            onClick={() => setState(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mx-history-trends__activation">
        <SemanticGlyph kind="focus" animated={false} />
        <div>
          <strong>{activation[0]}</strong>
          <span>{activation[1]}</span>
        </div>
        {state !== 'data' && (
          <button type="button" className="mx-history-trends__primary">
            Отметить настроение
          </button>
        )}
      </div>
      <div className="mx-history-trends__insights">
        {visibleCards.map((card, index) => (
          <article key={card.title}>
            <header>
              <div>
                <strong>{card.title}</strong>
                <span>{card.note}</span>
              </div>
              <button
                type="button"
                aria-label="Скрыть карточку"
                onClick={() => setHidden(current => [...current, insightCards.indexOf(card)])}
              >
                <EyeOff size={15} />
              </button>
            </header>
            {state === 'data' ? (
              <Chart kind={card.kind} />
            ) : (
              <div className="mx-history-trends__empty">
                <strong>
                  {state === 'empty' ? 'Пока недостаточно данных' : 'Нужно ещё 4 дня'}
                </strong>
                <span>
                  {state === 'empty'
                    ? 'Сделай check-in, чтобы начать наблюдение.'
                    : 'Прогресс 6 из 10 дней'}
                </span>
                <i>
                  <b style={{ width: state === 'empty' ? '8%' : '60%' }} />
                </i>
              </div>
            )}
          </article>
        ))}
      </div>
      {hidden.length > 0 && (
        <button type="button" className="mx-history-trends__restore" onClick={() => setHidden([])}>
          Вернуть скрытые карточки ({hidden.length})
        </button>
      )}
    </section>
  )
}

function JournalAssistantPreview() {
  const [mode, setMode] = useState('reflect')
  const [value, setValue] = useState('')
  const modes = [
    ['reflect', 'Порефлексировать'],
    ['challenge', 'Оспорить мысль'],
    ['next', 'Следующий шаг'],
    ['support', 'Поддержать'],
  ]
  return (
    <section className="mx-history-trends__section" aria-labelledby="journal-preview-title">
      <SectionHeading
        eyebrow="Точечное усиление · журнал"
        title="Помощь внутри записи"
        copy="Именованные режимы делают намерение явным и не конкурируют с персона-системой. Пустой ввод получает мягкую подсказку вместо тихого сбоя."
      />
      <div className="mx-history-trends__journal">
        <div className="mx-history-trends__modes" role="group" aria-label="Режим помощи">
          {modes.map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          value={value}
          onChange={event => setValue(event.target.value)}
          placeholder="Что сейчас занимает твои мысли?"
          aria-label="Текст записи"
        />
        <div>
          <span>
            {value
              ? `Режим: ${modes.find(([key]) => key === mode)[1]}`
              : 'Можно начать с одного предложения'}
          </span>
          <button
            type="button"
            className="mx-history-trends__primary"
            onClick={() =>
              setValue(
                current => current || 'Напиши одну мысль — я помогу с ней по выбранному режиму.'
              )
            }
          >
            <Send size={14} /> Помочь
          </button>
        </div>
      </div>
    </section>
  )
}

export default function HistoryTrendsJournalExperiment() {
  return (
    <section className="mx-history-trends" aria-labelledby="history-trends-title">
      <div className="mx-history-trends__intro">
        <span>26 · Новые продуктовые поверхности</span>
        <h2 id="history-trends-title">История, тренды и помощь в журнале</h2>
        <p>
          Функциональные паттерны из референса, переосмысленные в визуальном языке Mentalix. Только
          Preview: API и production не подключены.
        </p>
      </div>
      <HistoryPreview />
      <TrendsPreview />
      <JournalAssistantPreview />
    </section>
  )
}
