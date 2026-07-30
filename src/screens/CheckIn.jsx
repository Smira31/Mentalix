import { useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { X, ChevronLeft } from 'lucide-react'
import { ArtDoor } from '../components/Art'


const MENTOR_PERSONA_KEY = 'mx-mentor-persona'
const MENTOR_DRAFT_KEY = 'mx-mentor-draft'

const DAY_REVIEW_PROMPT =
  'Разбери мой сегодняшний день. Опирайся только на реальные данные Mentalix: моё состояние, ритуалы, аскезы, срывы, их причины, вечерние выводы и то, чем я горжусь. Дай один главный вывод, максимум две закономерности и один конкретный эксперимент на завтра. Если данных для вывода недостаточно — скажи об этом прямо.'

const CHECKIN_VIEWPORT_STYLE = {
  paddingTop: 'var(--app-safe-top)',
  paddingBottom: 'var(--app-safe-bottom)',
}

const CHECKIN_HEADER_SLOT_CLASS =
  'h-[52px] shrink-0'

const CHECKIN_CONTENT_CLASS =
  'w-full shrink-0 flex flex-col items-center px-6 pt-6 pb-8 animate-fade-in'


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
    placeholder:
      'Даже маленькое считается',
  },
  {
    key: 'hard',
    label: 'Что было трудно?',
    placeholder:
      'Трудность — тоже часть пути',
  },
  {
    key: 'lesson',
    label: 'Какой вывод забираешь?',
    placeholder:
      'Одна мысль, которую стоит запомнить',
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
  'Где повёл себя так, как хочешь вести всегда?',
  'Что заметил в себе хорошего?',
]


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
    useState({})

  const [proud, setProud] =
    useState([
      '',
      '',
      '',
    ])

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
    useState(0)


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


  async function submit() {
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

      setStep(doneStep)
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


  // ============================================================
  // ФИНАЛ
  // ============================================================

  if (step >= doneStep) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-emerald-deep overflow-y-auto animate-fade-in"
        style={CHECKIN_VIEWPORT_STYLE}
      >
        <div
          className={
            CHECKIN_HEADER_SLOT_CLASS
          }
          aria-hidden="true"
        />

        <div
          className={`${CHECKIN_CONTENT_CLASS} text-center`}
        >
          {isEvening ? (
            <ArtDoor
              size={140}
              className="mb-4"
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


          <p className="text-[15px] text-cream/50 mt-3 leading-relaxed max-w-sm">
            {isEvening
              ? 'Ты разобрал день, а не бросил его. Теперь можно посмотреть на него со стороны.'
              : 'Ты услышал себя — это тоже шаг.'}
          </p>


          {isEvening ? (
            <div className="w-full max-w-xs mt-9 flex flex-col gap-3">
              <button
                onClick={openScout}
                className="cta-pill w-full text-[16px] px-6 py-4"
              >
                Разобрать со Следопытом
              </button>

              <button
                onClick={() => {
                  platform.haptic(
                    'light',
                  )

                  onDone()
                }}
                className="w-full text-[14px] font-semibold text-cream/40 bg-transparent border-0 py-3"
              >
                Ко сну
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                platform.haptic(
                  'light',
                )

                onDone()
              }}
              className="cta-pill text-[16px] px-12 py-4 mt-10"
            >
              К дню
            </button>
          )}
        </div>
      </div>
    )
  }


  const isEmotionStep =
    step === emotionStep

  const isCard =
    step > emotionStep

  const cardIdx =
    step
    - emotionStep
    - 1

  const scale =
    SCALE_STEPS[step]

  const moodLevel =
    values.mood
    || existing?.mood
    || 3


  return (
    <div
      className="fixed inset-0 z-[60] bg-emerald-deep animate-fade-in overflow-y-auto"
      style={CHECKIN_VIEWPORT_STYLE}
    >
      <div
        className={`${CHECKIN_HEADER_SLOT_CLASS} flex items-end justify-between px-5`}
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
            className="text-cream/60"
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
            className="text-cream/60"
          />
        </button>
      </div>


      {/* ── шкалы ── */}

      {!isCard && !isEmotionStep && (
        <div
          key={step}
          className={
            CHECKIN_CONTENT_CLASS
          }
        >
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide">
            {isEvening
              ? 'Анализ дня'
              : 'Чек-ин'}{' '}
            · {step + 1} из{' '}
            {totalSteps}
          </div>


          <h2 className="font-display text-[26px] text-cream text-center leading-tight">
            {scale.title}
          </h2>


          <p className="text-[14px] text-cream/45 mt-2 mb-10">
            {scale.hint}
          </p>


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
                            : 'bg-emerald text-cream/50',
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
                          : 'text-cream/35'
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
          className={
            CHECKIN_CONTENT_CLASS
          }
        >
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide text-center">
            {isEvening
              ? 'Анализ дня'
              : 'Чек-ин'}{' '}
            · {step + 1} из{' '}
            {totalSteps}
          </div>


          <h2 className="font-display text-[26px] text-cream text-center leading-tight">
            Что ближе всего?
          </h2>


          <p className="text-[14px] text-cream/45 mt-2 mb-7 text-center">
            Назвать чувство —
            половина работы с ним.
          </p>


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
                      : 'bg-emerald text-cream/70',
                  ].join(
                    ' ',
                  )}
                >
                  {item}
                </button>
              )
            })}
          </div>


          <div className="flex flex-col items-center gap-3 mt-8">
            <button
              onClick={() => {
                platform.haptic(
                  'light',
                )

                setStep(
                  step + 1,
                )
              }}
              className="cta-pill text-[16px] px-12 py-4"
            >
              Дальше
            </button>


            <button
              onClick={() => {
                platform.haptic(
                  'light',
                )

                setEmotion(null)

                setStep(
                  step + 1,
                )
              }}
              className="text-[13px] font-semibold text-cream/40 bg-transparent border-0"
            >
              Пропустить
            </button>
          </div>
        </div>
      )}


      {/* ── уроки / мысль ── */}

      {isCard && cardIdx === 0 && (
        <div
          key="c1"
          className={
            CHECKIN_CONTENT_CLASS
          }
        >
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide text-center">
            {isEvening
              ? `Анализ дня · ${step + 1} из ${totalSteps}`
              : `Чек-ин · ${totalSteps} из ${totalSteps}`}
          </div>


          <h2 className="font-display text-[26px] text-cream text-center leading-tight">
            {isEvening
              ? 'Уроки дня'
              : 'Что на уме?'}
          </h2>


          <p className="text-[14px] text-cream/45 mt-2 mb-6 text-center">
            {isEvening
              ? 'Разбери день, пока он ещё свежий. Любое поле можно пропустить.'
              : 'Пара слов — уже разговор с собой.'}
          </p>


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

                    <textarea
                      value={
                        lessons[
                          field.key
                        ] || ''
                      }
                      onChange={(
                        event,
                      ) =>
                        setLessons(
                          (
                            current,
                          ) => ({
                            ...current,
                            [
                              field.key
                            ]:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      placeholder={
                        field.placeholder
                      }
                      rows={2}
                      className="w-full bg-transparent text-cream placeholder-cream/25 text-[15px] leading-relaxed outline-none resize-none font-body"
                    />
                  </div>
                ),
              )}
            </div>
          ) : (
            <textarea
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value,
                )
              }
              placeholder="Начни писать..."
              rows={5}
              className="w-full max-w-md mx-auto rounded-3xl bg-emerald text-cream placeholder-cream/30 p-5 text-[15px] leading-relaxed outline-none border border-cream/10 focus:border-gold/40 resize-none font-body"
            />
          )}


          {error && (
            <p className="text-[13px] text-cream/60 text-center mt-4">
              Не получилось
              сохранить — проверь
              связь
            </p>
          )}


          <div className="flex flex-col items-center gap-3 mt-7">
            <button
              onClick={() => {
                platform.haptic(
                  'light',
                )

                if (isEvening) {
                  setStep(
                    step + 1,
                  )
                } else {
                  submit()
                }
              }}
              disabled={saving}
              className="cta-pill text-[16px] px-12 py-4 disabled:opacity-50"
            >
              {isEvening
                ? 'Дальше'
                : saving
                  ? 'Сохраняю...'
                  : 'Завершить'}
            </button>


            {!saving && (
              <button
                onClick={() => {
                  platform.haptic(
                    'light',
                  )

                  if (isEvening) {
                    setStep(
                      step + 1,
                    )
                  } else {
                    submit()
                  }
                }}
                className="text-[13px] font-semibold text-cream/40 bg-transparent border-0"
              >
                Пропустить
              </button>
            )}
          </div>
        </div>
      )}


      {/* ── чем горжусь ── */}

      {isCard && cardIdx === 1 && (
        <div
          key="c2"
          className={
            CHECKIN_CONTENT_CLASS
          }
        >
          <div className="text-[12px] text-cream/35 font-semibold mb-2 uppercase tracking-wide text-center">
            Анализ дня ·{' '}
            {totalSteps} из{' '}
            {totalSteps}
          </div>


          <h2 className="font-display text-[26px] text-cream text-center leading-tight">
            Чем горжусь
          </h2>


          <p className="text-[14px] text-cream/45 mt-2 mb-6 text-center">
            Три пункта. Мелочи
            считаются — из них и
            состоит день.
          </p>


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
                    className="flex-1 bg-transparent text-cream placeholder-cream/25 text-[15px] outline-none font-body"
                  />
                </div>
              ),
            )}
          </div>


          {error && (
            <p className="text-[13px] text-cream/60 text-center mt-4">
              Не получилось
              сохранить — проверь
              связь
            </p>
          )}


          <div className="flex flex-col items-center gap-3 mt-7">
            <button
              onClick={submit}
              disabled={saving}
              className="cta-pill text-[16px] px-12 py-4 disabled:opacity-50"
            >
              {saving
                ? 'Сохраняю...'
                : 'Закрыть день'}
            </button>

            {!saving && (
              <button
                onClick={submit}
                className="text-[13px] font-semibold text-cream/40 bg-transparent border-0"
              >
                Пропустить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
