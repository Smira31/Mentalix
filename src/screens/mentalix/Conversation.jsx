import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import {
  ArrowRight,
  LoaderCircle,
  Mic,
  Square,
} from 'lucide-react'

import { platform } from '../../platform'
import BackButton from '../../components/BackButton'
import { api } from '../../lib/api'
import { useSynced } from '../../lib/store'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../../lib/fullscreenSurface'

import { PERSONAS } from './personas'
import MessageText from './MessageText'
import './Conversation.css'


const VOICE_HINT_KEY = 'mx-voice-hint-v1'
const VOICE_HINT_TIMEOUT = 4500


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

  const { style: surfaceStyle } =
    useFullscreenSurface()

  const scrollRef = useRef(null)
  const previousMessageCount = useRef(0)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const stopTimerRef = useRef(null)
  const secondsTimerRef = useRef(null)
  const sendingRef = useRef(sending)

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

  useEffect(() => {
    sendingRef.current = sending
  }, [sending])

  const hasText = Boolean(input.trim())

  const iconKey =
    voiceState === 'recording'
      ? 'recording'
      : voiceState === 'transcribing'
        ? 'transcribing'
        : hasText
          ? 'send'
          : 'mic'

  const [voicePressed, setVoicePressed] =
    useState(false)

  const [voiceHintSeen, setVoiceHintSeen] =
    useSynced(VOICE_HINT_KEY, '0')
  const [voiceHintDismissed, setVoiceHintDismissed] =
    useState(false)

  const showVoiceHint =
    voiceSupported
    && voiceHintSeen !== '1'
    && !voiceHintDismissed
    && !hasText
    && voiceState === 'idle'

  const dismissVoiceHint = useCallback(() => {
    setVoiceHintDismissed(true)
    setVoiceHintSeen('1')
  }, [setVoiceHintSeen])

  useEffect(() => {
    if (!showVoiceHint) return

    const timer = setTimeout(
      dismissVoiceHint,
      VOICE_HINT_TIMEOUT,
    )

    return () => clearTimeout(timer)
  }, [showVoiceHint, dismissVoiceHint])


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

          if (sendingRef.current) {
            setVoiceError(
              'Не удалось отправить голосовое сообщение, дождитесь отправки текущего.',
            )
            return
          }

          platform.haptic('medium')

          onSend(transcript)
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


  return createPortal(
    <div
      className={FULLSCREEN_SHELL_CLASS}
      style={{
        ...surfaceStyle,

        paddingBottom:
          'max(14px, env(safe-area-inset-bottom))',
      }}
    >

      {/* ── шапка ── */}

      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} grid grid-cols-[1fr_auto_1fr] items-center px-5`}
      >
        <div className="justify-self-start">
          <BackButton onClick={onBack} />
        </div>

        <div className="justify-self-center text-[15px] font-semibold tracking-[0.04em] text-cream uppercase leading-none whitespace-nowrap">
          {meta.name}
        </div>

        <span aria-hidden="true" />
      </div>


      {/* ── история сообщений ── */}

      <div
        ref={scrollRef}
        className={`${FULLSCREEN_SCROLL_CLASS} px-5 pb-6`}
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
                  className="w-full mx-msg-in"
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-gold font-semibold mb-2.5">
                    {meta.name}
                  </div>

                  <div className="text-[16px] leading-[1.62] tracking-[-0.01em] text-cream font-normal break-words">
                    <MessageText content={message.content} />
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
                Запись · 0:{String(voiceSeconds).padStart(2, '0')} · отпусти кнопку, чтобы закончить
              </span>
            )}

            {voiceState === 'transcribing' && (
              <span className="text-muted">Распознаю голос…</span>
            )}

            {voiceError && voiceState === 'idle' && (
              <span className="text-red-400">{voiceError}</span>
            )}
          </div>
        )}

        <div className="w-full max-w-md mx-auto min-h-[72px] rounded-[36px] bg-emerald-light/20 border border-cream/10 flex items-center gap-2.5 px-2.5">

          <input
            value={input}

            onChange={(event) => {
              const value = event.target.value

              setInput(value)

              /*
               * Стоит человеку найти поле ввода и начать печатать,
               * подсказку про голос повторно показывать незачем.
               */
              if (value.trim() && voiceHintSeen !== '1') {
                dismissVoiceHint()
              }
            }}

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

            className="flex-1 min-w-0 bg-transparent border-0 outline-none pl-4 pr-2 text-[17px] text-cream placeholder:text-faint"
          />


          <div className="relative shrink-0">
            {showVoiceHint && (
              <>
                {/*
                 * Полноэкранный невидимый слой — тап в любом месте
                 * экрана гасит подсказку и не даёт её больше
                 * показывать. Сама подсказка decorative-only
                 * (pointer-events-none), чтобы тап по ней тоже
                 * попадал на этот слой.
                 */}
                <div
                  className="fixed inset-0 z-[75]"
                  onClick={dismissVoiceHint}
                />

                <div className="absolute bottom-full right-0 mb-3 z-[76] pointer-events-none animate-fade-in">
                  <div className="w-[168px] rounded-2xl bg-cream text-emerald-deep text-[13px] font-semibold leading-snug px-4 py-2.5 text-center shadow-lg">
                    Нажми и удерживай, чтобы записать голосовое
                  </div>

                  <div className="absolute -bottom-[5px] right-6 w-3 h-3 bg-cream rotate-45" />
                </div>
              </>
            )}

            <button
              type="button"

              {...(hasText && voiceState === 'idle'
                ? {
                    onClick: onSend,
                    onPointerDown: () => setVoicePressed(true),
                    onPointerUp: () => setVoicePressed(false),
                    onPointerLeave: () => setVoicePressed(false),
                    onPointerCancel: () => setVoicePressed(false),
                  }
                : {
                    onPointerDown: (event) => {
                      event.preventDefault()

                      setVoicePressed(true)

                      if (voiceState === 'idle') {
                        startVoiceRecording()
                      }
                    },

                    onPointerUp: () => {
                      setVoicePressed(false)

                      if (voiceState === 'recording') {
                        stopVoiceRecording()
                      }
                    },

                    onPointerLeave: () => {
                      setVoicePressed(false)

                      if (voiceState === 'recording') {
                        stopVoiceRecording()
                      }
                    },

                    onPointerCancel: () => {
                      setVoicePressed(false)

                      if (voiceState === 'recording') {
                        stopVoiceRecording()
                      }
                    },

                    onContextMenu: (event) => {
                      event.preventDefault()
                    },

                    style: {
                      touchAction: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                    },
                  })}

              disabled={
                hasText && voiceState === 'idle'
                  ? sending || !hasText
                  : sending || voiceState === 'transcribing'
              }

              className={[
                'w-[54px] h-[54px] rounded-full bg-gold text-emerald-deep flex items-center justify-center shrink-0 disabled:opacity-35 mx-voice-btn',
                voicePressed ? 'mx-voice-btn-pressed' : '',
              ].join(' ')}

              aria-label={
                hasText && voiceState === 'idle'
                  ? 'Отправить'
                  : voiceState === 'recording'
                    ? 'Идёт запись — отпусти, чтобы закончить'
                    : voiceState === 'transcribing'
                      ? 'Распознаю голос'
                      : 'Нажми и удерживай, чтобы записать голосовое'
              }
            >
              <span
                key={iconKey}
                className="mx-voice-icon"
              >
                {voiceState === 'recording' ? (
                  <Square size={20} fill="currentColor" />
                ) : voiceState === 'transcribing' ? (
                  <LoaderCircle size={24} className="animate-spin" />
                ) : hasText ? (
                  <ArrowRight size={25} strokeWidth={1.9} />
                ) : (
                  <Mic size={25} strokeWidth={1.7} />
                )}
              </span>
            </button>
          </div>

        </div>
      </div>

    </div>,
    document.body,
  )
}
