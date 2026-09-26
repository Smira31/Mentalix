import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { MotifArt } from '../components/Motif'
import { api } from '../lib/api'
import { logEngagementEvent } from '../lib/engagementEvents'
import { ArrowRight, Check, Flame, Hand, ThumbsDown, ThumbsUp } from 'lucide-react'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import WebActionBar from '../components/WebActionBar'
import { pickByDay, MORNING_NOTE_PROMPTS, LESSON_PROMPTS } from '../data/prompts'
import { useMainButton, useSecondaryButton } from '../platform/telegram.hooks'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { consumeMoodDraft } from '../lib/moodCheckDraft'
import EmotionStep from '../components/EmotionStep'
import StepSlide from '../components/StepSlide'
import {
  clearCheckinDraft,
  draftHasContent,
  morningDraftToNote,
  readCheckinDraft,
  saveCheckinDraft,
} from '../lib/checkinDraft'
import { isPreviewDemoMode } from '../lib/demoMode'
import { logOnce } from '../lib/logOnce'
import { maybeBuildSurprise } from './mentalix/surpriseInsight'
import { SURPRISE_MESSAGE_KEY } from './mentalix/insightDigest'
import { loadAlterEgos, loadAlterEgosSync } from '../lib/alterEgoStorage'

import { currentCheckinStreak, seriesLogicalDateKey } from '../lib/series'
import { buildTomorrowTeaser } from '../lib/tomorrowTeaser'
import { peekPracticesData } from '../lib/practicesDataCache'
import { energyFillPercent } from '../lib/checkinScale'
import { MENTOR_HANDOFF_KEY } from './mentalix/personas'
import { eveningMorningFields } from '../lib/checkinMorningFields'
import { withRetry } from '../lib/todayRetry'
import { yesterdayLabel } from './StreakRecovery'
import { resolveDesyncStep } from '../lib/checkinDesync'
import { CHECKIN_FEEDBACK_OPTIONS, sendCheckinFeedback } from '../lib/checkinFeedback'
import cardMorningDone2x from '../assets/today/card-morning-done@2x.webp'
import cardMorningDone3x from '../assets/today/card-morning-done@3x.webp'
import cardEveningDone2x from '../assets/today/card-evening-done@2x.webp'
import cardEveningDone3x from '../assets/today/card-evening-done@3x.webp'
import './CheckInDemo.css'

const MENTOR_PERSONA_KEY = 'mx-mentor-persona'
const MENTOR_DRAFT_KEY = 'mx-mentor-draft'
const DAY_REVIEW_PROMPT =
  'Разбери мой сегодняшний день. Опирайся только на реальные данные Mentalix: моё состояние, ритуалы, аскезы, срывы, их причины, вечерние выводы и то, чем я горжусь. Дай один главный вывод, максимум две закономерности и один конкретный эксперимент на завтра. Если данных для вывода недостаточно — скажи об этом прямо.'

/*
 * MXL-EMOTION-STEP-002 — эмоция → один микро-шаг (ROADMAP.md, пункт 2).
 * Один универсальный драфт для тяжёлых эмоций, не зависящий от того, какая
 * именно из трёх выбрана — Собеседник сам спросит, что происходит.
 */
const EMOTION_TALK_PROMPT =
  'Сейчас тяжело — не хочу делать вид, что всё в порядке. Хочу просто сказать вслух, что чувствую.'

const HEAVY_EMOTIONS = ['тревожно', 'подавлен', 'страшно']

// MXL-PROMPT-ROTATION-001: один и тот же вариант на весь календарный день
// по МСК (см. src/data/prompts.js) — не пересчитывается на каждый рендер.
const MORNING_NOTE_PLACEHOLDER = pickByDay(MORNING_NOTE_PROMPTS)

/*
 * Короткие сцены (шкалы и эмоции) занимают доступную высоту и держат
 * смысловой центр в середине. Текстовые карточки с клавиатурой используют
 * отдельный top-aligned класс ниже: длинный ввод не должен плавать при
 * изменении visualViewport.
 */
const CHECKIN_CENTER_CLASS =
  'w-full flex-1 px-[var(--mx-screen-x)] py-6 flex flex-col items-center justify-center'

const CHECKIN_LONG_CLASS =
  'w-full min-h-full flex-1 px-[var(--mx-screen-x)] pt-4 pb-2 flex flex-col items-center'

const CHECKIN_QUESTION_CLASS = 'w-full text-center'

const CHECKIN_INTERACTIVE_CLASS = 'w-full pt-7'

const CHECKIN_SUCCESS_CLASS = 'w-full flex flex-col items-center text-center'

const CHECKIN_HEADER_CLASS = `${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center justify-between px-[var(--mx-screen-x)]`

const WEEK_DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function CheckInNextControls({
  onNext,
  disabled = false,
  onSkip = null,
  variant = 'scale',
}) {
  return (
    <div
      className={`mx-checkin-next-controls${variant === 'emotion' ? ' mx-checkin-next-controls--emotion' : ''}`}
    >
      {onSkip ? (
        <button
          type="button"
          className="mx-checkin-next-controls__skip mx-tap-target"
          data-testid="checkin-skip"
          onClick={onSkip}
        >
          Пропустить
        </button>
      ) : null}
      <button
        type="button"
        className="mx-checkin-next-controls__next"
        aria-label="Далее"
        data-testid="checkin-next"
        onClick={onNext}
        disabled={disabled}
      >
        <span>Далее</span>
        <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

function dayStart(date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function buildStreakDays(streakHistory, streak) {
  const today = dayStart(new Date())
  const completedDates = new Set(
    streakHistory
      .filter(checkin => checkin?.review_completed_at && checkin?.date)
      .map(checkin => String(checkin.date).slice(0, 10))
  )
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - Math.max(0, Number(streak) - 1))
  const visibleStart = new Date(startDate)
  visibleStart.setDate(startDate.getDate() - Math.max(0, 3 - Number(streak)))
  const length = Math.max(1, Math.round((today - visibleStart) / 86400000) + 1)

  return Array.from({ length }, (_, index) => {
    const date = new Date(visibleStart)
    date.setDate(visibleStart.getDate() + index)
    const isoDate = date.toISOString().slice(0, 10)
    const isToday = date.getTime() === today.getTime()

    return {
      isoDate,
      isToday,
      completed: completedDates.has(isoDate),
      label: WEEK_DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1],
      dateLabel: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    }
  })
}

/* Иконки кнопок «Нет / Немного / Да» на экране завершения. */
const FEEDBACK_ICONS = {
  no: ThumbsDown,
  some: Hand,
  yes: ThumbsUp,
}

function StreakFlower() {
  return (
    <svg
      width="112"
      height="112"
      viewBox="0 0 112 112"
      fill="none"
      aria-hidden="true"
      className="mb-7"
    >
      <path d="M56 91V58" stroke="rgb(var(--c-gold))" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 70C42 71 34 63 36 52C47 51 56 58 56 70Z" fill="rgb(var(--c-gold))" />
      <path d="M56 59C57 45 66 37 78 39C79 51 70 59 56 59Z" fill="rgb(var(--c-text))" />
      <path d="M56 78C65 70 75 71 82 79C74 88 64 87 56 78Z" fill="rgb(var(--c-muted))" />
    </svg>
  )
}

/*
 * Персонаж владельца на экране завершения: утро — голова вправо, активный взгляд;
 * разбор дня — закрытые глаза. Кадры уже используются карточками «Сегодня»
 * (src/assets/today), новых рисунков не рисуем.
 */
function CompletionArt({ variant = 'morning' }) {
  const evening = variant === 'evening'
  const src2x = evening ? cardEveningDone2x : cardMorningDone2x
  const src3x = evening ? cardEveningDone3x : cardMorningDone3x

  return (
    <img
      src={src2x}
      srcSet={`${src2x} 2x, ${src3x} 3x`}
      width={200}
      height={evening ? 230 : 212}
      alt={evening ? 'Персонаж с закрытыми глазами' : 'Персонаж со взглядом вправо'}
      className="mx-demo-checkin__character"
    />
  )
}

export function CheckInCompletionArt() {
  return <CompletionArt variant="morning" />
}

export function CheckInQuestion({
  title,
  hint,
  children,
  className = '',
  headingAs = 'h1',
  headingClassName = '',
  hintClassName = '',
}) {
  const Heading = headingAs

  return (
    <section className={`mx-checkin-question ${className}`.trim()}>
      <Heading className={headingClassName}>{title}</Heading>
      {hint ? <p className={`mx-checkin-question__hint ${hintClassName}`.trim()}>{hint}</p> : null}
      {children}
    </section>
  )
}

/*
 * Morning flow shared by production and preview.
 *
 * The preview-specific part lives outside this component: App supplies
 * DEMO_USER and api.js intercepts requests only when isPreviewDemoMode() is
 * true. The screens, transitions and editor must not diverge by environment.
 */
function MorningCheckInFlow({ user, onDone, onCompleted, redo = false, existing = null }) {
  const [step, setStep] = useState(0)
  /*
   * Шаги anxiety/focus убраны из утреннего флоу, и redo не переносит их
   * из перезаписываемой записи: поля опускаются в PUT /api/checkin/today,
   * бэкенд сохраняет прежние значения утра. Настроение и энергия
   * в redo переспрашиваются заново.
   *
   * sleep_quality и day_focus — необязательные поля (backend PR #103):
   * при повторном открытии (не redo) предзаполняются из существующей записи,
   * при redo стартуют пустыми. Пропущенные поля не отправляются (omitted),
   * чтобы бэкенд сохранил прежние значения.
   */
  const [values, setValues] = useState(() => ({
    mood: null,
    energy: null,
    anxiety: null,
    focus: redo ? null : (existing?.focus ?? null),
    sleep_quality: redo ? null : (existing?.sleep_quality ?? null),
  }))
  const [note, setNote] = useState('')
  const [dayFocus, setDayFocus] = useState(() => (redo ? '' : (existing?.day_focus ?? '')))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [streak, setStreak] = useState(0)
  const [streakHistory, setStreakHistory] = useState([])
  const { style: viewportStyle } = useFullscreenSurface()
  const demoSurfaceStyle = {
    ...viewportStyle,
    paddingBottom: 0,
  }
  /*
   * Порядок утренних шкал: настроение → сон → энергия → концентрация.
   * sleep_quality и focus — необязательные (required: false), их можно
   * пропустить; mood и energy — обязательные.
   */
  const allScales = [
    { ...SCALE_STEPS[0], required: true },
    { ...SLEEP_QUALITY_STEP, required: false },
    { ...SCALE_STEPS[1], required: true },
    { ...MORNING_FOCUS_STEP, required: false },
  ]
  const scale = step < allScales.length ? allScales[step] : null
  const dayFocusStep = allScales.length
  const noteStep = dayFocusStep + 1
  const doneStep = noteStep + 1
  const teaserLogged = useRef(false)
  useEffect(() => {
    if (teaserLogged.current || step !== doneStep) return
    teaserLogged.current = true
    logEngagementEvent({
      user,
      demo: isPreviewDemoMode(),
      event: 'teaser_shown',
      entityType: 'teaser',
      entityId: 'morning',
      hasSession: Boolean(platform.getSessionToken?.()),
      send: api.events.log,
    })
  }, [step, doneStep, user])

  /*
   * §6: во время горизонтального перехода (300 мс) повторная навигация
   * блокируется, чтобы не пропустить шаг и не сломать состояние.
   */
  const animatingRef = useRef(false)

  function goToStep(updater) {
    if (animatingRef.current) return
    setStep(updater)
  }

  function handleAnimatingChange(animating) {
    animatingRef.current = animating
  }

  function handleBack() {
    platform.haptic('light')

    if (step === doneStep || step === 0) {
      onDone()
      return
    }

    goToStep(current => Math.max(0, current - 1))
  }

  function pick(key, level) {
    platform.haptic('light')
    setValues(current => ({ ...current, [key]: level }))
  }

  async function finish() {
    setSaving(true)
    setError('')
    try {
      const saveApi = redo ? api.checkin.redo : api.checkin.save
      const morningPayload = {
        mood: values.mood || 3,
        energy: values.energy || 3,
        note: note.trim() || undefined,
        emotion: undefined,
      }
      if (values.anxiety != null) morningPayload.anxiety = values.anxiety
      if (values.focus != null) morningPayload.focus = values.focus
      if (values.sleep_quality != null) morningPayload.sleep_quality = values.sleep_quality
      if (dayFocus.trim()) morningPayload.day_focus = dayFocus.trim()
      await saveApi(user.id, morningPayload)
      onCompleted?.()
      platform.haptic('success')
      if (redo) {
        onDone()
        return
      }
      try {
        const history = await api.checkin.history(user.id, 90)
        setStreakHistory(Array.isArray(history) ? history : [])
        setStreak(Math.max(1, currentCheckinStreak(Array.isArray(history) ? history : [])))
      } catch (historyError) {
        console.error(historyError)
      }
      setStep(doneStep)
    } catch (saveError) {
      console.error(saveError)
      setError('Не удалось сохранить. Попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  const action =
    step === doneStep
      ? { text: 'Вернуться в Сегодня', testId: 'checkin-back-to-today', onClick: onDone }
      : step === dayFocusStep
        ? { text: 'Далее', onClick: () => goToStep(noteStep), disabled: false }
        : {
            text: 'Продолжить',
            onClick: () => goToStep(current => current + 1),
            disabled: false,
          }

  useMainButton({
    text: action.text,
    onClick: action.onClick,
    visible: step === doneStep,
    enabled: !action.disabled,
    loading: saving,
  })

  useSecondaryButton({ text: '', onClick: () => {}, visible: false })

  const screenRef = useRef(null)

  return createPortal(
    <div ref={screenRef} className="mx-demo-checkin" style={demoSurfaceStyle}>
      <header className="mx-demo-checkin__header">
        <BackButton onClick={handleBack} label="Сегодня" />
      </header>

      <main className={`mx-demo-checkin__body ${step === noteStep ? 'is-editor' : ''}`}>
        <StepSlide stepKey={step} onAnimatingChange={handleAnimatingChange}>
          {scale && (
            <CheckInScaleQuestion
              scale={scale}
              value={values[scale.key]}
              onPick={level => pick(scale.key, level)}
            />
          )}

          {step === noteStep && (
            <CheckInQuestion
              title="Что на уме?"
              hint="Пара слов — уже разговор с собой."
              className="mx-demo-checkin__editor-scene"
            >
              <JournalTextarea
                value={note}
                onChange={setNote}
                placeholder="Начни писать…"
                ariaLabel="Что на уме"
                testId="checkin-text-input"
                className="mx-demo-checkin__editor"
                editorClassName="pb-28"
                floatingToolbar
                guidedFlow
                autoFocus
                keepFocusOnSubmit
                submitIcon="arrow"
                submitLabel="Завершить"
                submitTestId="checkin-complete"
                onSubmit={finish}
                submitLoading={saving}
                onDeepen={() => {}}
                deepenLabel="Пойти глубже"
                showAddAction
                formatting
              />
              {error ? (
                <p role="alert" className="mx-demo-checkin__error mt-4 text-center">
                  {error}
                </p>
              ) : null}
            </CheckInQuestion>
          )}

          {step === dayFocusStep && (
            <CheckInQuestion
              title="Главный фокус дня"
              hint="Одна мысль, которой не хочешь потерять. Можно пропустить."
              className="mx-demo-checkin__editor-scene"
            >
              <div className="mx-demo-checkin__day-focus">
                <input
                  type="text"
                  value={dayFocus}
                  onChange={e => setDayFocus(e.target.value.slice(0, DAY_FOCUS_MAX))}
                  maxLength={DAY_FOCUS_MAX}
                  placeholder="Например: закончить важный разговор"
                  aria-label="Главный фокус дня"
                  data-testid="checkin-day-focus-input"
                  className="mx-demo-checkin__day-focus-input"
                />
                <span
                  className="mx-demo-checkin__day-focus-counter"
                  data-testid="checkin-day-focus-counter"
                >
                  {dayFocus.length}/{DAY_FOCUS_MAX}
                </span>
              </div>
            </CheckInQuestion>
          )}

          {step === doneStep && (
            <section className="mx-demo-checkin__scene mx-demo-checkin__scene--complete">
              <StreakFlower />
              <h1>Чек-ин завершён</h1>
              {streak > 0 ? (
                <p className="mx-type-body text-muted mt-4" data-testid="checkin-streak">
                  {streak}-дневная серия
                </p>
              ) : null}
            </section>
          )}
        </StepSlide>
      </main>
      {step < noteStep ? (
        <CheckInNextControls
          onNext={() => goToStep(current => Math.min(doneStep, current + 1))}
          disabled={
            step < allScales.length && allScales[step]?.required
              ? !values[allScales[step].key]
              : false
          }
          onSkip={
            (step < allScales.length && !allScales[step]?.required) || step === dayFocusStep
              ? () => goToStep(current => Math.min(doneStep, current + 1))
              : null
          }
        />
      ) : null}
      {step === doneStep ? (
        <WebActionBar action={action} loading={saving} className="mx-demo-checkin__action-bar" />
      ) : null}
    </div>,
    getFullscreenPortalTarget()
  )
}

// ── Чек-ин и вечерний «Анализ дня» ──
// Утром: настроение + энергия + короткая мысль → note.
// Вечером: только три текстовых шага уроков дня → lessons.
//
// Утро и вечер пишут в одну строку за день, но в разные поля.
// Поле, которому нечего сказать, не отправляется вовсе: бэкенд
// сохраняет прежнее значение, и вечер не затирает утро.

export function Face({ level, active, size = 56, showFrame = true }) {
  const mouths = [
    'M18 40 Q28 32 38 40',
    'M18 38 Q28 35 38 38',
    'M18 38 H38',
    'M18 36 Q28 42 38 36',
    'M16 34 Q28 46 40 34',
  ]
  const brows = [
    ['M16 18 L23 20', 'M33 20 L40 18'],
    ['M16 19 L23 20', 'M33 20 L40 19'],
    ['M17 20 H23', 'M33 20 H39'],
    ['M16 20 L23 18', 'M33 18 L40 20'],
    ['M15 21 L23 17', 'M33 17 L41 21'],
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className={active ? 'mx-face mx-face--active' : 'mx-face'}
    >
      {showFrame && (
        <circle className="mx-face__frame" cx="28" cy="28" r="26" fill="none" strokeWidth="2.5" />
      )}

      <path
        d={brows[level - 1][0]}
        className={active ? 'stroke-gold' : 'stroke-cream/40'}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d={brows[level - 1][1]}
        className={active ? 'stroke-gold' : 'stroke-cream/40'}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle cx="20" cy="26" r="2.4" className={active ? 'fill-gold' : 'fill-cream/40'} />

      <circle cx="36" cy="26" r="2.4" className={active ? 'fill-gold' : 'fill-cream/40'} />

      <path
        d={mouths[level - 1]}
        className={active ? 'stroke-gold' : 'stroke-cream/40'}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export const SCALE_STEPS = [
  {
    key: 'mood',
    title: 'Как ты сейчас?',
    hint: 'Честный ответ важнее красивого',
    labels: ['Тяжко', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'],
    faces: true,
  },
  {
    key: 'energy',
    title: 'Сколько в тебе энергии?',
    hint: 'Прислушайся к телу',
    labels: ['На нуле', 'Мало', 'Средне', 'Много', 'Через край'],
  },
  {
    key: 'anxiety',
    title: 'Сколько шума в голове?',
    hint: 'Тревога — это просто данные',
    labels: ['Тихо', 'Слегка', 'Заметно', 'Сильно', 'Штормит'],
  },
  {
    key: 'focus',
    title: 'Насколько ты собран?',
    hint: 'Где сейчас твоё внимание',
    labels: ['Рассеян', 'Плыву', 'Держусь', 'Собран', 'Кристально'],
  },
]

export const MORNING_SCALE_STEPS = [SCALE_STEPS[0], SCALE_STEPS[1]]

/*
 * Необязательные утренние шкалы после настроения и энергии.
 * sleep_quality — оценка качества сна 1–5 (backend PR #103).
 * focus — существующий «Уровень концентрации» 1–5, явно назван,
 *   чтобы отличать от текстового day_focus.
 */
const SLEEP_QUALITY_STEP = {
  key: 'sleep_quality',
  title: 'Как ты спал?',
  hint: 'Оцени качество сна',
  labels: ['Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'],
}

const MORNING_FOCUS_STEP = {
  key: 'focus',
  title: 'Уровень концентрации',
  hint: 'Где сейчас твоё внимание',
  labels: ['Рассеян', 'Плыву', 'Держусь', 'Собран', 'Кристально'],
}

export const MORNING_OPTIONAL_SCALES = [SLEEP_QUALITY_STEP, MORNING_FOCUS_STEP]

const DAY_FOCUS_MAX = 140

export function CheckInScaleQuestion({ scale, value, onPick }) {
  return (
    <CheckInQuestion title={scale.title} hint={scale.hint} className="mx-checkin-question--scale">
      <div
        className="mx-checkin-scale"
        role="radiogroup"
        aria-label={scale.title}
        data-testid="checkin-scale-row"
      >
        {scale.labels.map((label, index) => {
          const level = index + 1
          const active = value === level

          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${level}: ${label}`}
              data-testid="checkin-scale-option"
              data-level={level}
              onClick={() => onPick(level)}
              className={`mx-checkin-scale__option ${active ? 'is-selected' : ''}`}
            >
              <span className="mx-checkin-scale__circle">
                {scale.faces ? (
                  <span className="mx-checkin-scale__inner mx-checkin-scale__inner--face">
                    <Face level={level} active={active} size={35} showFrame={false} />
                  </span>
                ) : (
                  <span
                    className="mx-checkin-scale__inner"
                    style={
                      scale.key === 'energy'
                        ? {
                            background: `linear-gradient(to top, #e6e6e6 ${energyFillPercent(level)}%, #111 ${energyFillPercent(level)}%)`,
                          }
                        : undefined
                    }
                  />
                )}
              </span>
              <span className="mx-checkin-scale__label">
                {index === 0 || index === scale.labels.length - 1 ? label : ''}
              </span>
            </button>
          )
        })}
      </div>
    </CheckInQuestion>
  )
}

const LESSON_FIELDS = [
  {
    key: 'done',
    label: 'Что получилось?',
    placeholder: pickByDay(LESSON_PROMPTS.done),
  },
  {
    key: 'hard',
    label: 'Что было трудно?',
    placeholder: pickByDay(LESSON_PROMPTS.hard),
  },
  {
    key: 'lesson',
    label: 'Какой вывод забираешь?',
    placeholder: pickByDay(LESSON_PROMPTS.lesson),
  },
]

export const EMOTIONS = {
  1: ['подавлен', 'вымотан', 'тревожно', 'злюсь', 'пусто', 'одиноко', 'обидно', 'страшно'],
  2: ['устал', 'раздражён', 'рассеян', 'вяло', 'скучно', 'неспокойно', 'недоволен', 'растерян'],
  3: ['ровно', 'спокойно', 'задумчиво', 'нейтрально', 'собранно', 'терпимо', 'буднично'],
  4: ['бодро', 'доволен', 'тепло', 'включён', 'благодарен', 'уверенно', 'легко', 'спокойная сила'],
  5: ['воодушевлён', 'счастлив', 'свободен', 'горжусь', 'вдохновлён', 'силён', 'радостно', 'ясно'],
}

function existingLessons(value) {
  if (typeof value !== 'string') {
    return {}
  }

  return Object.fromEntries(
    LESSON_FIELDS.flatMap(field => {
      const prefix = `${field.label} `

      const line = value.split('\n').find(item => item.startsWith(prefix))

      return line ? [[field.key, line.slice(prefix.length)]] : []
    })
  )
}

function CheckInCore({
  user,
  onDone,
  onCompleted,
  onRecoveryExpired,
  recovery = null,
  mode = 'checkin',
  existing = null,
  redo = false,
}) {
  const isEvening = mode === 'evening' || Boolean(recovery)
  const previewDemoMode = isPreviewDemoMode()
  const skipScales = isEvening && (!!existing || Boolean(recovery))
  const fieldSource = redo ? null : existing

  /*
   * MXL-EVENTS: момент открытия флоу — единственное место, где backend
   * не может сам заметить «старт» (в отличие от завершения, которое
   * логируется атомарно внутри своих эндпоинтов). Один раз на монтирование,
   * best-effort — сбой логирования события не должен мешать самому чек-ину.
   */
  useEffect(() => {
    api.events
      .log(user.id, isEvening ? 'checkin_evening_start' : 'checkin_morning_start', 'checkin')
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [values, setValues] = useState(() => ({
    mood: fieldSource?.mood ?? (isEvening ? null : consumeMoodDraft()),
    energy: fieldSource?.energy ?? null,
    // Вечерний redo не переспрашивает anxiety/focus — переносим их
    // из перезаписываемой записи, иначе PUT затрёт значения утра.
    anxiety: (redo ? existing?.anxiety : fieldSource?.anxiety) ?? null,
    focus: (redo ? existing?.focus : fieldSource?.focus) ?? null,
  }))

  const [emotion, setEmotion] = useState(fieldSource?.emotion || null)

  const [savedCheckinId, setSavedCheckinId] = useState(null)

  const [scoutBusy, setScoutBusy] = useState(false)

  const [scoutError, setScoutError] = useState('')

  const [lessons, setLessons] = useState(() =>
    isEvening ? existingLessons(fieldSource?.lessons) : {}
  )

  const [morningDraft, setMorningDraft] = useState(() =>
    isEvening ? null : readCheckinDraft({ userId: user.id })
  )

  const [draftStatus, setDraftStatus] = useState(() =>
    !isEvening && draftHasContent(morningDraft) ? 'restored' : 'idle'
  )

  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false)

  const [savedMorningNote, setSavedMorningNote] = useState('')

  const [feedback, setFeedback] = useState(null)

  const [streak, setStreak] = useState(0)

  const [streakHistory, setStreakHistory] = useState([])
  const [surprise, setSurprise] = useState(null)
  const surpriseChecked = useRef(false)
  const surpriseEvents = useRef(new Set())

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState(false)

  // Альтер-эго: необязательная страница вечернего разбора.
  // Показывается только если у пользователя есть созданное альтер-эго.
  const [alterEgoName, setAlterEgoName] = useState(null)
  const [alterEgoAnswer, setAlterEgoAnswer] = useState('')

  useEffect(() => {
    if (!isEvening) return undefined

    // Синхронная проверка (localStorage) — мгновенно для тестов и вне Telegram.
    const syncList = loadAlterEgosSync()
    if (syncList.length > 0) {
      setAlterEgoName(syncList[0].name || null)
      return undefined
    }

    // Асинхронная проверка (CloudStorage) — для Telegram.
    let cancelled = false
    loadAlterEgos()
      .then(list => {
        if (!cancelled && list.length > 0) {
          setAlterEgoName(list[0].name || null)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [isEvening])

  const note = isEvening ? '' : morningDraftToNote(morningDraft)

  const scaleCount = skipScales ? 0 : MORNING_SCALE_STEPS.length

  const hasAlterEgo = Boolean(alterEgoName)
  const cardCount = isEvening ? LESSON_FIELDS.length + (hasAlterEgo ? 1 : 0) : 1

  const emotionStep = isEvening ? scaleCount : -1

  const totalSteps = isEvening ? scaleCount + 1 + cardCount : scaleCount + cardCount

  const doneStep = totalSteps

  const streakStep = doneStep + 1

  const [step, setStep] = useState(() =>
    isEvening && !redo && existing?.review_completed_at ? 1 : 0
  )

  const { style: viewportStyle } = useFullscreenSurface()

  /*
   * §6: во время горизонтального перехода (300 мс) повторная навигация
   * блокируется, чтобы не пропустить шаг и не сломать состояние.
   */
  const animatingRef = useRef(false)

  function goToStep(updater) {
    if (animatingRef.current) return
    setStep(updater)
  }

  function handleAnimatingChange(animating) {
    animatingRef.current = animating
  }

  function pick(key, level) {
    platform.haptic('light')

    // Выбор значения шкалы не двигает шаг: вперёд ведёт только
    // явное нажатие «Далее» (автопереход убран и здесь, и в утреннем флоу).
    setValues(current => ({
      ...current,
      [key]: level,
    }))
  }

  useEffect(() => {
    if (isEvening) {
      return undefined
    }

    if (!draftHasContent(morningDraft)) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      const saved = saveCheckinDraft({
        userId: user.id,
        draft: morningDraft,
      })

      setDraftStatus(saved ? 'saved' : 'error')
    }, 500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isEvening, morningDraft, user.id])

  function updateMorningDraft(patch) {
    setDraftStatus('pending')
    setMorningDraft(current => ({
      ...current,
      ...patch,
    }))
  }

  function requestClose() {
    if (!isEvening && draftHasContent(morningDraft)) {
      setCloseConfirmationOpen(true)
      return
    }

    onDone()
  }

  function closeWithDraft() {
    setCloseConfirmationOpen(false)
    onDone()
  }

  function buildNote() {
    if (isEvening) {
      return undefined
    }

    return note || undefined
  }

  function buildLessons() {
    if (!isEvening) {
      return undefined
    }

    const filled = LESSON_FIELDS.map(field => [field.label, (lessons[field.key] || '').trim()])
      .filter(([, text]) => text)
      .map(([label, text]) => `${label} ${text}`)

    if (hasAlterEgo && alterEgoAnswer.trim()) {
      filled.push(`Был ли ты сегодня ${alterEgoName}? ${alterEgoAnswer.trim()}`)
    }

    return filled.length ? filled.join('\n') : undefined
  }

  async function submit({ afterSave } = {}) {
    setSaving(true)
    setError(false)

    try {
      const saveApi = redo ? api.checkin.redo : api.checkin.save
      const selectedSaveApi = recovery
        ? (userId, payload) => withRetry(() => api.checkin.saveYesterday(userId, payload))
        : saveApi
      // Вечер (и повторный) не меняет утренние поля записи дня.
      const morning = isEvening ? eveningMorningFields(existing, values) : values
      const corePayload = {
        mood: morning.mood ?? 3,

        energy: morning.energy ?? 3,

        note: isEvening ? morning.note : buildNote(),

        emotion,

        lessons: buildLessons(),

        ...(isEvening
          ? {
              review_completed: true,
            }
          : {}),
      }
      if (morning.anxiety != null) corePayload.anxiety = morning.anxiety
      if (morning.focus != null) corePayload.focus = morning.focus
      const savedCheckin = await selectedSaveApi(user.id, corePayload)

      if (isEvening && !savedCheckin?.review_completed_at) {
        throw new Error('Backend не подтвердил закрытие дня')
      }
      onCompleted?.()
      if (recovery) {
        platform.haptic('success')
        onDone()
        return
      }

      // MXL-AI-HANDOFF-001: вечерний разбор сохраняется заранее, чтобы
      // хендофф к Следопыту мог отметить сегодняшнюю запись для AI-контекста.
      if (isEvening) {
        setSavedCheckinId(savedCheckin?.id ?? null)
      }

      if (!isEvening) {
        clearCheckinDraft({ userId: user.id })
        setSavedMorningNote(note)
        setMorningDraft({
          mode: 'brief',
          brief: '',
          fact: '',
          feeling: '',
          nextStep: '',
          free: '',
        })
        setDraftStatus('idle')
      }

      platform.haptic('success')

      if (afterSave) {
        afterSave()
      } else if (!isEvening) {
        try {
          const history = await api.checkin.history(user.id, 90)
          setStreakHistory(Array.isArray(history) ? history : [])
          setStreak(Math.max(1, currentCheckinStreak(Array.isArray(history) ? history : [])))
        } catch (historyError) {
          console.error(historyError)
        }

        setStep(streakStep)
      } else {
        setStep(doneStep)
      }
    } catch (error) {
      if (recovery && error?.status === 409) {
        onRecoveryExpired?.()
        return
      }
      console.error(error)
      setError(
        recovery && error?.status === 422
          ? 'Заверши вчерашний разбор и попробуй снова'
          : 'Не получилось сохранить — проверь связь'
      )
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!isEvening || step !== doneStep || surpriseChecked.current) return
    surpriseChecked.current = true
    let active = true
    maybeBuildSurprise(user).then(text => {
      if (!active || !text) return
      setSurprise(text)
      logOnce(surpriseEvents, 'shown', () =>
        api.events.log(user.id, 'surprise_insight_shown').catch(() => {})
      )
    })
    return () => {
      active = false
    }
  }, [isEvening, step, doneStep, user])

  function openSurprise() {
    if (
      !surprise ||
      !logOnce(surpriseEvents, 'opened', () =>
        api.events.log(user.id, 'surprise_insight_opened').catch(() => {})
      )
    )
      return
    sessionStorage.setItem(MENTOR_PERSONA_KEY, 'dnevnik')
    sessionStorage.setItem(SURPRISE_MESSAGE_KEY, surprise)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'mentor')
    window.location.href = url.toString()
  }

  async function openScout() {
    platform.haptic('medium')

    const canGrantAiContext = platform.name === 'telegram' && Number(user?.id) > 0

    if (canGrantAiContext) {
      const checkinId = savedCheckinId ?? existing?.id

      setScoutBusy(true)
      setScoutError('')

      try {
        if (!checkinId) {
          throw new Error('checkin_id_missing')
        }

        const consent = await api.mentalix.contextConsent(user.id)

        if (!consent?.enabled) {
          const granted = window.confirm(
            'Следопыт получит доступ к персональному контексту. Передавать можно только записи, отмеченные тобой: сейчас разрешится сегодняшний разбор — состояние, уроки и победы. Разрешить?'
          )

          if (!granted) {
            return
          }

          await api.mentalix.setContextConsent(user.id, true)
        }

        await api.mentalix.setCheckinContext(user.id, checkinId, true)
      } catch (error) {
        console.error(error)

        setScoutError('Не удалось разрешить разбор дня. Проверь соединение и попробуй ещё раз.')

        return
      } finally {
        setScoutBusy(false)
      }
    }

    try {
      sessionStorage.setItem(MENTOR_PERSONA_KEY, 'dnevnik')

      sessionStorage.setItem(MENTOR_DRAFT_KEY, DAY_REVIEW_PROMPT)
      sessionStorage.setItem(
        MENTOR_HANDOFF_KEY,
        JSON.stringify({ type: 'evening_review', date: seriesLogicalDateKey() })
      )
    } catch (error) {
      console.error(error)
    }

    const url = new URL(window.location.href)

    url.searchParams.set('tab', 'mentor')

    window.location.href = url.toString()
  }

  /*
   * Тот же переход-хендофф, что openScout(), но к Собеседнику
   * (mayak) с одним универсальным драфтом вместо разбора дня.
   * Отдельная функция, а не параметризация openScout() — вечерний
   * флоу к Следопыту (dnevnik) этим не затрагивается.
   */
  function openListener() {
    platform.haptic('medium')

    try {
      sessionStorage.setItem(MENTOR_PERSONA_KEY, 'mayak')

      sessionStorage.setItem(MENTOR_DRAFT_KEY, EMOTION_TALK_PROMPT)
    } catch (error) {
      console.error(error)
    }

    const url = new URL(window.location.href)

    url.searchParams.set('tab', 'mentor')

    window.location.href = url.toString()
  }

  async function deepenMorningNote() {
    if (!note.trim()) return

    await submit({
      afterSave: () => {
        try {
          sessionStorage.setItem(MENTOR_PERSONA_KEY, 'kompas')

          sessionStorage.setItem(
            MENTOR_DRAFT_KEY,
            [
              'Помоги мне пойти глубже в утренней записи.',
              `Моя мысль: ${note.trim()}`,
              'Не давай готовый совет сразу. Задай один точный вопрос, который поможет увидеть следующий шаг.',
            ].join('\n\n')
          )
        } catch (error) {
          console.error(error)
        }

        const url = new URL(window.location.href)

        url.searchParams.set('tab', 'mentor')

        window.location.href = url.toString()
      },
    })
  }

  // ============================================================
  // ФИНАЛ
  // ============================================================

  const isEmotionStep = isEvening && step === emotionStep

  const isCard = isEvening ? step > emotionStep : step >= scaleCount

  const isScaleStep = !isCard && !isEmotionStep
  const scale = skipScales ? null : MORNING_SCALE_STEPS[step]

  /*
   * Рассинхрон (P0): если existing изменился во время шага шкалы,
   * шаг может оказаться пустым (scale === null/undefined) или
   * за пределами нового layout. Пересчитываем: пропускаем пустой
   * шаг шкалы или зажимаем step в валидный диапазон — чтобы
   * пользователь не застрял на белом экране и не увидел финал
   * без сохранения.
   */
  useEffect(() => {
    const nextStep = resolveDesyncStep({
      step,
      doneStep,
      isScaleStep,
      scaleStepsLength: MORNING_SCALE_STEPS.length,
    })
    if (nextStep !== step) {
      setStep(nextStep)
    }
  }, [isScaleStep, step, doneStep])

  const cardIdx = isEvening ? step - emotionStep - 1 : step - scaleCount

  const isMorningNoteStep = !isEvening && isCard && cardIdx === 0

  const interactiveStyle = isMorningNoteStep
    ? {
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }
    : undefined

  const isCompletion = step === doneStep
  const teaserLogged = useRef(false)
  useEffect(() => {
    if (!isCompletion || teaserLogged.current) return
    teaserLogged.current = true
    logEngagementEvent({
      user,
      demo: previewDemoMode,
      event: 'teaser_shown',
      entityType: 'teaser',
      entityId: isEvening ? 'evening' : 'morning',
      hasSession: Boolean(platform.getSessionToken?.()),
      send: api.events.log,
    })
  }, [isCompletion, user, previewDemoMode, isEvening])

  const isStreakStep = !isEvening && step === streakStep

  const isFinal = isCompletion || isStreakStep

  function handleBack() {
    platform.haptic('light')

    if (isStreakStep || isCompletion) {
      onDone()
      return
    }

    if (step === 0) {
      requestClose()
      return
    }

    goToStep(current => current - 1)
  }

  const screenRef = useRef(null)

  /*
   * ДЕЙСТВИЯ ЖИВУТ В СИСТЕМНОЙ КНОПКЕ
   *
   * Она отрисована вне веб-вью и всегда остаётся над
   * клавиатурой. Именно из-за отсутствия этого свойства у
   * обычной кнопки чек-ин когда-то и потребовал портала,
   * пересчёта высоты и отдельной прокрутки.
   *
   * Здесь одно место, которое решает, что делает главная
   * кнопка на текущем шаге, — вместо четырёх разных кнопок,
   * разбросанных по разметке.
   */
  const mainAction = isStreakStep
    ? { text: 'Вернуться в Сегодня', run: onDone }
    : isCompletion
      ? isEvening
        ? { text: 'Закрыть', run: onDone }
        : { text: saving ? 'Сохраняю...' : 'Завершить', run: submit }
      : isEmotionStep
        ? {
            text: 'Дальше',
            run: () => goToStep(current => current + 1),
          }
        : isScaleStep
          ? {
              text: 'Далее',
              run: () => goToStep(current => current + 1),
              disabled: !values[scale?.key],
            }
          : isCard
            ? {
                text: saving
                  ? 'Сохраняю...'
                  : isEvening
                    ? cardIdx === cardCount - 1
                      ? recovery
                        ? 'Сохранить'
                        : 'Закрыть день'
                      : 'Дальше'
                    : 'Далее',
                run: () =>
                  isEvening
                    ? cardIdx < cardCount - 1
                      ? goToStep(current => current + 1)
                      : submit()
                    : goToStep(doneStep),
              }
            : null

  const skipAction = isFinal
    ? isEvening
      ? { text: 'Разобрать со Следопытом', run: openScout }
      : null
    : null

  const writingAction = isMorningNoteStep
    ? { text: saving ? 'Сохраняю...' : 'Завершить чек-ин', run: submit }
    : null

  const effectiveMainAction = mainAction || writingAction

  useMainButton({
    text: effectiveMainAction?.text || '',
    onClick: () => {
      platform.haptic('light')
      effectiveMainAction?.run()
    },
    visible: Boolean(effectiveMainAction) && isCompletion,
    enabled: !saving,
    loading: saving,
  })

  useSecondaryButton({
    text: skipAction?.text || '',
    onClick: () => {
      platform.haptic('light')
      skipAction?.run()
    },
    visible: Boolean(skipAction) && !saving && !isMorningNoteStep,
  })

  const webAction =
    effectiveMainAction && isCompletion
      ? {
          text: effectiveMainAction.text,
          ariaLabel:
            effectiveMainAction.text === 'Завершить'
              ? 'Сохранить и завершить'
              : effectiveMainAction.text,
          testId: isEvening ? 'checkin-save' : 'checkin-complete',
          onClick: effectiveMainAction.run,
          disabled: saving,
        }
      : null

  const webSecondaryAction =
    skipAction && isCompletion && !saving && !isMorningNoteStep
      ? { text: skipAction.text, testId: 'checkin-open-scout', onClick: skipAction.run }
      : null

  const compactStepAction = isEmotionStep
    ? () => goToStep(current => current + 1)
    : isScaleStep
      ? () => goToStep(current => current + 1)
      : null

  const compactStepDisabled = isEmotionStep
    ? !emotion
    : isScaleStep
      ? !values[MORNING_SCALE_STEPS[step]?.key]
      : false

  const streakDays = buildStreakDays(streakHistory, streak)

  if (isStreakStep) {
    return createPortal(
      <div ref={screenRef} className={FULLSCREEN_SHELL_CLASS} style={viewportStyle}>
        <div
          className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
        >
          <BackButton onClick={handleBack} label="Сегодня" />
        </div>
        <div className={FULLSCREEN_SCROLL_CLASS}>
          <div className={`${CHECKIN_CENTER_CLASS} justify-between`}>
            <section className="w-full flex flex-col items-center text-center pt-8">
              <StreakFlower />
              <h1 className="font-display text-[30px] font-bold leading-tight text-cream">
                {streak}-дневная серия.
              </h1>
              <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted">
                внутренняя работа — это путь. ты только что сделал ещё один шаг.
              </p>

              <div
                className="mt-10 grid w-full max-w-sm gap-2"
                style={{ gridTemplateColumns: `repeat(${streakDays.length}, minmax(0, 1fr))` }}
                role="group"
                aria-label="Дни текущей серии"
              >
                {streakDays.map(day => {
                  const active = day.completed || day.isToday

                  return (
                    <div key={day.isoDate} className="flex flex-col items-center gap-2">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                          active
                            ? 'border-cream bg-cream text-emerald-deep'
                            : 'border-cream/10 bg-emerald text-muted'
                        }`}
                        aria-label={`${day.label}: ${active ? 'пройдено' : 'пусто'}`}
                      >
                        {active ? <Flame size={17} strokeWidth={2.5} aria-hidden="true" /> : null}
                      </span>
                      <span className="text-[11px] text-muted">{day.label}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            <button
              type="button"
              data-testid="checkin-back-to-today"
              onClick={onDone}
              className="min-h-12 w-full max-w-sm rounded-full border-0 bg-cream px-6 py-3 text-[14px] font-bold text-emerald-deep"
            >
              Вернуться в Сегодня
            </button>
          </div>
        </div>
      </div>,
      getFullscreenPortalTarget()
    )
  }

  if (step >= doneStep) {
    return createPortal(
      <div
        ref={screenRef}
        className={`${FULLSCREEN_SHELL_CLASS} ${previewDemoMode ? 'mx-checkin-demo' : ''}`}
        style={viewportStyle}
      >
        <div
          className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center px-[var(--mx-screen-x)]`}
        >
          <BackButton onClick={handleBack} />
        </div>

        <div className={FULLSCREEN_SCROLL_CLASS}>
          <div className={CHECKIN_CENTER_CLASS}>
            <div className={CHECKIN_SUCCESS_CLASS}>
              <CompletionArt variant={isEvening ? 'evening' : 'morning'} />

              <h2 className="mx-checkin-completion-title">Готово.</h2>

              <div className="mt-7 w-full max-w-sm">
                <p className="text-[13px] text-muted">Было полезно?</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {CHECKIN_FEEDBACK_OPTIONS.map(option => {
                    const Icon = FEEDBACK_ICONS[option.value]

                    return (
                      <button
                        key={option.value}
                        type="button"
                        data-testid="checkin-feedback-option"
                        data-value={option.value}
                        onClick={() => {
                          platform.haptic('light')
                          setFeedback(option.label)
                          sendCheckinFeedback(
                            api.checkin.feedback,
                            savedCheckinId ?? existing?.id,
                            option.label
                          )
                        }}
                        className={`flex min-h-[102px] flex-col items-center justify-center gap-3 rounded-3xl border text-[14px] font-medium ${
                          feedback === option.label
                            ? 'border-[rgb(var(--c-line))] bg-[rgb(var(--c-line))] text-[rgb(var(--c-bg))]'
                            : 'border-[rgb(var(--c-border))] bg-emerald text-cream'
                        }`}
                      >
                        <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {scoutError && (
                <p role="alert" className="mt-4 text-[13px] text-red-300 leading-relaxed max-w-sm">
                  {scoutError}
                </p>
              )}
              {!isEvening && (
                <div className="mt-6 w-full max-w-sm rounded-3xl bg-emerald p-4 text-left">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-[12px] font-bold text-gold">
                      настроение: {SCALE_STEPS[0].labels[(values.mood || 3) - 1].toLowerCase()}
                    </span>
                    {emotion && (
                      <span className="rounded-full bg-cream/5 px-3 py-1 text-[12px] font-semibold text-muted">
                        {emotion}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted">
                    {savedMorningNote
                      ? 'Текст сохранён в сегодняшнем чек-ине.'
                      : 'Состояние сохранено без текстовой записи.'}
                  </p>
                  <p className="mt-2 text-[12px] text-muted">
                    Дальше — один добровольный шаг, который тебе сейчас подходит.
                  </p>
                </div>
              )}
              {isEvening && surprise ? (
                <div className="mt-6 w-full max-w-sm" data-testid="surprise-insight">
                  <p className="mx-type-meta text-muted">Следопыт кое-что заметил</p>
                  <p className="mx-type-body mt-2 text-cream">{surprise}</p>
                  <button
                    type="button"
                    data-testid="surprise-insight-open"
                    onClick={openSurprise}
                    className="mx-type-control mt-4 min-h-11 rounded-full border border-[rgb(var(--c-border))] px-5 text-cream"
                  >
                    Обсудить со Следопытом
                  </button>
                </div>
              ) : !isEvening ? (
                <p className="mx-type-body text-muted mt-6" data-testid="tomorrow-teaser">
                  {buildTomorrowTeaser({
                    streak,
                    checkins: streakHistory,
                    rituals: peekPracticesData(user.id)?.rituals,
                    ascezas: peekPracticesData(user.id)?.ascezas,
                    isEvening,
                  })}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <WebActionBar action={webAction} secondaryAction={webSecondaryAction} />
      </div>,
      getFullscreenPortalTarget()
    )
  }

  /*
   * Когда шкалы выключены (вечер поверх готового
   * чек-ина), шага «энергия» и «шум в голове» нет,
   * и брать их заголовки по индексу нельзя: подписи
   * уезжали на карточки уроков и гордости.
   */
  const moodLevel = values.mood || existing?.mood || 3

  const eveningQuestion =
    isEvening && isCard ? (cardIdx < LESSON_FIELDS.length ? LESSON_FIELDS[cardIdx] : null) : null
  const isAlterEgoCard = isEvening && isCard && hasAlterEgo && cardIdx === LESSON_FIELDS.length
  const questionTitle =
    scale?.title ||
    (isEmotionStep
      ? 'Что ближе всего к тому, что ты чувствуешь?'
      : isEvening
        ? eveningQuestion?.label || (isAlterEgoCard ? `Был ли ты сегодня ${alterEgoName}?` : '')
        : cardIdx === 0
          ? previewDemoMode
            ? 'Что сегодня важно не потерять?'
            : 'Что на уме?'
          : 'Чем горжусь')

  const questionSubtitle =
    scale?.hint ||
    (isEmotionStep
      ? null
      : isEvening
        ? isAlterEgoCard
          ? 'Когда получилось, а когда нет?'
          : 'Пара слов — уже разговор с собой. Можно пропустить.'
        : cardIdx === 0
          ? previewDemoMode
            ? 'Запиши одну мысль — коротко или подробно.'
            : 'Пара слов — уже разговор с собой.'
          : 'Три пункта. Мелочи считаются — из них и состоит день.')

  return createPortal(
    <div
      ref={screenRef}
      className={`${FULLSCREEN_SHELL_CLASS} ${previewDemoMode ? 'mx-checkin-demo' : ''}`}
      style={viewportStyle}
    >
      <div className={CHECKIN_HEADER_CLASS}>
        <BackButton onClick={handleBack} />
        {recovery && (
          <span className="text-[13px] text-muted" data-testid="streak-recovery-date">
            {yesterdayLabel(recovery.date)}
          </span>
        )}
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS} style={interactiveStyle}>
        <StepSlide stepKey={step} onAnimatingChange={handleAnimatingChange}>
          <div className={isCard ? CHECKIN_LONG_CLASS : CHECKIN_CENTER_CLASS}>
            {!isScaleStep && (
              <CheckInQuestion
                title={questionTitle}
                hint={questionSubtitle}
                headingAs="h2"
                className={isCard ? 'w-full text-left' : CHECKIN_QUESTION_CLASS}
                headingClassName={[
                  'font-display text-cream',
                  isMorningNoteStep
                    ? 'text-[30px] leading-[1.12]'
                    : isEmotionStep
                      ? 'text-[22px] font-semibold leading-[1.3]'
                      : isEvening && isCard
                        ? 'text-[22px] font-bold leading-[1.2]'
                        : 'text-[26px] leading-tight',
                ].join(' ')}
                hintClassName={[
                  'text-[14px] text-muted',
                  isMorningNoteStep
                    ? 'mt-5 border-l border-gold pl-4 leading-relaxed'
                    : isEvening && isCard
                      ? 'mt-[6px] text-[15px]'
                      : 'mt-2',
                ].join(' ')}
              />
            )}

            <div
              className={
                isCard
                  ? `${isMorningNoteStep ? 'w-full pt-6' : CHECKIN_INTERACTIVE_CLASS} flex flex-1 flex-col`
                  : CHECKIN_INTERACTIVE_CLASS
              }
            >
              {/* ── шкалы ── */}

              {isScaleStep && scale && (
                <div key={step} className="w-full flex flex-col items-center">
                  <CheckInScaleQuestion
                    scale={scale}
                    value={values[scale.key]}
                    onPick={level => pick(scale.key, level)}
                  />
                </div>
              )}

              {/* ── эмоции ── */}

              {isEmotionStep && (
                <EmotionStep
                  key="emo"
                  initialLevel={moodLevel}
                  emotion={emotion}
                  onEmotionChange={setEmotion}
                  onHeavyEmotionClick={openListener}
                  testId="checkin-emotion-pill"
                />
              )}

              {/* ── уроки / мысль ── */}
              {isCard && cardIdx < LESSON_FIELDS.length && (
                <div key="c1" className="w-full flex flex-1 flex-col items-center">
                  {isEvening ? (
                    <div className="w-full max-w-md mx-auto flex min-h-0 flex-1 flex-col">
                      <JournalTextarea
                        value={lessons[eveningQuestion.key] || ''}
                        onChange={value =>
                          setLessons(current => ({ ...current, [eveningQuestion.key]: value }))
                        }
                        placeholder={eveningQuestion.placeholder}
                        ariaLabel={eveningQuestion.label}
                        testId="checkin-text-input"
                        className="min-h-[18rem] flex-1"
                        editorClassName="mx-checkin-evening-editor"
                        floatingToolbar
                        guidedFlow
                        autoFocus
                        keepFocusOnSubmit
                        submitIcon="arrow"
                        submitLabel={recovery && cardIdx === cardCount - 1 ? 'Сохранить' : 'Далее'}
                        submitTestId={
                          recovery && cardIdx === cardCount - 1 ? 'checkin-save' : 'checkin-next'
                        }
                        onSubmit={() =>
                          cardIdx < cardCount - 1 ? goToStep(current => current + 1) : submit()
                        }
                        onDeepen={() => {}}
                        deepenLabel="Пойти глубже"
                        submitLoading={saving}
                        formatting
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-md mx-auto flex min-h-0 flex-1 flex-col">
                      <p
                        role="status"
                        aria-live="polite"
                        className="min-h-5 mt-3 text-[12px] text-muted"
                      >
                        {draftStatus === 'pending'
                          ? 'Есть несохранённая запись'
                          : draftStatus === 'saved'
                            ? 'Черновик сохранён локально'
                            : draftStatus === 'restored'
                              ? 'Черновик восстановлен на этом устройстве'
                              : draftStatus === 'error'
                                ? 'Не удалось сохранить черновик локально'
                                : 'Текст сохраняется только после завершения чек-ина'}
                      </p>
                      <JournalTextarea
                        value={morningDraft?.brief || ''}
                        onChange={value => updateMorningDraft({ mode: 'brief', brief: value })}
                        placeholder={previewDemoMode ? 'Начни писать' : MORNING_NOTE_PLACEHOLDER}
                        ariaLabel="Что на уме"
                        testId="checkin-text-input"
                        className="min-h-[18rem] flex-1"
                        editorClassName="pb-24"
                        floatingToolbar
                        guidedFlow={previewDemoMode}
                        autoFocus
                        keepFocusOnSubmit={previewDemoMode}
                        submitIcon="arrow"
                        onSubmit={() => submit()}
                        submitLabel="Завершить чек-ин"
                        submitTestId="checkin-complete"
                        submitLoading={saving}
                        onDeepen={deepenMorningNote}
                        showAddAction
                      />
                    </div>
                  )}
                  {error && <p className="text-[13px] text-muted text-center mt-4">{error}</p>}
                </div>
              )}

              {/* ── альтер-эго (последняя страница разбора) ── */}
              {isCard && isAlterEgoCard && (
                <div key="alter-ego" className="w-full flex flex-1 flex-col items-center">
                  <div className="w-full max-w-md mx-auto flex min-h-0 flex-1 flex-col">
                    <JournalTextarea
                      value={alterEgoAnswer}
                      onChange={setAlterEgoAnswer}
                      placeholder="Начни писать…"
                      ariaLabel={`Был ли ты сегодня ${alterEgoName}?`}
                      testId="alter-ego-evening-input"
                      className="min-h-[18rem] flex-1"
                      editorClassName="mx-checkin-evening-editor"
                      floatingToolbar
                      guidedFlow
                      autoFocus
                      keepFocusOnSubmit
                      submitIcon="arrow"
                      submitLabel="Закрыть день"
                      submitTestId="checkin-save"
                      onSubmit={() => submit()}
                      onDeepen={() => {}}
                      deepenLabel="Пойти глубже"
                      submitLoading={saving}
                      formatting
                    />
                  </div>
                  {error && <p className="text-[13px] text-muted text-center mt-4">{error}</p>}
                </div>
              )}
            </div>
          </div>
        </StepSlide>
      </div>

      {closeConfirmationOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkin-draft-dialog-title"
          aria-describedby="checkin-draft-dialog-description"
          className="fixed inset-0 z-[90] flex items-end bg-black/70 p-5 sm:items-center"
        >
          <div className="w-full max-w-md mx-auto rounded-[28px] bg-emerald p-6 shadow-xl animate-fade-in">
            <h2 id="checkin-draft-dialog-title" className="font-display text-[22px] text-cream">
              Закрыть запись?
            </h2>
            <p
              id="checkin-draft-dialog-description"
              className="mt-3 text-[14px] leading-relaxed text-muted"
            >
              Есть несохранённая запись. Черновик останется только на этом устройстве и не будет
              выдан за сохранённую запись.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setCloseConfirmationOpen(false)}
                className="min-h-12 rounded-full bg-cream px-4 text-[14px] font-semibold text-emerald-deep"
              >
                Продолжить
              </button>
              <button
                type="button"
                onClick={closeWithDraft}
                className="min-h-12 rounded-full border border-cream/15 px-4 text-[14px] font-semibold text-cream"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {!isCompletion && compactStepAction ? (
        <CheckInNextControls
          onNext={compactStepAction}
          disabled={compactStepDisabled}
          onSkip={isScaleStep ? () => goToStep(current => current + 1) : null}
          variant={isEmotionStep ? 'emotion' : 'scale'}
        />
      ) : null}
      <WebActionBar action={webAction} secondaryAction={webSecondaryAction} />
    </div>,
    getFullscreenPortalTarget()
  )
}

function CheckIn({
  user,
  onDone,
  onCompleted,
  onRecoveryExpired,
  recovery = null,
  mode = 'checkin',
  existing = null,
  redo = false,
}) {
  if (mode !== 'evening') {
    return (
      <MorningCheckInFlow
        user={user}
        onDone={onDone}
        onCompleted={onCompleted}
        redo={redo}
        existing={redo ? null : existing}
      />
    )
  }

  return (
    <CheckInCore
      user={user}
      onDone={onDone}
      onCompleted={onCompleted}
      onRecoveryExpired={onRecoveryExpired}
      recovery={recovery}
      mode={mode}
      existing={existing}
      redo={redo}
    />
  )
}

export default CheckIn
