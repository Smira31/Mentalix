import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, Lock, X } from 'lucide-react'

import { RoundBackButton } from '../components/NestedScreenHeader'
import JournalTextarea from '../components/JournalTextarea'
import { platform } from '../platform'
import { useBackButton } from '../platform/telegram.hooks'
import {
  getFullscreenPortalTarget,
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { isPreviewDemoMode } from '../lib/demoMode'
import { useHeroJourneyProgress, isStepAvailable, isStepCompleted } from '../lib/heroJourneyProgress'
import {
  HERO_JOURNEY_TRIALS,
  HERO_JOURNEY_CHAPTERS,
  HERO_JOURNEY_COURSE,
  HERO_JOURNEY_FINALE,
  HERO_JOURNEY_TOTAL_STEPS,
  findTrial,
  chapterForTrial,
  trialsForChapter,
  stepContents,
} from '../data/heroJourney'
import './HeroJourneyMap.css'

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

/* ── оболочка экрана ── */

function Shell({ children, footer }) {
  const { style } = useFullscreenSurface()

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={style}>
      <div className={`${FULLSCREEN_SCROLL_CLASS} mx-hero-journey`}>
        <div className="mx-auto flex w-full max-w-md flex-col px-[var(--mx-screen-x)] pb-6">
          {children}
        </div>
      </div>
      {footer}
    </div>,
    getFullscreenPortalTarget()
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

function ChapterSection({ chapter, progress, onOpenStep }) {
  const trials = trialsForChapter(chapter)
  const completedCount = trials.filter(t => isStepCompleted(t.id, progress)).length
  const anyStarted = completedCount > 0

  const [expanded, setExpanded] = useState(anyStarted)

  return (
    <section className="mx-hj-chapter">
      <div className="mx-hj-chapter__head" onClick={() => setExpanded(v => !v)}>
        <div className="mx-hj-chapter__title-block">
          <span className="mx-hj-chapter__roman">Глава {chapter.roman}</span>
          <span className="mx-hj-chapter__name">{chapter.title}</span>
          <span className="mx-hj-chapter__subtitle">{chapter.subtitle}</span>
        </div>
        <span className="mx-hj-chapter__count">{completedCount} из 4</span>
      </div>

      {expanded && (
        <div className="mx-hj-chapter__path">
          {trials.map((trial, i) => {
            const completed = isStepCompleted(trial.id, progress)
            const prevTrial = i > 0 ? trials[i - 1] : null
            const available = isStepAvailable(trial.number, prevTrial?.id, progress, DEMO)
            const status = completed ? 'completed' : available ? 'current' : 'locked'

            return (
              <button
                key={trial.id}
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
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mx-hj-chapter__expand"
        >
          4 шага
        </button>
      )}
    </section>
  )
}

function CourseMap({ progress, onOpenStep, onBack }) {
  const completedTotal = HERO_JOURNEY_TRIALS.filter(t =>
    isStepCompleted(t.id, progress)
  ).length

  const nextTrial = useMemo(() => {
    return HERO_JOURNEY_TRIALS.find(t => !isStepCompleted(t.id, progress))
  }, [progress])

  return (
    <Shell>
      <RoundBackButton onClick={onBack} />

      <div className="mx-hj-map__head">
        <span className="mx-hj-eyebrow">Курс · 16 шагов · 4 главы</span>
        <h1 className="mx-hj-map__title">Путь героя</h1>
        <p className="mx-hj-map__desc">{HERO_JOURNEY_COURSE.description}</p>
      </div>

      <div className="mx-hj-map__progress">
        <span className="mx-hj-map__progress-text">Пройдено {completedTotal} из 16</span>
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
          onClick={() => onOpenStep(nextTrial.id)}
          className="mx-hj-next-card"
        >
          <span className="mx-hj-next-card__label">Следующий шаг · {nextTrial.number}</span>
          <span className="mx-hj-next-card__title">{nextTrial.title}</span>
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
          />
        ))}
      </div>

      <div className="mx-hj-finale-card">
        <Lock size={20} className="mx-hj-finale-card__icon" />
        <span className="mx-hj-finale-card__title">{HERO_JOURNEY_FINALE.title}</span>
        <span className="mx-hj-finale-card__hint">{HERO_JOURNEY_FINALE.lockedHint}</span>
      </div>
    </Shell>
  )
}

/* ── B. Вход в шаг ── */

function StepIntro({ trial, onBack, onStart }) {
  const chapter = chapterForTrial(trial.id)
  const chapterTrials = trialsForChapter(chapter)
  const stepIndexInChapter = chapterTrials.findIndex(t => t.id === trial.id)
  const contents = stepContents(trial)

  return (
    <Shell>
      <RoundBackButton onClick={onBack} />

      <div className="mx-hj-step-intro__chapter-label">Глава {chapter.roman} · {chapter.title}</div>

      {/* TODO: иллюстрация шага (поле image) */}
      <div className="mx-hj-step-intro__image">
        <span className="mx-hj-step-intro__image-num">
          {String(trial.number).padStart(2, '0')}
        </span>
        <div className="mx-hj-step-intro__dots">
          {chapterTrials.map((_, i) => (
            <span
              key={i}
              className={`mx-hj-step-intro__dot ${i <= stepIndexInChapter ? 'is-active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="mx-hj-step-intro__meta">
        Шаг {trial.number} из {HERO_JOURNEY_TOTAL_STEPS} · ≈ 6 минут
      </div>
      <h2 className="mx-hj-step-intro__title">{trial.title}</h2>
      <p className="mx-hj-step-intro__subtitle">{trial.subtitle}</p>
      <p className="mx-hj-step-intro__desc">{trial.description}</p>

      <ul className="mx-hj-step-intro__contents">
        {contents.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <button type="button" onClick={onStart} className="cta-pill mx-hj-step-intro__cta">
        Начать шаг
      </button>
    </Shell>
  )
}

/* ── общая шапка для C–F ── */

function StepHeader({ trial, onBack }) {
  const chapter = chapterForTrial(trial.id)
  const chapterTrials = trialsForChapter(chapter)
  const stepIndexInChapter = chapterTrials.findIndex(t => t.id === trial.id)

  return (
    <div className="mx-hj-step-header">
      <RoundBackButton onClick={onBack} />
      <div className="mx-hj-step-header__info">
        <span className="mx-hj-step-header__title">Шаг {trial.number} · {trial.title}</span>
        <span className="mx-hj-step-header__progress">{stepIndexInChapter + 1} из 4</span>
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
      <StepHeader trial={trial} onBack={onBack} />

      <h2 className="mx-hj-signs__title">Узнаёшь себя?</h2>
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
        <span className="mx-hj-signs__count">Отмечено {markedCount} из {signs.length}</span>
        <button type="button" onClick={onNext} className="cta-pill">
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
      <StepHeader trial={trial} onBack={onBack} />

      <h2 className="mx-hj-paths__title">Как пройти — и как не пройти</h2>

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
          <cite>— из практикума «Путь героя»</cite>
        </blockquote>
      )}

      <button type="button" onClick={onNext} className="cta-pill mx-hj-paths__cta">
        Дальше
      </button>
    </Shell>
  )
}

/* ── E/F. Запиши / Одно действие ── */

function WriteScreen({ label, prompt, hint, placeholder, value, onChange, onSubmit, allowEmpty, onBack, trial }) {
  const hasText = Boolean(value.trim())
  const canSubmit = allowEmpty || hasText

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    platform.haptic('light')
    onSubmit()
  }, [canSubmit, onSubmit])

  return (
    <Shell>
      <StepHeader trial={trial} onBack={onBack} />

      <div className="mx-hj-write">
        <span className="mx-hj-write__label">{label}</span>
        <h2 className="mx-hj-write__prompt">{prompt}</h2>
        {hint && <p className="mx-hj-write__hint">{hint}</p>}
      </div>

      <JournalTextarea
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
        submitIcon={hasText ? 'arrow' : 'arrow'}
        submitLabel={hasText ? 'Далее' : 'Пропустить'}
        className="mt-4 flex-1"
      />
    </Shell>
  )
}

/* ── G. Шаг пройден ── */

function StepComplete({ trial, progress, onBackToMap, onBack }) {
  const chapter = chapterForTrial(trial.id)
  const chapterTrials = trialsForChapter(chapter)
  const completedInChapter = chapterTrials.filter(t => isStepCompleted(t.id, progress))
  const chapterDone = completedInChapter.length === chapterTrials.length
  const nextChapter = HERO_JOURNEY_CHAPTERS.find(
    ch => ch.roman === String.fromCharCode(chapter.roman.charCodeAt(0) + 1)
  )

  const reflection = progress.reflections[trial.id] || ''

  return (
    <Shell>
      <RoundBackButton onClick={onBack} />

      <div className="mx-hj-complete">
        <div className="mx-hj-complete__circle">
          <Check size={40} strokeWidth={3} />
        </div>
        <span className="mx-hj-complete__step">Шаг {trial.number} из {HERO_JOURNEY_TOTAL_STEPS}</span>
        <h2 className="mx-hj-complete__title">Шаг пройден</h2>
        <p className="mx-hj-complete__phrase">{trial.subtitle}</p>
      </div>

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

      <button type="button" onClick={onBackToMap} className="cta-pill mx-hj-complete__cta">
        К карте пути
      </button>
    </Shell>
  )
}

/* ── главный компонент ── */

export default function HeroJourneyMap({ onBack }) {
  const { progress, completeStep, setSigns } = useHeroJourneyProgress()
  const [view, setView] = useState('map')
  const [activeStepId, setActiveStepId] = useState(null)
  const [markedSigns, setMarkedSigns] = useState([])
  const [reflection, setReflection] = useState('')
  const [action, setAction] = useState('')

  const trial = useMemo(() => (activeStepId ? findTrial(activeStepId) : null), [activeStepId])

  useBackButton(() => {
    handleBack()
  }, view !== 'map')

  function handleBack() {
    if (view === 'map') {
      onBack()
      return
    }
    setView('map')
  }

  function openStep(stepId) {
    platform.haptic('light')
    setActiveStepId(stepId)
    setMarkedSigns(progress.signs[stepId] || [])
    setReflection(progress.reflections[stepId] || '')
    setAction(progress.actions[stepId] || '')
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
        hint={trial.prompt}
        placeholder="Записать мысль..."
        value={reflection}
        onChange={setReflection}
        onSubmit={submitWrite}
        allowEmpty={false}
        onBack={handleBack}
        trial={trial}
      />
    )
  }

  if (view === 'action') {
    return (
      <WriteScreen
        label="ОДНО ДЕЙСТВИЕ"
        prompt={trial.action}
        hint="Напиши, какое. Оно сохранится вместе с ответом в дневнике."
        placeholder="Моё одно направление..."
        value={action}
        onChange={setAction}
        onSubmit={submitAction}
        allowEmpty
        onBack={handleBack}
        trial={trial}
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
