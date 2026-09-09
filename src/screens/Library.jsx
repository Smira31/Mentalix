import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'

import SemanticGlyph, { semanticKindForArticle } from '../components/SemanticGlyph'
import { fetchArticles, peekArticles, peekArticlesSnapshot } from '../lib/libraryDataCache'
import { platform } from '../platform'
import Articles from './Articles'
import GuidedJournals from './GuidedJournals'
import './Library.css'

function CollectionCard({ title, description, kind, soon = false, onClick }) {
  return (
    <button
      type="button"
      className="mx-library-catalog__collection"
      disabled={soon}
      aria-label={soon ? `${title}, скоро` : `Открыть ${title}`}
      onClick={() => {
        if (soon) return
        platform.haptic('light')
        onClick?.()
      }}
    >
      {soon && <span className="mx-library-catalog__soon">СКОРО</span>}
      <strong>{title}</strong>
      <small>{description}</small>
      <span className="mx-library-catalog__collection-art" aria-hidden="true">
        <SemanticGlyph kind={kind} animated={false} />
      </span>
      {!soon && <ArrowRight className="mx-library-catalog__collection-arrow" size={17} />}
    </button>
  )
}

function LibraryHome({ onOpenArticles, onOpenJournals, onOpenArticle }) {
  const [initialArticlesState] = useState(() => {
    const memoryArticles = peekArticles()
    if (memoryArticles !== null) return { data: memoryArticles, shouldRefresh: false }

    const snapshotArticles = peekArticlesSnapshot()
    return { data: snapshotArticles, shouldRefresh: snapshotArticles !== null }
  })
  const [articles, setArticles] = useState(() => initialArticlesState.data ?? [])
  const [loading, setLoading] = useState(() => initialArticlesState.data === null)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    fetchArticles({ force: initialArticlesState.shouldRefresh || retryCount > 0 })
      .then(data => {
        if (!active) return
        setArticles(Array.isArray(data) ? data : [])
        setError(false)
      })
      .catch(loadError => {
        console.error(loadError)
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [initialArticlesState, retryCount])

  const featured = useMemo(() => {
    const sorted = [...articles].sort((a, b) => String(b.date).localeCompare(String(a.date)))
    const normalized = query.trim().toLowerCase()
    if (!normalized) return sorted.slice(0, 5)

    return sorted
      .filter(article =>
        `${article.title} ${article.excerpt} ${article.tag || ''}`
          .toLowerCase()
          .includes(normalized)
      )
      .slice(0, 5)
  }, [articles, query])

  function retryLoad() {
    setError(false)
    setLoading(true)
    setRetryCount(count => count + 1)
  }

  return (
    <div className="mx-library-catalog animate-fade-in">
      <header className="mx-library-catalog__header">
        <h2 className="font-display mx-type-page text-cream lowercase">библиотека.</h2>
        <button type="button" onClick={() => setSearchOpen(true)} aria-label="Открыть поиск">
          <Search size={20} />
        </button>
      </header>

      {searchOpen && (
        <label className="mx-library-catalog__search">
          <Search size={17} aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Найти материал"
            aria-label="Найти материал"
          />
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false)
              setQuery('')
            }}
            aria-label="Закрыть поиск"
          >
            <X size={17} />
          </button>
        </label>
      )}

      <section className="mx-library-catalog__section" aria-labelledby="library-featured-title">
        <div className="mx-library-catalog__section-head">
          <div>
            <span>Новые материалы</span>
            <h3 id="library-featured-title">На сейчас</h3>
          </div>
          {!loading && !error && <small>{featured.length}</small>}
        </div>

        {loading ? (
          <div className="mx-library-catalog__status" aria-label="Загрузка библиотеки">
            <i />
            <i />
          </div>
        ) : error && articles.length === 0 ? (
          <div className="mx-library-catalog__message" role="alert">
            <strong>Материалы не загрузились</strong>
            <p>Проверь соединение — сохранённые данные не изменились.</p>
            <button type="button" onClick={retryLoad}>
              Повторить
            </button>
          </div>
        ) : featured.length === 0 ? (
          <div className="mx-library-catalog__message">
            <strong>{articles.length === 0 ? 'Статей пока нет' : 'Ничего не найдено'}</strong>
            <p>
              {articles.length === 0
                ? 'Первая статья появится здесь.'
                : 'Попробуй более короткий запрос.'}
            </p>
            {articles.length > 0 && (
              <button type="button" onClick={() => setQuery('')}>
                Очистить поиск
              </button>
            )}
          </div>
        ) : (
          <div className="mx-library-catalog__rail" aria-label="Новые материалы">
            {featured.map(article => (
              <button
                type="button"
                className="mx-library-catalog__feature-card"
                key={article.id}
                onClick={() => {
                  platform.haptic('light')
                  onOpenArticle(article)
                }}
              >
                <span className="mx-library-catalog__feature-art" aria-hidden="true">
                  <SemanticGlyph kind={semanticKindForArticle(article)} animated={false} />
                </span>
                <span className="mx-library-catalog__eyebrow">{article.tag || 'Статья'}</span>
                <strong>{article.title}</strong>
                <small>{article.excerpt}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mx-library-catalog__section" aria-labelledby="library-collections-title">
        <div className="mx-library-catalog__section-head">
          <div>
            <span>Всё в одном месте</span>
            <h3 id="library-collections-title">Коллекции</h3>
          </div>
          <small>3</small>
        </div>
        <div className="mx-library-catalog__collections">
          <CollectionCard
            title="Статьи"
            description="Короткие материалы, которые помогают перейти к действию."
            kind="purpose"
            onClick={onOpenArticles}
          />
          <CollectionCard
            title="Направленные записи"
            description="Готовые вопросы и личные шаблоны для рефлексии."
            kind="journal"
            onClick={onOpenJournals}
          />
          <CollectionCard
            title="Практикумы"
            description="Большие материалы для последовательной работы."
            kind="focus"
            soon
          />
        </div>
      </section>
    </div>
  )
}

export default function Library({ user }) {
  const [screen, setScreen] = useState('home')
  const [initialArticle, setInitialArticle] = useState(null)

  if (screen === 'articles') {
    return (
      <div className="w-full max-w-md px-5">
        <Articles
          initialArticle={initialArticle}
          onExit={() => {
            setInitialArticle(null)
            setScreen('home')
          }}
        />
      </div>
    )
  }

  if (screen === 'journals') {
    return (
      <div className="w-full max-w-md px-5">
        <GuidedJournals user={user} onExit={() => setScreen('home')} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <LibraryHome
        onOpenArticles={() => setScreen('articles')}
        onOpenJournals={() => setScreen('journals')}
        onOpenArticle={article => {
          setInitialArticle(article)
          setScreen('articles')
        }}
      />
    </div>
  )
}
