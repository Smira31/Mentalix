import { useState, useMemo, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import { ArrowRight, Check, Lock } from 'lucide-react'

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

/* ── утилиты потока ── */

function screenSequence(trial) {
  const hasSigns = Array.isArray(trial?.signs) && trial.signs.length > 0
  const hasPaths = Boolean(trial?.heroPath)
  const seq = ['step-intro']
  if (hasSigns) seq.push('signs')
  if (hasPaths) seq.push('paths')
  seq.push('write', 'action', 'complete')
  return seq
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

function Shell({ children, footer, bodyClassName = '', fit = false, testId }) {
  return (
    <Screen
      showHeader={false}
      telegramChrome
      scroll={!fit}
      footer={footer}
      className="mx-hero-journey"
      bodyClassName={fit ? 'mx-hj-fit' : ''}
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

function CourseMap({ progress, onOpenStep }) {
  const {
    steps: HERO_JOURNEY_TRIALS,
    chapters: HERO_JOURNEY_CHAPTERS,
    course: HERO_JOURNEY_COURSE,
    finale: HERO_JOURNEY_FINALE,
  } = useCourse()
  const completedTotal = HERO_JOURNEY_TRIALS.filter(t => isStepCompleted(t.id, progress)).length

  const nextTrial = useMemo(() => {
    return HERO_JOURNEY_TRIALS.find(t => !isStepCompleted(t.id, progress))
  }, [progress])

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
          <span className="mx-hj-next-card__meta">≈ 6 мин</span>
          <span className="cta-pill mx-hj-next-card__cta">
            Продолжить <ArrowRight size={16} />
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

      {HERO_JOURNEY_FINALE && (
        <div className="mx-hj-finale-card">
          <Lock size={20} className="mx-hj-finale-card__icon" />
          <span className="mx-hj-finale-card__title">{HERO_JOURNEY_FINALE.title}</span>
          <span className="mx-hj-finale-card__hint">{HERO_JOURNEY_FINALE.lockedHint}</span>
        </div>
      )}
    </Shell>
  )
}

/* ── B. Вход в шаг ── */

function StepIntro({ trial, onStart }) {
  const { chapterForTrial, total: HERO_JOURNEY_TOTAL_STEPS } = useCourse()
  const chapter = chapterForTrial(trial.id)
  const enterImage = trial.image?.enter

  return (
    <Shell fit bodyClassName="mx-hj-step-intro">
      {enterImage ? (
        <div className="mx-hj-hero-image">
          <img src={enterImage} alt="" />
        </div>
      ) : (
        <>
          <div className="mx-hj-step-intro__image">
            <div className="mx-hj-step-intro__glyph">
              <SemanticGlyph kind="pathfinder" animated={false} />
            </div>
            <span className="mx-hj-step-intro__image-caption">шаг {trial.number}</span>
          </div>
        </>
      )}

      <div className="mx-hj-step-intro__text">
        <div className="mx-hj-step-intro__label">
          Глава {chapter.roman} · {chapter.title} · Шаг {trial.number} из {HERO_JOURNEY_TOTAL_STEPS}
        </div>
        <h2 className="mx-hj-step-intro__title">{appHeading(trial.title)}</h2>
        <p className="mx-hj-step-intro__subtitle">{trial.subtitle}</p>
        <p className="mx-hj-step-intro__desc">{trial.description}</p>
        <p className="mx-hj-step-intro__flow">2 шага: запись и одно действие</p>
      </div>

      <button
        type="button"
        data-testid="hero-step-start"
        onClick={onStart}
        className="cta-pill mx-hj-step-intro__cta"
      >
        Начать шаг
      </button>
    </Shell>
  )
}

/* ── общая шапка для C–F ── */

/* подписи действий экранов шага для метки в шапке */
const HEADER_VIEW_LABELS = {
  signs: 'Как проявляется',
  paths: 'Два пути',
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
          {trial.title} · {HEADER_VIEW_LABELS[view]}
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

/* ── C. Как это проявляется ── */

function SignsScreen({ trial, markedSigns, onToggleSign, onNext, onBack }) {
  const signs = trial.signs || []
  const markedCount = markedSigns.length

  return (
    <Shell>
      <StepHeader trial={trial} onBack={onBack} view="signs" />

      <h2 className="mx-hj-signs__title">{appHeading('Узнаёшь себя?')}</h2>
      <p className="mx-hj-signs__sub">Отметь то, что про тебя. Это видишь только ты.</p>

      <div className="mx-hj-signs__list">
        {signs.map((sign, i) => {
          const checked = markedSigns.includes(i)
          return (
            <button
              key={i}
              type="button"
              aria-pressed={checked}
              onClick={() => onToggleSign(i)}
              className={`mx-hj-sign-card ${checked ? 'is-checked' : ''}`}
            >
              <span className="mx-hj-sign-card__text">{sign}</span>
              <span className="mx-hj-sign-card__check">
                {checked && <Check size={16} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mx-hj-signs__footer">
        <span className="mx-hj-signs__count">
          Отмечено {markedCount} из {signs.length}
        </span>
        <button
          type="button"
          data-testid="hero-signs-next"
          onClick={onNext}
          className="cta-pill mx-hj-signs__cta"
        >
          Дальше
        </button>
      </div>
    </Shell>
  )
}

/* ── D. Два пути ── */

function PathsScreen({ trial, onNext, onBack }) {
  return (
    <Shell>
      <StepHeader trial={trial} onBack={onBack} view="paths" />

      <h2 className="mx-hj-paths__title">{appHeading('Как пройти — и как не пройти')}</h2>

      <div className="mx-hj-path-card mx-hj-path-card--shadow">
        <span className="mx-hj-path-card__label">Путь тени</span>
        <p className="mx-hj-path-card__action">{trial.shadowAction}</p>
        {trial.shadowOutcome && (
          <>
            <div className="mx-hj-path-card__divider" />
            <p className="mx-hj-path-card__outcome">{trial.shadowOutcome}</p>
          </>
        )}
      </div>

      <div className="mx-hj-path-card mx-hj-path-card--hero">
        <span className="mx-hj-path-card__label">Путь героя</span>
        <p className="mx-hj-path-card__action">{trial.heroPath}</p>
        {trial.heroOutcome && (
          <>
            <div className="mx-hj-path-card__divider" />
            <p className="mx-hj-path-card__outcome">{trial.heroOutcome}</p>
          </>
        )}
      </div>

      {trial.quote && (
        <blockquote className="mx-hj-paths__quote">
          <p>{trial.quote}</p>
        </blockquote>
      )}

      <button
        type="button"
        data-testid="hero-paths-next"
        onClick={onNext}
        className="cta-pill mx-hj-paths__cta"
      >
        Дальше
      </button>
    </Shell>
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
  allowEmpty,
  onBack,
  trial,
  view,
}) {
  const hasText = Boolean(value.trim())
  const canSubmit = allowEmpty || hasText

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    platform.haptic('light')
    onSubmit()
  }, [canSubmit, onSubmit])

  return (
    <Shell>
      <StepHeader trial={trial} onBack={onBack} view={view} />

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
        submitDisabled={!canSubmit}
        submitIcon="arrow"
        submitLabel={hasText ? 'Далее' : 'Пропустить'}
        className="mt-[28px] flex-1 mx-hj-write-input"
        editorClassName="mx-hj-write-editor"
      />
    </Shell>
  )
}

/* ── G. Шаг пройден ── */

function StepComplete({ trial, progress, onBackToMap }) {
  const { chapterForTrial, trialsForChapter, chapters: HERO_JOURNEY_CHAPTERS } = useCourse()
  const chapter = chapterForTrial(trial.id)
  const chapterTrials = trialsForChapter(chapter)
  const completedInChapter = chapterTrials.filter(t => isStepCompleted(t.id, progress))
  const chapterDone = completedInChapter.length === chapterTrials.length
  const nextChapter = HERO_JOURNEY_CHAPTERS.find(
    ch => ch.roman === String.fromCharCode(chapter.roman.charCodeAt(0) + 1)
  )

  const reflection = progress.reflections[trial.id] || ''
  const doneImage = trial.image?.done

  return (
    <Shell
      footer={
        <div className="mx-hj-complete__footer mx-auto w-full max-w-md px-[var(--mx-screen-x)]">
          <button
            type="button"
            data-testid="hero-complete-map"
            onClick={onBackToMap}
            className="cta-pill mx-hj-complete__cta"
          >
            К карте пути
          </button>
        </div>
      }
    >
      {doneImage ? (
        <div className="mx-hj-hero-image">
          <img src={doneImage} alt="" />
        </div>
      ) : null}

      <div className="mx-hj-complete">
        {!doneImage && (
          <div className="mx-hj-complete__circle">
            <Check size={40} strokeWidth={3} />
          </div>
        )}
        <h2 className="mx-hj-complete__title">{appHeading('Шаг пройден')}</h2>
        <p className="mx-hj-complete__phrase">
          {trial.doneText || 'Ты сделал ещё один шаг по пути.'}
        </p>

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
        </div>

        {reflection && (
          <button type="button" className="mx-hj-complete__diary-link" onClick={onBackToMap}>
            Твоя запись в дневнике →
          </button>
        )}
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
  const { findTrial, previousTrial } = useCourse()
  const { progress, completeStep, setSigns } = useHeroJourneyProgress(user.id, course.id)
  const [view, setView] = useState('map')
  const [activeStepId, setActiveStepId] = useState(null)
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

  function toggleSign(index) {
    platform.haptic('light')
    setMarkedSigns(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  function proceedFromSigns() {
    if (!trial) return
    setSigns(trial.id, markedSigns)
    setView(nextView('signs', trial))
  }

  function proceedFromPaths() {
    if (!trial) return
    setView(nextView('paths', trial))
  }

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

  if (view === 'map' || !trial) {
    return <CourseMap progress={progress} onOpenStep={openStep} onBack={onBack} />
  }

  if (view === 'step-intro') {
    return <StepIntro trial={trial} onBack={handleBack} onStart={startStep} />
  }

  if (view === 'signs') {
    return (
      <SignsScreen
        trial={trial}
        markedSigns={markedSigns}
        onToggleSign={toggleSign}
        onNext={proceedFromSigns}
        onBack={handleBack}
      />
    )
  }

  if (view === 'paths') {
    return <PathsScreen trial={trial} onNext={proceedFromPaths} onBack={handleBack} />
  }

  if (view === 'write') {
    return (
      <WriteScreen
        label="ЗАПИШИ"
        prompt={trial.prompt}
        hint={trial.hint || 'Не оценивай — просто назови, как есть.'}
        placeholder="Начни писать…"
        value={reflection}
        onChange={value => changeDraft('reflection', value)}
        onSubmit={submitWrite}
        allowEmpty={false}
        onBack={handleBack}
        trial={trial}
        view="write"
      />
    )
  }

  if (view === 'action') {
    return (
      <WriteScreen
        label="ОДНО ДЕЙСТВИЕ"
        prompt={trial.action}
        hint="Напиши, какое. Оно сохранится вместе с ответом в дневнике."
        placeholder={trial.actionPlaceholder || 'Моё действие…'}
        value={action}
        onChange={value => changeDraft('action', value)}
        onSubmit={submitAction}
        allowEmpty
        onBack={handleBack}
        trial={trial}
        view="action"
      />
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

  return <CourseMap progress={progress} onOpenStep={openStep} onBack={onBack} />
}
