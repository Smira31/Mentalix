import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  ArrowRight,
  LoaderCircle,
  Mic,
  Square,
} from 'lucide-react'

import { platform } from '../../platform'
import BackButton from '../../components/BackButton'
import { api } from '../../lib/api'

import { PERSONAS } from './personas'




export default function Conversation({
  userId,
  persona,
  messages,
  input,
  setInput,
  loading,
  sending,
  onSend,
  onBack,
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

  const scrollRef = useRef(null)
  const previousMessageCount = useRef(0)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const stopTimerRef = useRef(null)
  const secondsTimerRef = useRef(null)

  const [voiceState, setVoiceState] =
    useState('idle')
  const [voiceSeconds, setVoiceSeconds] =
    useState(0)
  const [voiceError, setVoiceError] =
    useState('')

  const voiceSupported =
    typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined'


  function scrollToEnd(
    behavior = 'smooth',
  ) {
    const scroll = scrollRef.current

    if (!scroll) return

    scroll.scrollTo({
      top: scroll.scrollHeight,
      behavior,
    })
  }


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


  useEffect(() => {
    return () => {
      clearTimeout(stopTimerRef.current)
      clearInterval(secondsTimerRef.current)

      const recorder = recorderRef.current
      if (recorder?.state === 'recording') {
        recorder.onstop = null
        recorder.stop()
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop())
    }
  }, [])


  function stopVoiceRecording() {
    const recorder = recorderRef.current

    if (recorder?.state === 'recording') {
      recorder.stop()
    }
  }


  async function startVoiceRecording() {
    setVoiceError('')

    if (!voiceSupported) {
      setVoiceError(
        'Запись голоса недоступна в этой версии Telegram.',
      )
      return
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        })

      const mimeType = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
      ].find((type) =>
        MediaRecorder.isTypeSupported(type),
      )

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )

      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setVoiceError('Не удалось записать голос. Попробуй ещё раз.')
        setVoiceState('idle')
      }

      recorder.onstop = async () => {
        clearTimeout(stopTimerRef.current)
        clearInterval(secondsTimerRef.current)

        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null

        const audio = new Blob(
          chunksRef.current,
          { type: recorder.mimeType || 'audio/webm' },
        )

        chunksRef.current = []

        if (!audio.size) {
          setVoiceError('Голос не записался. Попробуй ещё раз.')
          setVoiceState('idle')
          return
        }

        setVoiceState('transcribing')

        try {
          const result =
            await api.mentalix.transcribe(userId, audio)

          const transcript = String(result?.text || '').trim()

          if (!transcript) {
            throw new Error('empty transcript')
          }

          setInput((current) =>
            [current.trim(), transcript]
              .filter(Boolean)
              .join(' '),
          )

          platform.haptic('medium')
        } catch (error) {
          console.error(error)
          const message = String(error?.message || '')
          const voiceCode =
            message.match(/VOICE_[A-Z0-9_]+/)?.[0]
          const httpStatus =
            message.match(/failed: (\d{3})/)?.[1]
          const diagnosticCode =
            voiceCode
            || (httpStatus ? `HTTP_${httpStatus}` : 'NETWORK')

          setVoiceError(
            `Не удалось распознать голос. Код: ${diagnosticCode}.`,
          )
        } finally {
          setVoiceState('idle')
          setVoiceSeconds(0)
        }
      }

      recorder.start(250)
      setVoiceSeconds(0)
      setVoiceState('recording')
      platform.haptic('medium')

      /*
       * Инвариант «Время»: вебвью душит таймеры в
       * фоне, поэтому счётчик считается от отметки
       * старта, а не сложением тиков.
       */
      const startedAt = Date.now()

      secondsTimerRef.current = setInterval(() => {
        setVoiceSeconds(
          Math.floor(
            (Date.now() - startedAt) / 1000,
          ),
        )
      }, 250)

      stopTimerRef.current = setTimeout(() => {
        stopVoiceRecording()
      }, 60000)
    } catch (error) {
      console.error(error)
      setVoiceError(
        'Разреши Mentalix доступ к микрофону и попробуй ещё раз.',
      )
      setVoiceState('idle')
    }
  }


  useEffect(() => {
    if (loading) return

    const firstPosition =
      previousMessageCount.current === 0

    previousMessageCount.current =
      messages.length

    const frame =
      window.requestAnimationFrame(() => {
        scrollToEnd(
          firstPosition
            ? 'auto'
            : 'smooth',
        )
      })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [
    loading,
    messages.length,
    sending,
  ])


  return (
    <div
      className="fixed left-0 right-0 z-[70] w-full bg-emerald-deep flex flex-col overflow-hidden animate-fade-in"
      style={{
        top: `${viewportTop}px`,

        height: viewportHeight
          ? `${viewportHeight}px`
          : '100dvh',

        paddingTop: '0px',

        paddingBottom:
          'max(14px, env(safe-area-inset-bottom))',
      }}
    >

      {/* ── верхняя бренд-зона ── */}

<div
  className="relative shrink-0 px-5"
  style={{
    height:
      'calc(var(--app-safe-top) + 102px)',
  }}
>
  {/* Следопыт — между Telegram-пинбарами */}

  <div
    className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap"
    style={{
      top:
        'calc(var(--app-safe-top) + 42px)',
    }}
  >
    <div className="text-[15px] font-semibold tracking-[0.04em] text-cream/95 uppercase leading-none">
      {meta.name}
    </div>

    <div className="text-[11px] font-medium tracking-[0.04em] text-gold uppercase mt-2 leading-none">
      {meta.tagline}
    </div>
  </div>


  {/* Назад — под кнопкой Telegram «Закрыть» */}

  <div
    className="absolute left-5"
    style={{
      top:
        'calc(var(--app-safe-top) + 62px)',
    }}
  >
    <BackButton onClick={onBack} />
  </div>
</div>


{/* ── история сообщений ── */}


      {/* ── история сообщений ── */}

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pb-6 px-5 pb-6"
      >

        {loading && (
          <p className="text-muted text-[15px] text-center pt-4">
            Загрузка...
          </p>
        )}


        {!loading &&
          messages.length === 0 && (
            <p className="text-muted text-[15px] text-center pt-10 leading-[1.6]">
              {meta.desc}

              <br />
              <br />

              Напиши первым —{' '}
              {meta.name} ответит.
            </p>
          )}


        <div className="w-full max-w-md mx-auto space-y-5">
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
                    <div className="w-fit max-w-[82%] rounded-[24px] bg-cognac px-5 py-4 text-[16px] leading-[1.5] font-normal text-cream break-words whitespace-pre-wrap">
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
                  <div className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold mb-2.5">
                    {meta.name}
                  </div>

                  <div className="text-[16px] leading-[1.62] tracking-[-0.01em] text-cream/90 font-normal break-words whitespace-pre-wrap">
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

              <p className="text-[15px] text-faint">
                {meta.typing}
              </p>
            </div>
          )}

        </div>
      </div>


      {/* ── composer ── */}

      <div

  className="shrink-0 px-4 pt-3"

  style={{

    paddingBottom:

      'max(10px, env(safe-area-inset-bottom))',

  }}

>
        {(voiceState !== 'idle' || voiceError) && (
          <div className="w-full max-w-md mx-auto px-3 pb-2 text-center text-[12px]">
            {voiceState === 'recording' && (
              <span className="text-gold">
                Запись · 0:{String(voiceSeconds).padStart(2, '0')} · нажми квадрат, чтобы закончить
              </span>
            )}

            {voiceState === 'transcribing' && (
              <span className="text-cream/45">Распознаю голос…</span>
            )}

            {voiceError && voiceState === 'idle' && (
              <span className="text-red-400">{voiceError}</span>
            )}
          </div>
        )}

        <div className="w-full max-w-md mx-auto min-h-[72px] rounded-[36px] bg-emerald-light/20 border border-cream/10 flex items-center gap-2.5 px-2.5">

          <button
            type="button"
            onClick={() => {
              if (voiceState === 'recording') {
                stopVoiceRecording()
              } else if (voiceState === 'idle') {
                startVoiceRecording()
              }
            }}
            disabled={voiceState === 'transcribing'}
            className="w-[54px] h-[54px] rounded-full border border-cream/15 bg-cream/[0.025] flex items-center justify-center text-cream/85 shrink-0 active:scale-90 transition-transform"
            aria-label={
              voiceState === 'recording'
                ? 'Остановить запись'
                : 'Записать голос'
            }
          >
            {voiceState === 'recording' ? (
              <Square size={20} fill="currentColor" />
            ) : voiceState === 'transcribing' ? (
              <LoaderCircle size={24} className="animate-spin" />
            ) : (
              <Mic size={25} strokeWidth={1.7} />
            )}
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
                scrollToEnd('smooth')
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

            className="flex-1 min-w-0 bg-transparent border-0 outline-none px-2 text-[17px] text-cream placeholder:text-faint"
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
