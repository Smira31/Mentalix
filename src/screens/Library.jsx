import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react'

import SemanticGlyph, { semanticKindForArticle } from '../components/SemanticGlyph'
import ArticleCover from '../components/ArticleCover'
import { ARTICLES } from '../data/articles'
import { fetchArticles, peekArticles, peekArticlesSnapshot } from '../lib/libraryDataCache'
import { isPreviewDemoMode } from '../lib/demoMode'
import { platform } from '../platform'
import Articles from './Articles'
import GuidedJournals from './GuidedJournals'
import './Library.css'

const LIBRARY_V2_ENV_ENABLED = import.meta.env.VITE_LIBRARY_V2 === 'true'
const LIBRARY_V2_QA_ENABLED =
  typeof window !== 'undefined' &&
  window.location.hostname === 'mentalix-owner-qa.pages.dev' &&
  new URLSearchParams(window.location.search).get('library_v2') === '1'
const LIBRARY_V2_ENABLED = LIBRARY_V2_ENV_ENABLED || LIBRARY_V2_QA_ENABLED || isPreviewDemoMode()

function LibraryV2FeaturedBanner({ title, description, art, action, onOpen }) {
  return (
    <article className="mx-library-v2__featured-banner">
      <div className="mx-library-v2__featured-art" aria-hidden="true">
        {art}
      </div>
      <div className="mx-library-v2__featured-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <button type="button" className="mx-library-v2__pill" onClick={onOpen}>
          {action} <ArrowRight size={15} />
        </button>
      </div>
    </article>
  )
}

const LIBRARY_V2_PROGRAMS = [
  ['Границы без лишнего напряжения', 'journal', 'Сказать «нет» без чувства вины'],
  ['Неделя внимательного решения', 'purpose', 'Семь дней, чтобы разложить выбор по полочкам'],
  ['Неделя внутреннего порядка', 'focus', 'Навести ясность в делах без спешки'],
]

function LibraryV2ArticleLanding({ onOpen }) {
  const article = ARTICLES[0]
  return (
    <section className="mx-library-v2__section-block" aria-labelledby="library-v2-articles-title">
      <h2 className="mx-type-section" id="library-v2-articles-title">
        Статьи
      </h2>
      <LibraryV2FeaturedBanner
        title={article.title}
        description={article.excerpt}
        action="Читать"
        onOpen={onOpen}
        art={<ArticleCover article={article} className="h-full w-full" />}
      />
    </section>
  )
}

function LibraryV2ProgramLanding({ onOpen }) {
  return (
    <section className="mx-library-v2__section-block" aria-labelledby="library-v2-programs-title">
      <h2 className="mx-type-section" id="library-v2-programs-title">
        Программы
      </h2>
      <LibraryV2FeaturedBanner
        title="Найди свою программу"
        description="Пошаговые практики на несколько дней или недель — выбери то, что откликается сейчас."
        action="Смотреть"
        onOpen={onOpen}
        art={<SemanticGlyph kind="focus" animated={false} />}
      />
    </section>
  )
}

function LibraryV2JournalLanding({ onOpen }) {
  return (
    <section className="mx-library-v2__section-block" aria-labelledby="library-v2-journals-title">
      <h2 className="mx-type-section" id="library-v2-journals-title">
        Направленные записи
      </h2>
      <LibraryV2FeaturedBanner
        title="Новая запись"
        description="Короткие письменные практики, которые помогают прояснить мысли."
        action="Начать"
        onOpen={onOpen}
        art={<SemanticGlyph kind="journal" animated={false} />}
      />
      <div className="mx-library-programs__guided-list" aria-label="Другие направленные записи">
        <button type="button" className="mx-library-programs__guided-list-row" onClick={onOpen}>
          <span>
            <strong>Новая запись</strong>
            <small>4 вопроса · 5–7 минут</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="mx-library-programs__guided-list-row" onClick={onOpen}>
          <span>
            <strong>Вернуться к записи</strong>
            <small>Сохранённые ответы и следующий шаг</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

function LibraryV2ProgramDetail({ title, onBack }) {
  return (
    <div className="mx-library-v2__program-detail animate-fade-in">
      <button
        type="button"
        className="mx-library-collection-back"
        onClick={onBack}
        aria-label="Назад"
      >
        <ArrowLeft size={19} />
      </button>
      <div className="mx-library-v2__program-detail-art" aria-hidden="true">
        <SemanticGlyph kind="focus" animated={false} />
      </div>
      <span className="mx-library-v2__article-tag">ПРОГРАММЫ</span>
      <h1>{title}</h1>
      <p>Выстроить устойчивый ритм и доводить важное до конца без давления на себя.</p>
      <strong>Скоро</strong>
    </div>
  )
}

function LibraryV2CatalogCard({ title, description, kind, article, onOpen }) {
  return (
    <button type="button" className="mx-library-v2__catalog-card" onClick={onOpen}>
      <span className="mx-library-v2__catalog-card-art" aria-hidden="true">
        {article ? (
          <ArticleCover article={article} className="h-full w-full" />
        ) : (
          <SemanticGlyph kind={kind} animated={false} />
        )}
      </span>
      <strong>{title}</strong>
      <small>{description}</small>
    </button>
  )
}

function LibraryV2ProgramsCatalog({ onBack, onOpen }) {
  return (
    <div className="mx-library-v2__catalog animate-fade-in">
      <button
        type="button"
        className="mx-library-collection-back"
        onClick={onBack}
        aria-label="Назад"
      >
        <ArrowLeft size={19} />
      </button>
      <h1 className="font-display mx-type-page text-cream lowercase">программы.</h1>
      <div className="mx-library-v2__catalog-grid" aria-label="Каталог программ">
        {LIBRARY_V2_PROGRAMS.map(([title, kind, description]) => (
          <LibraryV2CatalogCard
            key={title}
            title={title}
            description={description}
            kind={kind}
            onOpen={() => onOpen(title)}
          />
        ))}
      </div>
    </div>
  )
}

function LibraryV2ArticlesCatalog({ onBack, onOpen }) {
  return (
    <div className="mx-library-v2__catalog animate-fade-in">
      <button
        type="button"
        className="mx-library-collection-back"
        onClick={onBack}
        aria-label="Назад"
      >
        <ArrowLeft size={19} />
      </button>
      <h1 className="font-display mx-type-page text-cream lowercase">статьи.</h1>
      <div className="mx-library-v2__catalog-grid" aria-label="Каталог статей">
        {ARTICLES.map(article => (
          <LibraryV2CatalogCard
            key={article.id}
            title={article.title}
            description={article.excerpt}
            article={article}
            onOpen={() => onOpen(article.id)}
          />
        ))}
      </div>
    </div>
  )
}

function LibraryV2ArticleReader({ article, onBack }) {
  const paragraphs = String(article.body || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
  return (
    <div className="mx-library-v2__reader animate-fade-in">
      <button
        type="button"
        className="mx-library-collection-back"
        onClick={onBack}
        aria-label="Назад"
      >
        <ArrowLeft size={19} />
      </button>
      <ArticleCover article={article} variant="banner" className="mb-5" />
      <h1>{article.title}</h1>
      <div className="mx-library-v2__reader-meta">
        <span>{article.minutes} мин чтения</span>
        <span>·</span>
        <span>{article.tag}</span>
      </div>
      <div className="mx-library-v2__reader-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {article.source && (
        <a
          href={article.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-library-v2__reader-source"
        >
          Первоисточник <ArrowRight size={14} />
        </a>
      )}
    </div>
  )
}

function LibraryV2Articles({ article, onBack, onOpen }) {
  if (article) return <LibraryV2ArticleReader article={article} onBack={onBack} />
  return <LibraryV2ArticlesList onBack={onBack} onOpen={onOpen} />
}

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

function LibraryHome({
  onOpenArticles,
  onOpenJournals,
  onOpenArticle,
  onOpenV2Programs,
  onOpenV2Articles,
}) {
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
    <div className="mx-library-catalog mx-screen-shell animate-fade-in">
      <header className="mx-library-catalog__header">
        <h1 className="font-display mx-type-page text-cream lowercase">библиотека.</h1>
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

      {LIBRARY_V2_ENABLED && (
        <section className="mx-library-v2__section" aria-label="Библиотека v2">
          <LibraryV2ProgramLanding onOpen={onOpenV2Programs} />
          <LibraryV2ArticleLanding onOpen={onOpenV2Articles} />
          <LibraryV2JournalLanding onOpen={onOpenJournals} />
        </section>
      )}

      {!LIBRARY_V2_ENABLED && (
        <section className="mx-library-catalog__section" aria-labelledby="library-featured-title">
          <div className="mx-library-catalog__section-head">
            <div>
              <span>Новые материалы</span>
              <h2 className="mx-type-section" id="library-featured-title">
                На сейчас
              </h2>
            </div>
            {!loading && !error && <small>{featured.length}</small>}
          </div>

          {loading ? (
            <div
              className="mx-library-catalog__status"
              role="status"
              aria-live="polite"
              aria-label="Загрузка библиотеки"
            >
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
      )}

      {!LIBRARY_V2_ENABLED && (
        <section
          className="mx-library-catalog__section"
          aria-labelledby="library-collections-title"
        >
          <div className="mx-library-catalog__section-head">
            <div>
              <span>Всё в одном месте</span>
              <h2 className="mx-type-section" id="library-collections-title">
                Коллекции
              </h2>
            </div>
            <small>3</small>
          </div>
          <div className="mx-library-catalog__collections">
            {!LIBRARY_V2_ENABLED && (
              <CollectionCard
                title="Статьи"
                description="Короткие материалы, которые помогают перейти к действию."
                kind="purpose"
                onClick={onOpenArticles}
              />
            )}
            {!LIBRARY_V2_ENABLED && (
              <CollectionCard
                title="Направленные записи"
                description="Готовые вопросы и личные шаблоны для рефлексии."
                kind="journal"
                onClick={onOpenJournals}
              />
            )}
            <CollectionCard
              title="Практикумы"
              description="Большие материалы для последовательной работы."
              kind="focus"
              soon
            />
          </div>
        </section>
      )}
    </div>
  )
}

export default function Library({ user }) {
  const [screen, setScreen] = useState('home')
  const [initialArticle, setInitialArticle] = useState(null)
  const [libraryV2Article, setLibraryV2Article] = useState(null)
  const [libraryV2Program, setLibraryV2Program] = useState('Самодисциплина')

  if (screen === 'library-v2-programs' && LIBRARY_V2_ENABLED) {
    return (
      <div className="w-full max-w-md px-5">
        <LibraryV2ProgramsCatalog
          onBack={() => setScreen('home')}
          onOpen={title => {
            setLibraryV2Program(title)
            setScreen('library-v2-program')
          }}
        />
      </div>
    )
  }

  if (screen === 'library-v2-articles' && LIBRARY_V2_ENABLED && !libraryV2Article) {
    return (
      <div className="w-full max-w-md px-5">
        <LibraryV2ArticlesCatalog
          onBack={() => setScreen('home')}
          onOpen={articleId =>
            setLibraryV2Article(ARTICLES.find(article => article.id === articleId))
          }
        />
      </div>
    )
  }

  if (screen === 'library-v2-program' && LIBRARY_V2_ENABLED) {
    return (
      <div className="w-full max-w-md px-5">
        <LibraryV2ProgramDetail title={libraryV2Program} onBack={() => setScreen('home')} />
      </div>
    )
  }

  if (screen === 'library-v2-articles' && LIBRARY_V2_ENABLED) {
    return (
      <div className="w-full max-w-md px-5">
        <LibraryV2Articles
          article={libraryV2Article}
          onBack={() => {
            setLibraryV2Article(null)
            setScreen('home')
          }}
          onOpen={articleId =>
            setLibraryV2Article(ARTICLES.find(article => article.id === articleId))
          }
        />
      </div>
    )
  }

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
        onOpenV2Programs={() => setScreen('library-v2-programs')}
        onOpenArticle={article => {
          setInitialArticle(article)
          setScreen('articles')
        }}
        onOpenV2Articles={articleId => {
          setLibraryV2Article(articleId ? ARTICLES.find(article => article.id === articleId) : null)
          setScreen('library-v2-articles')
        }}
      />
    </div>
  )
}
