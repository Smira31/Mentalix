import {
  useEffect,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { api } from '../lib/api'
import { X, ChevronLeft } from 'lucide-react'
import { MotifArt } from '../components/Motif'
import JournalTextarea from '../components/JournalTextarea'
import WebActionBar from '../components/WebActionBar'
import { pickByDay, MORNING_NOTE_PROMPTS, LESSON_PROMPTS } from '../data/prompts'
import {
  useMainButton,
  useSecondaryButton,
} from '../platform/telegram.hooks'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'


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
  'w-full flex-1 px-6 py-6 flex flex-col items-center justify-center'

const CHECKIN_LONG_CLASS =
  'w-full min-h-full flex-1 px-6 pt-4 pb-2 flex flex-col items-center'

const CHECKIN_QUESTION_CLASS =
  'w-full text-center'

const CHECKIN_INTERACTIVE_CLASS =
  'w-full pt-7'

const CHECKIN_SUCCESS_CLASS =
  'w-full flex flex-col items-center text-center'

const CHECKIN_HEADER_CLASS =
  `${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center justify-between px-5`


// ── Чек-ин и вечерний «Анализ дня» ──
// Утром: четыре шкалы + короткая мысль → note.
// Вечером: шкалы (если ещё не отмечался) + две карточки —
// «Уроки дня» → lessons и «Чем горжусь» → wins.
//
// Утро и вечер пишут в одну строку за день, но в разные поля.
// Поле, которому нечего сказать, не отправляется вовсе: бэкенд
// сохраняет прежнее значение, и вечер не затирает утро.


function Face({
  level,
  active,
  size = 56,
}) {
  const mouths = [
    'M18 40 Q28 32 38 40',
    'M18 38 Q28 35 38 38',
    'M18 38 H38',
    'M18 36 Q28 42 38 36',
    'M16 34 Q28 46 40 34',
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
    >
      <circle
        cx="28"
        cy="28"
        r="26"
        className={
          active
            ? 'stroke-gold'
            : 'stroke-cream/25'
        }
        strokeWidth="2.5"
      />

      <circle
        cx="20"
        cy="22"
        r="2.4"
        className={
          active
            ? 'fill-gold'
            : 'fill-cream/40'
        }
      />

      <circle
        cx="36"
        cy="22"
        r="2.4"
        className={
          active
            ? 'fill-gold'
            : 'fill-cream/40'
        }
      />

      <path
        d={mouths[level - 1]}
        className={
          active
            ? 'stroke-gold'
            : 'stroke-cream/40'
        }
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}


const SCALE_STEPS = [
  {
    key: 'mood',
    title: 'Как ты сейчас?',
    hint: 'Честный ответ важнее красивого',
    labels: [
      'Тяжко',
      'Так себе',
      'Нормально',
      'Хорошо',
      'Отлично',
    ],
    faces: true,
  },
  {
    key: 'energy',
    title: 'Сколько в тебе энергии?',
    hint: 'Прислушайся к телу',
    labels: [
      'На нуле',
      'Мало',
      'Средне',
      'Много',
      'Через край',
    ],
  },
  {
    key: 'anxiety',
    title: 'Сколько шума в голове?',
    hint: 'Тревога — это просто данные',
    labels: [
      'Тихо',
      'Слегка',
      'Заметно',
      'Сильно',
      'Штормит',
    ],
  },
  {
    key: 'focus',
    title: 'Насколько ты собран?',
    hint: 'Где сейчас твоё внимание',
    labels: [
      'Рассеян',
      'Плыву',
      'Держусь',
      'Собран',
      'Кристально',
    ],
  },
]


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
  1: [
    'подавлен',
    'вымотан',
    'тревожно',
    'злюсь',
    'пусто',
    'одиноко',
    'обидно',
    'страшно',
  ],
  2: [
    'устал',
    'раздражён',
    'рассеян',
    'вяло',
    'скучно',
    'неспокойно',
    'недоволен',
    'растерян',
  ],
  3: [
    'ровно',
    'спокойно',
    'задумчиво',
    'нейтрально',
    'собранно',
    'терпимо',
    'буднично',
  ],
  4: [
    'бодро',
    'доволен',
    'тепло',
    'включён',
    'благодарен',
    'уверенно',
    'легко',
    'спокойная сила',
  ],
  5: [
    'воодушевлён',
    'счастлив',
    'свободен',
    'горжусь',
    'вдохновлён',
    'силён',
    'радостно',
    'ясно',
  ],
}


const PROUD_HINTS = [
  'Что сделал, хотя не хотелось?',
  'Где повёл себя так, как хочешь?',
  'Что заметил в себе хорошего?',
]


function existingLessons(value) {
  if (typeof value !== 'string') {
    return {}
  }

  return Object.fromEntries(
    LESSON_FIELDS.flatMap(
      (field) => {
        const prefix =
          `${field.label} `

        const line = value
          .split('\n')
          .find((item) =>
            item.startsWith(prefix),
          )

        return line
          ? [[
              field.key,
              line.slice(prefix.length),
            ]]
          : []
      },
    ),
  )
}


function existingProud(value) {
  let items = []

  if (Array.isArray(value)) {
    items = value
  } else if (
    typeof value === 'string'
    && value.trim()
  ) {
    try {
      const parsed = JSON.parse(value)

      items = Array.isArray(parsed)
        ? parsed
        : [value]
    } catch {
      items = value.split('\n')
    }
  }

  return [
    ...items.slice(0, 3),
    '',
    '',
    '',
  ].slice(0, 3)
}


export default function CheckIn({
  user,
  onDone,
  mode = 'checkin',
  existing = null,
}) {
  const isEvening =
    mode === 'evening'

  const skipScales =
    isEvening && !!existing

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


  const [values, setValues] =
    useState({
      mood:
        existing?.mood ?? null,
      energy:
        existing?.energy ?? null,
      anxiety:
        existing?.anxiety ?? null,
      focus:
        existing?.focus ?? null,
    })


  const [emotion, setEmotion] =
    useState(
      existing?.emotion || null,
    )

  const [lessons, setLessons] =
    useState(() =>
      isEvening
        ? existingLessons(
            existing?.lessons,
          )
        : {},
    )

  const [proud, setProud] =
    useState(() =>
      isEvening
        ? existingProud(
            existing?.wins,
          )
        : ['', '', ''],
    )

  const [note, setNote] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState(false)


  const scaleCount =
    skipScales
      ? 0
      : SCALE_STEPS.length

  const cardCount =
    isEvening
      ? 2
      : 1

  const emotionStep =
    scaleCount

  const totalSteps =
    scaleCount
    + 1
    + cardCount

  const doneStep =
    totalSteps


  const [step, setStep] =
    useState(() =>
      isEvening
      && existing
        ?.review_completed_at
        ? 1
        : 0,
    )

  const { style: viewportStyle } =
    useFullscreenSurface()


  function pick(
    key,
    level,
  ) {
    platform.haptic('light')

    setValues((current) => ({
      ...current,
      [key]: level,
    }))

    setTimeout(() => {
      setStep(
        (current) =>
          current + 1,
      )
    }, 280)
  }


  function buildNote() {
    if (isEvening) {
      return undefined
    }

    return (
      note.trim()
      || undefined
    )
  }


  function buildLessons() {
    if (!isEvening) {
      return undefined
    }

    const filled =
      LESSON_FIELDS
        .map((field) => [
          field.label,
          (
            lessons[
              field.key
            ] || ''
          ).trim(),
        ])
        .filter(
          ([, text]) =>
            text,
        )
        .map(
          ([label, text]) =>
            `${label} ${text}`,
        )

    return filled.length
      ? filled.join('\n')
      : undefined
  }


  function buildWins() {
    if (!isEvening) {
      return undefined
    }

    const filled =
      proud
        .map(
          (text) =>
            text.trim(),
        )
        .filter(Boolean)

    return filled.length
      ? filled
      : undefined
  }


  async function submit({ afterSave } = {}) {
    setSaving(true)
    setError(false)

    try {
      const savedCheckin =
        await api.checkin.save(
        user.id,
        {
          mood:
            values.mood ?? 3,

          energy:
            values.energy ?? 3,

          anxiety:
            values.anxiety ?? 3,

          focus:
            values.focus ?? 3,

          note:
            buildNote(),

          emotion,

          lessons:
            buildLessons(),

          wins:
            buildWins(),

          ...(isEvening
            ? {
                review_completed:
                  true,
              }
            : {}),
        },
      )

      if (
        isEvening
        && !savedCheckin
          ?.review_completed_at
      ) {
        throw new Error(
          'Backend не подтвердил закрытие дня',
        )
      }

      platform.haptic(
        'success',
      )

      if (afterSave) {
        afterSave()
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


  function openScout() {
    platform.haptic('medium')

    try {
      sessionStorage.setItem(
        MENTOR_PERSONA_KEY,
        'dnevnik',
      )

      sessionStorage.setItem(
        MENTOR_DRAFT_KEY,
        DAY_REVIEW_PROMPT,
      )
    } catch (error) {
      console.error(error)
    }

    const url =
      new URL(
        window.location.href,
      )

    url.searchParams.set(
      'tab',
      'mentor',
    )

    window.location.href =
      url.toString()
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
      sessionStorage.setItem(
        MENTOR_PERSONA_KEY,
        'mayak',
      )

      sessionStorage.setItem(
        MENTOR_DRAFT_KEY,
        EMOTION_TALK_PROMPT,
      )
    } catch (error) {
      console.error(error)
    }

    const url =
      new URL(
        window.location.href,
      )

    url.searchParams.set(
      'tab',
      'mentor',
    )

    window.location.href =
      url.toString()
  }


  async function deepenMorningNote() {
    if (!note.trim()) return

    await submit({
      afterSave: () => {
        try {
          sessionStorage.setItem(
            MENTOR_PERSONA_KEY,
            'kompas',
          )

          sessionStorage.setItem(
            MENTOR_DRAFT_KEY,
            [
              'Помоги мне пойти глубже в утренней записи.',
              `Моя мысль: ${note.trim()}`,
              'Не давай готовый совет сразу. Задай один точный вопрос, который поможет увидеть следующий шаг.',
            ].join('\n\n'),
          )
        } catch (error) {
          console.error(error)
        }

        const url =
          new URL(
            window.location.href,
          )

        url.searchParams.set(
          'tab',
          'mentor',
        )

        window.location.href =
          url.toString()
      },
    })
  }


  // ============================================================
  // ФИНАЛ
  // ============================================================

  const isEmotionStep =
    step === emotionStep

  const isCard =
    step > emotionStep

  const cardIdx =
    step
    - emotionStep
    - 1

  const isMorningNoteStep =
    !isEvening
    && isCard
    && cardIdx === 0

  const interactiveStyle =
    isMorningNoteStep
      ? {
          overflowY: 'scroll',
          WebkitOverflowScrolling:
            'touch',
          touchAction: 'pan-y',
        }
      : undefined

  const isFinal = step >= doneStep


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
  const mainAction = isFinal
    ? isEvening
      ? { text: 'Разобрать со Следопытом', run: openScout }
      : { text: 'К следующему шагу', run: onDone }
    : isEmotionStep
      ? {
          text: 'Дальше',
          run: () => setStep(step + 1),
        }
      : isCard
        ? {
            text: saving
              ? 'Сохраняю...'
              : isEvening
                ? cardIdx === 0
                  ? 'Дальше'
                  : 'Закрыть день'
                : 'Завершить',
            run: () =>
              isEvening && cardIdx === 0
                ? setStep(step + 1)
                : submit(),
          }
        : null


  const skipAction = isFinal
    ? isEvening
      ? { text: 'Ко сну', run: onDone }
      : null
    : isEmotionStep
      ? {
          text: 'Пропустить',
          run: () => {
            setEmotion(null)
            setStep(step + 1)
          },
        }
      : isCard
        ? {
            text: 'Пропустить',
            run: () =>
              isEvening && cardIdx === 0
                ? setStep(step + 1)
                : submit(),
          }
        : null


  useMainButton({
    text: mainAction?.text || '',
    onClick: () => {
      platform.haptic('light')
      mainAction?.run()
    },
    visible: Boolean(mainAction) && !isMorningNoteStep,
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


  const webAction = mainAction && !isMorningNoteStep
    ? { text: mainAction.text, onClick: mainAction.run, disabled: saving }
    : null

  const webSecondaryAction =
    skipAction && !saving && !isMorningNoteStep
      ? { text: skipAction.text, onClick: skipAction.run }
      : null


  if (step >= doneStep) {
    return createPortal(
      <div
        className={
          FULLSCREEN_SHELL_CLASS
        }
        style={viewportStyle}
      >
        <div
          className={
            FULLSCREEN_HEADER_SLOT_CLASS
          }
          aria-hidden="true"
        />

        <div
          className={
            FULLSCREEN_SCROLL_CLASS
          }
        >
          <div
            className={
              CHECKIN_CENTER_CLASS
            }
          >
          <div
            className={
              CHECKIN_SUCCESS_CLASS
            }
          >
            {isEvening ? (
              <MotifArt
                name="noch"
                size={184}
                artScale={1.08}
                className="mb-5"
              />
            ) : null}


            <div className="animate-celebrate-pop mb-6">
              <Face
                level={
                  values.mood || 4
                }
                active
                size={
                  isEvening
                    ? 64
                    : 88
                }
              />
            </div>


            <h2 className="font-display text-[26px] text-cream leading-tight">
              {isEvening
                ? 'День закрыт'
                : 'Чек-ин записан'}
            </h2>


            <p className="text-[15px] text-muted mt-3 leading-relaxed max-w-sm">
              {isEvening
                ? 'Ты разобрал день, а не бросил его. Теперь можно посмотреть на него со стороны.'
                : 'Ты услышал себя — это тоже шаг.'}
            </p>


          </div>
          </div>
        </div>

        <WebActionBar action={webAction} secondaryAction={webSecondaryAction} />
      </div>,
      document.body,
    )
  }


  /*
   * Когда шкалы выключены (вечер поверх готового
   * чек-ина), шага «энергия» и «шум в голове» нет,
   * и брать их заголовки по индексу нельзя: подписи
   * уезжали на карточки уроков и гордости.
   */
  const scale =
    skipScales
      ? null
      : SCALE_STEPS[step]

  const moodLevel =
    values.mood
    || existing?.mood
    || 3

  const stepLabel =
    `${isEvening
      ? 'Анализ дня'
      : 'Чек-ин'} · ${step + 1} из ${totalSteps}`

  const questionTitle =
    scale
      ?.title
    || (
      isEmotionStep
        ? 'Что ближе всего?'
        : cardIdx === 0
          ? isEvening
            ? 'Уроки дня'
            : 'Что на уме?'
          : 'Чем горжусь'
    )

  const questionSubtitle =
    scale
      ?.hint
    || (
      isEmotionStep
        ? 'Назвать чувство — половина работы с ним.'
        : cardIdx === 0
          ? isEvening
            ? 'Разбери день, пока он ещё свежий. Любое поле можно пропустить.'
            : 'Пара слов — уже разговор с собой.'
          : 'Три пункта. Мелочи считаются — из них и состоит день.'
    )


  return createPortal(
    <div
      className={
        FULLSCREEN_SHELL_CLASS
      }
      style={viewportStyle}
    >
      <div
        className={CHECKIN_HEADER_CLASS}
      >
        <button
          onClick={() => {
            platform.haptic(
              'light',
            )

            if (step === 0) {
              onDone()
            } else {
              setStep(
                step - 1,
              )
            }
          }}
          aria-label="Назад"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ChevronLeft
            size={20}
            className="text-muted"
          />
        </button>


        <div className="flex gap-1.5">
          {Array.from({
            length:
              totalSteps,
          }).map((_, index) => (
            <span
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${
                index <= step
                  ? 'bg-gold'
                  : 'bg-cream/15'
              }`}
            />
          ))}
        </div>


        <button
          onClick={() => {
            platform.haptic(
              'light',
            )

            onDone()
          }}
          aria-label="Закрыть"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <X
            size={18}
            className="text-muted"
          />
        </button>
      </div>

      <div
        className={
          FULLSCREEN_SCROLL_CLASS
        }
        style={interactiveStyle}
      >
      <div
        className={
          isCard
            ? CHECKIN_LONG_CLASS
            : CHECKIN_CENTER_CLASS
        }
      >

      <section
        className={
          isMorningNoteStep
            ? 'w-full text-left'
            : CHECKIN_QUESTION_CLASS
        }
      >
        <div
          className={[
            'mb-2 text-[12px] font-semibold uppercase tracking-wide',
            isMorningNoteStep
              ? 'text-gold'
              : 'text-faint',
          ].join(' ')}
        >
          {stepLabel}
        </div>

        <h2
          className={[
            'font-display text-cream',
            isMorningNoteStep
              ? 'text-[30px] leading-[1.12]'
              : 'text-[26px] leading-tight',
          ].join(' ')}
        >
          {questionTitle}
        </h2>

        <p
          className={[
            'text-[14px] text-muted',
            isMorningNoteStep
              ? 'mt-5 border-l border-gold pl-4 leading-relaxed'
              : 'mt-2',
          ].join(' ')}
        >
          {questionSubtitle}
        </p>
      </section>

      <div
        className={
          isCard
            ? `${isMorningNoteStep ? 'w-full pt-6' : CHECKIN_INTERACTIVE_CLASS} flex flex-1 flex-col`
            : CHECKIN_INTERACTIVE_CLASS
        }
      >

      {/* ── шкалы ── */}

      {!isCard && !isEmotionStep && (
        <div
          key={step}
          className="w-full flex flex-col items-center"
        >
          <div className="flex items-end justify-center gap-3 w-full max-w-sm">
            {[1, 2, 3, 4, 5].map(
              (level) => {
                const active =
                  values[
                    scale.key
                  ] === level

                return (
                  <button
                    key={level}
                    onClick={() =>
                      pick(
                        scale.key,
                        level,
                      )
                    }
                    className="flex flex-col items-center gap-2 border-0 bg-transparent active:scale-90 transition-transform flex-1"
                  >
                    {scale.faces ? (
                      <Face
                        level={level}
                        active={
                          active
                        }
                      />
                    ) : (
                      <span
                        className={[
                          'w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold transition-colors',
                          active
                            ? 'bg-gold text-emerald-deep'
                            : 'bg-emerald text-muted',
                        ].join(
                          ' ',
                        )}
                      >
                        {level}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-semibold leading-tight text-center ${
                        active
                          ? 'text-gold'
                          : 'text-faint'
                      }`}
                    >
                      {
                        scale.labels[
                          level - 1
                        ]
                      }
                    </span>
                  </button>
                )
              },
            )}
          </div>
        </div>
      )}


      {/* ── эмоции ── */}

      {isEmotionStep && (
        <div
          key="emo"
          className="w-full flex flex-col items-center"
        >
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {(
              EMOTIONS[
                moodLevel
              ]
              || EMOTIONS[3]
            ).map((item) => {
              const active =
                emotion === item

              return (
                <button
                  key={item}
                  onClick={() => {
                    platform.haptic(
                      'light',
                    )

                    setEmotion(
                      active
                        ? null
                        : item,
                    )
                  }}
                  className={[
                    'px-4 py-2.5 rounded-full text-[14px] font-semibold border-0 transition-colors',
                    active
                      ? 'bg-gold text-emerald-deep'
                      : 'bg-emerald text-muted',
                  ].join(
                    ' ',
                  )}
                >
                  {item}
                </button>
              )
            })}
          </div>

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

      {isCard && cardIdx === 0 && (
        <div
          key="c1"
          className="w-full flex flex-1 flex-col items-center"
        >
          {isEvening ? (
            <div className="space-y-3 max-w-md mx-auto w-full">
              {LESSON_FIELDS.map(
                (field) => (
                  <div
                    key={
                      field.key
                    }
                    className="rounded-3xl bg-emerald p-4"
                  >
                    <div className="text-[13px] font-bold text-cream mb-2">
                      {
                        field.label
                      }
                    </div>

                    <JournalTextarea
                      value={
                        lessons[
                          field.key
                        ] || ''
                      }
                      onChange={(
                        value,
                      ) =>
                        setLessons(
                          (
                            current,
                          ) => ({
                            ...current,
                            [
                              field.key
                            ]: value,
                          }),
                        )
                      }
                      placeholder={
                        field.placeholder
                      }
                      ariaLabel={field.label}
                      className="min-h-[11rem]"
                    />
                  </div>
                ),
              )}
            </div>
          ) : (
            <JournalTextarea
              value={note}
              onChange={setNote}
              placeholder={MORNING_NOTE_PLACEHOLDER}
              ariaLabel="Утренняя мысль"
              className="w-full max-w-md mx-auto min-h-[18rem] flex-1"
              editorClassName="pb-24"
              floatingToolbar
              onSubmit={() => submit()}
              submitLabel="Завершить чек-ин"
              submitLoading={saving}
              onDeepen={deepenMorningNote}
            />
          )}


          {error && (
            <p className="text-[13px] text-muted text-center mt-4">
              Не получилось
              сохранить — проверь
              связь
            </p>
          )}


        </div>
      )}


      {/* ── чем горжусь ── */}

      {isCard && cardIdx === 1 && (
        <div
          key="c2"
          className="w-full flex flex-col items-center"
        >
          <div className="space-y-2.5 max-w-md mx-auto w-full">
            {proud.map(
              (
                value,
                index,
              ) => (
                <div
                  key={index}
                  className="rounded-full bg-emerald px-5 py-3.5 flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-[12px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  <input
                    value={value}
                    onChange={(
                      event,
                    ) =>
                      setProud(
                        (
                          current,
                        ) =>
                          current.map(
                            (
                              item,
                              itemIndex,
                            ) =>
                              itemIndex
                              === index
                                ? event
                                    .target
                                    .value
                                : item,
                          ),
                      )
                    }
                    placeholder={
                      PROUD_HINTS[
                        index
                      ]
                    }
                    className="flex-1 bg-transparent text-cream placeholder-muted text-[16px] outline-none font-body"
                  />
                </div>
              ),
            )}
          </div>


          {error && (
            <p className="text-[13px] text-muted text-center mt-4">
              Не получилось
              сохранить — проверь
              связь
            </p>
          )}


        </div>
      )}
      </div>
      </div>
      </div>

      <WebActionBar action={webAction} secondaryAction={webSecondaryAction} />
    </div>,
    document.body,
  )
}
