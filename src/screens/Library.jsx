import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import CourseCatalog, { CourseCards } from '../components/CourseCatalog'
import { HERO_COURSE, libraryCourses } from '../data/courses'
import { isPreviewDemoMode } from '../lib/demoMode'
import ArticleSheet from '../components/ArticleSheet'
import LibraryArticleReader from './LibraryArticleReader'
import HeroJourneyMap from './HeroJourneyMap'
import DailyJournalFlow from './DailyJournal/DailyJournalFlow'
import {
  LibraryV2ProgramLanding,
  LibraryV2ProgramsCatalog,
  LibraryV2ProgramDetail,
  LIBRARY_PROGRAMS_ENABLED,
} from './LibraryPrograms'
import {
  articleSectionsFromList,
  nextArticleFromList,
  fetchArticles,
  peekArticles,
} from '../lib/libraryDataCache'
import { redirectRemovedLibraryAddress } from '../lib/libraryNavigation'
import { useTabReset } from '../lib/tabRefresh'
import { previewHeroJourneyAction } from '../lib/heroJourneyDemo'
import { platform } from '../platform'
import './Library.css'
import './LibraryStoic.css'

export default function Library({ user, onInputModeChange }) {
  const [screen, setScreen] = useState(() => (previewHeroJourneyAction() ? 'hero-journey' : 'home'))
  const [sheet, setSheet] = useState(null)
  const [article, setArticle] = useState(null)
  const [program, setProgram] = useState('Самодисциплина')
  const [course, setCourse] = useState(HERO_COURSE)
  const [courseOrigin, setCourseOrigin] = useState('home')
  /* Статьи едут с сервера: список без body, текст статьи догружает читалка. */
  const [articles, setArticles] = useState(() => peekArticles() || [])
  const [articlesLoading, setArticlesLoading] = useState(() => !peekArticles())
  const [articlesError, setArticlesError] = useState(false)
  const [articlesRetry, setArticlesRetry] = useState(0)
  const sections = useMemo(() => articleSectionsFromList(articles), [articles])
  const courses = libraryCourses(
    isPreviewDemoMode(),
    new URLSearchParams(window.location.search).get('demo_courses') !== '0'
  )
  const originTile = useRef(null)
  const readerScroll = useRef(0)
  const homeScroll = useRef(0)
  const closeSheet = useCallback(() => setSheet(null), [])
  const readerOpen = screen === 'reader'
  const focused = Boolean(sheet) || screen !== 'home'

  useEffect(() => {
    redirectRemovedLibraryAddress()
  }, [])

  /* Список статей едет с сервера (GET /api/content/library): пока грузится —
     спокойный скелет, при ошибке сети — короткий текст и «Повторить». */
  useEffect(() => {
    const cached = peekArticles()
    if (cached) {
      setArticles(cached)
      setArticlesLoading(false)
      setArticlesError(false)
      return undefined
    }
    let alive = true
    setArticlesLoading(true)
    setArticlesError(false)
    fetchArticles({ force: articlesRetry > 0 })
      .then(list => {
        if (alive) setArticles(list || [])
      })
      .catch(() => {
        if (alive) setArticlesError(true)
      })
      .finally(() => {
        if (alive) setArticlesLoading(false)
      })
    return () => {
      alive = false
    }
  }, [articlesRetry])
  useEffect(() => {
    onInputModeChange?.(focused)
    return () => onInputModeChange?.(false)
  }, [focused, onInputModeChange])

  useLayoutEffect(() => {
    if (screen === 'reader') {
      const root = document.querySelector('.mx-library-reader-surface .mx-fullscreen-scroll')
      if (root) root.scrollTop = readerScroll.current
    }
    if (screen === 'home' && !sheet) {
      const root = document.querySelector('.mx-app-scroll-root')
      if (root) root.scrollTop = homeScroll.current
      originTile.current?.focus({ preventScroll: true })
    }
    return undefined
  }, [screen, article, sheet])

  useTabReset('library', () => {
    setScreen('home')
    setSheet(null)
    setArticle(null)
  })

  function openArticle(item, event) {
    originTile.current = event.currentTarget
    homeScroll.current = document.querySelector('.mx-app-scroll-root')?.scrollTop || 0
    platform.haptic('light')
    setSheet(item)
  }

  if (screen === 'hero-journey')
    return (
      <HeroJourneyMap
        key={`${user.id}:${course.id}`}
        user={user}
        course={course}
        onBack={() => setScreen(courseOrigin)}
      />
    )
  const openCourse = selected => {
    homeScroll.current = document.querySelector('.mx-app-scroll-root')?.scrollTop || 0
    setCourseOrigin(screen)
    setCourse(selected)
    setScreen('hero-journey')
  }
  if (screen === 'courses')
    return (
      <CourseCatalog
        courses={courses}
        userId={user.id}
        onOpen={openCourse}
        onBack={() => setScreen('home')}
      />
    )
  const reader =
    readerOpen && article ? (
      <LibraryArticleReader
        key={article.id}
        article={article}
        next={nextArticleFromList(article, articles)}
        onBack={() => {
          setScreen('home')
          setSheet(article)
        }}
        onJournal={() => {
          readerScroll.current =
            document.querySelector('.mx-library-reader-surface .mx-fullscreen-scroll')?.scrollTop ||
            0
          setScreen('journal')
        }}
        onNext={() => {
          readerScroll.current = 0
          setArticle(nextArticleFromList(article, articles))
        }}
      />
    ) : null
  if (LIBRARY_PROGRAMS_ENABLED && screen === 'programs')
    return (
      <LibraryV2ProgramsCatalog
        onBack={() => setScreen('home')}
        onOpen={title => {
          setProgram(title)
          setScreen('program')
        }}
      />
    )
  if (LIBRARY_PROGRAMS_ENABLED && screen === 'program')
    return <LibraryV2ProgramDetail title={program} onBack={() => setScreen('programs')} />

  return (
    <>
      <div
        className="mx-screen-shell mx-library-catalog mx-library-stoic"
        data-testid="library-home"
        inert={focused ? '' : undefined}
        aria-hidden={focused ? true : undefined}
      >
        <header className="mx-library-catalog__header">
          <h1 className="font-display mx-type-page text-cream">библиотека.</h1>
        </header>
        <section className="mx-library-topic" aria-labelledby="library-courses-title">
          <h2 id="library-courses-title" className="mx-library-caps">
            ПРАКТИКУМЫ
          </h2>
          <CourseCards courses={courses.slice(0, 3)} userId={user.id} onOpen={openCourse} />
          {courses.length > 3 && (
            <button
              type="button"
              data-testid="library-all-courses-open"
              className="mx-library-next mx-type-control"
              onClick={() => setScreen('courses')}
            >
              Все практикумы <ArrowRight size={16} />
            </button>
          )}
        </section>
        {LIBRARY_PROGRAMS_ENABLED && (
          <LibraryV2ProgramLanding onOpen={() => setScreen('programs')} />
        )}
        {articlesLoading && (
          <section
            className="mx-library-topic"
            data-testid="library-articles-loading"
            aria-busy="true"
            aria-label="Статьи загружаются"
          >
            <div className="mx-library-articles-skeleton">
              {[0, 1, 2].map(index => (
                <span key={index} className="mx-hj-skeleton mx-hj-skeleton--text" />
              ))}
            </div>
          </section>
        )}
        {articlesError && !articlesLoading && (
          <section
            className="mx-library-topic mx-library-articles-error"
            data-testid="library-articles-error"
            role="alert"
          >
            <p className="mx-type-body text-muted">Не удалось загрузить. Проверь интернет</p>
            <button
              type="button"
              className="mx-library-action mx-type-control"
              data-testid="library-articles-retry"
              onClick={() => setArticlesRetry(count => count + 1)}
            >
              Повторить
            </button>
          </section>
        )}
        {!articlesLoading &&
          !articlesError &&
          sections.map(section => (
            <section
              key={section.topic}
              className="mx-library-topic"
              data-testid="library-topic"
              aria-label={section.topic}
            >
              <h2 className="mx-library-caps">{section.topic}</h2>
              <div className="mx-library-tiles">
                {section.articles.map(item => (
                  <button
                    type="button"
                    className="mx-library-tile"
                    key={item.id}
                    data-testid="library-article-tile"
                    data-article-id={item.id}
                    onClick={event => openArticle(item, event)}
                  >
                    <span className="mx-library-art-slot" aria-hidden="true">
                      <img src={section.image} alt="" />
                    </span>
                    <strong className="mx-type-card">{item.title}</strong>
                    <span className="mx-type-body text-muted mx-library-excerpt">
                      {item.excerpt}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        {!articlesLoading && !articlesError && sections.length === 0 && (
          <p className="mx-type-body text-muted">Статей пока нет.</p>
        )}
      </div>
      {reader}
      {screen === 'journal' && (
        <DailyJournalFlow
          userId={user.id}
          reflectionPrompt={article.question}
          onClose={() => setScreen('reader')}
        />
      )}
      {sheet && (
        <ArticleSheet
          article={sheet}
          onClose={closeSheet}
          onRead={() => {
            readerScroll.current = 0
            setArticle(sheet)
            setSheet(null)
            setScreen('reader')
          }}
        />
      )}
    </>
  )
}
