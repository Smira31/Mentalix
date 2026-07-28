import { useEffect, useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import {
  Send,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Mountain,
  Footprints,
  Plus,
  MoreHorizontal,
  X,
} from 'lucide-react'


const MENTOR_PERSONA_KEY = 'mx-mentor-persona'
const MENTOR_DRAFT_KEY = 'mx-mentor-draft'


const PERSONAS = [
  {
    key: 'mayak',
    name: 'Собеседник',
    tagline: 'выслушает без оценки',
    desc:
      'Тёплый и внимательный. Поможет разобраться в чувствах, когда непросто.',
    Icon: MessageCircle,
    accent: 'text-gold',
    ring: 'border-cream/15',
    glow: 'bg-gold/10',
    starters: [
      'Сегодня было тяжело',
      'Не могу выключить голову',
    ],
  },
  {
    key: 'kompas',
    name: 'Наставник',
    tagline: 'вернёт к действию',
    desc:
      'Строгий и честный. Разложит цель на шаги и не даст себя жалеть.',
    Icon: Mountain,
    accent: 'text-gold',
    ring: 'border-cream/15',
    glow: 'bg-gold/10',
    starters: [
      'Разложи цель на шаги',
      'Я топчусь на месте',
    ],
  },
  {
    key: 'dnevnik',
    name: 'Следопыт',
    tagline: 'видит твои паттерны',
    desc:
      'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
    Icon: Footprints,
    accent: 'text-gold',
    ring: 'border-cream/15',
    glow: 'bg-gold/10',
    starters: [
      'Подведи итоги дня',
      'Что я упускаю?',
    ],
  },
]


function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}


function trim(text, max = 90) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()

  return clean.length > max
    ? `${clean.slice(0, max).trimEnd()}…`
    : clean
}


function readPendingMentor() {
  try {
    const persona =
      sessionStorage.getItem(
        MENTOR_PERSONA_KEY,
      )

    const draft =
      sessionStorage.getItem(
        MENTOR_DRAFT_KEY,
      ) || ''

    sessionStorage.removeItem(
      MENTOR_PERSONA_KEY,
    )

    sessionStorage.removeItem(
      MENTOR_DRAFT_KEY,
    )

    const valid = PERSONAS.some(
      (item) => item.key === persona,
    )

    if (!valid) {
      return {
        persona: null,
        draft: '',
      }
    }

    return {
      persona,
      draft,
    }
  } catch {
    return {
      persona: null,
      draft: '',
    }
  }
}


// ============================================================
// АРТ СЛЕДОПЫТА
// ============================================================

function PathfinderSunrise() {
  return (
    <svg
      viewBox="0 0 360 180"
      className="w-full max-w-[300px] h-auto"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        className="text-gold"
        strokeWidth="1.3"
        strokeLinecap="round"
      >
        <path
          d="M18 119H342"
          opacity="0.34"
        />

        <path
          d="M91 119C91 70 131 30 180 30C229 30 269 70 269 119"
          opacity="0.9"
        />

        <path
          d="M112 119C112 81 142 51 180 51C218 51 248 81 248 119"
          opacity="0.28"
        />

        <path d="M180 13V0" />
        <path d="M153 17L146 2" />
        <path d="M128 27L115 10" />
        <path d="M106 43L87 28" />
        <path d="M89 64L65 52" />
        <path d="M77 89L49 82" />

        <path d="M207 17L214 2" />
        <path d="M232 27L245 10" />
        <path d="M254 43L273 28" />
        <path d="M271 64L295 52" />
        <path d="M283 89L311 82" />
      </g>

      <path
        d="M132 119C135 94 156 76 180 76C204 76 225 94 228 119H132Z"
        className="fill-gold"
        opacity="0.13"
      />

      <path
        d="M145 119C148 101 162 88 180 88C198 88 212 101 215 119H145Z"
        className="fill-gold"
        opacity="0.24"
      />

      <path
        d="M158 119C160 107 169 99 180 99C191 99 200 107 202 119H158Z"
        className="fill-gold"
        opacity="0.9"
      />

      <g
        stroke="currentColor"
        className="text-gold"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M83 136C110 131 122 133 140 141C156 148 169 152 183 151"
          opacity="0.62"
        />

        <path
          d="M183 151C168 157 157 166 151 176"
          opacity="0.62"
        />

        <path
          d="M165 151C172 145 181 141 191 141"
          opacity="0.48"
        />
      </g>
    </svg>
  )
}


// ============================================================
// ВЫБОР СОБЕСЕДНИКА
// ============================================================

function PersonaPicker({
  user,
  onPick,
}) {
  const [previews, setPreviews] =
    useState({})


  useEffect(() => {
    if (!user) return

    let alive = true

    Promise.all(
      PERSONAS.map((persona) =>
        api.mentalix
          .history(
            user.id,
            persona.key,
          )
          .then((messages) => [
            persona.key,
            Array.isArray(messages)
              ? messages[
                  messages.length - 1
                ]
              : null,
          ])
          .catch(() => [
            persona.key,
            null,
          ]),
      ),
    ).then((pairs) => {
      if (!alive) return

      const next = {}

      pairs.forEach(
        ([key, last]) => {
          if (last?.content) {
            next[key] = last
          }
        },
      )

      setPreviews(next)
    })

    return () => {
      alive = false
    }
  }, [user])


  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <h2 className="font-display text-lg mb-1 text-cream/90">
        С кем поговорим
      </h2>

      <p className="text-[11px] text-cream/40 mb-5">
        три собеседника, три разговора
      </p>

      <div className="space-y-3">
        {PERSONAS.map((persona) => {
          const Icon = persona.Icon

          const last =
            previews[persona.key]

          return (
            <div
              key={persona.key}
              className={`rounded-[24px] border ${persona.ring} bg-emerald-light/15 overflow-hidden`}
            >
              <button
                onClick={() => {
                  haptic('light')

                  onPick(
                    persona.key,
                    '',
                  )
                }}
                className="w-full text-left p-4 flex items-start gap-4 transition-transform active:scale-[0.99] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${persona.glow} flex items-center justify-center shrink-0`}
                >
                  <Icon
                    size={24}
                    className={
                      persona.accent
                    }
                    strokeWidth={1.75}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-display text-lg text-cream">
                      {persona.name}
                    </span>

                    <span
                      className={`text-[11px] ${persona.accent}`}
                    >
                      {persona.tagline}
                    </span>
                  </div>

                  <p className="text-xs text-cream/50 leading-snug mt-1">
                    {persona.desc}
                  </p>
                </div>
              </button>

              <div className="px-4 pb-4 pt-0">
                {last ? (
                  <button
                    onClick={() => {
                      haptic('light')

                      onPick(
                        persona.key,
                        '',
                      )
                    }}
                    className="w-full text-left rounded-2xl bg-emerald-light/25 border border-cream/10 px-3.5 py-3 transition-transform active:scale-[0.99] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
                  >
                    <div
                      className={`text-[10px] uppercase tracking-wide ${persona.accent} mb-1`}
                    >
                      Продолжить разговор
                    </div>

                    <p className="text-xs text-cream/55 leading-snug">
                      {last.role === 'user'
                        ? 'Ты: '
                        : ''}

                      {trim(last.content)}
                    </p>
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {persona.starters.map(
                      (starter) => (
                        <button
                          key={starter}
                          onClick={() => {
                            haptic('light')

                            onPick(
                              persona.key,
                              starter,
                            )
                          }}
                          className="rounded-full border border-cream/15 bg-emerald-light/25 px-3.5 py-2 text-xs text-cream/70 transition-transform active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
                        >
                          {starter}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-cream/30 leading-snug mt-5 px-1">
        У каждого своя история —
        разговоры не смешиваются.
      </p>
    </div>
  )
}


// ============================================================
// ЖУРНАЛЬНЫЙ ВХОД СЛЕДОПЫТА
// ============================================================

function PathfinderJournal({
  input,
  setInput,
  onSend,
  onBack,
  onOpenHistory,
  sending,
}) {
  return (
    <div
      className="w-full max-w-sm mx-auto px-5 pb-24 flex flex-col min-h-[calc(100vh-160px)] animate-fade-in"
    >
      {/* шапка */}

      <div className="flex items-center pt-1">
        <button
          onClick={() => {
            haptic('light')
            onBack()
          }}
          aria-label="Закрыть"
          className="w-10 h-10 flex items-center justify-center text-cream/65 active:scale-90 transition-transform"
        >
          <X
            size={25}
            strokeWidth={1.6}
          />
        </button>

        <div className="ml-4 flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Footprints
              size={22}
              className="text-gold"
              strokeWidth={1.7}
            />
          </div>

          <div className="min-w-0">
            <div className="font-display text-[18px] text-cream leading-none">
              Следопыт
            </div>

            <div className="text-[10px] text-gold mt-1 uppercase tracking-[0.05em]">
              видит твои паттерны
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            haptic('light')
            onOpenHistory()
          }}
          aria-label="История разговора"
          className="ml-auto w-10 h-10 flex items-center justify-center text-cream/65 active:scale-90 transition-transform"
        >
          <MoreHorizontal
            size={24}
            strokeWidth={1.7}
          />
        </button>
      </div>


      {/* арт */}

      <div className="mt-6 -mx-5">
        <div className="h-px bg-cream/[0.07]" />

        <div className="flex justify-start pl-1 pt-4">
          <PathfinderSunrise />
        </div>
      </div>


      {/* подпись */}

      <div className="flex items-center gap-3 mt-[-4px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold whitespace-nowrap">
          Следопыт спрашивает
        </span>

        <div className="flex-1 h-px bg-gold/35" />

        <span className="w-2.5 h-2.5 border border-gold/70 rotate-45 shrink-0" />
      </div>


      {/* вопрос */}

      <div className="pt-8">
        <h1
          className="text-[35px] leading-[1.14] text-cream font-normal tracking-[-0.025em]"
          style={{
            fontFamily:
              'Georgia, "Times New Roman", serif',
          }}
        >
          Что сегодня
          <br />
          осталось с тобой?
        </h1>

        <div className="w-8 h-px bg-gold mt-7 mb-5" />

        <p className="text-[15px] leading-[1.62] text-cream/50 max-w-[300px]">
          Отвечай свободно. Я разберу твой день
          и помогу заметить то, что легко пропустить.
        </p>
      </div>


      {/* воздух */}

      <div className="flex-1 min-h-[72px]" />


      {/* поле */}

      <div className="pb-3">
        <div className="min-h-[62px] rounded-full border border-cream/15 bg-emerald-light/15 flex items-center px-2 gap-2">
          <button
            type="button"
            onClick={() => {
              haptic('light')
            }}
            aria-label="Добавить"
            className="w-11 h-11 rounded-full bg-cream/[0.05] flex items-center justify-center text-cream/55 shrink-0 active:scale-90 transition-transform"
          >
            <Plus
              size={23}
              strokeWidth={1.5}
            />
          </button>

          <input
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                onSend()
              }
            }}
            placeholder="Начни писать..."
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[16px] text-cream placeholder:text-cream/28 px-1"
          />

          <button
            onClick={onSend}
            disabled={
              sending ||
              !input.trim()
            }
            aria-label="Отправить"
            className="w-12 h-12 rounded-full bg-gold text-emerald-deep flex items-center justify-center shrink-0 disabled:opacity-35 active:scale-90 transition-transform"
          >
            <ArrowRight
              size={24}
              strokeWidth={1.9}
            />
          </button>
        </div>
      </div>
    </div>
  )
}


// ============================================================
// ЧАТ
// ============================================================

function Chat({
  user,
  persona,
  initialText = '',
  onBack,
}) {
  const meta = PERSONAS.find(
    (item) =>
      item.key === persona,
  )

  const [messages, setMessages] =
    useState([])

  const [input, setInput] =
    useState(initialText)

  const [loading, setLoading] =
    useState(true)

  const [sending, setSending] =
    useState(false)

  const [journalOpen, setJournalOpen] =
    useState(
      persona === 'dnevnik' &&
      !initialText,
    )

  const endRef = useRef(null)


  useEffect(() => {
    if (!user) return

    api.mentalix
      .history(
        user.id,
        persona,
      )
      .then(setMessages)
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user, persona])


  useEffect(() => {
    if (journalOpen) return

    endRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [
    messages,
    sending,
    journalOpen,
  ])


  async function send() {
    const text = input.trim()

    if (!text || sending) return

    setInput('')

    setJournalOpen(false)

    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: text,
      },
    ])

    setSending(true)
    haptic('light')

    try {
      const reply =
        await api.mentalix.send(
          user.id,
          text,
          persona,
        )

      setMessages((previous) => [
        ...previous,
        reply,
      ])
    } catch (error) {
      console.error(error)

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            'Не удалось получить ответ, попробуй ещё раз.',
        },
      ])
    } finally {
      setSending(false)
    }
  }


  const Icon = meta.Icon


  if (
    persona === 'dnevnik' &&
    journalOpen
  ) {
    return (
      <PathfinderJournal
        input={input}
        setInput={setInput}
        onSend={send}
        onBack={onBack}
        sending={sending}
        onOpenHistory={() => {
          setJournalOpen(false)
        }}
      />
    )
  }


  return (
    <div className="w-full max-w-sm px-4 pb-24 flex flex-col h-[calc(100vh-180px)] animate-fade-in">

      {/* шапка */}

      <div className="flex items-center gap-3 px-2 pb-3 mb-2 border-b border-cream/10">
        <button
          onClick={() => {
            haptic('light')

            if (
              persona === 'dnevnik'
            ) {
              setJournalOpen(true)
              return
            }

            onBack()
          }}
          className="text-cream/60 shrink-0"
          aria-label="Назад"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          className={`w-9 h-9 rounded-xl ${meta.glow} flex items-center justify-center shrink-0`}
        >
          <Icon
            size={18}
            className={meta.accent}
            strokeWidth={1.75}
          />
        </div>

        <div>
          <div className="font-display text-base text-cream leading-tight">
            {meta.name}
          </div>

          <div
            className={`text-[10px] ${meta.accent}`}
          >
            {meta.tagline}
          </div>
        </div>

        {persona === 'dnevnik' && (
          <button
            onClick={() => {
              haptic('light')
              setJournalOpen(true)
            }}
            className="ml-auto text-[11px] text-gold/70"
          >
            новый разбор
          </button>
        )}
      </div>


      {/* сообщения */}

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-3">

        {loading && (
          <p className="text-cream/40 text-[15px] text-center pt-4">
            Загрузка...
          </p>
        )}

        {!loading &&
          messages.length === 0 && (
            <p className="text-cream/40 text-[15px] text-center pt-10 leading-[1.6]">
              {meta.desc}
              <br />
              <br />
              Напиши первым — {meta.name} ответит.
            </p>
          )}

        {messages.map(
          (message, index) => {
            const isUser =
              message.role === 'user'


            if (
              persona === 'dnevnik' &&
              !isUser
            ) {
              return (
                <div
                  key={index}
                  className="mr-auto w-full py-5 border-b border-cream/[0.07]"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Footprints
                      size={15}
                      className="text-gold"
                      strokeWidth={1.7}
                    />

                    <span className="text-[10px] uppercase tracking-[0.12em] text-gold/80 font-semibold">
                      Следопыт
                    </span>
                  </div>

                  <div
                    className="text-[18px] leading-[1.62] text-cream/88 font-normal break-words whitespace-pre-wrap"
                  >
                    {message.content}
                  </div>
                </div>
              )
            }


            return (
              <div
                key={index}
                className={[
                  'w-fit max-w-[88%] rounded-[24px] px-[18px] py-4',
                  'text-[17px] leading-[1.58] font-normal break-words whitespace-pre-wrap',
                  isUser
                    ? 'ml-auto bg-cognac text-cream'
                    : 'mr-auto bg-emerald-light/40 text-cream/90',
                ].join(' ')}
              >
                {message.content}
              </div>
            )
          },
        )}


        {sending && (
          persona === 'dnevnik' ? (
            <div className="mr-auto w-full py-5">
              <div className="flex items-center gap-2 mb-3">
                <Footprints
                  size={15}
                  className="text-gold"
                  strokeWidth={1.7}
                />

                <span className="text-[10px] uppercase tracking-[0.12em] text-gold/70">
                  Следопыт
                </span>
              </div>

              <p className="text-[15px] text-cream/35">
                разбирает твой день…
              </p>
            </div>
          ) : (
            <div className="mr-auto w-fit max-w-[88%] rounded-[24px] bg-emerald-light/40 px-[18px] py-4 text-[15px] leading-[1.5] text-cream/50">
              {meta.name} печатает…
            </div>
          )
        )}

        <div ref={endRef} />
      </div>


      {/* поле ввода */}

      {persona === 'dnevnik' ? (
        <div className="px-2 pt-3">
          <div className="min-h-[56px] rounded-full border border-cream/15 bg-emerald-light/15 flex items-center gap-2 px-2">
            <button
              type="button"
              onClick={() => {
                haptic('light')
              }}
              className="w-10 h-10 rounded-full bg-cream/[0.04] flex items-center justify-center text-cream/45 shrink-0"
              aria-label="Добавить"
            >
              <Plus
                size={20}
                strokeWidth={1.5}
              />
            </button>

            <input
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter'
                ) {
                  send()
                }
              }}
              placeholder="Продолжить размышление..."
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-cream placeholder:text-cream/25"
            />

            <button
              onClick={send}
              disabled={
                sending ||
                !input.trim()
              }
              className="w-11 h-11 rounded-full bg-gold text-emerald-deep flex items-center justify-center shrink-0 disabled:opacity-35 transition-transform active:scale-90"
              aria-label="Отправить"
            >
              <ArrowRight
                size={21}
                strokeWidth={1.9}
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2 pt-3">
          <input
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                send()
              }
            }}
            placeholder={`Написать ${meta.name}…`}
            className="flex-1 bg-emerald-light/25 border border-cream/15 rounded-full px-4 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold transition-colors"
          />

          <button
            onClick={send}
            disabled={
              sending ||
              !input.trim()
            }
            className="w-10 h-10 rounded-full bg-gold text-emerald-deep flex items-center justify-center shrink-0 disabled:opacity-40 transition-transform active:scale-90"
            aria-label="Отправить"
          >
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  )
}


// ============================================================
// MENTALIX
// ============================================================

export default function MentalixChat({
  user,
}) {
  const [pending] = useState(
    () => readPendingMentor(),
  )

  const [persona, setPersona] =
    useState(pending.persona)

  const [draft, setDraft] =
    useState(pending.draft)


  if (!persona) {
    return (
      <PersonaPicker
        user={user}
        onPick={(
          key,
          text,
        ) => {
          setDraft(text || '')
          setPersona(key)
        }}
      />
    )
  }


  return (
    <Chat
      user={user}
      persona={persona}
      initialText={draft}
      onBack={() => {
        setDraft('')
        setPersona(null)
      }}
    />
  )
}