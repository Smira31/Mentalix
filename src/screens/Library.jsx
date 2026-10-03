import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { articleSections, nextArticle } from '../lib/libraryArticles'
import { redirectRemovedLibraryAddress } from '../lib/libraryNavigation'
import { useTabReset } from '../lib/tabRefresh'
import { previewHeroJourneyAction } from '../lib/heroJourneyDemo'
import { platform } from '../platform'
import './Library.css'
import './LibraryStoic.css'

const sections = articleSections()

export default function Library({ user, onInputModeChange }) {
  const [screen, setScreen] = useState(() => (previewHeroJourneyAction() ? 'hero-journey' : 'home'))
  const [sheet, setSheet] = useState(null)
  const [article, setArticle] = useState(null)
  const [program, setProgram] = useState('Самодисциплина')
  const [course, setCourse] = useState(HERO_COURSE)
  const [courseOrigin, setCourseOrigin] = useState('home')
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
        next={nextArticle(article, sections)}
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
          setArticle(nextArticle(article, sections))
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
        className="mx-library-catalog mx-library-stoic w-full max-w-md"
        data-testid="library-home"
        inert={focused ? '' : undefined}
        aria-hidden={focused ? true : undefined}
      >
        <header className="mx-library-catalog__header">
          <h1 className="font-display mx-type-page text-cream">библиотека.</h1>
        </header>
        <section className="mx-library-topic" aria-labelledby="library-courses-title">
          <h2 id="library-courses-title" className="mx-library-caps">
            КУРСЫ
          </h2>
          <CourseCards courses={courses.slice(0, 3)} userId={user.id} onOpen={openCourse} />
          {courses.length > 3 && (
            <button
              type="button"
              data-testid="library-all-courses-open"
              className="mx-library-next mx-type-control"
              onClick={() => setScreen('courses')}
            >
              Все курсы →
            </button>
          )}
        </section>
        {LIBRARY_PROGRAMS_ENABLED && (
          <LibraryV2ProgramLanding onOpen={() => setScreen('programs')} />
        )}
        {sections.map(section => (
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
                  <span className="mx-type-body text-muted mx-library-excerpt">{item.excerpt}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
        {sections.length === 0 && <p className="mx-type-body text-muted">Статей пока нет.</p>}
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
