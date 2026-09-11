import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Menu, Search, Sparkles } from 'lucide-react'
import SemanticGlyph from '../SemanticGlyph'
import './LibraryProgramsExperiment.css'

const PROGRAMS = [
  ['Границы без лишнего напряжения', 'journal'],
  ['Неделя внимательного решения', 'purpose'],
]

const ARTICLES = [
  {
    id: 'one-step',
    eyebrow: 'Фокус',
    title: 'Как начать с одного шага',
    duration: '6 минут',
    kind: 'focus',
    intro: 'Иногда задача становится легче, когда ей возвращают небольшой, понятный масштаб.',
    blocks: [
      [
        'Сначала — наблюдение',
        'Отметь, что именно сейчас требует внимания. Не нужно сразу объяснять это или искать идеальное решение. Достаточно назвать один участок ситуации.',
      ],
      [
        'Потом — граница',
        'Раздели то, что зависит от тебя сегодня, и то, что пока остаётся внешним условием. Это помогает не тратить силы на весь контекст сразу.',
      ],
      [
        'Небольшой шаг',
        'Выбери действие, которое занимает до десяти минут. После него можно снова оценить ситуацию, не обещая себе весь результат заранее.',
      ],
    ],
  },
  {
    id: 'inner-support',
    eyebrow: 'Поддержка',
    title: 'Как говорить с собой бережнее',
    duration: '8 минут',
    kind: 'purpose',
    intro: 'Внутренний тон влияет не только на настроение, но и на точность решений.',
    blocks: [
      [
        'Заметь формулировку',
        'Поймай фразу, которая звучит слишком широко: «я всегда», «у меня не получится», «надо было раньше». Переведи её в наблюдаемый факт.',
      ],
      [
        'Добавь контекст',
        'Спроси себя, какие обстоятельства были рядом. Контекст не отменяет ответственности, но делает описание ситуации честнее и полезнее.',
      ],
      [
        'Оставь рабочие слова',
        'Выбери формулировку, с которой можно сделать следующий шаг: «сейчас я знаю…», «мне нужно уточнить…», «сегодня я попробую…».',
      ],
    ],
  },
  {
    id: 'evening-pause',
    eyebrow: 'Рефлексия',
    title: 'Спокойно завершить день',
    duration: '5 минут',
    kind: 'journal',
    intro:
      'Короткая пауза вечером помогает отделить незавершённое от того, что уже можно отпустить.',
    blocks: [
      [
        'Собери факты',
        'Запиши два события дня без оценки. Это могут быть разговор, задача, решение или момент, который заметил только ты.',
      ],
      [
        'Назови остаток',
        'Что осталось в мыслях? Одно предложение достаточно. Не обязательно доводить его до вывода прямо сейчас.',
      ],
      [
        'Закрой день',
        'Выбери простой знак завершения: убрать одну вещь, записать первый шаг на завтра или просто поставить точку в заметке.',
      ],
    ],
  },
]

const params = () => new URLSearchParams(window.location.search)

function SafeArea() {
  return (
    <div className="mx-library-programs__safe" aria-hidden="true">
      <span>MENTALIX</span>
      <Menu size={17} />
    </div>
  )
}

function TopBar({ onSearch }) {
  return (
    <header className="mx-library-programs__topbar">
      <h2>библиотека.</h2>
      <button type="button" aria-label="Открыть поиск" onClick={onSearch}>
        <Search size={19} />
      </button>
    </header>
  )
}

function ProgramGlyph() {
  return (
    <span className="mx-library-programs__program-glyph">
      <SemanticGlyph kind="focus" animated={false} />
    </span>
  )
}

function FeaturedProgram({ onOpen }) {
  return (
    <button
      type="button"
      className="mx-library-programs__featured"
      onClick={() => onOpen('Самодисциплина')}
    >
      <div className="mx-library-programs__featured-art" aria-hidden="true">
        <ProgramGlyph />
      </div>
      <div className="mx-library-programs__featured-copy">
        <div>
          <strong>Самодисциплина</strong>
          <p>Выстроить устойчивый ритм без давления на себя.</p>
        </div>
        <span className="mx-library-programs__featured-arrow" aria-label="Открыть программу">
          <ArrowRight size={18} />
        </span>
      </div>
    </button>
  )
}

function ProgramRail({ onOpen }) {
  return (
    <div className="mx-library-programs__program-rail" aria-label="Другие программы">
      {PROGRAMS.map(([title, kind]) => (
        <button
          type="button"
          key={title}
          onClick={() => onOpen(title)}
          className="mx-library-programs__small-program"
        >
          <span className="mx-library-programs__small-art" aria-hidden="true">
            <SemanticGlyph kind={kind} animated={false} />
          </span>
          <strong>{title}</strong>
        </button>
      ))}
    </div>
  )
}

function ArticleRail({ empty, onRead, readIds }) {
  if (empty)
    return (
      <div className="mx-library-programs__empty">
        <strong>Статьи появятся здесь</strong>
        <span>Материалы уже в работе.</span>
      </div>
    )
  return (
    <div className="mx-library-programs__article-rail" aria-label="Статьи">
      {ARTICLES.map(article => (
        <button
          type="button"
          key={article.id}
          className="mx-library-programs__article"
          onClick={() => onRead(article.id)}
        >
          <span className="mx-library-programs__article-art" aria-hidden="true">
            <SemanticGlyph kind={article.kind} animated={false} />
          </span>
          <strong>{article.title}</strong>
          <small>
            {article.duration} · {readIds.has(article.id) ? 'Прочитано' : 'Не прочитано'}
          </small>
        </button>
      ))}
    </div>
  )
}

function BottomNav() {
  return (
    <nav className="mx-library-programs__bottom" aria-label="Основная навигация">
      <span>Сегодня</span>
      <span>Шаги</span>
      <span>Диалог</span>
      <span aria-current="page">Библиотека</span>
      <span>Прогресс</span>
    </nav>
  )
}

function Landing({ onOpenDetail, onRead, readIds }) {
  return (
    <div className="mx-library-programs__landing">
      <TopBar onSearch={() => {}} />
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <h3>Программы</h3>
        </div>
        <FeaturedProgram onOpen={onOpenDetail} />
        <ProgramRail onOpen={onOpenDetail} />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <div>
            <h3>Статьи</h3>
            <span className="mx-library-programs__counter">
              {readIds.size} из {ARTICLES.length}
            </span>
          </div>
          <BookOpen size={18} aria-hidden="true" />
        </div>
        <ArticleRail empty={false} readIds={readIds} onRead={onRead} />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <h3>Направленные записи</h3>
        </div>
        <button type="button" className="mx-library-programs__journal-row">
          <span>
            <Sparkles size={18} />
            <strong>Разобраться в решении</strong>
            <small>4 вопроса</small>
          </span>
          <ArrowRight size={17} />
        </button>
      </section>
    </div>
  )
}

function Detail({ title, onBack }) {
  return (
    <div className="mx-library-programs__detail">
      <button
        type="button"
        className="mx-library-programs__back"
        onClick={onBack}
        aria-label="Назад"
      >
        <ArrowLeft size={19} />
      </button>
      <div className="mx-library-programs__detail-art" aria-hidden="true">
        <ProgramGlyph />
      </div>
      <h2>{title}</h2>
      <p className="mx-library-programs__detail-status">Скоро</p>
    </div>
  )
}

function ArticleReader({ articleId, onBack, onChangeArticle }) {
  const startIndex = Math.max(
    0,
    ARTICLES.findIndex(article => article.id === articleId)
  )
  const [index, setIndex] = useState(startIndex)
  const railRef = useRef(null)
  const scrollTo = next => {
    const safeIndex = Math.max(0, Math.min(ARTICLES.length - 1, next))
    setIndex(safeIndex)
    onChangeArticle(ARTICLES[safeIndex].id)
    railRef.current?.children[safeIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }
  useEffect(() => {
    railRef.current?.children[startIndex]?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }, [startIndex])
  return (
    <div className="mx-library-programs__reader">
      <header className="mx-library-programs__reader-head">
        <button
          type="button"
          className="mx-library-programs__back"
          onClick={onBack}
          aria-label="Назад"
        >
          <ArrowLeft size={19} />
        </button>
        <span>
          {index + 1} / {ARTICLES.length}
        </span>
        <div className="mx-library-programs__reader-actions">
          <button
            type="button"
            aria-label="Предыдущая статья"
            disabled={index === 0}
            onClick={() => scrollTo(index - 1)}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            aria-label="Следующая статья"
            disabled={index === ARTICLES.length - 1}
            onClick={() => scrollTo(index + 1)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </header>
      <div
        className="mx-library-programs__reader-rail"
        ref={railRef}
        onScroll={event => {
          const next = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)
          if (next !== index && ARTICLES[next]) {
            setIndex(next)
            onChangeArticle(ARTICLES[next].id)
          }
        }}
      >
        {ARTICLES.map(article => (
          <article className="mx-library-programs__reader-slide" key={article.id}>
            <div className="mx-library-programs__reader-art" aria-hidden="true">
              <SemanticGlyph kind={article.kind} animated={false} />
            </div>
            <span className="mx-library-programs__eyebrow">{article.eyebrow}</span>
            <h1>{article.title}</h1>
            <small>{article.duration}</small>
            <p>{article.intro}</p>
            {article.blocks.map(([heading, text]) => (
              <section key={heading}>
                <h2>{heading}</h2>
                <p>{text}</p>
              </section>
            ))}
            <p className="mx-library-programs__reader-close">
              Остановись на одном наблюдении и реши, нужен ли следующий шаг сегодня.
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

export default function LibraryProgramsExperiment() {
  const review = params().get('review') === '1'
  const initialScreen = params().get('screen') || 'landing'
  const [screen, setScreen] = useState(initialScreen)
  const [readIds, setReadIds] = useState(
    new Set(params().get('article') ? [params().get('article')] : [])
  )
  const [articleId, setArticleId] = useState(params().get('article') || ARTICLES[0].id)
  const requestedTitle = params().get('program')
  const detailTitle = PROGRAMS.some(([title]) => title === requestedTitle)
    ? requestedTitle
    : 'Самодисциплина'
  const setReviewScreen = (next, value) => {
    setScreen(next)
    const query = new URLSearchParams({ ui_lab: 'library-programs', review: '1' })
    if (next === 'detail') {
      query.set('screen', 'detail')
      query.set('program', value)
    }
    if (next === 'article') {
      query.set('screen', 'article')
      query.set('article', value)
    }
    window.history.replaceState(null, '', `?${query}`)
  }
  const openArticle = id => {
    setReadIds(current => new Set(current).add(id))
    setArticleId(id)
    setReviewScreen('article', id)
  }
  const product =
    screen === 'detail' ? (
      <Detail title={detailTitle} onBack={() => setReviewScreen('landing')} />
    ) : screen === 'article' ? (
      <ArticleReader
        articleId={articleId}
        onBack={() => setReviewScreen('landing')}
        onChangeArticle={id => {
          setArticleId(id)
          setReadIds(current => new Set(current).add(id))
          const query = new URLSearchParams({
            ui_lab: 'library-programs',
            review: '1',
            screen: 'article',
            article: id,
          })
          window.history.replaceState(null, '', `?${query}`)
        }}
      />
    ) : (
      <Landing
        readIds={readIds}
        onRead={openArticle}
        onOpenDetail={title => setReviewScreen('detail', title)}
      />
    )
  return (
    <section
      className={`mx-library-programs${review ? ' mx-library-programs--review' : ''}`}
      aria-labelledby="library-programs-title"
    >
      {!review && (
        <div className="mx-library-programs__intro">
          <span className="mx-library-programs__eyebrow">
            MXL-LIBRARY-PROGRAMS-UI-LAB-001 · Preview-only
          </span>
          <h2 id="library-programs-title">Библиотека: программы</h2>
          <p>
            Канонический mobile-концепт: сначала понятная ценность, затем спокойное действие. Оплата
            и сохранение состояния не подключены.
          </p>
        </div>
      )}
      <div className="mx-library-programs__device">
        {review ? null : <SafeArea />}
        <div className="mx-library-programs__scroll">{product}</div>
        <BottomNav />
      </div>
    </section>
  )
}
