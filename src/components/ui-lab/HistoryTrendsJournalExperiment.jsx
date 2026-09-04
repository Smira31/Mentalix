import { useMemo, useState } from 'react'
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
import { Face, SCALE_STEPS } from '../../screens/CheckIn'
import './HistoryTrendsJournalExperiment.css'

// Зеркало EMOTIONS из src/screens/CheckIn.jsx (там не экспортируется).
// Единственный источник истины — CheckIn.jsx; список синхронизировать вручную при изменении.
const EMOTIONS = {
  1: ['подавлен', 'вымотан', 'тревожно', 'злюсь', 'пусто', 'одиноко', 'обидно', 'страшно'],
  2: ['устал', 'раздражён', 'рассеян', 'вяло', 'скучно', 'неспокойно', 'недоволен', 'растерян'],
  3: ['ровно', 'спокойно', 'задумчиво', 'нейтрально', 'собранно', 'терпимо', 'буднично'],
  4: ['бодро', 'доволен', 'тепло', 'включён', 'благодарен', 'уверенно', 'легко', 'спокойная сила'],
  5: ['воодушевлён', 'счастлив', 'свободен', 'горжусь', 'вдохновлён', 'силён', 'радостно', 'ясно'],
}
const MOOD_LABELS = SCALE_STEPS[0].labels
const MOOD_LEVEL_BY_EMOTION = Object.entries(EMOTIONS).reduce((map, [level, words]) => {
  words.forEach(word => {
    map[word] = Number(level)
  })
  return map
}, {})

// TODO: временная фикстура для UI Lab — реальные данные придут из api.checkin.history.
function buildMonthFixture(pattern) {
  return pattern.map((level, index) => {
    const day = index + 1
    if (!level) return { day, level: null, emotion: null }
    const words = EMOTIONS[level]
    return { day, level, emotion: words[day % words.length] }
  })
}

// Волна: спокойное начало → трудная середина месяца → восстановление к концу.
const CURRENT_MONTH_PATTERN = [
  4, 4, 3, 4, 5, 4, 3, 0, 2, 3, 2, 2, 1, 2, 3, 2, 0, 4, 3, 4, 4, 5, 4, 4, 5, 4, 5, 4, 5, 4,
]
// Предыдущий месяц: ровнее, без выраженного спада.
const PREVIOUS_MONTH_PATTERN = [
  3, 4, 3, 3, 4, 3, 4, 3, 3, 4, 3, 3, 4, 4, 3, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4, 4, 3, 4, 4, 0,
]
const MONTH_FIXTURES = {
  current: { label: 'Этот месяц', days: buildMonthFixture(CURRENT_MONTH_PATTERN) },
  previous: { label: 'Предыдущий месяц', days: buildMonthFixture(PREVIOUS_MONTH_PATTERN) },
}

function average(values) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

// Тот же приём, что deriveConclusions в Analytics.jsx: делим период пополам
// и сравниваем средние, чтобы честно сказать, вырос тренд или просел.
function computeMoodSummary(days) {
  const withMood = days.filter(entry => entry.level != null)
  const avg = average(withMood.map(entry => entry.level))
  if (avg == null || withMood.length < 3) return { avg, count: withMood.length, trend: null }
  const half = Math.floor(withMood.length / 2)
  const delta =
    average(withMood.slice(half).map(entry => entry.level)) -
    average(withMood.slice(0, half).map(entry => entry.level))
  const trend = delta > 0.3 ? 'up' : delta < -0.3 ? 'down' : 'flat'
  return { avg, count: withMood.length, trend }
}

function heroInsightText(summary) {
  if (summary.trend === 'up') return 'К концу месяца настроение заметно выросло.'
  if (summary.trend === 'down')
    return 'К концу месяца настроение немного просело — стоит присмотреться, что изменилось.'
  return 'Настроение держится ровно весь месяц.'
}

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
          <i key={index} data-filled={index === 17} data-tone={index % 2} />
        ))}
      </div>
    )
  if (kind === 'ring')
    return (
      <div className="mx-history-trends__chart mx-history-trends__chart--ring">
        <div className="mx-history-trends__ring" aria-hidden="true" />
        <div className="mx-history-trends__ring-copy">
          <strong>12</strong>
          <span>сессий</span>
        </div>
      </div>
    )
  return (
    <div className="mx-history-trends__chart mx-history-trends__chart--bars">
      {[32, 58, 44, 74, 52].map((height, index) => (
        <i key={height} data-active={index === 3} style={{ height: `${height}%` }} />
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

function MoodHero({ state, summary, monthLabel }) {
  if (state !== 'data' || summary.count === 0) {
    return (
      <div className="mx-history-trends__hero">
        <span>Среднее за месяц</span>
        <h2>среднее настроение.</h2>
        <p>
          {state === 'progress'
            ? 'Пока рано считать среднее — сделай ещё несколько check-in, чтобы картина стала честной.'
            : 'Здесь появится честное среднее, как только наберётся пара отметок настроения.'}
        </p>
      </div>
    )
  }
  return (
    <div className="mx-history-trends__hero">
      <span>Среднее за месяц · {monthLabel.toLowerCase()}</span>
      <h2>среднее настроение.</h2>
      <div className="mx-history-trends__hero-value">
        <strong>{summary.avg.toFixed(1)}</strong>
        <span>из 5 · {MOOD_LABELS[Math.round(summary.avg) - 1]}</span>
      </div>
      <p>{heroInsightText(summary)}</p>
    </div>
  )
}

function TrendsPreview() {
  const [hidden, setHidden] = useState([])
  const [state, setState] = useState('data')
  const [activeMonth, setActiveMonth] = useState('current')
  const monthDays = MONTH_FIXTURES[activeMonth].days
  const moodSummary = useMemo(() => computeMoodSummary(monthDays), [monthDays])
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
      {/* Dev-only переключатель для ручного review трёх состояний данных — не для прод-версии. */}
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
      <MoodHero
        state={state}
        summary={moodSummary}
        monthLabel={MONTH_FIXTURES[activeMonth].label}
      />
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
