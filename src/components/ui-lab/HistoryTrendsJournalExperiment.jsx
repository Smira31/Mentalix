import { Fragment, useMemo, useState } from 'react'
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

function moodLevelBreakdown(days) {
  const counts = [0, 0, 0, 0, 0]
  days.forEach(entry => {
    if (entry.level) counts[entry.level - 1] += 1
  })
  return counts
}

function topEmotions(days, limit = 5) {
  const counts = new Map()
  days.forEach(entry => {
    if (!entry.emotion) return
    counts.set(entry.emotion, (counts.get(entry.emotion) || 0) + 1)
  })
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
      level: MOOD_LEVEL_BY_EMOTION[emotion],
    }))
}

function emotionsByLevelRange(days, minLevel, maxLevel, limit = 3) {
  const counts = new Map()
  days.forEach(entry => {
    if (!entry.emotion || !entry.level) return
    if (entry.level < minLevel || entry.level > maxLevel) return
    counts.set(entry.emotion, (counts.get(entry.emotion) || 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([emotion]) => emotion)
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

function pluralizeEvents(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} событие`
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${count} события`
  return `${count} событий`
}

function groupHistoryByDate(entries) {
  return entries.reduce((groups, entry) => {
    const group = groups.find(item => item.date === entry.date)
    if (group) group.entries.push(entry)
    else groups.push({ date: entry.date, entries: [entry] })
    return groups
  }, [])
}

const insightCards = [
  { title: 'Разбивка по настроению', note: 'За этот месяц', kind: 'mood-bars' },
  { title: 'Календарь состояния', note: 'Одна точка — один день', kind: 'heatmap' },
  { title: 'Практики, которые поддерживают', note: 'На основе отмеченных дней', kind: 'ring' },
]
const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="mx-history-trends__heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  )
}

function Chart({ kind, breakdown }) {
  if (kind === 'heatmap')
    return (
      <div className="mx-history-trends__calendar">
        <div
          className="mx-history-trends__chart mx-history-trends__chart--heatmap"
          aria-label="Календарь состояния"
        >
          {Array.from({ length: 35 }, (_, index) => (
            <i key={index} data-filled={index === 17} data-tone={index % 2} />
          ))}
        </div>
        <div className="mx-history-trends__weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>
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
  if (kind === 'mood-bars') {
    const max = Math.max(1, ...breakdown)
    return (
      <div className="mx-history-trends__chart mx-history-trends__chart--mood">
        {breakdown.map((count, index) => {
          const level = index + 1
          const isTop = count > 0 && count === max
          return (
            <div className="mx-history-trends__mood-col" key={level}>
              <div className="mx-history-trends__mood-stick-track">
                <i data-active={isTop} style={{ height: `${Math.max((count / max) * 100, 6)}%` }} />
              </div>
              <Face level={level} active={isTop} size={18} />
              <span>{count}</span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

function HistoryPreview() {
  const [selected, setSelected] = useState(null)
  const historyByDate = useMemo(() => groupHistoryByDate(historyEntries), [])
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
        {historyByDate.map(group => (
          <div className="mx-history-trends__day" key={group.date}>
            <div className="mx-history-trends__date">
              <strong>{group.date}</strong>
              <span>{pluralizeEvents(group.entries.length)}</span>
              <ChevronDown size={14} />
            </div>
            {group.entries.map(entry => (
              <Fragment key={entry.type}>
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
                {entry.type === 'Дыхание' && (
                  <div className="mx-history-trends__milestone">
                    <SemanticGlyph kind="purpose" animated={false} />
                    <div>
                      <strong>Первый следующий шаг</strong>
                      <span>Ты возвращаешься к действию уже 7 дней.</span>
                    </div>
                    <Check size={16} />
                  </div>
                )}
              </Fragment>
            ))}
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

function MonthLineChart({ state, days, activeMonth, onMonthChange }) {
  const points = days.filter(entry => entry.level != null)
  const maxDay = days.length
  const width = 300
  const height = 100
  const toX = day => ((day - 1) / (maxDay - 1)) * width
  const toY = level => height - ((level - 1) / 4) * height
  const path = points
    .map(
      (entry, index) =>
        `${index === 0 ? 'M' : 'L'} ${toX(entry.day).toFixed(1)} ${toY(entry.level).toFixed(1)}`
    )
    .join(' ')
  const ticks = [1, 5, 10, 15, 20, 25, maxDay]

  return (
    <div className="mx-history-trends__month">
      <div className="mx-history-trends__month-head">
        <strong>Настроение по дням</strong>
        <div className="mx-history-trends__month-toggle" role="group" aria-label="Период">
          {Object.entries(MONTH_FIXTURES).map(([key, fixture]) => (
            <button
              type="button"
              key={key}
              aria-pressed={activeMonth === key}
              onClick={() => onMonthChange(key)}
            >
              {fixture.label}
            </button>
          ))}
        </div>
      </div>
      {state === 'data' && points.length > 1 ? (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mx-history-trends__month-chart"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={path} />
            {points.map(entry => (
              <circle key={entry.day} cx={toX(entry.day)} cy={toY(entry.level)} r="1.6" />
            ))}
          </svg>
          <div className="mx-history-trends__month-axis">
            {ticks.map(day => (
              <span key={day} style={{ left: `${((day - 1) / (maxDay - 1)) * 100}%` }}>
                {day}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="mx-history-trends__empty">
          <strong>
            {state === 'empty' ? 'Пока нет ни одной отметки' : 'График соберётся из отметок'}
          </strong>
          <span>
            {state === 'empty'
              ? 'Отметь настроение — точки появятся день за днём.'
              : 'Ещё несколько check-in — и линия станет заметной.'}
          </span>
        </div>
      )}
    </div>
  )
}

function EmotionDonut({ items }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const segments = items.reduce((accumulated, item, index) => {
    const previous = accumulated[index - 1]
    const start = previous ? previous.start + previous.length : 0
    const length = total ? (item.count / total) * circumference : 0
    return [...accumulated, { emotion: item.emotion, length, start }]
  }, [])

  return (
    <svg viewBox="0 0 76 76" className="mx-history-trends__donut" aria-hidden="true">
      <g transform="rotate(-90 38 38)">
        <circle cx="38" cy="38" r={radius} className="mx-history-trends__donut-track" />
        {segments.map((segment, index) => (
          <circle
            key={segment.emotion}
            cx="38"
            cy="38"
            r={radius}
            className="mx-history-trends__donut-segment"
            data-rank={index}
            strokeDasharray={`${segment.length} ${circumference - segment.length}`}
            strokeDashoffset={-segment.start}
          />
        ))}
      </g>
    </svg>
  )
}

function EmotionsSection({ state, emotions, risers, fallers }) {
  const hasData = state === 'data' && emotions.length > 0
  return (
    <div className="mx-history-trends__emotions" role="region" aria-labelledby="emotions-title">
      <div className="mx-history-trends__emotions-heading">
        <strong id="emotions-title">Эмоции</strong>
        <span>Те же слова из check-in, собранные в частоты за месяц — без эмодзи-рожиц.</span>
      </div>
      {hasData ? (
        <>
          <div className="mx-history-trends__emotions-top">
            <div>
              <strong>Топ эмоций месяца</strong>
              <EmotionDonut items={emotions} />
            </div>
            <ul className="mx-history-trends__emotions-list">
              {emotions.map(item => (
                <li key={item.emotion}>
                  <Face level={item.level} active={false} size={16} />
                  <span>{item.emotion}</span>
                  <em>{item.percent}%</em>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-history-trends__emotions-cards">
            <article>
              <strong>Что поднимает</strong>
              {risers.length ? (
                <ul>
                  {risers.map(word => (
                    <li key={word}>{word}</li>
                  ))}
                </ul>
              ) : (
                <span className="mx-history-trends__emotions-empty">Пока не набралось данных</span>
              )}
            </article>
            <article>
              <strong>Что понижает</strong>
              {fallers.length ? (
                <ul>
                  {fallers.map(word => (
                    <li key={word}>{word}</li>
                  ))}
                </ul>
              ) : (
                <span className="mx-history-trends__emotions-empty">Пока не набралось данных</span>
              )}
            </article>
          </div>
        </>
      ) : (
        <div className="mx-history-trends__empty">
          <strong>
            {state === 'empty' ? 'Пока нет ни одной эмоции' : 'Эмоции ещё собираются'}
          </strong>
          <span>
            {state === 'empty'
              ? 'Выбери слово в check-in — здесь появится первая точка.'
              : 'Ещё немного отметок — и появится честная картина.'}
          </span>
        </div>
      )}
    </div>
  )
}

function TrendsPreview() {
  const [hidden, setHidden] = useState([])
  const [state, setState] = useState('data')
  const [activeMonth, setActiveMonth] = useState('current')
  const monthDays = MONTH_FIXTURES[activeMonth].days
  const moodSummary = useMemo(() => computeMoodSummary(monthDays), [monthDays])
  const moodBreakdown = useMemo(() => moodLevelBreakdown(monthDays), [monthDays])
  const emotions = useMemo(() => topEmotions(monthDays), [monthDays])
  const risers = useMemo(() => emotionsByLevelRange(monthDays, 4, 5), [monthDays])
  const fallers = useMemo(() => emotionsByLevelRange(monthDays, 1, 2), [monthDays])
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
      <MonthLineChart
        state={state}
        days={monthDays}
        activeMonth={activeMonth}
        onMonthChange={setActiveMonth}
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
              <Chart kind={card.kind} breakdown={moodBreakdown} />
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
      <EmotionsSection state={state} emotions={emotions} risers={risers} fallers={fallers} />
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
