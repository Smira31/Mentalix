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

  const Icon = meta.Icon

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
          'max(8px, env(safe-area-inset-bottom))',
      }}
    >

      {/* ── Шапка ── */}

      <div className="shrink-0 flex items-center gap-3 px-5 pb-3 border-b border-cream/10">
        <button
          type="button"
          onClick={() => {
            haptic('light')
            onNewConversation()
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-cream/60 shrink-0 active:scale-90 transition-transform"
          aria-label="Назад"
        >
          <ArrowLeft
            size={22}
            strokeWidth={1.8}
          />
        </button>

        <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
          <Icon
            size={18}
            className="text-gold"
            strokeWidth={1.75}
          />
        </div>

        <div className="min-w-0">
          <div className="font-display text-base text-cream leading-tight">
            {meta.name}
          </div>

          <div className="text-[10px] text-gold">
            {meta.tagline}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic('light')
            onNewConversation()
          }}
          className="ml-auto shrink-0 text-[11px] text-gold/70 active:opacity-60"
        >
          новый разговор
        </button>
      </div>


      {/* ── История сообщений ── */}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 space-y-4 py-4">
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

        {messages.map(
          (message, index) => {
            const isUser =
              message.role === 'user'

            if (!isUser) {
              return (
                <div
                  key={index}
                  className="mr-auto w-full py-5 border-b border-cream/[0.07]"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon
                      size={15}
                      className="text-gold"
                      strokeWidth={1.7}
                    />

                    <span className="text-[10px] uppercase tracking-[0.12em] text-gold/80 font-semibold">
                      {meta.name}
                    </span>
                  </div>

                  <div className="text-[17px] leading-[1.62] text-cream/90 font-normal break-words whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              )
            }

            return (
              <div
                key={index}
                className="w-fit max-w-[88%] rounded-[24px] px-[18px] py-4 text-[16px] leading-[1.58] font-normal break-words whitespace-pre-wrap ml-auto bg-cognac text-cream"
              >
                {message.content}
              </div>
            )
          },
        )}

        {sending && (
          <div className="mr-auto w-full py-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon
                size={15}
                className="text-gold"
                strokeWidth={1.7}
              />

              <span className="text-[10px] uppercase tracking-[0.12em] text-gold/70">
                {meta.name}
              </span>
            </div>

            <p className="text-[15px] text-cream/35">
              {meta.typing}
            </p>
          </div>
        )}

        <div ref={endRef} />
      </div>


      {/* ── Поле ввода ── */}

      <div className="shrink-0 px-5 pt-3">
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
                onSend()
              }
            }}
            placeholder={`Написать ${meta.name}…`}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-cream placeholder:text-cream/25"
          />

          <button
            type="button"
            onClick={onSend}
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
    </div>
  )
}