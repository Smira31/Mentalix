import { getFullscreenPortalTarget } from '../../lib/fullscreenSurface'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { ArrowRight, LoaderCircle, Mic, Square } from 'lucide-react'

import { platform } from '../../platform'
import BackButton from '../../components/BackButton'
import { api } from '../../lib/api'
import { isPreviewDemoMode } from '../../lib/demoMode'
import { useSynced } from '../../lib/store'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../../lib/fullscreenSurface'

import { PERSONAS } from './personas'
import MessageText from './MessageText'
import {
  groupJournalMessages,
  isLongJournalMessage,
  journalMessageKey,
  messageContent,
} from '../../lib/journalPresentation'
import './Conversation.css'

const VOICE_HINT_KEY = 'mx-voice-hint-v1'
const VOICE_HINT_TIMEOUT = 4500

export default function Conversation({
  userId,
  persona,
  personaMeta = null,
  messages,
  input,
  setInput,
  loading,
  sending,
  onSend,
  onBack,
  contextSlot = null,
  footerSlot = null,
  sendError = '',
  onRetry,
}) {
  const meta = personaMeta || PERSONAS.find(item => item.key === persona) || PERSONAS[0]

  const { style: surfaceStyle, keyboardOpen } = useFullscreenSurface()

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const restoreComposerFocusRef = useRef(false)
  const previousMessageCount = useRef(0)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const stopTimerRef = useRef(null)
  const secondsTimerRef = useRef(null)
  const sendingRef = useRef(sending)
  const suppressVoiceClickRef = useRef(false)

  const [voiceState, setVoiceState] = useState('idle')
  const [voiceSeconds, setVoiceSeconds] = useState(0)
  const [voiceError, setVoiceError] = useState('')
  const [expandedMessages, setExpandedMessages] = useState(() => new Set())
  const demoVoice = isPreviewDemoMode()

  const voiceSupported =
    demoVoice ||
    (typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof window !== 'undefined' &&
      typeof window.MediaRecorder !== 'undefined')

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

  const [voicePressed, setVoicePressed] = useState(false)

  const [voiceHintSeen, setVoiceHintSeen] = useSynced(VOICE_HINT_KEY, '0')
  const [voiceHintDismissed, setVoiceHintDismissed] = useState(false)

  const showVoiceHint =
    voiceSupported &&
    voiceHintSeen !== '1' &&
    !voiceHintDismissed &&
    !hasText &&
    voiceState === 'idle'

  const dismissVoiceHint = useCallback(() => {
    setVoiceHintDismissed(true)
    setVoiceHintSeen('1')
  }, [setVoiceHintSeen])

  useEffect(() => {
    if (!showVoiceHint) return

    const timer = setTimeout(dismissVoiceHint, VOICE_HINT_TIMEOUT)

    return () => clearTimeout(timer)
  }, [showVoiceHint, dismissVoiceHint])

  function scrollToEnd(behavior = 'smooth') {
    const scroll = scrollRef.current

    if (!scroll) return

    scroll.scrollTo({
      top: scroll.scrollHeight,
      behavior,
    })
  }

  async function sendFromComposer() {
    if (!input.trim() || sending) return

    restoreComposerFocusRef.current = document.activeElement === inputRef.current
    await onSend()

    if (restoreComposerFocusRef.current) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true })
      })
    }
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

      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  function stopVoiceRecording() {
    const recorder = recorderRef.current

    if (demoVoice && voiceState === 'recording') {
      setInput('Хочу разобраться в том, что сейчас для меня важно.')
      setVoiceState('idle')
      setVoiceSeconds(0)
      dismissVoiceHint()
      return
    }

    if (recorder?.state === 'recording') {
      recorder.stop()
    }
  }

  async function startVoiceRecording() {
    setVoiceError('')

    if (demoVoice) {
      setVoiceState('recording')
      setVoiceSeconds(0)
      platform.haptic('medium')
      return
    }

    if (!voiceSupported) {
      setVoiceError('Запись голоса недоступна в этой версии Telegram.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      const Recorder = window.MediaRecorder
      const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(type =>
        Recorder.isTypeSupported(type)
      )

      const recorder = new Recorder(stream, mimeType ? { mimeType } : undefined)

      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = event => {
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

        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
        recorderRef.current = null

        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })

        chunksRef.current = []

        if (!audio.size) {
          setVoiceError('Голос не записался. Попробуй ещё раз.')
          setVoiceState('idle')
          return
        }

        setVoiceState('transcribing')

        try {
          const result = await api.mentalix.transcribe(userId, audio)

          const transcript = String(result?.text || '').trim()

          if (!transcript) {
            throw new Error('empty transcript')
          }

          if (sendingRef.current) {
            setVoiceError('Не удалось отправить голосовое сообщение, дождитесь отправки текущего.')
            return
          }

          platform.haptic('medium')
          setInput(transcript)
          dismissVoiceHint()
        } catch (error) {
          console.error(error)
          const message = String(error?.message || '')
          const voiceCode = message.match(/VOICE_[A-Z0-9_]+/)?.[0]
          const httpStatus = message.match(/failed: (\d{3})/)?.[1]
          const diagnosticCode = voiceCode || (httpStatus ? `HTTP_${httpStatus}` : 'NETWORK')

          setVoiceError(`Не удалось распознать голос. Код: ${diagnosticCode}.`)
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
        setVoiceSeconds(Math.floor((Date.now() - startedAt) / 1000))
      }, 250)

      stopTimerRef.current = setTimeout(() => {
        stopVoiceRecording()
      }, 60000)
    } catch (error) {
      console.error(error)
      setVoiceError('Разреши Mentalix доступ к микрофону и попробуй ещё раз.')
      setVoiceState('idle')
    }
  }

  useEffect(() => {
    if (loading) return

    const firstPosition = previousMessageCount.current === 0

    previousMessageCount.current = messages.length

    const frame = window.requestAnimationFrame(() => {
      scrollToEnd(firstPosition ? 'auto' : 'smooth')
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [loading, messages.length, sending])

  useEffect(() => {
    if (!keyboardOpen) return undefined

    const frame = window.requestAnimationFrame(() => {
      scrollToEnd('auto')
    })

    return () => window.cancelAnimationFrame(frame)
  }, [keyboardOpen])

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} ${demoVoice ? 'mx-conversation-surface--demo' : ''}`}
      style={{
        ...surfaceStyle,

        background: 'rgb(var(--c-bg))',
        paddingBottom: '0px',
      }}
    >
      {/* ── шапка ── */}

      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mt-2 grid grid-cols-[1fr_auto_1fr] items-center px-[var(--mx-screen-x)]`}
      >
        <div className="justify-self-start">
          <BackButton onClick={onBack} />
        </div>

        <h1 className="justify-self-center mx-ai-meta text-cream leading-none whitespace-nowrap">
          {meta.name}
        </h1>

        <span aria-hidden="true" />
      </div>

      {/* ── история сообщений ── */}

      <div
        ref={scrollRef}
        className={`${FULLSCREEN_SCROLL_CLASS} mx-conversation-scroll px-[var(--mx-screen-x)] pb-6`}
      >
        {!loading && contextSlot}

        {loading && <p className="text-muted text-[14px] text-center pt-4">Загрузка...</p>}

        {!loading && messages.length === 0 && (
          <p className="text-muted text-[14px] text-center pt-10 leading-[1.6]">
            {meta.desc}
            <br />
            <br />
            Напиши первым — {meta.name} ответит.
          </p>
        )}

        <div className="w-full max-w-md mx-auto space-y-3.5">
          {groupJournalMessages(messages).map(group => (
            <div key={group.key} className="space-y-3.5">
              {group.label && (
                <div className="pt-2 text-center text-[10px] uppercase tracking-[0.18em] text-muted">
                  {group.label}
                </div>
              )}

              {group.messages.map(({ message, index }) => {
                const isUser = message.role === 'user'
                const messageKey = journalMessageKey(message, index)
                const isLong = !isUser && isLongJournalMessage(message)
                const isExpanded = expandedMessages.has(messageKey)

                if (isUser) {
                  return (
                    <div key={messageKey} className="mx-imessage-row mx-imessage-row--user">
                      <div className="mx-imessage-bubble mx-imessage-bubble--user">
                        {messageContent(message)}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={messageKey} className="mx-imessage-row mx-imessage-row--assistant">
                    <div className="mx-ai-meta text-gold mb-1.5">{meta.name}</div>

                    <div className="mx-imessage-bubble mx-imessage-bubble--assistant mx-ai-body text-cream break-words">
                      <MessageText content={messageContent(message)} />
                    </div>

                    {isLong && (
                      <button
                        type="button"
                        data-testid="ai-expand-reply"
                        className="mx-ai-meta mt-3 text-gold"
                        onClick={() => {
                          setExpandedMessages(previous => {
                            const next = new Set(previous)
                            if (next.has(messageKey)) next.delete(messageKey)
                            else next.add(messageKey)
                            return next
                          })
                        }}
                      >
                        {isExpanded ? 'Свернуть ответ' : 'Читать полностью'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {sendError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-2xl bg-cream/5 px-4 py-3 text-[12px] text-muted"
            >
              <span>{sendError}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="shrink-0 font-semibold text-gold"
                >
                  Повторить
                </button>
              )}
            </div>
          )}

          {sending && (
            <div className="w-full py-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-gold font-semibold mb-3">
                {meta.name}
              </div>

              <p className="text-[14px] text-muted">{meta.typing}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── composer ── */}

      <div
        className="shrink-0 px-4 pt-3"

        style={{
          paddingBottom: keyboardOpen ? '1px' : 'max(4px, env(safe-area-inset-bottom))',
        }}
      >
        {(voiceState !== 'idle' || voiceError) && (
          <div className="w-full max-w-md mx-auto px-3 pb-2 text-center text-[12px]">
            {voiceState === 'recording' && (
              <span className="text-gold">
                Запись · 0:{String(voiceSeconds).padStart(2, '0')} · отпусти кнопку, чтобы закончить
              </span>
            )}

            {voiceState === 'transcribing' && <span className="text-muted">Распознаю голос…</span>}

            {voiceError && voiceState === 'idle' && (
              <span className="text-red-400">{voiceError}</span>
            )}
          </div>
        )}

        <div className="mx-ai-composer w-full max-w-md mx-auto min-h-[72px] rounded-[36px] bg-black/45 border border-cream/10 flex items-center gap-2.5 px-2.5">
          <input
            ref={inputRef}
            value={input}
            data-testid="mentor-input"

            onFocus={() => {
              restoreComposerFocusRef.current = true
            }}

            onBlur={() => {
              restoreComposerFocusRef.current = false
            }}

            onChange={event => {
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

            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void sendFromComposer()
              }
            }}

            placeholder={`Написать ${meta.name}…`}

            name="mentor-message"
            autoComplete="off"
            autoCapitalize="sentences"
            inputMode="text"
            enterKeyHint="send"
            className="mx-ai-input flex-1 min-w-0 bg-transparent border-0 outline-none pl-4 pr-2 text-cream placeholder:text-faint"
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
                <div className="fixed inset-0 z-[75]" onClick={dismissVoiceHint} />

                <div className="absolute bottom-full right-0 mb-3 z-[76] pointer-events-none animate-fade-in">
                  <div className="w-[168px] rounded-2xl bg-cream text-emerald-deep text-[12px] font-semibold leading-snug px-4 py-2.5 text-center shadow-lg">
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
                    onClick: () => {
                      if (suppressVoiceClickRef.current) {
                        suppressVoiceClickRef.current = false
                        return
                      }
                      void sendFromComposer()
                    },
                    onPointerDown: event => {
                      event.preventDefault()
                      setVoicePressed(true)
                    },
                    onPointerUp: () => setVoicePressed(false),
                    onPointerLeave: () => setVoicePressed(false),
                    onPointerCancel: () => setVoicePressed(false),
                  }
                : {
                    onClick: demoVoice
                      ? () => {
                          if (suppressVoiceClickRef.current) {
                            suppressVoiceClickRef.current = false
                            return
                          }

                          if (voiceState === 'idle') startVoiceRecording()
                          else if (voiceState === 'recording') stopVoiceRecording()
                        }
                      : undefined,
                    onPointerDown: event => {
                      event.preventDefault()
                      event.currentTarget.setPointerCapture?.(event.pointerId)

                      setVoicePressed(true)

                      if (voiceState === 'idle') {
                        startVoiceRecording()
                      }
                    },

                    onPointerUp: event => {
                      setVoicePressed(false)
                      event.currentTarget.releasePointerCapture?.(event.pointerId)

                      if (voiceState === 'recording') {
                        suppressVoiceClickRef.current = true
                        stopVoiceRecording()
                      }
                    },

                    onPointerLeave: event => {
                      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) return

                      setVoicePressed(false)

                      if (voiceState === 'recording') {
                        suppressVoiceClickRef.current = true
                        stopVoiceRecording()
                      }
                    },

                    onPointerCancel: () => {
                      setVoicePressed(false)

                      if (voiceState === 'recording') {
                        suppressVoiceClickRef.current = true
                        stopVoiceRecording()
                      }
                    },

                    onContextMenu: event => {
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
              <span key={iconKey} className="mx-voice-icon">
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

        {footerSlot}
      </div>
    </div>,
    getFullscreenPortalTarget()
  )
}
