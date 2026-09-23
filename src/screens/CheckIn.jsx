import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { MotifArt } from '../components/Motif'
import { api } from '../lib/api'
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
import {
  clearCheckinDraft,
  draftHasContent,
  morningDraftToNote,
  readCheckinDraft,
  saveCheckinDraft,
} from '../lib/checkinDraft'
import { isPreviewDemoMode } from '../lib/demoMode'
import { currentCheckinStreak } from '../lib/series'
import { energyFillPercent } from '../lib/checkinScale'
import { resolveDesyncStep } from '../lib/checkinDesync'
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

function CheckInNextControls({ onNext, disabled = false, onSkip = null }) {
  return (
    <div className="mx-checkin-next-controls">
      {onSkip ? (
        <button type="button" className="mx-checkin-next-controls__skip" onClick={onSkip}>
          Пропустить
        </button>
      ) : null}
      <button
        type="button"
        className="mx-checkin-next-controls__next"
        aria-label="Далее"
        onClick={onNext}
        disabled={disabled}
      >
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

function CheckInCompletionArt() {
  return (
    <svg
      viewBox="0 0 120 136"
      role="img"
      aria-label="Птица с пером и карандашом"
      className="mx-demo-checkin__bird"
      fill="none"
    >
      <path
        d="M41 62c4-11 14-18 27-19 11-1 20 3 27 11-8 12-23 18-37 15-8-1-14-4-17-7Z"
        fill="rgb(var(--c-text))"
      />
      <path d="M93 52 105 57l-13 4" fill="rgb(var(--c-text))" />
      <path d="M69 43c-3-13 2-25 14-32 8 13 5 27-7 35" fill="rgb(var(--c-text))" />
      <circle cx="82" cy="17" r="3" fill="rgb(var(--c-bg))" />
      <path
        d="M57 53c10-7 20-8 30-3"
        stroke="rgb(var(--c-bg))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M24 83 91 70l6 12-68 15-9-7 4-7Z" fill="rgb(var(--c-text))" />
      <path d="m91 70 12 6-6 6-6-12Z" fill="rgb(var(--c-gold))" />
      <path d="m29 97 14 4-19 8 5-12Z" fill="rgb(var(--c-muted))" />
      <path
        d="M32 108c11 1 24 5 38 13"
        stroke="rgb(var(--c-text))"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M39 107c13 2 25 6 36 13"
        stroke="rgb(var(--c-text))"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
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
function MorningCheckInFlow({ user, onDone }) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({ mood: null, energy: null, anxiety: null, focus: null })
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [streak, setStreak] = useState(0)
  const [streakHistory, setStreakHistory] = useState([])
  const { style: viewportStyle } = useFullscreenSurface()
  const demoSurfaceStyle = {
    ...viewportStyle,
    paddingTop: 0,
    paddingBottom: 0,
  }
  const scale = step < MORNING_SCALE_STEPS.length ? MORNING_SCALE_STEPS[step] : null
  const noteStep = MORNING_SCALE_STEPS.length
  const doneStep = noteStep + 1
  const streakStep = doneStep + 1

  function handleBack() {
    platform.haptic('light')

    if (step === streakStep || step === doneStep || step === 0) {
      onDone()
      return
    }

    setStep(current => Math.max(0, current - 1))
  }

  function pick(key, level) {
    platform.haptic('light')
    setValues(current => ({ ...current, [key]: level }))
    window.setTimeout(() => {
      setStep(current => current + 1)
    }, 280)
  }

  async function finish() {
    setSaving(true)
    setError('')
    try {
      await api.checkin.save(user.id, {
        mood: values.mood || 3,
        energy: values.energy || 3,
        anxiety: values.anxiety || 3,
        focus: values.focus || 3,
        note: note.trim() || undefined,
        emotion: undefined,
      })
      platform.haptic('success')
      try {
        const history = await api.checkin.history(user.id, 90)
        setStreakHistory(Array.isArray(history) ? history : [])
        setStreak(Math.max(1, currentCheckinStreak(Array.isArray(history) ? history : [])))
      } catch (historyError) {
        console.error(historyError)
      }
      setStep(streakStep)
    } catch (saveError) {
      console.error(saveError)
      setError('Не удалось сохранить. Попробуй ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  const action =
    step === streakStep
      ? { text: 'Вернуться в Сегодня', onClick: onDone }
      : step === noteStep
        ? { text: 'Продолжить', onClick: () => setStep(doneStep), disabled: !note.trim() }
        : step === doneStep
          ? {
              text: saving ? 'Сохраняю…' : 'Завершить',
              onClick: finish,
              disabled: saving,
            }
          : { text: 'Продолжить', onClick: () => setStep(current => current + 1), disabled: false }

  useMainButton({
    text: action.text,
    onClick: action.onClick,
    visible: step === doneStep || step === streakStep,
    enabled: !action.disabled,
    loading: saving,
  })

  useSecondaryButton({ text: '', onClick: () => {}, visible: false })

  return createPortal(
    <div className="mx-demo-checkin" style={demoSurfaceStyle}>
      <header className="mx-demo-checkin__header">
        <BackButton onClick={handleBack} label="Сегодня" />
      </header>

      <main className={`mx-demo-checkin__body ${step === noteStep ? 'is-editor' : ''}`}>
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
              className="mx-demo-checkin__editor"
              editorClassName="pb-28"
              floatingToolbar
              guidedFlow
              autoFocus
              keepFocusOnSubmit
              submitIcon="arrow"
              submitLabel="Далее"
              onSubmit={() => setStep(doneStep)}
              onDeepen={() => {}}
              deepenLabel="Пойти глубже"
              showAddAction
              formatting
            />
          </CheckInQuestion>
        )}

        {step === doneStep && (
          <section className="mx-demo-checkin__scene mx-demo-checkin__scene--complete">
            <CheckInCompletionArt />
            <h1>
              Утренний чек-ин
              <strong>завершён.</strong>
            </h1>
            <p className="mx-demo-checkin__feedback-prompt">
              Эта практика помогла остановиться и заметить важное?
            </p>
            <div className="mx-demo-checkin__feedback">
              {[
                ['Нет', ThumbsDown],
                ['Немного', Hand],
                ['Да', ThumbsUp],
              ].map(([item, Icon]) => (
                <button
                  key={item}
                  type="button"
                  className={feedback === item ? 'is-selected' : ''}
                  onClick={() => setFeedback(item)}
                >
                  <Icon size={42} strokeWidth={1.7} aria-hidden="true" />
                  {item}
                </button>
              ))}
            </div>
            {error && (
              <p role="alert" className="mx-demo-checkin__error">
                {error}
              </p>
            )}
          </section>
        )}

        {step === streakStep && (
          <section className="mx-demo-checkin__scene mx-demo-checkin__scene--complete">
            <StreakFlower />
            <h1>{streak}-дневная серия.</h1>
            <p>внутренняя работа — это путь. ты только что сделал ещё один шаг.</p>
            <div
              className="mt-6 grid w-full max-w-sm gap-2"
              style={{
                gridTemplateColumns: `repeat(${buildStreakDays(streakHistory, streak).length}, minmax(0, 1fr))`,
              }}
              role="group"
              aria-label="Дни текущей серии"
            >
              {buildStreakDays(streakHistory, streak).map(day => {
                const active = day.completed || day.isToday
                return (
                  <div key={day.isoDate} className="flex flex-col items-center gap-1">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border ${active ? 'border-cream bg-cream text-emerald-deep' : 'border-cream/10 bg-emerald text-muted'}`}
                    >
                      {active ? <Flame size={15} aria-hidden="true" /> : null}
                    </span>
                    <span className="text-[10px] text-muted">{day.label}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
      {step < noteStep ? (
        <CheckInNextControls
          onNext={() => setStep(current => Math.min(doneStep, current + 1))}
          disabled={step < noteStep ? !values[MORNING_SCALE_STEPS[step].key] : !note.trim()}
          onSkip={
            step < noteStep ? () => setStep(current => Math.min(doneStep, current + 1)) : null
          }
        />
      ) : null}
      {step === doneStep || step === streakStep ? (
        <WebActionBar action={action} className="mx-demo-checkin__action-bar" />
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

export function CheckInScaleQuestion({ scale, value, onPick }) {
  return (
    <CheckInQuestion title={scale.title} hint={scale.hint} className="mx-checkin-question--scale">
      <div className="mx-checkin-scale" role="radiogroup" aria-label={scale.title}>
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

const EMOTIONS = {
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

function CheckInCore({ user, onDone, mode = 'checkin', existing = null }) {
  const isEvening = mode === 'evening'
  const previewDemoMode = isPreviewDemoMode()
  const skipScales = isEvening && !!existing

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
    mood: existing?.mood ?? (isEvening ? null : consumeMoodDraft()),
    energy: existing?.energy ?? null,
    anxiety: existing?.anxiety ?? null,
    focus: existing?.focus ?? null,
  }))

  const [emotion, setEmotion] = useState(existing?.emotion || null)

  const [showAllEmotions, setShowAllEmotions] = useState(false)

  const [savedCheckinId, setSavedCheckinId] = useState(null)

  const [scoutBusy, setScoutBusy] = useState(false)

  const [scoutError, setScoutError] = useState('')

  const [lessons, setLessons] = useState(() =>
    isEvening ? existingLessons(existing?.lessons) : {}
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

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState(false)

  const note = isEvening ? '' : morningDraftToNote(morningDraft)

  const scaleCount = skipScales ? 0 : MORNING_SCALE_STEPS.length

  const cardCount = isEvening ? LESSON_FIELDS.length : 1

  const emotionStep = isEvening ? scaleCount : -1

  const totalSteps = isEvening ? scaleCount + 1 + cardCount : scaleCount + cardCount

  const doneStep = totalSteps

  const streakStep = doneStep + 1

  const [step, setStep] = useState(() => (isEvening && existing?.review_completed_at ? 1 : 0))

  const { style: viewportStyle } = useFullscreenSurface()

  function pick(key, level) {
    platform.haptic('light')

    setValues(current => ({
      ...current,
      [key]: level,
    }))
    if (!isEvening) {
      window.setTimeout(() => {
        setStep(current => current + 1)
      }, 280)
    }
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

    return filled.length ? filled.join('\n') : undefined
  }

  async function submit({ afterSave } = {}) {
    setSaving(true)
    setError(false)

    try {
      const savedCheckin = await api.checkin.save(user.id, {
        mood: values.mood ?? 3,

        energy: values.energy ?? 3,

        anxiety: values.anxiety ?? 3,

        focus: values.focus ?? 3,

        note: buildNote(),

        emotion,

        lessons: buildLessons(),

        ...(isEvening
          ? {
              review_completed: true,
            }
          : {}),
      })

      if (isEvening && !savedCheckin?.review_completed_at) {
        throw new Error('Backend не подтвердил закрытие дня')
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
      console.error(error)

      setError(true)
    } finally {
      setSaving(false)
    }
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

    setStep(current => current - 1)
  }

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
        ? { text: 'Разобрать со Следопытом', run: openScout }
        : { text: saving ? 'Сохраняю...' : 'Завершить', run: submit }
      : isEmotionStep
        ? {
            text: 'Дальше',
            run: () => setStep(step + 1),
          }
        : isScaleStep
          ? {
              text: 'Далее',
              run: () => setStep(step + 1),
              disabled: !values[scale?.key],
            }
          : isCard
            ? {
                text: saving
                  ? 'Сохраняю...'
                  : isEvening
                    ? cardIdx === cardCount - 1
                      ? 'Закрыть день'
                      : 'Дальше'
                    : 'Далее',
                run: () =>
                  isEvening
                    ? cardIdx < cardCount - 1
                      ? setStep(step + 1)
                      : submit()
                    : setStep(doneStep),
              }
            : null

  const skipAction = isFinal ? (isEvening ? { text: 'Ко сну', run: onDone } : null) : null

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
          onClick: effectiveMainAction.run,
          disabled: saving,
        }
      : null

  const webSecondaryAction =
    skipAction && isCompletion && !saving && !isMorningNoteStep
      ? { text: skipAction.text, onClick: skipAction.run }
      : null

  const compactStepAction = isEmotionStep
    ? () => setStep(step + 1)
    : isScaleStep
      ? () => setStep(step + 1)
      : null

  const compactStepDisabled = isEmotionStep
    ? !emotion
    : isScaleStep
      ? !values[MORNING_SCALE_STEPS[step]?.key]
      : false

  const streakDays = buildStreakDays(streakHistory, streak)

  if (isStreakStep) {
    return createPortal(
      <div className={FULLSCREEN_SHELL_CLASS} style={viewportStyle}>
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
              <CheckInCompletionArt />

              <h2 className="mx-checkin-completion-title">
                {isEvening ? 'Разбор дня' : 'Утренний чек-ин'}
                <strong>завершён.</strong>
              </h2>

              {
                <div className="mt-7 w-full max-w-sm">
                  <p className="text-[13px] text-muted">
                    Чек-ин помог остановиться и заметить важное?
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      ['Нет', ThumbsDown],
                      ['Немного', Hand],
                      ['Да', ThumbsUp],
                    ].map(([label, Icon]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFeedback(label)}
                        className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border text-[12px] ${
                          feedback === label
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-cream/10 bg-emerald text-muted'
                        }`}
                      >
                        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              }

              {isEvening && (
                <div className="mt-6 rounded-full border border-cream/10 bg-emerald px-4 py-2 text-[14px] font-semibold text-cream">
                  Сохранить
                </div>
              )}

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
                      ? 'Текст сохранён в сегодняшнем check-in.'
                      : 'Состояние сохранено без текстовой записи.'}
                  </p>
                  <p className="mt-2 text-[12px] text-muted">
                    Дальше — один добровольный шаг, который тебе сейчас подходит.
                  </p>
                </div>
              )}
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
  const scale = skipScales ? null : MORNING_SCALE_STEPS[step]

  const moodLevel = values.mood || existing?.mood || 3
  const emotionOptions = Array.from(new Set(Object.values(EMOTIONS).flat()))
  const visibleEmotionOptions = showAllEmotions
    ? emotionOptions
    : EMOTIONS[moodLevel] || EMOTIONS[3]

  const eveningQuestion =
    isEvening && isCard ? (cardIdx < LESSON_FIELDS.length ? LESSON_FIELDS[cardIdx] : null) : null
  const questionTitle =
    scale?.title ||
    (isEmotionStep
      ? 'Какой был день?'
      : isEvening
        ? eveningQuestion.label
        : cardIdx === 0
          ? previewDemoMode
            ? 'Что сегодня важно не потерять?'
            : 'Что на уме?'
          : 'Чем горжусь')

  const questionSubtitle =
    scale?.hint ||
    (isEmotionStep
      ? 'Назвать чувство — половина работы с ним.'
      : isEvening
        ? 'Пара слов — уже разговор с собой. Можно пропустить.'
        : cardIdx === 0
          ? previewDemoMode
            ? 'Запиши одну мысль — коротко или подробно.'
            : 'Пара слов — уже разговор с собой.'
          : 'Три пункта. Мелочи считаются — из них и состоит день.')

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} ${previewDemoMode ? 'mx-checkin-demo' : ''}`}
      style={viewportStyle}
    >
      <div className={CHECKIN_HEADER_CLASS}>
        <BackButton onClick={handleBack} />
      </div>

      <div className={FULLSCREEN_SCROLL_CLASS} style={interactiveStyle}>
        <div
          key={step}
          className={`${isCard ? CHECKIN_LONG_CLASS : CHECKIN_CENTER_CLASS} mx-checkin-step-enter`}
        >
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
              <div key="emo" className="w-full flex flex-col items-center">
                <div className="mx-checkin-emotion-grid">
                  {visibleEmotionOptions.map(item => {
                    const active = emotion === item

                    return (
                      <button
                        key={item}
                        onClick={() => {
                          platform.haptic('light')

                          setEmotion(active ? null : item)
                        }}
                        className={`mx-checkin-emotion-button ${active ? 'is-selected' : ''}`}
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </button>
                    )
                  })}
                </div>

                {!showAllEmotions && (
                  <button
                    type="button"
                    className="mx-checkin-emotion-more"
                    onClick={() => setShowAllEmotions(true)}
                  >
                    Показать ещё
                  </button>
                )}

                {HEAVY_EMOTIONS.includes(emotion) && (
                  <button
                    onClick={openListener}
                    className="mt-6 text-[13px] font-semibold text-gold bg-transparent border-0"
                  >
                    Поговорить об этом с Собеседником →
                  </button>
                )}
              </div>
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
                      className="min-h-[18rem] flex-1"
                      editorClassName="mx-checkin-evening-editor"
                      floatingToolbar
                      guidedFlow
                      autoFocus
                      keepFocusOnSubmit
                      submitIcon="arrow"
                      submitLabel="Далее"
                      onSubmit={() => (cardIdx < cardCount - 1 ? setStep(step + 1) : submit())}
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
                      className="min-h-[18rem] flex-1"
                      editorClassName="pb-24"
                      floatingToolbar
                      guidedFlow={previewDemoMode}
                      autoFocus
                      keepFocusOnSubmit={previewDemoMode}
                      submitIcon="arrow"
                      onSubmit={() => submit()}
                      submitLabel="Завершить чек-ин"
                      submitLoading={saving}
                      onDeepen={deepenMorningNote}
                      showAddAction
                    />
                  </div>
                )}
                {error && (
                  <p className="text-[13px] text-muted text-center mt-4">
                    Не получилось сохранить — проверь связь
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
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
          onSkip={isScaleStep ? () => setStep(step + 1) : null}
        />
      ) : null}
      <WebActionBar action={webAction} secondaryAction={webSecondaryAction} />
    </div>,
    getFullscreenPortalTarget()
  )
}

function CheckIn({ user, onDone, mode = 'checkin', existing = null }) {
  if (mode !== 'evening') {
    return <MorningCheckInFlow user={user} onDone={onDone} />
  }

  return <CheckInCore user={user} onDone={onDone} mode={mode} existing={existing} />
}

export default CheckIn
