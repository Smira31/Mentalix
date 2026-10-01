import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  House,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react'

import SemanticGlyph from '../SemanticGlyph'
import './LibraryExperiment.css'

const ARTICLES = [
  {
    id: 'one-step',
    eyebrow: 'Фокус',
    title: 'Как начать с одного шага',
    description: 'Короткий материал о действии без лишнего давления.',
    kind: 'focus',
  },
  {
    id: 'inner-support',
    eyebrow: 'Поддержка',
    title: 'Как говорить с собой бережнее',
    description: 'Заметь внутренний тон и выбери более точные слова.',
    kind: 'purpose',
  },
  {
    id: 'evening-pause',
    eyebrow: 'Рефлексия',
    title: 'Спокойно завершить день',
    description: 'Несколько минут, чтобы отпустить незавершённое.',
    kind: 'journal',
  },
]

const JOURNALS = [
  {
    id: 'decision',
    eyebrow: '4 вопроса',
    title: 'Разобраться в решении',
    description: 'Отдели факты от предположений и найди следующий шаг.',
    kind: 'focus',
  },
  {
    id: 'week',
    eyebrow: '5 вопросов',
    title: 'Подвести итог недели',
    description: 'Увидь главное без ощущения отчётности.',
    kind: 'journal',
  },
]

const STATES = [
  ['ready', 'Готово'],
  ['loading', 'Загрузка'],
  ['error', 'Ошибка'],
  ['empty', 'Пусто'],
  ['web', 'Web'],
]

function Glyph({ kind }) {
  return <SemanticGlyph kind={kind} animated={false} />
}

function BottomNavigation() {
  const items = [
    ['Сегодня', House],
    ['Практики', Sparkles],
    ['Диалог', MessageCircle],
    ['Библиотека', BookOpen],
    ['Прогресс', ChartNoAxesColumnIncreasing],
  ]

  return (
    <nav className="mx-library-lab__bottom-nav" aria-label="Демо основной навигации">
      {items.map(([label, Icon]) => (
        <span key={label} data-active={label === 'Библиотека' ? 'true' : undefined}>
          <Icon size={18} strokeWidth={1.7} />
          <small>{label}</small>
        </span>
      ))}
    </nav>
  )
}

function SearchField({ value, onChange, onClose }) {
  return (
    <label className="mx-library-lab__search">
      <Search size={17} aria-hidden="true" />
      <input
        autoFocus
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="Найти материал"
        aria-label="Найти материал"
      />
      <button type="button" onClick={onClose} aria-label="Закрыть поиск">
        <X size={17} />
      </button>
    </label>
  )
}

function ArticleRail({ articles, onOpen }) {
  return (
    <div className="mx-library-lab__rail" aria-label="Материалы для тебя">
      {articles.map(article => (
        <button
          type="button"
          className="mx-library-lab__feature-card"
          key={article.id}
          onClick={() => onOpen(article)}
        >
          <span className="mx-library-lab__feature-art" aria-hidden="true">
            <Glyph kind={article.kind} />
          </span>
          <span className="mx-library-lab__eyebrow">{article.eyebrow}</span>
          <strong>{article.title}</strong>
          <small>{article.description}</small>
        </button>
      ))}
    </div>
  )
}

function CollectionCard({ title, description, kind, soon = false, onClick }) {
  return (
    <button
      type="button"
      className="mx-library-lab__collection"
      disabled={soon}
      onClick={onClick}
      aria-label={soon ? `${title}, скоро` : `Открыть ${title}`}
    >
      {soon && <span className="mx-library-lab__soon">СКОРО</span>}
      <strong>{title}</strong>
      <small>{description}</small>
      <span className="mx-library-lab__collection-art" aria-hidden="true">
        <Glyph kind={kind} />
      </span>
      {!soon && <ArrowRight className="mx-library-lab__collection-arrow" size={17} />}
    </button>
  )
}

function StatusSurface({ state, onRetry }) {
  if (state === 'loading') {
    return (
      <div className="mx-library-lab__status" aria-label="Загрузка библиотеки">
        <i />
        <i />
        <i />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="mx-library-lab__message" role="alert">
        <strong>Библиотека не загрузилась</strong>
        <p>Проверь соединение — сохранённые данные не изменились.</p>
        <button type="button" onClick={onRetry}>
          Повторить
        </button>
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="mx-library-lab__message">
        <strong>Здесь появятся твои материалы</strong>
        <p>Новые статьи и направленные записи будут собраны в одном месте.</p>
      </div>
    )
  }

  if (state === 'web') {
    return (
      <div className="mx-library-lab__message">
        <strong>Статьи доступны в браузере</strong>
        <p>Направленные записи открой в Telegram — там сохраняется твой контекст.</p>
      </div>
    )
  }

  return null
}

function Home({ state, searchOpen, query, setQuery, setSearchOpen, onCollection, onArticle }) {
  const articles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return ARTICLES
    return ARTICLES.filter(article =>
      `${article.title} ${article.description} ${article.eyebrow}`
        .toLowerCase()
        .includes(normalized)
    )
  }, [query])

  return (
    <>
      <header className="mx-library-lab__header">
        <h2>библиотека.</h2>
        <button type="button" onClick={() => setSearchOpen(true)} aria-label="Открыть поиск">
          <Search size={20} />
        </button>
      </header>

      {searchOpen && (
        <SearchField
          value={query}
          onChange={setQuery}
          onClose={() => {
            setSearchOpen(false)
            setQuery('')
          }}
        />
      )}

      {state === 'ready' ? (
        <>
          <section className="mx-library-lab__section">
            <div className="mx-library-lab__section-head">
              <div>
                <span>Выбрано для тебя</span>
                <h3>Материалы на сейчас</h3>
              </div>
              <small>{articles.length}</small>
            </div>
            {articles.length > 0 ? (
              <ArticleRail articles={articles} onOpen={onArticle} />
            ) : (
              <div className="mx-library-lab__message mx-library-lab__message--search">
                <strong>Ничего не найдено</strong>
                <p>Попробуй более короткий запрос.</p>
                <button type="button" onClick={() => setQuery('')}>
                  Очистить поиск
                </button>
              </div>
            )}
          </section>

          <section className="mx-library-lab__section">
            <div className="mx-library-lab__section-head">
              <div>
                <span>Всё в одном месте</span>
                <h3>Коллекции</h3>
              </div>
              <small>3</small>
            </div>
            <div className="mx-library-lab__collections">
              <CollectionCard
                title="Статьи"
                description="Короткие материалы, которые помогают перейти к действию."
                kind="purpose"
                onClick={() => onCollection('articles')}
              />
              <CollectionCard
                title="Направленные записи"
                description="Готовые вопросы и личные шаблоны для рефлексии."
                kind="journal"
                onClick={() => onCollection('journals')}
              />
              <CollectionCard
                title="Практикумы"
                description="Большие материалы для последовательной работы."
                kind="focus"
                soon
              />
            </div>
          </section>
        </>
      ) : (
        <StatusSurface state={state} onRetry={() => {}} />
      )}
    </>
  )
}

function Collection({ type, onBack, onArticle }) {
  const isArticles = type === 'articles'
  const items = isArticles ? ARTICLES : JOURNALS

  return (
    <>
      <button type="button" className="mx-library-lab__back" onClick={onBack} aria-label="Назад">
        <ArrowLeft size={19} />
      </button>
      <header className="mx-library-lab__collection-header">
        <span>Коллекция</span>
        <h2>{isArticles ? 'Статьи.' : 'Направленные записи.'}</h2>
        <p>
          {isArticles
            ? 'Короткие материалы Mentalix — без мотивационного шума.'
            : 'Вопросы, которые помогают заметить главное и сохранить свой ответ.'}
        </p>
      </header>
      <div className="mx-library-lab__catalog-grid">
        {items.map(item => (
          <button
            type="button"
            className="mx-library-lab__catalog-card"
            key={item.id}
            onClick={() => isArticles && onArticle(item)}
          >
            <span className="mx-library-lab__eyebrow">{item.eyebrow}</span>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
            <span className="mx-library-lab__catalog-art" aria-hidden="true">
              <Glyph kind={item.kind} />
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
    </>
  )
}

function Reader({ article, onBack }) {
  return (
    <article className="mx-library-lab__reader">
      <button
        type="button"
        className="mx-library-lab__back"
        onClick={onBack}
        aria-label="К статьям"
      >
        <ArrowLeft size={19} />
      </button>
      <span className="mx-library-lab__eyebrow">{article.eyebrow} · 4 минуты</span>
      <h2>{article.title}</h2>
      <p className="mx-library-lab__reader-lead">{article.description}</p>
      <div className="mx-library-lab__reader-art" aria-hidden="true">
        <Glyph kind={article.kind} />
      </div>
      <p>
        Не пытайся охватить всё сразу. Выбери действие, которое можно начать без дополнительной
        подготовки, и проверь его на практике.
      </p>
      <p>
        После этого вернись к результату: что стало легче, где появилось сопротивление и какой шаг
        теперь выглядит честным.
      </p>
    </article>
  )
}

export default function LibraryExperiment() {
  const [state, setState] = useState('ready')
  const [screen, setScreen] = useState('home')
  const [article, setArticle] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  function reset(nextState = state) {
    setState(nextState)
    setScreen('home')
    setArticle(null)
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <section className="mx-library-lab" aria-labelledby="mx-library-lab-title">
      <div className="mx-library-lab__intro">
        <span>UI-EXP-005 · Issue #526 · Preview-only</span>
        <h2 id="mx-library-lab-title">Библиотека: Stoic-ритм, функции Mentalix</h2>
        <p>
          Это визуальный прототип. Статьи, направленные записи и disabled-практикумы сохраняют
          действующие продуктовые границы; production не изменён.
        </p>
      </div>

      <div className="mx-library-lab__state-switch" aria-label="Состояние демо">
        {STATES.map(([key, label]) => (
          <button type="button" key={key} aria-pressed={state === key} onClick={() => reset(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="mx-library-lab__device">
        <div className="mx-library-lab__top-safe" aria-hidden="true">
          <span>MENTALIX</span>
          <Menu size={17} />
        </div>
        <div
          className="mx-library-lab__scroll"
          key={article ? `article-${article.id}` : `${screen}-${state}`}
        >
          {article ? (
            <Reader article={article} onBack={() => setArticle(null)} />
          ) : screen === 'home' ? (
            <Home
              state={state}
              searchOpen={searchOpen}
              query={query}
              setQuery={setQuery}
              setSearchOpen={setSearchOpen}
              onCollection={setScreen}
              onArticle={setArticle}
            />
          ) : (
            <Collection type={screen} onBack={() => setScreen('home')} onArticle={setArticle} />
          )}
        </div>
        <BottomNavigation />
      </div>
    </section>
  )
}
