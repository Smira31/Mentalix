/*
 * useVoiceRecorder — запись и распознавание голоса.
 *
 * Логика извлечена из src/screens/mentalix/Conversation.jsx,
 * чтобы переиспользовать в Даймоне без дублирования.
 *
 * В demo-режиме (isPreviewDemoMode) запись заменяется заглушкой:
 * stopRecording подставляет фиксированный текст.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { platform } from '../platform'
import { api } from './api'
import { isPreviewDemoMode } from './demoMode'

const DEMO_TRANSCRIPT = 'Хочу разобраться в том, что сейчас для меня важно.'

export function useVoiceRecorder({ userId, onTranscript, disabled = false }) {
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const stopTimerRef = useRef(null)
  const secondsTimerRef = useRef(null)

  const onTranscriptRef = useRef(onTranscript)
  const disabledRef = useRef(disabled)

  const [voiceState, setVoiceState] = useState('idle')
  const [voiceSeconds, setVoiceSeconds] = useState(0)
  const [voiceError, setVoiceError] = useState('')

  const demoVoice = isPreviewDemoMode()

  const voiceSupported =
    demoVoice ||
    (typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof window !== 'undefined' &&
      typeof window.MediaRecorder !== 'undefined')

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])

  // Cleanup on unmount
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

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current

    if (demoVoice && voiceState === 'recording') {
      onTranscriptRef.current(DEMO_TRANSCRIPT)
      setVoiceState('idle')
      setVoiceSeconds(0)
      return
    }

    if (recorder?.state === 'recording') {
      recorder.stop()
    }
  }, [demoVoice, voiceState])

  const startRecording = useCallback(() => {
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
      navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      }).then(stream => {
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

            if (disabledRef.current) {
              setVoiceError('Не удалось отправить голосовое сообщение, дождитесь отправки текущего.')
              return
            }

            platform.haptic('medium')
            onTranscriptRef.current(transcript)
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

        const startedAt = Date.now()

        secondsTimerRef.current = setInterval(() => {
          setVoiceSeconds(Math.floor((Date.now() - startedAt) / 1000))
        }, 250)

        stopTimerRef.current = setTimeout(() => {
          stopRecording()
        }, 60000)
      }).catch(error => {
        console.error(error)
        setVoiceError('Разреши Mentalix доступ к микрофону и попробуй ещё раз.')
        setVoiceState('idle')
      })
    } catch (error) {
      console.error(error)
      setVoiceError('Разреши Mentalix доступ к микрофону и попробуй ещё раз.')
      setVoiceState('idle')
    }
  }, [demoVoice, voiceSupported, userId, stopRecording])

  return {
    voiceState,
    voiceSeconds,
    voiceError,
    voiceSupported,
    startRecording,
    stopRecording,
  }
}
