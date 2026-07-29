import {
  useEffect,
  useState,
} from 'react'

import {
  ArrowLeft,
  ArrowRight,
  Plus,
} from 'lucide-react'

import WebApp from '@twa-dev/sdk'

import { PERSONAS } from './personas'


function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}


export default function Conversation({
  persona,
  messages,
  input,
  setInput,
  loading,
  sending,
  onSend,
  onNewConversation,
  endRef,
}) {
  const meta = PERSONAS.find(
    (item) => item.key === persona,
  )

  const [
    viewportHeight,
    setViewportHeight,
  ] = useState(null)

  const [
    viewportTop,
    setViewportTop,
  ] = useState(0)


  useEffect(() => {
    const viewport =
      window.visualViewport

    if (!viewport) return

    const updateViewport = () => {
      setViewportHeight(
        viewport.height,
      )

      setViewportTop(
        viewport.offsetTop || 0,
      )
    }

    updateViewport()

    viewport.addEventListener(
      'resize',
      updateViewport,
    )

    viewport.addEventListener(
      'scroll',
      updateViewport,
    )

    return () => {
      viewport.removeEventListener(
        'resize',
        updateViewport,
      )

      viewport.removeEventListener(
        'scroll',
        updateViewport,
      )
    }
  }, [])


  return (
    <div
      className="fixed left-0 right-0 z-[70] w-full bg-emerald-deep flex flex-col overflow-hidden animate-fade-in"
      style={{
        top: `${viewportTop}px`,

        height: viewportHeight
          ? `${viewportHeight}px`
          : '100dvh',

        paddingTop:
          'max(8px, env(safe-area-inset-top))',

        paddingBottom:
          'max(14px, env(safe-area-inset-bottom))',
      }}
    >

      {/* ── верхняя бренд-зона ── */}

      <div className="relative shrink-0 h-[72px] px-5">

  <button
    type="button"
    onClick={() => {
      haptic('light')
      onNewConversation()
    }}
    className="absolute left-5 top-1 w-11 h-11 rounded-full flex items-center justify-center text-cream/65 active:scale-90 transition-transform"
    aria-label="Назад"
  >
    <ArrowLeft
      size={25}
      strokeWidth={1.7}
    />
  </button>

  <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center whitespace-nowrap">
    <div className="text-[15px] font-semibold tracking-[0.04em] text-cream/95 uppercase leading-none">
      {meta.name}
    </div>

    <div className="text-[11px] font-medium tracking-[0.04em] text-gold uppercase mt-2 leading-none">
      {meta.tagline}
    </div>
  </div>

</div>


      {/* ── история сообщений ── */}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-5">

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

              Напиши первым —{' '}
              {meta.name} ответит.
            </p>
          )}


        <div className="space-y-7">
          {messages.map(
            (message, index) => {
              const isUser =
                message.role === 'user'

              if (isUser) {
                return (
                  <div
                    key={index}
                    className="flex justify-end"
                  >
                    <div className="w-fit max-w-[86%] rounded-[28px] bg-cognac px-6 py-[18px] text-[17px] leading-[1.5] font-normal text-cream break-words whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                )
              }


              return (
                <div
                  key={index}
                  className="w-full"
                >
                  <div className="text-[11px] uppercase tracking-[0.16em] text-gold font-semibold mb-4">
                    {meta.name}
                  </div>

                  <div className="text-[17px] leading-[1.66] text-cream/90 font-normal break-words whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              )
            },
          )}


          {sending && (
            <div className="w-full py-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-gold font-semibold mb-3">
                {meta.name}
              </div>

              <p className="text-[15px] text-cream/35">
                {meta.typing}
              </p>
            </div>
          )}


          <div ref={endRef} />
        </div>
      </div>


      {/* ── composer ── */}

      <div className="shrink-0 px-4 pt-2 pb-1">
        <div className="min-h-[68px] rounded-[34px] bg-emerald-light/25 border border-cream/10 flex items-center gap-2 px-2.5">

          <button
            type="button"
            onClick={() => {
              haptic('light')
            }}
            className="w-[52px] h-[52px] rounded-full border border-cream/15 bg-cream/[0.025] flex items-center justify-center text-cream/85 shrink-0 active:scale-90 transition-transform"
            aria-label="Добавить"
          >
            <Plus
              size={27}
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

            onFocus={() => {
              setTimeout(() => {
                endRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                })
              }, 180)
            }}

            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                onSend()
              }
            }}

            placeholder={`Написать ${meta.name}…`}

            className="flex-1 min-w-0 bg-transparent border-0 outline-none px-2 text-[17px] text-cream placeholder:text-cream/30"
          />


          <button
            type="button"
            onClick={onSend}

            disabled={
              sending ||
              !input.trim()
            }

            className="w-[52px] h-[52px] rounded-full bg-gold text-emerald-deep flex items-center justify-center shrink-0 disabled:opacity-35 transition-transform active:scale-90"
            aria-label="Отправить"
          >
            <ArrowRight
              size={25}
              strokeWidth={1.9}
            />
          </button>

        </div>
      </div>

    </div>
  )
}