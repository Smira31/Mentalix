import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Menu, Search, Sparkles } from 'lucide-react'
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
    intro: 'Когда задача разрастается в голове, первый шаг часто теряется среди всех следующих.',
    situation:
      'Ты открываешь список дел и уже устаёшь от того, сколько всего нужно удержать в уме.',
    thought:
      'Маленький шаг — это не компромисс с целью. Это способ вернуть ей форму, с которой можно работать.',
    example:
      'Вместо «разобраться с проектом» можно открыть один документ и выписать три вопроса, на которые нужен ответ сегодня.',
    blocks: [
      [
        'Назови участок',
        'Отметь, что именно сейчас требует внимания. Не объясняй всю ситуацию — назови один участок, на который можно посмотреть прямо сегодня.',
      ],
      [
        'Отдели своё',
        'Раздели то, что зависит от тебя сегодня, и то, что пока остаётся внешним условием. Так контекст перестаёт давить целиком.',
      ],
      [
        'Оставь продолжение',
        'Выбери действие до десяти минут. После него можно снова оценить ситуацию, не обещая себе весь результат заранее.',
      ],
    ],
    tryToday: 'Запиши один следующий шаг и поставь ему таймер на десять минут.',
    quote: 'Ясность иногда начинается не с ответа, а с честно выбранного масштаба.',
    closing: 'Начни не со всей дороги — с места, где ты уже стоишь.',
  },
  {
    id: 'inner-support',
    eyebrow: 'Поддержка',
    title: 'Как говорить с собой бережнее',
    duration: '8 минут',
    kind: 'purpose',
    intro: 'Жёсткость редко помогает стать лучше. Чаще она просто отнимает силы.',
    situation:
      'После ошибки ты прокручиваешь разговор и замечаешь, что внутренний голос звучит громче самой ситуации.',
    thought:
      'Бережность не отменяет ответственность. Она помогает не тратить силы на самонаказание.',
    example:
      'Фразу «я всё испортил» можно заменить на «в разговоре я пропустил важный вопрос; завтра я его задам».',
    blocks: [
      [
        'Заметь формулировку',
        'Поймай слова «я всегда», «у меня не получится», «надо было раньше». Переведи их в наблюдаемый факт без приговора.',
      ],
      [
        'Добавь контекст',
        'Спроси, какие обстоятельства были рядом. Контекст не отменяет ответственности, но делает описание ситуации честнее.',
      ],
      [
        'Оставь рабочие слова',
        'Выбери формулировку, с которой можно сделать следующий шаг: «сейчас я знаю…», «мне нужно уточнить…».',
      ],
    ],
    tryToday: 'Поймай одну жёсткую фразу и перепиши её как факт, который можно проверить.',
    quote: 'Поддержать себя — не значит закрыть глаза. Это значит смотреть без лишнего шума.',
    closing: 'Тон, которым ты к себе обращаешься, тоже часть пути.',
  },
  {
    id: 'evening-pause',
    eyebrow: 'Рефлексия',
    title: 'Спокойно завершить день',
    duration: '5 минут',
    kind: 'journal',
    intro:
      'Вечерняя пауза не обязана подводить идеальный итог. Ей достаточно вернуть дню его очертания.',
    situation:
      'День закончился, но отдельные разговоры и незавершённые дела продолжают звучать фоном.',
    thought:
      'Завершение — это не оценка дня. Это маленькая граница между тем, что уже произошло, и тем, что можно оставить на завтра.',
    example:
      'Можно записать: «Сегодня я отложил звонок. Завтра первым делом уточню время». Этого достаточно, чтобы не носить всё в голове.',
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
        'Поставь точку',
        'Выбери простой знак завершения: убрать одну вещь, записать первый шаг на завтра или закрыть заметку.',
      ],
    ],
    tryToday: 'Запиши два факта дня и один первый шаг на завтра — без разбора и самооценки.',
    quote: 'Иногда день заканчивается не решением, а аккуратно поставленной точкой.',
    closing: 'Оставь завтрашнему себе не груз, а одну ясную нитку.',
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
        <strong>Самодисциплина</strong>
        <p>Выстроить устойчивый ритм и доводить важное до конца без давления на себя.</p>
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

function ArticleRail({ onRead, readIds }) {
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
          <h3>Статьи</h3>
          <BookOpen size={18} aria-hidden="true" />
        </div>
        <ArticleRail readIds={readIds} onRead={onRead} />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <h3>Практики для размышления</h3>
        </div>
        <button type="button" className="mx-library-programs__journal-row">
          <span>
            <Sparkles size={18} />
            <strong>Прояснить выбор</strong>
            <small>4 вопроса, чтобы принять решение</small>
          </span>
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

function ReaderSlide({ article, index, read, onFinish, scrollTop, onScroll }) {
  const handleScroll = event => {
    const element = event.currentTarget
    onScroll(index, element.scrollTop)
    if (!read && element.scrollTop + element.clientHeight >= element.scrollHeight - 24)
      onFinish(article.id)
  }
  return (
    <article
      className="mx-library-programs__reader-slide"
      onScroll={handleScroll}
      data-article-id={article.id}
    >
      <div className="mx-library-programs__reader-art" aria-hidden="true">
        <SemanticGlyph kind={article.kind} animated={false} />
      </div>
      <span className="mx-library-programs__eyebrow">{article.eyebrow}</span>
      <h1>{article.title}</h1>
      <small>{article.duration}</small>
      <p className="mx-library-programs__reader-situation">{article.situation}</p>
      <p className="mx-library-programs__reader-lead">{article.intro}</p>
      <h2>Одна мысль</h2>
      <p>{article.thought}</p>
      <blockquote>{article.quote}</blockquote>
      <h2>Из жизни</h2>
      <p>{article.example}</p>
      {article.blocks.map(([heading, text]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <p>{text}</p>
        </section>
      ))}
      <section className="mx-library-programs__reader-try">
        <span className="mx-library-programs__eyebrow">Попробуй сегодня</span>
        <p>{article.tryToday}</p>
      </section>
      <p className="mx-library-programs__reader-close">{article.closing}</p>
      {read && <p className="mx-library-programs__reader-read">Прочитано</p>}
      <div
        className="mx-library-programs__reader-next"
        aria-label={index < ARTICLES.length - 1 ? 'Следующая статья' : 'Вернуться к статьям'}
      >
        <span>{index < ARTICLES.length - 1 ? 'Следующая статья →' : 'Вернуться к статьям'}</span>
        <strong>{index < ARTICLES.length - 1 ? ARTICLES[index + 1].title : 'Все статьи'}</strong>
      </div>
      <span
        className="mx-library-programs__reader-restored"
        data-restored-scroll={scrollTop}
        aria-hidden="true"
      />
    </article>
  )
}

function ArticleReader({ articleId, onBack, onChangeArticle, readIds, onFinish }) {
  const startIndex = Math.max(
    0,
    ARTICLES.findIndex(article => article.id === articleId)
  )
  const [index, setIndex] = useState(startIndex)
  const railRef = useRef(null)
  const slideRefs = useRef([])
  const scrollPositions = useRef({})
  const activeArticle = ARTICLES[index]
  const scrollTo = (next, behavior = 'smooth') => {
    const safeIndex = Math.max(0, Math.min(ARTICLES.length - 1, next))
    setIndex(safeIndex)
    onChangeArticle(ARTICLES[safeIndex].id)
    railRef.current?.children[safeIndex]?.scrollIntoView({
      behavior,
      block: 'nearest',
      inline: 'start',
    })
  }
  useEffect(() => {
    const slide = slideRefs.current[startIndex]
    slide?.scrollTo({
      top: scrollPositions.current[ARTICLES[startIndex].id] || 0,
      behavior: 'auto',
    })
    railRef.current?.children[startIndex]?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }, [startIndex])
  useEffect(() => {
    const slide = slideRefs.current[index]
    slide?.scrollTo({ top: scrollPositions.current[activeArticle.id] || 0, behavior: 'auto' })
  }, [index, activeArticle.id])
  return (
    <div className="mx-library-programs__reader">
      <header className="mx-library-programs__reader-head">
        <button type="button" className="mx-library-programs__reader-back" onClick={onBack}>
          ← Библиотека
        </button>
        <span>
          {index + 1} из {ARTICLES.length}
        </span>
        <span
          className="mx-library-programs__reader-progress"
          style={{ '--reader-progress': `${readIds.has(activeArticle.id) ? 100 : 0}%` }}
        />
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
        {ARTICLES.map((article, articleIndex) => (
          <div
            className="mx-library-programs__reader-page"
            key={article.id}
            ref={element => {
              slideRefs.current[articleIndex] = element
            }}
          >
            <ReaderSlide
              article={article}
              index={articleIndex}
              read={readIds.has(article.id)}
              onFinish={onFinish}
              scrollTop={scrollPositions.current[article.id] || 0}
              onScroll={(slideIndex, top) => {
                scrollPositions.current[ARTICLES[slideIndex].id] = top
              }}
            />
          </div>
        ))}
      </div>
      <div className="mx-library-programs__reader-swipe" aria-hidden="true">
        Свайп в сторону, чтобы открыть следующую статью
      </div>
      <button
        type="button"
        className="mx-library-programs__reader-hidden-next"
        onClick={() => scrollTo(index + 1)}
        disabled={index === ARTICLES.length - 1}
      >
        Следующая статья
      </button>
    </div>
  )
}

export default function LibraryProgramsExperiment() {
  const query = params()
  const review = query.get('review') === '1'
  const initialScreen = query.get('screen') || 'landing'
  const [screen, setScreen] = useState(initialScreen)
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(window.sessionStorage.getItem('mentalix-library-read') || '[]'))
    } catch {
      return new Set()
    }
  })
  const [articleId, setArticleId] = useState(query.get('article') || ARTICLES[0].id)
  const requestedTitle = query.get('program')
  const detailTitle = [...PROGRAMS.map(([title]) => title), 'Самодисциплина'].includes(
    requestedTitle
  )
    ? requestedTitle
    : 'Самодисциплина'
  useEffect(() => {
    window.sessionStorage.setItem('mentalix-library-read', JSON.stringify([...readIds]))
  }, [readIds])
  const setReviewScreen = (next, value) => {
    setScreen(next)
    const nextQuery = new URLSearchParams({ ui_lab: 'library-programs', review: '1' })
    if (next === 'detail') {
      nextQuery.set('screen', 'detail')
      nextQuery.set('program', value)
    }
    if (next === 'article') {
      nextQuery.set('screen', 'article')
      nextQuery.set('article', value)
    }
    window.history.replaceState(null, '', `?${nextQuery}`)
  }
  const openArticle = id => {
    setArticleId(id)
    setReviewScreen('article', id)
  }
  const finishArticle = id =>
    setReadIds(current => (current.has(id) ? current : new Set(current).add(id)))
  const product =
    screen === 'detail' ? (
      <Detail title={detailTitle} onBack={() => setReviewScreen('landing')} />
    ) : screen === 'article' ? (
      <ArticleReader
        articleId={articleId}
        onBack={() => setReviewScreen('landing')}
        readIds={readIds}
        onFinish={finishArticle}
        onChangeArticle={id => {
          setArticleId(id)
          const nextQuery = new URLSearchParams({
            ui_lab: 'library-programs',
            review: '1',
            screen: 'article',
            article: id,
          })
          window.history.replaceState(null, '', `?${nextQuery}`)
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
        {screen !== 'article' && <BottomNav />}
      </div>
    </section>
  )
}

export { ARTICLES }
