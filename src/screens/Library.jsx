import { useEffect, useMemo, useState } from 'react'
import NestedScreenHeader from '../components/NestedScreenHeader'
import SemanticGlyph, { semanticKindForArticle } from '../components/SemanticGlyph'
import { ARTICLES } from '../data/articles'
import { fetchArticles, peekArticles, peekArticlesSnapshot } from '../lib/libraryDataCache'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import Articles from './Articles'
import GuidedJournals from './GuidedJournals'
import HeroJourneyMap from './HeroJourneyMap'
import { previewHeroJourneyAction } from '../lib/heroJourneyDemo'
import {
  LibraryV2ProgramsCatalog,
  LibraryV2ArticlesCatalog,
  LibraryV2Articles,
  LibraryV2ProgramDetail,
  LibraryV2HeroJourneyLanding,
  LibraryV2ProgramLanding,
  LibraryV2ArticleLanding,
  LibraryV2JournalLanding,
  CollectionCard,
  LIBRARY_V2_ENABLED,
} from './library/parts'
import './Library.css'

function LibraryHome({
  onOpenArticles,
  onOpenJournals,
  onOpenArticle,
  onOpenV2Programs,
  onOpenV2Articles,
  onOpenHeroJourney,
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
    return sorted.slice(0, 5)
  }, [articles])

  function retryLoad() {
    setError(false)
    setLoading(true)
    setRetryCount(count => count + 1)
  }

  return (
    <div className="mx-library-catalog mx-screen-shell animate-fade-in">
      <header className="mx-library-catalog__header">
        <h1 className="font-display mx-type-page text-cream lowercase">библиотека.</h1>
      </header>

      {LIBRARY_V2_ENABLED && (
        <section className="mx-library-v2__section" aria-label="Библиотека v2">
          <LibraryV2HeroJourneyLanding onOpen={onOpenHeroJourney} />
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
              <strong>Статей пока нет</strong>
              <p>Первая статья появится здесь.</p>
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

export default function Library({ user, onInputModeChange }) {
  const [screen, setScreen] = useState(() => (previewHeroJourneyAction() ? 'hero-journey' : 'home'))
  const [initialArticle, setInitialArticle] = useState(null)
  const [libraryV2Article, setLibraryV2Article] = useState(null)
  const [libraryV2Program, setLibraryV2Program] = useState('Самодисциплина')

  /*
   * Edge-swipe «назад» для вложенных экранов библиотеки.
   * Под-экраны V2 (каталог программ, детальная программа, каталог статей,
   * читалка статьи) не используют компонент BackButton, поэтому без
   * явной регистрации в стеке useBackButton свайп от левого края не работает.
   * Под-экраны articles и journals имеют собственный BackButton —
   * их запись в стеке выше, Library-уровень срабатывает только когда
   * внутренний экран уже закрыт.
   */
  const libraryBackHandler = libraryV2Article
    ? () => setLibraryV2Article(null)
    : screen === 'library-v2-program'
      ? () => setScreen('library-v2-programs')
      : screen !== 'home'
        ? () => setScreen('home')
        : null

  useBackButton(libraryBackHandler, Boolean(libraryBackHandler))

  if (screen === 'library-v2-programs' && LIBRARY_V2_ENABLED) {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
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
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
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
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
        <LibraryV2ProgramDetail title={libraryV2Program} onBack={() => setScreen('library-v2-programs')} />
      </div>
    )
  }

  if (screen === 'library-v2-articles' && LIBRARY_V2_ENABLED) {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
        <LibraryV2Articles
          article={libraryV2Article}
          onBack={() => {
            setLibraryV2Article(null)
            setScreen('library-v2-articles')
          }}
          onOpen={articleId =>
            setLibraryV2Article(ARTICLES.find(article => article.id === articleId))
          }
        />
      </div>
    )
  }

  if (screen === 'hero-journey') {
    return <HeroJourneyMap onBack={() => setScreen('home')} />
  }

  if (screen === 'articles') {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
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
      <div className="w-full max-w-md px-[var(--mx-screen-x)]">
        <GuidedJournals user={user} onExit={() => setScreen('home')} onInputModeChange={onInputModeChange} />
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
        onOpenHeroJourney={() => setScreen('hero-journey')}
      />
    </div>
  )
}
