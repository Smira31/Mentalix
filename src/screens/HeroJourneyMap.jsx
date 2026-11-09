import { useState, useMemo, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import { Check, ChevronDown, ChevronRight, Lock } from 'lucide-react'

import Screen from '../components/Screen'
import ScreenBack from '../components/ScreenBack'
import { HERO_COURSE, courseContent } from '../data/courses'
import JournalTextarea from '../components/JournalTextarea'
import SemanticGlyph from '../components/SemanticGlyph'
import HeroJourneySheet, { splitSheetThought } from '../components/HeroJourneySheet'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import { useHeroJourneyContent } from '../lib/heroJourneyContent'
import {
  heroChapterLocked,
  heroFinaleLocked,
  heroTrialLocked,
} from '../lib/heroJourneyPayload'
import {
  useHeroJourneyProgress,
  isStepAvailable,
  isStepCompleted,
  readHeroDraft,
  clearHeroDraft,
} from '../lib/heroJourneyProgress'
import { heroDraftKey } from '../lib/heroJourneyState'
import { writeLocal } from '../lib/store'
import HeroJourneyStory from './HeroJourneyStory'
import './HeroJourneyMap.css'

const CourseContext = createContext(null)
const useCourse = () => useContext(CourseContext)

/* Размеры картинок шага: enter 1.6:1, done 1.3:1 (совпадает с aspect-ratio в CSS). */
const STEP_IMAGE_DIMENSIONS = {
  enter: { width: 1200, height: 750 },
  done: { width: 1170, height: 900 },
}

/* Положение кадра по умолчанию: чуть выше середины — низ кадров намеренно пустой. */
const DEFAULT_HERO_FOCUS = '50% 40%'

/* Предзагрузка одной картинки: открытие следующего экрана без мигания. */
function preloadImage(src) {
  if (!src) return
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

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
  /* Кадр передаётся только завершением: вступление остаётся неизменным. */
  frame,
  overlap = DEFAULT_IMAGE_OVERLAP,
  onError,
  /* Гибкая высота (вход в шаг): картинка сама занимает свободное место колонки. */
  flexible = false,
}) {
  return (
    <div
      className={`mx-hj-hero${compact ? ' mx-hj-hero--compact' : ''}${
        flexible ? ' mx-hj-hero--flex' : ''
      }${frame ? ' mx-hj-hero--cropped' : ''}`}
      style={{
        '--mx-hj-hero-overlap': overlap,
        ...(frame && {
          '--mx-hj-frame-ratio': `${frame.width} / ${frame.height}`,
          '--mx-hj-frame-top': `${(-frame.top / frame.width) * 100}%`,
        }),
      }}
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

/*
 * Есть ли у шага свои тексты. В демо-сборке у глав II–IV в бандле только id и
 * номер (закрытая часть курса живёт на сервере и отдаётся по правам), поэтому
 * такой шаг нельзя предлагать как «Следующий шаг»: карточка показала бы
 * «undefined». Шаг остаётся видимым на карте — но как закрытая глава.
 */
function hasStepContent(trial) {
  return Boolean(
    trial && (trial.title || trial.intro || (Array.isArray(trial.pages) && trial.pages.length))
  )
}

/* Подпись главы « · Название» — только когда название есть: у демо-глав оно
   приходит с сервера, и подставлять вместо него слово undefined нельзя. */
function chapterLabel(chapter) {
  return chapter?.title ? `${chapter.roman} · ${chapter.title}` : String(chapter?.roman ?? '')
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
  contentSource,
  contentStatus,
  /* Тот же обработчик, что у системной кнопки Telegram: вне Telegram он
     рисуется видимой круглой «Назад» (ScreenBack), в Telegram — не рисуется. */
  onBack,
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
        data-content-source={contentSource}
        data-content-status={contentStatus}
        className={`flex flex-col ${fit ? 'flex-1 min-h-0' : ''} ${bodyClassName}`}
      >
        {onBack && (
          <div className="mx-hj-back">
            <ScreenBack onBack={onBack} testId="hero-back" registerSystemBack={false} />
          </div>
        )}
        {children}
      </div>
    </Screen>
  )
}

/* ── Загрузка / ошибка контента ── */

/* Спокойный скелет в стиле приложения: пока тексты едут с сервера. */
function ContentSkeleton() {
  return (
    <Shell testId="hero-journey-loading">
      <div className="mx-hj-map__head">
        <span className="mx-hj-skeleton mx-hj-skeleton--eyebrow" />
        <span className="mx-hj-skeleton mx-hj-skeleton--title" />
        <span className="mx-hj-skeleton mx-hj-skeleton--desc" />
      </div>
      <div className="mx-hj-skeleton mx-hj-skeleton--card" />
      <div className="mx-hj-chapters">
        {[0, 1, 2].map(i => (
          <div key={i} className="mx-hj-skeleton mx-hj-skeleton--chapter" />
        ))}
      </div>
    </Shell>
  )
}

/* Ошибка сети: короткий текст и «Повторить», без технических сообщений. */
function ContentFailure({ onRetry, error }) {
  return (
    <div className="mx-hj-content-error" role="alert" data-testid="hero-content-failure">
      <p className="mx-hj-content-error__text">
        {error === 'access'
          ? 'Практикум недоступен для этого аккаунта.'
          : 'Не удалось загрузить. Проверь интернет'}
      </p>
      <button
        type="button"
        data-testid="hero-retry"
        onClick={onRetry}
        className="cta-pill mx-hj-content-error__cta"
      >
        Повторить
      </button>
    </div>
  )
}

function ContentError({ onRetry, error }) {
  return (
    <Shell testId="hero-journey-error" contentStatus={error === 'access' ? 'access' : 'error'}>
      <ContentFailure onRetry={onRetry} error={error} />
    </Shell>
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

function ChapterSection({ chapter, progress, onOpenStep, currentStepId, onOpenSubscription }) {
  const { trialsForChapter, previousTrial, chapters, course } = useCourse()
  const trials = trialsForChapter(chapter)
  const completedCount = trials.filter(t => isStepCompleted(t.id, progress)).length
  const anyStarted = completedCount > 0
  const hasCurrentStep = Boolean(currentStepId) && trials.some(t => t.id === currentStepId)
  const access = course?.access || null

  const [expanded, setExpanded] = useState(anyStarted || hasCurrentStep)
  /* Главы II–IV без Pro закрыты: сервер не отдаёт их тексты (у закрытых шагов
     текстовых полей нет), поэтому карточка главы показывает публичное название,
     помечается Pro и ведёт на существующий экран подписки. Прав решает сервер —
     ни локальное состояние, ни демо-сборка закрытые тексты не открывают. */
  const proLocked = heroChapterLocked(chapter, access)

  if (proLocked) {
    return (
      <section
        className="mx-hj-chapter mx-hj-chapter--locked mx-hj-chapter--pro-locked"
        data-testid={`hero-chapter-locked-${chapter.key}`}
      >
        <button
          type="button"
          className="mx-hj-chapter__head mx-hj-chapter__head--button"
          data-testid={`hero-chapter-pro-${chapter.key}`}
          onClick={() => onOpenSubscription?.()}
        >
          <div className="mx-hj-chapter__title-block mx-protected-text">
            <span className="mx-hj-chapter__roman">Глава {chapter.roman}</span>
            {chapter.title && <span className="mx-hj-chapter__name">{chapter.title}</span>}
            {chapter.subtitle && (
              <span className="mx-hj-chapter__subtitle">{chapter.subtitle}</span>
            )}
          </div>
          <span className="mx-hj-chapter__side">
            <span className="mx-hj-chapter__pro">Pro</span>
            <Lock size={16} className="mx-hj-chapter__lock" aria-hidden="true" />
          </span>
        </button>
        <p className="mx-hj-chapter__note">Доступно по подписке Pro</p>
      </section>
    )
  }

  /* Закрытая глава (ни один шаг не начат и текущего шага в ней нет): серые
     заголовок и римская цифра, справа вместо счётчика — маленький замок;
     у открытой главы — стрелка «›» (раскрытая — «˅»). */
  const locked = !anyStarted && !hasCurrentStep

  return (
    <section className={`mx-hj-chapter${locked ? ' mx-hj-chapter--locked' : ''}`}>
      <div className="mx-hj-chapter__head" onClick={() => setExpanded(v => !v)}>
        <div className="mx-hj-chapter__title-block mx-protected-text">
          <span className="mx-hj-chapter__roman">Глава {chapter.roman}</span>
          <span className="mx-hj-chapter__name">{chapter.title}</span>
          <span className="mx-hj-chapter__subtitle">{chapter.subtitle}</span>
        </div>
        {locked ? (
          <Lock size={16} className="mx-hj-chapter__lock" aria-hidden="true" />
        ) : (
          <>
            <span className="mx-hj-chapter__count">
              {completedCount} из {trials.length}
            </span>
            {expanded ? (
              <ChevronDown size={18} className="mx-hj-chapter__chevron" aria-hidden="true" />
            ) : (
              <ChevronRight size={18} className="mx-hj-chapter__chevron" aria-hidden="true" />
            )}
          </>
        )}
      </div>

      {expanded && (
        <div className="mx-hj-chapter__path">
          {trials.map((trial, i) => {
            const completed = isStepCompleted(trial.id, progress)
            const prevTrial = previousTrial(trial.id)
            const available = isStepAvailable(trial.number, prevTrial?.id, progress)
            /* Закрытый Pro-шаг внутри открытой главы: текстов у него нет, но
               нажатие не молчит — ведёт на экран подписки. */
            const proStepLocked = heroTrialLocked(trial, chapters, access)
            const status = completed ? 'completed' : proStepLocked ? 'locked' : available ? 'current' : 'locked'

            return (
              <button
                key={trial.id}
                data-testid={`hero-step-${trial.id}`}
                data-state={completed ? 'done' : available ? 'open' : 'locked'}
                data-pro-locked={proStepLocked ? 'true' : undefined}
                type="button"
                disabled={status === 'locked' && !proStepLocked}
                onClick={() => (proStepLocked ? onOpenSubscription?.() : onOpenStep(trial.id))}
                className="mx-hj-step-row"
              >
                <div className="mx-hj-step-row__left">
                  {i > 0 && <span className="mx-hj-step-row__line" />}
                  <StepDot status={status} number={trial.number} />
                </div>
                <div className="mx-hj-step-row__info">
                  {/* Название закрытого шага может прийти публичным или не
                      прийти вовсе: вместо «undefined» — номер шага. */}
                  <span className="mx-hj-step-row__name">{trial.title || `Шаг ${trial.number}`}</span>
                  {trial.subtitle && <span className="mx-hj-step-row__sub">{trial.subtitle}</span>}
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
function FinaleCard({ progress, onOpenStep, onOpenSubscription }) {
  const { steps, finale, course } = useCourse()
  const lastStep = steps[steps.length - 1]
  const completed = isStepCompleted(finale.id, progress)
  const available = isStepAvailable(finale.number, lastStep?.id, progress)
  /* Финал идёт после последней главы: без Pro он закрыт так же, как главы
     II–IV, и ведёт на экран подписки. */
  const proLocked = heroFinaleLocked(finale, course?.access || null)
  const state = completed ? 'done' : proLocked ? 'locked' : available ? 'open' : 'locked'

  return (
    <button
      type="button"
      data-testid={`hero-step-${finale.id}`}
      data-state={state}
      data-pro-locked={proLocked ? 'true' : undefined}
      disabled={state === 'locked' && !proLocked}
      onClick={() => (proLocked ? onOpenSubscription?.() : onOpenStep(finale.id))}
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
        {proLocked
          ? 'Доступно по подписке Pro'
          : state === 'locked'
            ? finale.lockedHint
            : finale.subtitle}
      </span>
    </button>
  )
}

function CourseMap({ progress, onOpenStep, onOpenAbout, onOpenSubscription, onBack }) {
  const {
    steps: HERO_JOURNEY_TRIALS,
    chapters: HERO_JOURNEY_CHAPTERS,
    course: HERO_JOURNEY_COURSE,
    prologue,
    finale: HERO_JOURNEY_FINALE,
    contentSource,
    contentStatus,
    retryContent,
  } = useCourse()
  const access = HERO_JOURNEY_COURSE?.access || null
  const completedTotal = HERO_JOURNEY_TRIALS.filter(t => isStepCompleted(t.id, progress)).length

  /* «Следующий шаг» — только открытый шаг с текстами: закрытый Pro-шаг
     предлагать нельзя, у него текстов нет (карточка показала бы «undefined»),
     а пройти его без подписки нельзя. */
  const nextTrial = useMemo(() => {
    return HERO_JOURNEY_TRIALS.find(
      t =>
        !isStepCompleted(t.id, progress) &&
        !heroTrialLocked(t, HERO_JOURNEY_CHAPTERS, access) &&
        hasStepContent(t)
    )
  }, [progress, HERO_JOURNEY_TRIALS, HERO_JOURNEY_CHAPTERS, access])

  usePreloadStepImages(nextTrial)

  if (HERO_JOURNEY_TRIALS.length === 0)
    return (
      <Shell
        testId="hero-journey-map"
        contentSource={contentSource}
        contentStatus={contentStatus}
        onBack={onBack}
      >
        <div className="mx-hj-map__head mx-protected-text">
          <h1 className="mx-hj-map__title">{appHeading(HERO_JOURNEY_COURSE.title)}</h1>
          <p className="mx-hj-map__desc">{HERO_JOURNEY_COURSE.description}</p>
        </div>
        <p className="mx-hj-empty-course" data-testid="hero-empty-course">
          Практикум готовится. Скоро здесь появятся шаги.
        </p>
      </Shell>
    )

  return (
    <Shell
      testId="hero-journey-map"
      contentSource={contentSource}
      contentStatus={contentStatus}
      onBack={onBack}
    >
      {contentStatus === 'error' && <ContentFailure onRetry={retryContent} />}
      <div className="mx-hj-map__head mx-protected-text">
        <span className="mx-hj-eyebrow">
          Практикум · {HERO_JOURNEY_TRIALS.length} шагов · {HERO_JOURNEY_CHAPTERS.length} главы
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
            onOpenSubscription={onOpenSubscription}
            currentStepId={nextTrial?.id}
          />
        ))}
      </div>

      {HERO_JOURNEY_FINALE && (
        <FinaleCard
          progress={progress}
          onOpenStep={onOpenStep}
          onOpenSubscription={onOpenSubscription}
        />
      )}
    </Shell>
  )
}

/* ── Пролог «О практикуме» ── */

function AboutScreen({ prologue, onBackToMap, onBack }) {
  return (
    /* Колонка без скролла: кнопка «К шагам» прижата к низу (см. __bottom в CSS). */
    <Shell
      fit
      bodyClassName="mx-hj-about mx-protected-text"
      screenBodyClassName="mx-hj-about-body"
      onBack={onBack}
    >
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

function StepIntro({ trial, onStart, onBack, storyIndex, onStoryIndexChange }) {
  const { chapterForTrial, finale, steps, total: HERO_JOURNEY_TOTAL_STEPS } = useCourse()
  const isFinale = finale?.id === trial.id
  const chapter = isFinale ? null : chapterForTrial(trial.id)
  const enterImage = trial.image?.enter
  const [imageFailed, setImageFailed] = useState(false)
  const showEnterImage = Boolean(enterImage) && !imageFailed
  /* Листы вводки, как в сторис: необязательное поле шага pages — 3–5 листов
     { label, text }. Без листов вводка показывается как раньше. */
  const pages = Array.isArray(trial.pages) ? trial.pages.filter(page => page?.text) : []

  /* Вступление без листов идёт той же сценой, что листы: тот же разбор текста
     (последний жирный абзац — «мысль») и та же белая круглая кнопка «›» внизу.
     Разметка блока — прежняя: метка главы, заголовок, подзаголовок, абзацы. */
  const intro = splitSheetThought(trial.intro)
  const introScene = (
    <>
      <div className="mx-hj-step-intro__label">
        {isFinale
          ? `Финал · ${trial.title}`
          : `Глава ${chapterLabel(chapter)} · Шаг ${trial.number} из ${HERO_JOURNEY_TOTAL_STEPS}`}
      </div>
      <h2 className="mx-hj-step-intro__title">{appHeading(trial.title)}</h2>
      <p className="mx-hj-step-intro__subtitle">{trial.subtitle}</p>
      {String(intro.body ?? '')
        .split('\n\n')
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="mx-hj-step-intro__desc">
            {para}
          </p>
        ))}
    </>
  )

  /* Подгрузка (из main): завершение текущего шага и вход следующего. */
  useEffect(() => {
    preloadImage(trial.image?.done)
    preloadImage(steps[trial.number]?.image?.enter)
  }, [trial, steps])

  /* Иллюстрация шага: кадр входа или заглушка, когда картинки нет. Одна и та же
     на листе 1 сторис и во вступлении шага без листов. */
  const illustration = showEnterImage ? (
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
  )

  return (
    /* Колонка на всю доступную высоту без скролла. Сверху — картинка, которая
       сама забирает место, оставшееся после текста и кнопки (flex + min/max);
       текст слегка перехлёстывает затемнённый нижний край; кнопка
       прижата к низу (см. .mx-hj-hero--flex и __bottom в CSS). Листы сторис
       живут в той же колонке: общая геометрия картинки сохраняется. */
    <Shell fit bodyClassName="mx-hj-step-intro" screenBodyClassName="mx-hj-intro-body" onBack={onBack}>
      {pages.length > 0 ? (
        <HeroJourneyStory
          pages={pages}
          illustration={illustration}
          onForward={onStart}
          onBack={onBack}
          index={storyIndex}
          onIndexChange={onStoryIndexChange}
        />
      ) : (
        /* Одна сцена шага: тот же кадр, тот же текст с «мыслью» и та же белая
           круглая кнопка «›», что на листах шага 1. */
        <HeroJourneySheet
          illustration={illustration}
          sheetKey={trial.id}
          body={introScene}
          thought={intro.thought}
          action={{ testId: 'hero-step-start', label: 'Начать шаг', onClick: onStart }}
        />
      )}
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
  onBack,
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
    <Shell fit bodyClassName="mx-hj-write-col" onBack={onBack}>
      <StepHeader trial={trial} view={view} />

      <div className="mx-hj-write mx-protected-text">
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
        autoFocus
        autoFocusKey={view}
        onSubmit={handleSubmit}
        submitDisabled={false}
        submitIcon={hasText ? 'chevron' : 'x'}
        submitLabel={hasText ? 'Дальше' : 'Закрыть'}
        className="mt-[var(--mx-space-7)] flex-1 mx-hj-write-input"
        editorClassName="mx-hj-write-editor"
      />
    </Shell>
  )
}

/* ── G. Шаг пройден ── */

function StepComplete({ trial, progress, onBackToMap, onContinue, onBack }) {
  const {
    chapterForTrial,
    trialsForChapter,
    chapters: HERO_JOURNEY_CHAPTERS,
    finale,
    steps,
  } = useCourse()
  /* У финала нет главы: на его экране «Путь пройден» карточки главы нет. */
  const chapter = finale?.id === trial.id ? null : chapterForTrial(trial.id)
  const chapterTrials = trialsForChapter(chapter)
  const completedInChapter = chapterTrials.filter(t => isStepCompleted(t.id, progress))
  const chapterDone = completedInChapter.length === chapterTrials.length
  /* Следующая глава — по позиции в списке, не по римским цифрам («II» ≠ «I»+1). */
  const nextChapter = chapter
    ? HERO_JOURNEY_CHAPTERS[HERO_JOURNEY_CHAPTERS.indexOf(chapter) + 1] || null
    : null

  const reflection = progress.reflections[trial.id] || ''
  const actionAnswer = progress.actions[trial.id] || ''
  const doneImage = trial.image?.done
  const [imageFailed, setImageFailed] = useState(false)
  const showDoneImage = Boolean(doneImage) && !imageFailed

  /* Подгрузка входа следующего шага (из main) */
  useEffect(() => {
    preloadImage(steps[trial.number]?.image?.enter)
  }, [trial, steps])

  return (
    /* Колонка без скролла: кадр done обрезается по данным шага,
       текст идёт сразу под ним, «Продолжить» — с коротким зазором. */
    <Shell
      fit
      bodyClassName="mx-hj-step-complete"
      screenBodyClassName="mx-hj-complete-body"
      onBack={onBack}
    >
      {showDoneImage ? (
        <HeroImage
          flexible
          src={doneImage}
          size={STEP_IMAGE_DIMENSIONS.done}
          frame={trial.image?.frame?.done}
          focus={trial.image?.focus}
          compact={trial.image?.compact}
          overlap={trial.image?.overlap}
          onError={() => setImageFailed(true)}
        />
      ) : null}

      <div className="mx-hj-complete mx-protected-text">
        {!showDoneImage && (
          <div className="mx-hj-complete__circle">
            <Check size={40} strokeWidth={3} />
          </div>
        )}
        {/* doneTitle показывается как в контенте, с заглавной: appHeading()
            приводит заголовки к строчным, а мысль шага пишется с большой буквы. */}
        <h2 className="mx-hj-complete__title">{trial.doneTitle || appHeading('Шаг пройден')}</h2>
        <p className="mx-hj-complete__phrase">
          {trial.doneSummary || 'Ты сделал ещё один шаг по пути.'}
        </p>
        {/* «Твоя опора»: ответ из «Одно действие» остаётся с пользователем
            после шага; пустой ответ блок не показывает. */}
        {actionAnswer && (
          <div className="mx-hj-complete__support">
            <span className="mx-hj-complete__support-label">Твоя опора</span>
            <p className="mx-hj-complete__support-text">{actionAnswer}</p>
          </div>
        )}
        {trial.doneTeaser && <p className="mx-hj-complete__teaser">{trial.doneTeaser}</p>}

        {chapter && (
          <div className="mx-hj-complete__chapter-card">
            {chapterDone ? (
              <p className="mx-hj-complete__chapter-done">
                {`Глава ${chapterLabel(chapter)} пройдена`}
              </p>
            ) : (
              <p className="mx-hj-complete__chapter-progress">
                Глава {chapter.roman} · {completedInChapter.length} из {chapterTrials.length}
              </p>
            )}
            {chapterDone && nextChapter && (
              <p className="mx-hj-complete__next-chapter">
                {`Открыта глава ${chapterLabel(nextChapter)}`}
              </p>
            )}
            {chapterDone && !nextChapter && finale && (
              <p className="mx-hj-complete__next-chapter">Открыт финал · {finale.title}</p>
            )}
          </div>
        )}

        {reflection && (
          <button type="button" className="mx-hj-quiet-link" onClick={onBackToMap}>
            Твоя запись в дневнике
          </button>
        )}
      </div>

      <div className="mx-hj-step-intro__bottom mx-hj-complete__bottom">
        <button
          type="button"
          data-testid="hero-complete-map"
          onClick={() => {
            /* Последний шаг главы (4, 8, 12) ведёт на экран паузы;
               остальные — на карту, как раньше. */
            if (chapterDone && nextChapter) onContinue(nextChapter.trialIds[0])
            else onContinue(null)
          }}
          className="cta-pill mx-hj-step-intro__cta mx-hj-complete__cta"
        >
          <span>Продолжить</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </Shell>
  )
}

/* ── H. Пауза между главами ── */

/*
 * Экран паузы после последнего шага главы (шаги 4, 8, 12).
 * Главная кнопка (одна, белая) ведёт на карту, тихая текстовая ссылка —
 * сразу первый шаг следующей главы. После 16-го шага пауза не показывается:
 * открывается финал «Возвращение».
 *
 * Оформление общее, своего набора классов у экрана нет: метка, заголовок и
 * абзац те же, что на вступлении шага, кнопка — общая нижняя группа
 * шага (.mx-hj-step-intro__bottom) и тихий вторичный текст (.mx-hj-quiet-link).
 */
function PauseScreen({ nextTrial, onStay, onContinue, onBack }) {
  return (
    <Shell
      fit
      bodyClassName="mx-hj-pause"
      screenBodyClassName="mx-hj-pause-body"
      testId="hero-pause"
      onBack={onBack}
    >
      <span className="mx-hj-eyebrow">ПАУЗА</span>
      <h2 className="mx-hj-step-intro__title">{appHeading('Глава позади')}</h2>
      <p className="mx-hj-step-intro__desc">
        Ты прошёл четыре шага и взял четыре действия. Дай им пару дней — так они станут твоими, а
        не очередным списком дел.
      </p>

      <div className="mx-hj-step-intro__bottom">
        <button
          type="button"
          data-testid="hero-pause-stay"
          onClick={onStay}
          className="cta-pill mx-hj-step-intro__cta"
        >
          Вернусь завтра
        </button>
        {nextTrial && (
          <button
            type="button"
            data-testid="hero-pause-next"
            onClick={onContinue}
            className="mx-hj-quiet-link"
          >
            Всё равно дальше
          </button>
        )}
      </div>
    </Shell>
  )
}

/* ── главный компонент ── */

export default function HeroJourneyMap({ course = HERO_COURSE, ...props }) {
  /* Серверные тексты относятся только к «Пути героя». Этим же экраном
     Библиотека открывает другие практикумы — у них данные свои. */
  const isHeroJourney = course?.id === HERO_COURSE.id
  /* refreshToken: возврат из подписки и возврат на вкладку перечитывают права
     (#1122) — экран остаётся на месте, свежий ответ подставляется тихо. */
  const {
    course: loadedCourse,
    loading,
    error,
    retry,
    source,
  } = useHeroJourneyContent(isHeroJourney, props.user?.id, props.refreshToken)
  const activeCourse = (isHeroJourney && loadedCourse) || course

  /* Тексты едут с сервера: спокойный скелет, пока грузится, и короткая
     ошибка с «Повторить», если сети нет. */
  if (isHeroJourney && loading && !loadedCourse) return <ContentSkeleton />
  if (isHeroJourney && error && !loadedCourse) return <ContentError onRetry={retry} error={error} />

  return (
    <CourseContext.Provider
      value={{
        ...courseContent(activeCourse),
        contentSource: source,
        contentStatus: loading
          ? 'loading'
          : error === 'access'
            ? 'access'
            : error
              ? 'error'
              : activeCourse.steps.length
                ? 'ready'
                : 'empty',
        retryContent: retry,
      }}
    >
      <CourseFlow key={props.user?.id} {...props} course={activeCourse} />
    </CourseContext.Provider>
  )
}

function CourseFlow({ onBack, user, course, onOpenSubscription }) {
  const { findTrial, previousTrial, prologue, chapterForTrial, chapters, finale } = useCourse()
  const access = course?.access || null
  /* Закрытый шаг или финал: прав решает сервер, экран лишь ведёт на подписку. */
  const isLocked = selected =>
    finale?.id === selected?.id
      ? heroFinaleLocked(selected, access)
      : heroTrialLocked(selected, chapters, access)
  const { progress, completeStep } = useHeroJourneyProgress(user.id, course.id)
  const [view, setView] = useState('map')
  const [activeStepId, setActiveStepId] = useState(null)
  /* Первый шаг следующей главы для экрана паузы (после шагов 4, 8, 12). */
  const [pauseNextStepId, setPauseNextStepId] = useState(null)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  /* Открытый лист вводки-сторис: «Назад» с листа 2+ — предыдущий лист,
     с листа 1 — карта (HeroJourneyStory листает этот же индекс). */
  const [storyIndex, setStoryIndex] = useState(0)
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
    if (view === 'about' || view === 'pause') {
      setView('map')
      return
    }
    /* Вводка листами: «Назад» с листа 2+ ведёт на предыдущий лист,
       с листа 1 — на карту, как раньше. */
    if (view === 'step-intro' && storyIndex > 0) {
      platform.haptic('light')
      setStoryIndex(storyIndex - 1)
      return
    }
    flushDraft()
    const seq = screenSequence(trial)
    const prevView = seq[seq.indexOf(view) - 1] || 'map'
    /* Возврат на вводку открывает первый лист, как при новом входе в шаг. */
    if (prevView === 'step-intro') setStoryIndex(0)
    setView(prevView)
  }

  function openStep(stepId) {
    const selected = findTrial(stepId)
    if (!selected) return
    /* Закрытая глава II–IV без Pro: текстов нет, открывать нечего — ведём на
       существующий экран подписки. */
    if (isLocked(selected)) {
      onOpenSubscription?.()
      return
    }
    if (
      !isStepCompleted(stepId, progress) &&
      !isStepAvailable(selected.number, previousTrial(stepId)?.id, progress)
    )
      return
    flushDraft()
    pendingDraft.current = null
    const draft = readHeroDraft(heroDraftKey(user.id, stepId, course.id))
    platform.haptic('light')
    setActiveStepId(stepId)
    setStoryIndex(0)
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
    return (
      <AboutScreen
        prologue={prologue}
        onBackToMap={() => setView('map')}
        onBack={handleBack}
      />
    )
  }

  if (view === 'map' || !trial) {
    return (
      <CourseMap
        progress={progress}
        onOpenStep={openStep}
        onOpenAbout={() => setView('about')}
        onOpenSubscription={onOpenSubscription}
        onBack={handleBack}
      />
    )
  }

  if (view === 'step-intro') {
    return (
      <StepIntro
        trial={trial}
        onBack={handleBack}
        onStart={startStep}
        storyIndex={storyIndex}
        onStoryIndexChange={setStoryIndex}
      />
    )
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
          onBack={handleBack}
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
          onBack={handleBack}
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
        onContinue={nextStepId => {
          if (nextStepId) {
            setPauseNextStepId(nextStepId)
            setView('pause')
          } else {
            setView('map')
          }
        }}
        onBack={handleBack}
      />
    )
  }

  if (view === 'pause') {
    const nextTrial = pauseNextStepId ? findTrial(pauseNextStepId) : null
    /* Закрытая следующая глава (без Pro): «Всё равно дальше» ведёт на карту,
       где главы II–IV показаны Pro и ведут на экран подписки. */
    const nextOpen = Boolean(nextTrial) && !isLocked(nextTrial)
    return (
      <PauseScreen
        nextTrial={nextOpen ? nextTrial : null}
        onBack={handleBack}
        onStay={() => setView('map')}
        onContinue={() => {
          if (nextOpen) openStep(pauseNextStepId)
          else setView('map')
        }}
      />
    )
  }

  return (
    <CourseMap
      progress={progress}
      onOpenStep={openStep}
      onOpenAbout={() => setView('about')}
      onOpenSubscription={onOpenSubscription}
      onBack={handleBack}
    />
  )
}
