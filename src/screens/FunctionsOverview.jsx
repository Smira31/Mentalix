import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  Compass,
  Feather,
  Flame,
  Heart,
  History,
  Library,
  MessageCircle,
  Moon,
  PenLine,
  Search,
  Sparkles,
  Wind,
} from 'lucide-react'
import './FunctionsOverview.css'

const GROUPS = [
  {
    title: 'Каждый день',
    copy: 'Короткий вход, который помогает заметить главное и выбрать следующий шаг.',
    items: [
      {
        key: 'today',
        icon: CalendarDays,
        title: 'Сегодня',
        copy: 'Чек-ин, мысль дня и следующий шаг',
      },
      { key: 'journal', icon: PenLine, title: 'Журнал', copy: 'Свободная запись и guided-вопросы' },
      {
        key: 'mentor',
        icon: MessageCircle,
        title: 'Диалог',
        copy: 'Разговор с наставником, когда нужно разобраться',
      },
    ],
  },
  {
    title: 'Практики и фокус',
    copy: 'Небольшие упражнения без давления: выбери одно и начни.',
    items: [
      { key: 'focus', icon: Compass, title: 'Фокус', copy: 'Один важный вопрос до действия' },
      {
        key: 'meditation',
        icon: Moon,
        title: 'Медитация',
        copy: 'Наблюдение, влияние и возвращение внимания',
      },
      { key: 'breathing', icon: Wind, title: 'Дыхание', copy: 'Практики дыхания в своём темпе' },
      {
        key: 'brain',
        icon: Brain,
        title: 'Нейротренажёр',
        copy: 'Короткие упражнения для внимания',
      },
    ],
  },
  {
    title: 'Путь и наблюдение',
    copy: 'История изменений без гонки за идеальным результатом.',
    items: [
      {
        key: 'progress',
        icon: BarChart3,
        title: 'Статистика',
        copy: 'Серии, дни и заметные изменения',
      },
      { key: 'awards', icon: Flame, title: 'Награды', copy: 'Вехи, которые открываются по пути' },
      {
        key: 'history',
        icon: History,
        title: 'История',
        copy: 'Возвращение к сохранённым записям',
      },
    ],
  },
  {
    title: 'Материалы',
    copy: 'Темы, статьи и источники для самостоятельного изучения.',
    items: [
      { key: 'library', icon: Library, title: 'Библиотека', copy: 'Статьи, темы и материалы' },
      {
        key: 'guided',
        icon: BookOpen,
        title: 'Guided-журналы',
        copy: 'Направленные маршруты саморефлексии',
      },
      {
        key: 'quotes',
        icon: Feather,
        title: 'Мои фразы',
        copy: 'Личные мысли для ежедневного напоминания',
      },
    ],
  },
]

function FeatureCard({ item, onOpen }) {
  const Icon = item.icon
  return (
    <button type="button" className="mx-functions-card" onClick={() => onOpen(item.key)}>
      <span className="mx-functions-card__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.4} />
      </span>
      <span className="mx-functions-card__body">
        <strong>{item.title}</strong>
        <span>{item.copy}</span>
      </span>
      <ChevronRight className="mx-functions-card__arrow" size={18} aria-hidden="true" />
    </button>
  )
}

export default function FunctionsOverview({ onOpen }) {
  return (
    <div className="mx-functions-overview" aria-label="Все функции Mentalix">
      <section className="mx-functions-hero">
        <div className="mx-functions-hero__eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          пространство Mentalix
        </div>
        <h1>
          всё, что помогает
          <br />
          быть ближе к себе.
        </h1>
        <p>Выбери один путь. Остальное подождёт.</p>
        <button type="button" className="mx-functions-hero__cta" onClick={() => onOpen('today')}>
          Начать с сегодняшнего дня <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>

      <div className="mx-functions-search-hint" aria-label="Поиск по функциям">
        <Search size={16} aria-hidden="true" />
        <span>Найти практику или материал</span>
      </div>

      {GROUPS.map(group => (
        <section className="mx-functions-group" key={group.title}>
          <div className="mx-functions-group__heading">
            <h2>{group.title}</h2>
            <p>{group.copy}</p>
          </div>
          <div className="mx-functions-grid">
            {group.items.map(item => (
              <FeatureCard key={item.key} item={item} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
