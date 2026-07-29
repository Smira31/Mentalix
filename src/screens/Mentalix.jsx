import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'

import {
  PERSONAS,
  readPendingMentor,
} from './mentalix/personas'

import PersonaPicker from './mentalix/PersonaPicker'
import Conversation from './mentalix/Conversation'

import ListenerArt from './mentalix/art/ListenerArt'
import MentorArt from './mentalix/art/MentorArt'
import PathfinderArt from './mentalix/art/PathfinderArt'

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

// ============================================================
// АРТ: СОБЕСЕДНИК
// ============================================================

function ListenerArt() {
  return (
    <svg
      viewBox="0 0 360 210"
      className="w-full h-auto"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        className="text-gold"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M56 108V75C56 62 64 56 78 56H118C131 56 139 63 139 77V110"
          opacity="0.95"
        />

        <path
          d="M56 102C61 94 68 91 78 91H116C127 91 134 96 139 104"
          opacity="0.68"
        />

        <path
          d="M56 105V143C56 153 61 158 70 158H134C144 158 149 153 149 143V118C149 107 143 102 132 102H118"
          opacity="0.9"
        />

        <path
          d="M70 158L66 181"
          opacity="0.65"
        />

        <path
          d="M137 158L141 181"
          opacity="0.65"
        />

        <path
          d="M149 129H166"
          opacity="0.72"
        />

        <path
          d="M190 132H254"
          opacity="0.85"
        />

        <path
          d="M222 132V174"
          opacity="0.65"
        />

        <path
          d="M204 174H240"
          opacity="0.55"
        />

        <path
          d="M211 118H229V128H211Z"
          opacity="0.9"
        />

        <path
          d="M229 120C237 120 238 127 230 127"
          opacity="0.7"
        />

        <path
          d="M216 112C215 108 219 106 218 102"
          opacity="0.45"
        />

        <path
          d="M288 167V59"
          opacity="0.7"
        />

        <path
          d="M288 61L263 38"
          opacity="0.85"
        />

        <path
          d="M262 38L247 51"
          opacity="0.88"
        />

        <path
          d="M242 53H270L264 68H247L242 53Z"
          opacity="0.95"
        />

        <path
          d="M270 167H306"
          opacity="0.65"
        />
      </g>

      <path
        d="M248 67L206 143H284L262 67H248Z"
        className="fill-gold"
        opacity="0.055"
      />

      <g
        className="text-gold"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      >
        <path d="M96 80V88" />
        <path d="M92 84H100" />
        <path d="M116 72V78" />
        <path d="M113 75H119" />
      </g>
    </svg>
  )
}


// ============================================================
// АРТ: НАСТАВНИК
// ============================================================

function MentorArt() {
  return (
    <svg
      viewBox="0 0 360 210"
      className="w-full h-auto"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        className="text-gold"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M30 167L99 96L127 121L183 51L236 111L267 86L330 167"
          opacity="0.88"
        />

        <path
          d="M64 167L124 112"
          opacity="0.34"
        />

        <path
          d="M129 122L180 69L213 109"
          opacity="0.32"
        />

        <path
          d="M238 113L267 94L301 133"
          opacity="0.32"
        />

        <path
          d="M151 190C182 179 203 166 195 151C188 139 161 142 167 128C173 113 206 111 194 96C184 84 176 82 183 65"
          strokeWidth="2"
          opacity="0.95"
        />

        <path
          d="M183 67V29"
          opacity="0.9"
        />

        <path
          d="M184 31L212 37L184 48"
          opacity="0.95"
        />

        <path
          d="M41 82C50 72 63 72 71 82C79 78 88 82 91 89H31C33 85 36 83 41 82Z"
          opacity="0.36"
        />

        <path
          d="M250 61C258 50 274 50 281 61C290 58 299 62 302 69H240C242 65 246 62 250 61Z"
          opacity="0.36"
        />
      </g>

      <path
        d="M183 51L130 121L166 100L183 68L200 92L224 97L183 51Z"
        className="fill-gold"
        opacity="0.055"
      />
    </svg>
  )
}


// ============================================================
// АРТ: СЛЕДОПЫТ
// ============================================================

function PathfinderArt() {
  return (
    <svg
      viewBox="0 0 360 210"
      className="w-full h-auto"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        className="text-gold"
        strokeWidth="1.25"
        strokeLinecap="round"
      >
        <path
          d="M16 145H344"
          opacity="0.3"
        />

        <path
          d="M118 145C118 111 146 83 180 83C214 83 242 111 242 145"
          opacity="0.92"
        />

        <path d="M180 69V20" />

        <path d="M165 72L153 29" />
        <path d="M150 78L126 38" />
        <path d="M137 89L101 54" />
        <path d="M127 103L81 79" />
        <path d="M121 120L68 109" />

        <path d="M195 72L207 29" />
        <path d="M210 78L234 38" />
        <path d="M223 89L259 54" />
        <path d="M233 103L279 79" />
        <path d="M239 120L292 109" />

        <path
          d="M98 145L63 145"
          opacity="0.48"
        />

        <path
          d="M262 145L297 145"
          opacity="0.48"
        />

        <path
          d="M181 146C188 153 187 159 178 164C166 171 167 179 181 184C190 188 190 194 181 201"
          strokeWidth="1.6"
          opacity="0.7"
        />
      </g>

      <path
        d="M121 145C124 112 149 86 180 86C211 86 236 112 239 145H121Z"
        className="fill-gold"
        opacity="0.08"
      />

      <path
        d="M151 145C153 128 165 116 180 116C195 116 207 128 209 145H151Z"
        className="fill-gold"
        opacity="0.6"
      />
    </svg>
  )
}


function PersonaArt({
  persona,
}) {
  if (persona === 'mayak') {
    return <ListenerArt />
  }

  if (persona === 'kompas') {
    return <MentorArt />
  }

  return <PathfinderArt />
}



// ============================================================
// ЖУРНАЛЬНЫЙ СТАРТОВЫЙ ЭКРАН
// ============================================================

function JournalStart({
  persona,
  input,
  setInput,
  onSend,
  onBack,
  onOpenHistory,
  sending,
}) {
  const meta = PERSONAS.find(
    (item) =>
      item.key === persona,
  )

  const Icon = meta.Icon


  return (
    <div className="w-full max-w-sm mx-auto px-5 pb-24 flex flex-col min-h-[calc(100vh-160px)] animate-fade-in">

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
          <div className="w-10 h-10 rounded-xl border border-gold/25 bg-gold/[0.04] flex items-center justify-center shrink-0">
            <Icon
              size={22}
              className="text-gold"
              strokeWidth={1.7}
            />
          </div>


          <div className="min-w-0">
            <div className="font-display text-[18px] text-cream leading-none">
              {meta.name}
            </div>

            <div className="text-[10px] text-gold mt-1 uppercase tracking-[0.05em]">
              {meta.tagline}
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


      <div className="mt-4 -mx-1">
        <div className="h-[245px] flex items-center justify-center">
          <PersonaArt
            persona={persona}
          />
        </div>
      </div>


      <div className="flex items-center gap-3 mt-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold whitespace-nowrap">
          {meta.asking}
        </span>

        <div className="flex-1 h-px bg-gold/35" />

        <span className="w-2.5 h-2.5 border border-gold/70 rotate-45 shrink-0" />
      </div>


      <div className="pt-8">
        <h1
          className="text-[35px] leading-[1.14] text-cream font-normal tracking-[-0.025em] whitespace-pre-line"
          style={{
            fontFamily:
              'Georgia, "Times New Roman", serif',
          }}
        >
          {meta.question}
        </h1>


        <div className="w-8 h-px bg-gold mt-7 mb-5" />


        <p className="text-[15px] leading-[1.62] text-cream/50 max-w-[300px]">
          {meta.intro}
        </p>
      </div>


      <div className="flex-1 min-h-[70px]" />


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
    useState(!initialText)

  const endRef = useRef(null)

  const previousMessageCount =
    useRef(0)


  useEffect(() => {
    if (!user) return

    api.mentalix
      .history(
        user.id,
        persona,
      )
      .then((history) => {
        setMessages(history)

        previousMessageCount.current =
          history.length
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [
    user,
    persona,
  ])


  useEffect(() => {
    if (journalOpen) return

    const previousCount =
      previousMessageCount.current

    const currentCount =
      messages.length

    previousMessageCount.current =
      currentCount

    if (
      currentCount <=
      previousCount
    ) {
      return
    }

    const lastMessage =
      messages[
        currentCount - 1
      ]

    if (!lastMessage) return

    if (
      lastMessage.role === 'user'
    ) {
      endRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }, [
    messages,
    journalOpen,
  ])


  async function send() {
    const text = input.trim()

    if (
      !text ||
      sending
    ) {
      return
    }

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


  return (
    <Conversation
      persona={persona}
      messages={messages}
      input={input}
      setInput={setInput}
      loading={loading}
      sending={sending}
      onSend={send}
      onNewConversation={() => {
        setJournalOpen(true)
      }}
      endRef={endRef}
    />
  )
}


// ============================================================
// MENTALIX
// ============================================================

export default function MentalixChat({
  user,
  onPersonaChange,
}) {
  const [pending] = useState(
    () => readPendingMentor(),
  )

  const [persona, setPersona] =
    useState(
      pending.persona,
    )

  const [draft, setDraft] =
    useState(
      pending.draft,
    )


  /*
   * Сообщаем App.jsx,
   * открыта ли конкретная персона.
   *
   * Благодаря этому App сам решает,
   * показывать BottomNavigation или нет.
   */
  useEffect(() => {
    onPersonaChange?.(
      Boolean(persona)
    )
  }, [
    persona,
    onPersonaChange,
  ])


  /*
   * Если пользователь уйдёт с вкладки
   * каким-либо внешним способом,
   * navbar не должен остаться скрытым.
   */
  useEffect(() => {
    return () => {
      onPersonaChange?.(false)
    }
  }, [onPersonaChange])


  if (!persona) {
    return (
      <PersonaPicker
        user={user}
        onPick={(
          key,
          text,
        ) => {
          setDraft(
            text || '',
          )

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