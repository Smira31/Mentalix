import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import SemanticGlyph from '../SemanticGlyph'
import { useBackButton } from '../../platform/telegram.hooks'
import './LibraryProgramsExperiment.css'

const PROGRAMS = [
  ['Границы без лишнего напряжения', 'journal'],
  ['Неделя внимательного решения', 'purpose'],
  ['Неделя внутреннего порядка', 'focus'],
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

const STORAGE_KEY = 'mentalix-library-guided-entry-v1'
const TEMPLATE_ID = 'clarify-choice'
const SWIPE_HINT_STORAGE_KEY = 'mentalix-library-reader-swipe-hint-v1'
const JOURNAL_STEPS = [
  'Что именно вы сейчас пытаетесь решить?',
  'Какие факты вы знаете точно?',
  'Что для вас важнее всего в этом выборе?',
  'Какой небольшой следующий шаг можно сделать сейчас?',
]

const emptyAnswers = () => JOURNAL_STEPS.map(() => '')

function readSavedEntry() {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (!raw || !Array.isArray(raw.answers) || raw.answers.length !== JOURNAL_STEPS.length)
      return null
    return {
      answers: JOURNAL_STEPS.map((_, index) =>
        typeof raw.answers[index] === 'string' ? raw.answers[index] : ''
      ),
      step: Math.max(0, Math.min(JOURNAL_STEPS.length - 1, Number(raw.step) || 0)),
      status: raw.status === 'completed' ? 'completed' : 'draft',
    }
  } catch {
    return null
  }
}

function saveEntry(answers, step, status = 'draft') {
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ answers: [...answers], step, status, updatedAt: new Date().toISOString() })
  )
}

function params() {
  return new URLSearchParams(window.location.search)
}

function urlFor(screen, values = {}) {
  const next = new URLSearchParams({ ui_lab: 'library-programs', review: '1' })
  if (screen !== 'landing') next.set('screen', screen)
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') next.set(key, String(value))
  })
  return `?${next}`
}

function SafeArea() {
  return (
    <div className="mx-library-programs__safe" aria-hidden="true">
      <span>MENTALIX</span>
      <span />
    </div>
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

function Landing({ onOpenDetail, onRead, onOpenJournals, readIds }) {
  return (
    <div className="mx-library-programs__landing">
      <header className="mx-library-programs__topbar">
        <h2>библиотека.</h2>
      </header>
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
        </div>
        <ArticleRail readIds={readIds} onRead={onRead} />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <h3>Направленные записи</h3>
        </div>
        <button
          type="button"
          className="mx-library-programs__guided-entry"
          onClick={onOpenJournals}
        >
          <span className="mx-library-programs__guided-entry-art" aria-hidden="true">
            <SemanticGlyph kind="journal" animated={false} />
          </span>
          <span className="mx-library-programs__guided-entry-copy">
            <strong>Направленные записи</strong>
            <small>
              Короткие письменные практики, которые помогают прояснить мысли и сохранить важное
            </small>
          </span>
          <span className="mx-library-programs__guided-entry-arrow" aria-hidden="true">
            →
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

function ArticleReader({ articleId, onBack, onChangeArticle, readIds, onFinish }) {
  const startIndex = Math.max(
    0,
    ARTICLES.findIndex(article => article.id === articleId)
  )
  const [index, setIndex] = useState(startIndex)
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    try {
      return window.sessionStorage.getItem(SWIPE_HINT_STORAGE_KEY) !== 'seen'
    } catch {
      return true
    }
  })
  const railRef = useRef(null)
  const scrollPositions = useRef({})
  const gestureStart = useRef(null)
  const activeArticle = ARTICLES[index]
  const scrollTo = (next, behavior = 'smooth') =>
    railRef.current?.children[Math.max(0, Math.min(ARTICLES.length - 1, next))]?.scrollIntoView({
      behavior,
      block: 'nearest',
      inline: 'start',
    })
  useEffect(() => {
    if (!showSwipeHint) return undefined
    const timer = window.setTimeout(() => setShowSwipeHint(false), 2600)
    return () => window.clearTimeout(timer)
  }, [showSwipeHint])
  function dismissSwipeHint() {
    setShowSwipeHint(false)
    try {
      window.sessionStorage.setItem(SWIPE_HINT_STORAGE_KEY, 'seen')
    } catch {
      // Preview-only hint remains best-effort when storage is unavailable.
    }
  }
  function handleRailPointerDown(event) {
    gestureStart.current = { x: event.clientX, y: event.clientY }
  }
  function handleRailPointerUp(event) {
    const start = gestureStart.current
    gestureStart.current = null
    if (!start) return
    if (Math.abs(event.clientX - start.x) > 32 || Math.abs(event.clientY - start.y) > 32)
      dismissSwipeHint()
  }
  return (
    <div className="mx-library-programs__reader">
      <header className="mx-library-programs__reader-header">
        <button type="button" onClick={onBack} aria-label="← Библиотека">
          ← Библиотека
        </button>
        <span>
          {index + 1} из {ARTICLES.length}
        </span>
        <span
          className="mx-library-programs__reader-progress"
          style={{ '--reader-progress': `${((index + 1) / ARTICLES.length) * 100}%` }}
        />
      </header>
      <div
        className="mx-library-programs__reader-rail"
        ref={railRef}
        onPointerDown={handleRailPointerDown}
        onPointerUp={handleRailPointerUp}
        onScroll={event => {
          const rail = event.currentTarget
          const next = Math.round(rail.scrollLeft / rail.clientWidth)
          const distance = Math.abs(rail.scrollLeft - index * rail.clientWidth)
          if (distance < rail.clientWidth * 0.28) return
          if (next !== index && ARTICLES[next]) {
            dismissSwipeHint()
            setIndex(next)
            onChangeArticle(ARTICLES[next].id)
          }
        }}
      >
        {ARTICLES.map((article, articleIndex) => (
          <div className="mx-library-programs__reader-page" key={article.id}>
            <article
              className="mx-library-programs__reader-slide"
              onScroll={event => {
                const element = event.currentTarget
                scrollPositions.current[article.id] = element.scrollTop
                if (
                  !readIds.has(article.id) &&
                  element.scrollTop + element.clientHeight >= element.scrollHeight - 24
                )
                  onFinish(article.id)
              }}
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
              {readIds.has(article.id) && (
                <p className="mx-library-programs__reader-read">Прочитано</p>
              )}
              <button
                type="button"
                className="mx-library-programs__reader-next"
                onClick={() => (index < ARTICLES.length - 1 ? scrollTo(index + 1) : onBack)}
              >
                <span>
                  {index < ARTICLES.length - 1 ? 'Следующая статья →' : 'Вернуться к статьям'}
                </span>
                <strong>
                  {index < ARTICLES.length - 1 ? ARTICLES[index + 1].title : 'Все статьи'}
                </strong>
              </button>
            </article>
          </div>
        ))}
      </div>
      {showSwipeHint && (
        <div className="mx-library-programs__reader-hint" role="status">
          Смахните влево, чтобы открыть следующую статью
        </div>
      )}
    </div>
  )
}

function GuidedCatalog({ saved, onBack, onOpenTemplate }) {
  const status =
    saved?.status === 'completed'
      ? 'Завершено'
      : saved
        ? `Продолжить · ${Math.min(4, saved.step + 1)} из 4`
        : 'Начать'
  return (
    <div className="mx-library-programs__guided-catalog">
      <button
        type="button"
        className="mx-library-programs__back"
        onClick={onBack}
        aria-label="Вернуться в библиотеку"
      >
        <ArrowLeft size={19} /> <span>Библиотека</span>
      </button>
      <span className="mx-library-programs__eyebrow">Коллекция</span>
      <h1>Направленные записи</h1>
      <p className="mx-library-programs__guided-intro">
        Короткие вопросы, чтобы остановиться, увидеть главное и сохранить следующий шаг.
      </p>
      <button
        type="button"
        className="mx-library-programs__guided-template"
        onClick={onOpenTemplate}
      >
        <span className="mx-library-programs__guided-template-art" aria-hidden="true">
          <SemanticGlyph kind="journal" animated={false} />
        </span>
        <span>
          <strong>Прояснить выбор</strong>
          <small>4 вопроса, чтобы принять решение</small>
          <small>5–7 минут · {status}</small>
        </span>
      </button>
    </div>
  )
}

function FlowHeader({ onBack, step, label }) {
  return (
    <header className="mx-library-programs__flow-header">
      <button type="button" onClick={onBack} aria-label="Назад">
        <ArrowLeft size={19} />
      </button>
      <span>{label}</span>
      <strong>{step}</strong>
    </header>
  )
}

function GuidedJournal({
  saved,
  stage,
  stepIndex,
  answers,
  onBack,
  onStart,
  onChange,
  onContinue,
  onReview,
  onSave,
  onReturn,
}) {
  if (stage === 'intro')
    return (
      <div className="mx-library-programs__guided-flow mx-library-programs__guided-intro-screen">
        <FlowHeader onBack={onBack} step="" label="Направленные записи" />
        <div className="mx-library-programs__guided-flow-center">
          <span className="mx-library-programs__guided-flow-art" aria-hidden="true">
            <SemanticGlyph kind="journal" animated={false} />
          </span>
          <span className="mx-library-programs__eyebrow">Прояснить выбор</span>
          <h1>Разложите ситуацию по частям и увидьте следующий шаг</h1>
          <p>4 вопроса · 5–7 минут</p>
          <button type="button" className="mx-library-programs__primary" onClick={onStart}>
            Начать
          </button>
        </div>
      </div>
    )
  if (stage === 'review')
    return (
      <div className="mx-library-programs__guided-flow mx-library-programs__guided-review">
        <FlowHeader onBack={onBack} step="Проверка" label="Прояснить выбор" />
        <span className="mx-library-programs__eyebrow">Ваши ответы</span>
        <h1>Остановитесь на том, что стало яснее</h1>
        <div className="mx-library-programs__answer-list">
          {JOURNAL_STEPS.map((question, index) => (
            <section key={question}>
              <small>{index + 1} из 4</small>
              <h2>{question}</h2>
              <p>{answers[index]}</p>
            </section>
          ))}
        </div>
        <button type="button" className="mx-library-programs__primary" onClick={onSave}>
          Сохранить запись
        </button>
      </div>
    )
  return (
    <div className="mx-library-programs__guided-flow mx-library-programs__guided-writing">
      <FlowHeader onBack={onBack} step={`${stepIndex + 1} из 4`} label="Прояснить выбор" />
      <span className="mx-library-programs__eyebrow">Вопрос {stepIndex + 1}</span>
      <h1>{JOURNAL_STEPS[stepIndex]}</h1>
      <p className="mx-library-programs__guided-hint">
        Ответьте так, как получается сейчас. Правильной формулировки не нужно.
      </p>
      <textarea
        autoFocus
        value={answers[stepIndex]}
        onChange={event => onChange(event.target.value)}
        placeholder="Начните писать…"
        aria-label={JOURNAL_STEPS[stepIndex]}
      />
      <div className="mx-library-programs__guided-actions">
        <button type="button" className="mx-library-programs__secondary" onClick={onBack}>
          Назад
        </button>
        <button
          type="button"
          className="mx-library-programs__primary"
          disabled={!answers[stepIndex].trim()}
          onClick={stepIndex === 3 ? onReview : onContinue}
        >
          {stepIndex === 3 ? 'Проверить ответы' : 'Продолжить'}
        </button>
      </div>
    </div>
  )
}

function Completion({ onReturn }) {
  return (
    <div className="mx-library-programs__guided-flow mx-library-programs__guided-completion">
      <span className="mx-library-programs__guided-completion-mark" aria-hidden="true">
        ✓
      </span>
      <span className="mx-library-programs__eyebrow">Прояснить выбор</span>
      <h1>Запись сохранена</h1>
      <p>Ответы остались в этом preview-сеансе. К ним можно вернуться из каталога.</p>
      <button type="button" className="mx-library-programs__primary" onClick={onReturn}>
        Вернуться в библиотеку
      </button>
    </div>
  )
}

export default function LibraryProgramsExperiment() {
  const query = params()
  const initialScreen = query.get('screen') || 'landing'
  const [screen, setScreen] = useState(initialScreen)
  const [stage, setStage] = useState(query.get('stage') || 'intro')
  const [stepIndex, setStepIndex] = useState(
    Math.max(0, Math.min(3, Number(query.get('step')) || 0))
  )
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(window.sessionStorage.getItem('mentalix-library-read') || '[]'))
    } catch {
      return new Set()
    }
  })
  const [saved, setSaved] = useState(readSavedEntry)
  const [answers, setAnswers] = useState(() => readSavedEntry()?.answers || emptyAnswers())
  const [articleId, setArticleId] = useState(query.get('article') || ARTICLES[0].id)
  const [detailTitle, setDetailTitle] = useState(query.get('program') || 'Самодисциплина')
  const review = query.get('review') === '1'

  useEffect(() => {
    window.sessionStorage.setItem('mentalix-library-read', JSON.stringify([...readIds]))
  }, [readIds])
  useEffect(() => {
    const handlePopState = () => {
      const next = params()
      setScreen(next.get('screen') || 'landing')
      setStage(next.get('stage') || 'intro')
      setStepIndex(Math.max(0, Math.min(3, Number(next.get('step')) || 0)))
      setArticleId(next.get('article') || ARTICLES[0].id)
      setDetailTitle(next.get('program') || 'Самодисциплина')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(nextScreen, values = {}, replace = false) {
    const href = urlFor(nextScreen, values)
    if (replace) window.history.replaceState({ mentalixLibrary: true }, '', href)
    else window.history.pushState({ mentalixLibrary: true }, '', href)
    setScreen(nextScreen)
    if (values.stage) setStage(values.stage)
    if (values.step !== undefined) setStepIndex(Number(values.step))
    if (values.article) setArticleId(values.article)
    if (values.program) setDetailTitle(values.program)
  }
  function back(fallback = 'landing') {
    if (window.history.state?.mentalixLibrary) window.history.back()
    else navigate(fallback, {}, true)
  }
  function openJournal() {
    const next = saved?.status === 'completed' ? 'review' : saved ? 'writing' : 'intro'
    if (next === 'review') navigate('review', { template: TEMPLATE_ID })
    else navigate('journal', { template: TEMPLATE_ID, stage: next, step: saved?.step || 0 })
  }
  function updateAnswer(value) {
    const next = [...answers]
    next[stepIndex] = value
    setAnswers(next)
    saveEntry(next, stepIndex)
    setSaved({ answers: next, step: stepIndex, status: 'draft' })
  }
  function startJournal() {
    const firstIncomplete = answers.findIndex(answer => !answer.trim())
    const nextStep = firstIncomplete === -1 ? 3 : firstIncomplete
    setStepIndex(nextStep)
    navigate('journal', { template: TEMPLATE_ID, stage: 'writing', step: nextStep })
  }
  function continueJournal() {
    const nextStep = Math.min(3, stepIndex + 1)
    saveEntry(answers, nextStep)
    setSaved({ answers, step: nextStep, status: 'draft' })
    setStepIndex(nextStep)
    navigate('journal', { template: TEMPLATE_ID, stage: 'writing', step: nextStep })
  }
  function reviewJournal() {
    saveEntry(answers, 3)
    setSaved({ answers, step: 3, status: 'draft' })
    navigate('review', { template: TEMPLATE_ID })
  }
  function saveJournal() {
    saveEntry(answers, 3, 'completed')
    setSaved({ answers, step: 3, status: 'completed' })
    navigate('completion', { template: TEMPLATE_ID })
  }
  function returnToLibrary() {
    navigate('landing', {}, true)
  }
  function finishArticle(id) {
    setReadIds(current => (current.has(id) ? current : new Set(current).add(id)))
  }

  const telegramAvailable = Boolean(
    typeof window !== 'undefined' && window.Telegram?.WebApp?.initData
  )
  const nestedScreen = screen !== 'landing'
  useBackButton(() => back(), telegramAvailable && nestedScreen)

  let product
  if (screen === 'detail') product = <Detail title={detailTitle} onBack={() => back()} />
  else if (screen === 'article')
    product = (
      <ArticleReader
        articleId={articleId}
        onBack={() => back()}
        readIds={readIds}
        onFinish={finishArticle}
        onChangeArticle={id => {
          setArticleId(id)
          navigate('article', { article: id }, true)
        }}
      />
    )
  else if (screen === 'catalog')
    product = (
      <GuidedCatalog
        saved={saved}
        onBack={() => navigate('landing', {}, true)}
        onOpenTemplate={openJournal}
      />
    )
  else if (screen === 'journal')
    product = (
      <GuidedJournal
        saved={saved}
        stage={stage}
        stepIndex={stepIndex}
        answers={answers}
        onBack={() =>
          stage === 'writing'
            ? stepIndex > 0
              ? navigate(
                  'journal',
                  { template: TEMPLATE_ID, stage: 'writing', step: stepIndex - 1 },
                  true
                )
              : navigate('catalog', {}, true)
            : back('catalog')
        }
        onStart={startJournal}
        onChange={updateAnswer}
        onContinue={continueJournal}
        onReview={reviewJournal}
      />
    )
  else if (screen === 'review')
    product = (
      <GuidedJournal
        saved={saved}
        stage="review"
        stepIndex={3}
        answers={answers}
        onBack={() => back('journal')}
        onSave={saveJournal}
      />
    )
  else if (screen === 'completion') product = <Completion onReturn={returnToLibrary} />
  else
    product = (
      <Landing
        readIds={readIds}
        onRead={id => {
          setArticleId(id)
          navigate('article', { article: id })
        }}
        onOpenDetail={title => {
          setDetailTitle(title)
          navigate('detail', { program: title })
        }}
        onOpenJournals={() => navigate('catalog')}
      />
    )

  const hideNav = ['journal', 'review', 'completion'].includes(screen)
  return (
    <section
      className={`mx-library-programs${review ? ' mx-library-programs--review' : ''}${telegramAvailable ? ' mx-library-programs--telegram' : ''}`}
      aria-labelledby="library-programs-title"
    >
      {!review && (
        <div className="mx-library-programs__intro">
          <span className="mx-library-programs__eyebrow">
            MXL-LIBRARY-PROGRAMS-UI-LAB-001 · Preview-only
          </span>
          <h2 id="library-programs-title">Библиотека: программы</h2>
          <p>
            Канонический mobile-концепт. Состояние направленных записей сохраняется только в
            preview-сеансе.
          </p>
        </div>
      )}
      <div className="mx-library-programs__device">
        {review ? null : <SafeArea />}
        <div className="mx-library-programs__scroll">{product}</div>
        {!hideNav && screen !== 'article' && <BottomNav />}
      </div>
    </section>
  )
}

export { ARTICLES }
