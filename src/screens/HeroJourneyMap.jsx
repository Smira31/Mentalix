import { useState, useMemo, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import { Check, ChevronRight, Lock } from 'lucide-react'

import Screen from '../components/Screen'
import { HERO_COURSE, courseContent } from '../data/courses'
import JournalTextarea from '../components/JournalTextarea'
import SemanticGlyph from '../components/SemanticGlyph'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import { isPreviewDemoMode } from '../lib/demoMode'
import {
  useHeroJourneyProgress,
  isStepAvailable,
  isStepCompleted,
  readHeroDraft,
  clearHeroDraft,
} from '../lib/heroJourneyProgress'
import { heroDraftKey } from '../lib/heroJourneyState'
import { writeLocal } from '../lib/store'
import './HeroJourneyMap.css'

const CourseContext = createContext(null)
const useCourse = () => useContext(CourseContext)

const DEMO = isPreviewDemoMode()

/* Размеры картинок шага: enter 1.6:1, done 1.3:1 (совпадает с aspect-ratio в CSS). */
const STEP_IMAGE_DIMENSIONS = {
  enter: { width: 1200, height: 750 },
  done: { width: 1170, height: 900 },
}

/* Положение кадра по умолчанию: чуть выше середины — низ кадров намеренно пустой. */
const DEFAULT_HERO_FOCUS = '50% 40%'

/* Доля высоты героя, на которую текст заходит на картинку (image.overlap).
   Глава I — 0.08, глава III — 0.22, у остальных шагов — это значение. */
const DEFAULT_IMAGE_OVERLAP = 0.12

/*
 * Иллюстрация шага — одна геометрия на входе и на завершении.
 * Картинка идёт от верха экрана на всю ширину, края растворяются маской,
 * под статус-баром и кнопками Telegram лежит скрим (см. .mx-hj-hero в CSS).
 * Перекрытие под заголовок даёт отрицательный нижний margin самого героя.
 */
function HeroImage({
  src,
  size,
  focus,
  compact,
  overlap = DEFAULT_IMAGE_OVERLAP,
  onError,
  /* Гибкая высота (вход в шаг): картинка сама занимает свободное место колонки. */
  flexible = false,
}) {
  return (
    <div
      className={`mx-hj-hero${compact ? ' mx-hj-hero--compact' : ''}${
        flexible ? ' mx-hj-hero--flex' : ''
      }`}
      style={{ '--mx-hj-hero-overlap': overlap }}
    >
      <div className="mx-hj-hero__frame">
        <img
          src={src}
          alt=""
          width={size.width}
          height={size.height}
          decoding="async"
          style={{ objectPosition: focus || DEFAULT_HERO_FOCUS }}
          onError={onError}
        />
      </div>
      <span className="mx-hj-hero__scrim" aria-hidden="true" />
    </div>
  )
}

/* Предзагрузка картинок следующего шага: открытие шага без мигания. */
function usePreloadStepImages(trial) {
  const enterImage = trial?.image?.enter
  const doneImage = trial?.image?.done

  useEffect(() => {
    for (const src of [enterImage, doneImage]) {
      if (!src) continue
      const image = new Image()
      image.decoding = 'async'
      image.src = src
    }
  }, [enterImage, doneImage])
}

/* ── утилиты потока ── */

function screenSequence() {
  return ['step-intro', 'write', 'action', 'complete']
}

function nextView(currentView, trial) {
  const seq = screenSequence(trial)
  const idx = seq.indexOf(currentView)
  return seq[idx + 1] || 'map'
}

/* заголовок в стиле приложения: строчные + точка (если нет знака в конце) */
function appHeading(text) {
  const t = String(text).toLowerCase()
  return /[.?!:]$/.test(t) ? t : t + '.'
}

/* экраны шага с шапкой (без intro/complete) — для счётчика */
function headerScreens(trial) {
  return screenSequence(trial).filter(v => v !== 'step-intro' && v !== 'complete')
}

/* ── оболочка экрана ── */

function Shell({
  children,
  footer,
  bodyClassName = '',
  screenBodyClassName = '',
  fit = false,
  topFlush = false,
  testId,
}) {
  return (
    <Screen
      showHeader={false}
      telegramChrome
      scroll={!fit}
      footer={footer}
      className={`mx-hero-journey${topFlush ? ' mx-hero-journey--top' : ''}`}
      bodyClassName={`${fit ? 'mx-hj-fit' : ''} ${screenBodyClassName}`.trim()}
    >
      <div
        data-testid={testId}
        className={`flex flex-col ${fit ? 'flex-1 min-h-0' : ''} ${bodyClassName}`}
      >
        {children}
      </div>
    </Screen>
  )
}

/* ── A. Карта курса ── */

function StepDot({ status, number }) {
  return (
    <span className={`mx-hj-dot mx-hj-dot--${status}`} aria-hidden="true">
      {status === 'completed' ? (
        <Check size={16} strokeWidth={3} />
      ) : status === 'locked' ? (
        <span className="mx-hj-dot__num">{number}</span>
      ) : (
        <span className="mx-hj-dot__num">{number}</span>
      )}
    </span>
  )
}

function ChapterSection({ chapter, progress, onOpenStep, currentStepId }) {
  const { trialsForChapter, previousTrial } = useCourse()
  const trials = trialsForChapter(chapter)
  const completedCount = trials.filter(t => isStepCompleted(t.id, progress)).length
  const anyStarted = completedCount > 0
  const hasCurrentStep = Boolean(currentStepId) && trials.some(t => t.id === currentStepId)

  const [expanded, setExpanded] = useState(anyStarted || hasCurrentStep)

  return (
    <section className="mx-hj-chapter">
      <div className="mx-hj-chapter__head" onClick={() => setExpanded(v => !v)}>
        <div className="mx-hj-chapter__title-block">
          <span className="mx-hj-chapter__roman">Глава {chapter.roman}</span>
          <span className="mx-hj-chapter__name">{chapter.title}</span>
          <span className="mx-hj-chapter__subtitle">{chapter.subtitle}</span>
        </div>
        <span className="mx-hj-chapter__count">
          {completedCount} из {trials.length}
        </span>
      </div>

      {expanded && (
        <div className="mx-hj-chapter__path">
          {trials.map((trial, i) => {
            const completed = isStepCompleted(trial.id, progress)
            const prevTrial = previousTrial(trial.id)
            const available = isStepAvailable(trial.number, prevTrial?.id, progress, DEMO)
            const status = completed ? 'completed' : available ? 'current' : 'locked'

            return (
              <button
                key={trial.id}
                data-testid={`hero-step-${trial.id}`}
                data-state={completed ? 'done' : available ? 'open' : 'locked'}
                type="button"
                disabled={status === 'locked'}
                onClick={() => onOpenStep(trial.id)}
                className="mx-hj-step-row"
              >
                <div className="mx-hj-step-row__left">
                  {i > 0 && <span className="mx-hj-step-row__line" />}
                  <StepDot status={status} number={trial.number} />
                </div>
                <div className="mx-hj-step-row__info">
                  <span className="mx-hj-step-row__name">{trial.title}</span>
                  <span className="mx-hj-step-row__sub">{trial.subtitle}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!expanded && (
        <button type="button" onClick={() => setExpanded(true)} className="mx-hj-chapter__expand">
          {trials.length} шага
        </button>
      )}
    </section>
  )
}

/* Финал «Возвращение»: закрыт, пока не пройден последний шаг; потом открывается как шаг. */
function FinaleCard({ progress, onOpenStep }) {
  const { steps, finale } = useCourse()
  const lastStep = steps[steps.length - 1]
  const completed = isStepCompleted(finale.id, progress)
  const available = isStepAvailable(finale.number, lastStep?.id, progress, DEMO)
  const state = completed ? 'done' : available ? 'open' : 'locked'

  return (
    <button
      type="button"
      data-testid={`hero-step-${finale.id}`}
      data-state={state}
      disabled={state === 'locked'}
      onClick={() => onOpenStep(finale.id)}
      className={`mx-hj-finale-card mx-hj-finale-card--${state}`}
    >
      {state === 'done' ? (
        <Check size={20} strokeWidth={3} className="mx-hj-finale-card__icon" />
      ) : state === 'open' ? (
        <ChevronRight size={20} className="mx-hj-finale-card__icon" />
      ) : (
        <Lock size={20} className="mx-hj-finale-card__icon" />
      )}
      <span className="mx-hj-finale-card__title">{finale.title}</span>
      <span className="mx-hj-finale-card__hint">
        {state === 'locked' ? finale.lockedHint : finale.subtitle}
      </span>
    </button>
  )
}

function CourseMap({ progress, onOpenStep, onOpenAbout }) {
  const {
    steps: HERO_JOURNEY_TRIALS,
    chapters: HERO_JOURNEY_CHAPTERS,
    course: HERO_JOURNEY_COURSE,
    prologue,
    finale: HERO_JOURNEY_FINALE,
  } = useCourse()
  const completedTotal = HERO_JOURNEY_TRIALS.filter(t => isStepCompleted(t.id, progress)).length

  const nextTrial = useMemo(() => {
    return HERO_JOURNEY_TRIALS.find(t => !isStepCompleted(t.id, progress))
  }, [progress, HERO_JOURNEY_TRIALS])

  usePreloadStepImages(nextTrial)

  if (HERO_JOURNEY_TRIALS.length === 0)
    return (
      <Shell testId="hero-journey-map">
        <div className="mx-hj-map__head">
          <h1 className="mx-hj-map__title">{appHeading(HERO_JOURNEY_COURSE.title)}</h1>
          <p className="mx-hj-map__desc">{HERO_JOURNEY_COURSE.description}</p>
        </div>
        <p className="mx-hj-empty-course" data-testid="hero-empty-course">
          Курс готовится. Скоро здесь появятся шаги.
        </p>
      </Shell>
    )

  return (
    <Shell testId="hero-journey-map">
      <div className="mx-hj-map__head">
        <span className="mx-hj-eyebrow">
          Курс · {HERO_JOURNEY_TRIALS.length} шагов · {HERO_JOURNEY_CHAPTERS.length} главы
        </span>
        <h1 className="mx-hj-map__title">{appHeading(HERO_JOURNEY_COURSE.title)}</h1>
        <p className="mx-hj-map__desc">{HERO_JOURNEY_COURSE.description}</p>
      </div>

      {prologue && (
        <button
          type="button"
          data-testid="hero-about-open"
          onClick={onOpenAbout}
          className="mx-hj-about-link"
        >
          <span className="mx-hj-about-link__text">
            <span className="mx-hj-about-link__title">{prologue.menuLabel}</span>
            <span className="mx-hj-about-link__sub">{prologue.title}</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      )}

      <div className="mx-hj-map__progress">
        <span className="mx-hj-map__progress-text">
          Пройдено {completedTotal} из {HERO_JOURNEY_TRIALS.length}
        </span>
        <div className="mx-hj-map__segments">
          {HERO_JOURNEY_TRIALS.map(t => (
            <span
              key={t.id}
              className={`mx-hj-segment ${isStepCompleted(t.id, progress) ? 'is-done' : ''}`}
            />
          ))}
        </div>
      </div>

      {nextTrial && (
        <button
          type="button"
          data-testid="hero-continue"
          onClick={() => onOpenStep(nextTrial.id)}
          className="mx-hj-next-card"
        >
          <span className="mx-hj-next-card__label">Следующий шаг · {nextTrial.number}</span>
          <span className="mx-hj-next-card__title">{appHeading(nextTrial.title)}</span>
          <span className="mx-hj-next-card__sub">{nextTrial.subtitle}</span>
          <span className="cta-pill mx-hj-next-card__cta">
            Продолжить <ChevronRight size={16} />
          </span>
        </button>
      )}

      <div className="mx-hj-chapters">
        {HERO_JOURNEY_CHAPTERS.map(chapter => (
          <ChapterSection
            key={chapter.key}
            chapter={chapter}
            progress={progress}
            onOpenStep={onOpenStep}
            currentStepId={nextTrial?.id}
          />
        ))}
      </div>

      {HERO_JOURNEY_FINALE && <FinaleCard progress={progress} onOpenStep={onOpenStep} />}
    </Shell>
  )
}

/* ── Пролог «О курсе» ── */

function AboutScreen({ prologue, onBackToMap }) {
  return (
    /* Колонка без скролла: кнопка «К шагам» прижата к низу (см. __bottom в CSS). */
    <Shell fit bodyClassName="mx-hj-about" screenBodyClassName="mx-hj-about-body">
      <span className="mx-hj-eyebrow">{prologue.eyebrow}</span>
      <h1 className="mx-hj-about__title">{appHeading(prologue.title)}</h1>
      {prologue.paragraphs.map((para, i) => (
        <p key={i} className="mx-hj-about__text">
          {para}
        </p>
      ))}

      <div className="mx-hj-step-intro__bottom">
        <button
          type="button"
          data-testid="hero-about-steps"
          onClick={onBackToMap}
          className="cta-pill mx-hj-step-intro__cta"
        >
          К шагам
        </button>
      </div>
    </Shell>
  )
}

/* ── B. Вход в шаг ── */

function StepIntro({ trial, onStart }) {
  const { chapterForTrial, finale, total: HERO_JOURNEY_TOTAL_STEPS } = useCourse()
  const isFinale = finale?.id === trial.id
  const chapter = isFinale ? null : chapterForTrial(trial.id)
  const enterImage = trial.image?.enter
  const [imageFailed, setImageFailed] = useState(false)
  const showEnterImage = Boolean(enterImage) && !imageFailed

  return (
    /* Колонка на всю доступную высоту без скролла. Сверху — картинка, которая
       сама забирает место, оставшееся после текста и кнопки (flex + min/max);
       текст слегка перехлёстывает затемнённый нижний край; кнопка
       прижата к низу (см. .mx-hj-hero--flex и __bottom в CSS). */
    <Shell
      fit
      topFlush={showEnterImage}
      bodyClassName="mx-hj-step-intro"
      screenBodyClassName="mx-hj-intro-body"
    >
      {showEnterImage ? (
        <HeroImage
          flexible
          src={enterImage}
          size={STEP_IMAGE_DIMENSIONS.enter}
          focus={trial.image?.focus}
          compact={trial.image?.compact}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="mx-hj-step-intro__image">
          <div className="mx-hj-step-intro__glyph">
            <SemanticGlyph kind="pathfinder" animated={false} />
          </div>
          <span className="mx-hj-step-intro__image-caption">шаг {trial.number}</span>
        </div>
      )}

      <div className="mx-hj-step-intro__text">
        <div className="mx-hj-step-intro__label">
          {isFinale
            ? `Финал · ${trial.title}`
            : `Глава ${chapter.roman} · ${chapter.title} · Шаг ${trial.number} из ${HERO_JOURNEY_TOTAL_STEPS}`}
        </div>
        <h2 className="mx-hj-step-intro__title">{appHeading(trial.title)}</h2>
        <p className="mx-hj-step-intro__subtitle">{trial.subtitle}</p>
        {trial.intro.split('\n\n').map((para, i) => (
          <p key={i} className="mx-hj-step-intro__desc">{para}</p>
        ))}
      </div>

      <div className="mx-hj-step-intro__bottom">
        <button
          type="button"
          data-testid="hero-step-start"
          onClick={onStart}
          className="cta-pill mx-hj-step-intro__cta"
        >
          Начать шаг
        </button>
      </div>
    </Shell>
  )
}

/* ── общая шапка для C–F ── */

/* подписи действий экранов шага для метки в шапке */
const HEADER_VIEW_LABELS = {
  write: 'Запиши',
  action: 'Одно действие',
}

function StepHeader({ trial, view }) {
  const screens = headerScreens(trial)
  const idx = screens.indexOf(view)
  /* На экранах записи/действия пейджер — текст «1 / 2», на остальных — точки */
  const isWriteFlow = view === 'write' || view === 'action'
  const writeStep = view === 'write' ? 1 : 2

  return (
    <div className="mx-hj-step-header">
      <div className="mx-hj-step-header__row">
        <span className="mx-hj-step-header__label">
          <span className="mx-hj-step-header__name">{trial.title}</span>
          <span className="mx-hj-step-header__mode">
            {' · '}
            {HEADER_VIEW_LABELS[view]}
          </span>
        </span>
        {isWriteFlow ? (
          <span className="mx-hj-step-header__label mx-hj-step-header__pager">{writeStep} / 2</span>
        ) : (
          <span className="mx-hj-step-header__dots" aria-hidden="true">
            {screens.map((v, i) => (
              <span key={v} className={`mx-hj-step-header__dot ${i === idx ? 'is-active' : ''}`} />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── E/F. Запиши / Одно действие ── */

function WriteScreen({
  label,
  prompt,
  hint,
  placeholder,
  value,
  onChange,
  onSubmit,
  onClose,
  trial,
  view,
}) {
  const hasText = Boolean(value.trim())

  /* Одна круглая кнопка справа внизу (RoundSubmitButton): пока поле пустое —
     крестик «×», нажатие закрывает экран (пустое поле — без подтверждения, как
     у крестика в журнале и чек-ине); после первого символа — шеврон «›»,
     нажатие идёт дальше. */
  const handleSubmit = useCallback(() => {
    if (hasText) {
      platform.haptic('light')
      onSubmit()
      return
    }
    onClose(false)
  }, [hasText, onSubmit, onClose])

  return (
    /* Колонка без скролла: поле занимает свободную высоту, кнопка (floating
       toolbar JournalTextarea) прижата к низу и не скрывается за краем. */
    <Shell fit bodyClassName="mx-hj-write-col">
      <StepHeader trial={trial} view={view} />

      <div className="mx-hj-write">
        <h2 className="mx-hj-write__prompt">{prompt}</h2>
        {hint && <p className="mx-hj-write__hint">{hint}</p>}
      </div>

      <JournalTextarea
        testId={`hero-${view}-input`}
        submitTestId={`hero-${view}-next`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        ariaLabel={label}
        floatingToolbar
        formatting={false}
        hideAddAction
        guidedFlow
        onSubmit={handleSubmit}
        submitDisabled={false}
        submitIcon={hasText ? 'chevron' : 'x'}
        submitLabel={hasText ? 'Дальше' : 'Закрыть'}
        className="mt-[28px] flex-1 mx-hj-write-input"
        editorClassName="mx-hj-write-editor"
      />
    </Shell>
  )
}

/* ── G. Шаг пройден ── */

function StepComplete({ trial, progress, onBackToMap }) {
  const {
    chapterForTrial,
    trialsForChapter,
    chapters: HERO_JOURNEY_CHAPTERS,
    finale,
  } = useCourse()
  /* У финала нет главы: на его экране «Путь пройден» карточки главы нет. */
  const chapter = finale?.id === trial.id ? null : chapterForTrial(trial.id)
  const chapterTrials = trialsForChapter(chapter)
  const completedInChapter = chapterTrials.filter(t => isStepCompleted(t.id, progress))
  const chapterDone = completedInChapter.length === chapterTrials.length
  const nextChapter = chapter
    ? HERO_JOURNEY_CHAPTERS.find(
        ch => ch.roman === String.fromCharCode(chapter.roman.charCodeAt(0) + 1)
      )
    : null

  const reflection = progress.reflections[trial.id] || ''
  const doneImage = trial.image?.done
  const [imageFailed, setImageFailed] = useState(false)
  const showDoneImage = Boolean(doneImage) && !imageFailed

  return (
    /* Колонка на всю высоту без скролла, как у вступления: картинка сама
       забирает свободную высоту (110–300 px), текст идёт сразу под ней,
       кнопка «Продолжить» прижата к низу. */
    <Shell
      fit
      topFlush={showDoneImage}
      bodyClassName="mx-hj-step-complete"
      screenBodyClassName="mx-hj-complete-body"
    >
      {showDoneImage ? (
        <HeroImage
          flexible
          src={doneImage}
          size={STEP_IMAGE_DIMENSIONS.done}
          focus={trial.image?.focus}
          compact={trial.image?.compact}
          overlap={trial.image?.overlap}
          onError={() => setImageFailed(true)}
        />
      ) : null}

      <div className="mx-hj-complete">
        {!showDoneImage && (
          <div className="mx-hj-complete__circle">
            <Check size={40} strokeWidth={3} />
          </div>
        )}
        <h2 className="mx-hj-complete__title">{appHeading(trial.doneTitle || 'Шаг пройден')}</h2>
        <p className="mx-hj-complete__phrase">
          {trial.doneSummary || 'Ты сделал ещё один шаг по пути.'}
        </p>
        {trial.doneTeaser && (
          <p className="mx-hj-complete__teaser">{trial.doneTeaser}</p>
        )}

        {chapter && (
          <div className="mx-hj-complete__chapter-card">
            <div className="mx-hj-complete__chapter-segs">
              {chapterTrials.map(t => (
                <span
                  key={t.id}
                  className={`mx-hj-segment ${isStepCompleted(t.id, progress) ? 'is-done' : ''}`}
                />
              ))}
            </div>
            {chapterDone ? (
              <p className="mx-hj-complete__chapter-done">
                Глава {chapter.roman} · {chapter.title} пройдена
              </p>
            ) : (
              <p className="mx-hj-complete__chapter-progress">
                Глава {chapter.roman} · {completedInChapter.length} из {chapterTrials.length}
              </p>
            )}
            {chapterDone && nextChapter && (
              <p className="mx-hj-complete__next-chapter">
                Открыта глава {nextChapter.roman} · {nextChapter.title}
              </p>
            )}
            {chapterDone && !nextChapter && finale && (
              <p className="mx-hj-complete__next-chapter">Открыт финал · {finale.title}</p>
            )}
          </div>
        )}

        {reflection && (
          <button type="button" className="mx-hj-complete__diary-link" onClick={onBackToMap}>
            Твоя запись в дневнике
          </button>
        )}
      </div>

      <div className="mx-hj-step-intro__bottom mx-hj-complete__bottom">
        <button
          type="button"
          data-testid="hero-complete-map"
          onClick={onBackToMap}
          className="cta-pill mx-hj-step-intro__cta"
        >
          Продолжить <ChevronRight size={16} />
        </button>
      </div>
    </Shell>
  )
}

/* ── главный компонент ── */

export default function HeroJourneyMap({ course = HERO_COURSE, ...props }) {
  return (
    <CourseContext.Provider value={courseContent(course)}>
      <CourseFlow {...props} course={course} />
    </CourseContext.Provider>
  )
}

function CourseFlow({ onBack, user, course }) {
  const { findTrial, previousTrial, prologue } = useCourse()
  const { progress, completeStep } = useHeroJourneyProgress(user.id, course.id)
  const [view, setView] = useState('map')
  const [activeStepId, setActiveStepId] = useState(null)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [markedSigns, setMarkedSigns] = useState([])
  const [reflection, setReflection] = useState('')
  const [action, setAction] = useState('')
  const pendingDraft = useRef(null)
  const draftTimer = useRef(null)

  const flushDraft = useCallback(() => {
    clearTimeout(draftTimer.current)
    const draft = pendingDraft.current
    if (draft) writeLocal(draft.key, JSON.stringify(draft.value))
  }, [])

  useEffect(() => {
    const saveOnHide = () => {
      if (document.hidden) flushDraft()
    }
    window.addEventListener('pagehide', flushDraft)
    document.addEventListener('visibilitychange', saveOnHide)
    return () => {
      flushDraft()
      window.removeEventListener('pagehide', flushDraft)
      document.removeEventListener('visibilitychange', saveOnHide)
    }
  }, [flushDraft])

  function changeDraft(field, value) {
    if (!activeStepId) return
    const key = heroDraftKey(user.id, activeStepId, course.id)
    pendingDraft.current = {
      key,
      value: { reflection, action, [field]: value },
    }
    if (field === 'reflection') setReflection(value)
    else setAction(value)
    clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(flushDraft, 300)
  }

  const trial = useMemo(
    () => (activeStepId ? findTrial(activeStepId) : null),
    [activeStepId, findTrial]
  )

  useBackButton(() => {
    handleBack()
  })

  function handleBack() {
    if (view === 'map') {
      onBack()
      return
    }
    if (view === 'about') {
      setView('map')
      return
    }
    flushDraft()
    const seq = screenSequence(trial)
    setView(seq[seq.indexOf(view) - 1] || 'map')
  }

  function openStep(stepId) {
    const selected = findTrial(stepId)
    if (!selected) return
    if (
      !isStepCompleted(stepId, progress) &&
      !isStepAvailable(selected.number, previousTrial(stepId)?.id, progress, DEMO)
    )
      return
    flushDraft()
    pendingDraft.current = null
    const draft = readHeroDraft(heroDraftKey(user.id, stepId, course.id))
    platform.haptic('light')
    setActiveStepId(stepId)
    setMarkedSigns(progress.signs[stepId] || [])
    setReflection(draft?.reflection ?? progress.reflections[stepId] ?? '')
    setAction(draft?.action ?? progress.actions[stepId] ?? '')
    setView('step-intro')
  }

  function startStep() {
    platform.haptic('light')
    if (!trial) return
    setView(nextView('step-intro', trial))
  }

  /* Крестик на «Запиши»/«Одно действие» — как в чек-ине: с несохранённым
     текстом сначала просит подтверждение, иначе закрывает шаг сразу.
     Черновик остаётся на устройстве (как в журнале). */
  function requestClose(hasText) {
    if (hasText) {
      setCloseConfirmOpen(true)
      return
    }
    closeStep()
  }

  function closeStep() {
    platform.haptic('light')
    flushDraft()
    pendingDraft.current = null
    setCloseConfirmOpen(false)
    setView('map')
  }

  /* Диалог подтверждения — та же копия и логика, что у экрана записи чек-ина
     («Закрыть запись?»): «Продолжить» остаётся, «Закрыть» выходит к карте. */
  const closeConfirmDialog = closeConfirmOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-close-dialog-title"
      aria-describedby="hero-close-dialog-description"
      className="fixed inset-0 z-[90] flex items-end bg-black/70 p-5 sm:items-center"
      data-testid="hero-close-confirm"
    >
      <div className="w-full max-w-md mx-auto rounded-[28px] bg-emerald p-6 shadow-xl animate-fade-in">
        <h2 id="hero-close-dialog-title" className="font-display text-[22px] text-cream">
          Закрыть запись?
        </h2>
        <p
          id="hero-close-dialog-description"
          className="mt-3 text-[14px] leading-relaxed text-muted"
        >
          Есть несохранённая запись. Черновик останется только на этом устройстве и не будет выдан
          за сохранённую запись.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            autoFocus
            data-testid="hero-close-stay"
            onClick={() => setCloseConfirmOpen(false)}
            className="min-h-12 rounded-full bg-cream px-4 text-[14px] font-semibold text-emerald-deep"
          >
            Продолжить
          </button>
          <button
            type="button"
            data-testid="hero-close-exit"
            onClick={closeStep}
            className="min-h-12 rounded-full border border-cream/15 px-4 text-[14px] font-semibold text-cream"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  ) : null

  function submitWrite() {
    if (!trial) return
    setView(nextView('write', trial))
  }

  function submitAction() {
    if (!trial) return
    completeStep(trial.id, {
      signs: markedSigns,
      reflection: reflection.trim(),
      action: action.trim(),
    })
    clearTimeout(draftTimer.current)
    pendingDraft.current = null
    clearHeroDraft(heroDraftKey(user.id, trial.id, course.id))
    platform.haptic('success')
    setView('complete')
  }

  if (view === 'about' && prologue) {
    return <AboutScreen prologue={prologue} onBackToMap={() => setView('map')} />
  }

  if (view === 'map' || !trial) {
    return (
      <CourseMap
        progress={progress}
        onOpenStep={openStep}
        onOpenAbout={() => setView('about')}
        onBack={onBack}
      />
    )
  }

  if (view === 'step-intro') {
    return <StepIntro trial={trial} onBack={handleBack} onStart={startStep} />
  }

  if (view === 'write') {
    return (
      <>
        <WriteScreen
          label="ЗАПИШИ"
          prompt={trial.writePrompt}
          hint={trial.writeHint || 'Не оценивай — просто назови, как есть.'}
          placeholder="Начни писать…"
          value={reflection}
          onChange={value => changeDraft('reflection', value)}
          onSubmit={submitWrite}
          onClose={requestClose}
          trial={trial}
          view="write"
        />
        {closeConfirmDialog}
      </>
    )
  }

  if (view === 'action') {
    return (
      <>
        <WriteScreen
          label="ОДНО ДЕЙСТВИЕ"
          prompt={trial.actionPrompt}
          hint={trial.actionHint || 'Напиши, какое. Оно сохранится вместе с ответом в дневнике.'}
          placeholder={trial.actionPlaceholder || 'Моё действие…'}
          value={action}
          onChange={value => changeDraft('action', value)}
          onSubmit={submitAction}
          onClose={requestClose}
          trial={trial}
          view="action"
        />
        {closeConfirmDialog}
      </>
    )
  }

  if (view === 'complete') {
    return (
      <StepComplete
        trial={trial}
        progress={progress}
        onBackToMap={() => setView('map')}
        onBack={handleBack}
      />
    )
  }

  return (
    <CourseMap
      progress={progress}
      onOpenStep={openStep}
      onOpenAbout={() => setView('about')}
      onBack={onBack}
    />
  )
}
