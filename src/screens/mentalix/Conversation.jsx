import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { ArrowRight, LoaderCircle, Mic, Square } from 'lucide-react'

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
  privacyControls,
  contextSlot = null,
  footerSlot = null,
  sendError = '',
  onRetry,
}) {
  const meta = personaMeta || PERSONAS.find(item => item.key === persona) || PERSONAS[0]

  const { style: surfaceStyle } = useFullscreenSurface()

  const scrollRef = useRef(null)
  const previousMessageCount = useRef(0)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const stopTimerRef = useRef(null)
  const secondsTimerRef = useRef(null)
  const sendingRef = useRef(sending)

  const [voiceState, setVoiceState] = useState('idle')
  const [voiceSeconds, setVoiceSeconds] = useState(0)
  const [voiceError, setVoiceError] = useState('')
  const [expandedMessages, setExpandedMessages] = useState(() => new Set())
  const [feedbackByMessage, setFeedbackByMessage] = useState(() => new Set())
  const [feedbackError, setFeedbackError] = useState('')

  const voiceSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'

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

  async function leaveFeedback(messageId, rating) {
    if (!messageId || feedbackByMessage.has(messageId)) return
    setFeedbackError('')
    try {
      await api.mentalix.feedback(userId, rating, messageId)
      setFeedbackByMessage(previous => new Set(previous).add(messageId))
    } catch {
      setFeedbackError('Не удалось сохранить отметку. Попробуй ещё раз.')
    }
  }

  function scrollToEnd(behavior = 'smooth') {
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

      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  function stopVoiceRecording() {
    const recorder = recorderRef.current

    if (recorder?.state === 'recording') {
      recorder.stop()
    }
  }

  // NOTE: remainder of file truncated in this emergency restore - WILL FIX
  return null
}
