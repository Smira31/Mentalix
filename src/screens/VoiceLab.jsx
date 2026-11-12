// src/screens/VoiceLab.jsx
//
// Этап 0 «Голос»: скрытая лаборатория проверки записи микрофона внутри
// Telegram Mini App (iPhone / Android / Desktop).
//
// Это не пользовательская функция: экран открывается только скрытым входом —
// 7 быстрых нажатий по номеру версии в Профиле (Settings.jsx). В меню и
// вкладках его нет. Звук остаётся на устройстве: getUserMedia → MediaRecorder
// → <audio>, никаких сетевых запросов, localStorage, IndexedDB и облака.
//
// Формат выбирается через MediaRecorder.isTypeSupported по порядку:
// audio/mp4 → audio/webm;codecs=opus → audio/ogg;codecs=opus → по умолчанию.
// Максимум 10 с, автостоп; треки освобождаются сразу после стопа.

import { useEffect, useRef, useState } from 'react'

import Screen from '../components/Screen'
import CapsLabel from '../components/ui/CapsLabel'
import PageTitle from '../components/ui/PageTitle'
import PillButton from '../components/ui/PillButton'
import GlassButton from '../components/ui/GlassButton'

import './VoiceLab.css'

const MAX_RECORDING_MS = 10_000
const FORMATS = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus']
const COPIED_RESET_MS = 2000

function readTelegram() {
  const webApp = typeof window === 'undefined' ? null : window.Telegram?.WebApp
  return { platform: String(webApp?.platform || ''), version: String(webApp?.version || '') }
}

// Возможности среды снимаются один раз при открытии экрана: их же видит отчёт.
function readSupport() {
  const getUserMedia =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  const hasRecorder = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined'
  const canCheck = hasRecorder && typeof window.MediaRecorder.isTypeSupported === 'function'

  return {
    telegram: readTelegram(),
    getUserMedia,
    hasRecorder,
    formats: FORMATS.map(type => ({
      type,
      supported: canCheck ? window.MediaRecorder.isTypeSupported(type) : false,
    })),
  }
}

function pickMimeType(formats) {
  return formats.find(format => format.supported)?.type || ''
}

function formatSeconds(ms) {
  return `${(Math.max(0, ms) / 1000).toFixed(1).replace('.', ',')} с`
}

function formatSize(kb) {
  return `${String(kb).replace('.', ',')} КБ`
}

function recordingErrorMessage(error) {
  const name = String(error?.name || '')

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Нет доступа к микрофону. Разреши запись в настройках Telegram (или iOS) и попробуй ещё раз.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Микрофон не найден. Проверь, что он подключён, и попробуй ещё раз.'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Микрофон занят другим приложением. Закрой его и попробуй ещё раз.'
  }
  if (name === 'OverconstrainedError') {
    return 'Микрофон не поддерживает нужные параметры записи. Попробуй ещё раз.'
  }

  return `Не получилось записать звук${name ? ` (${name})` : ''}. Попробуй ещё раз.`
}

function copyWithTextarea(text) {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(field)
  if (!ok) throw new Error('copy failed')
}

export default function VoiceLab({ onBack }) {
  const [support] = useState(readSupport)
  const [status, setStatus] = useState('idle') // idle | requesting | recording | ready
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const stopTimerRef = useRef(null)
  const tickTimerRef = useRef(null)
  const copiedTimerRef = useRef(null)
  const objectUrlRef = useRef(null)

  function clearTimers() {
    clearTimeout(stopTimerRef.current)
    clearInterval(tickTimerRef.current)
    stopTimerRef.current = null
    tickTimerRef.current = null
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }

  // Микрофон освобождается при любом выходе с экрана.
  useEffect(() => {
    return () => {
      clearTimers()
      clearTimeout(copiedTimerRef.current)
      const recorder = recorderRef.current
      if (recorder && recorder.state === 'recording') {
        recorder.onstop = null
        recorder.onerror = null
        recorder.stop()
      }
      recorderRef.current = null
      releaseStream()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  function stopRecording() {
    const recorder = recorderRef.current
    if (recorder && recorder.state === 'recording') recorder.stop()
  }

  async function startRecording() {
    if (status === 'requesting' || status === 'recording') return

    setError('')
    setCopied(false)
    setResult(null)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    if (!support.getUserMedia) {
      setError('В этой версии Telegram нет доступа к микрофону: getUserMedia недоступен.')
      return
    }
    if (!support.hasRecorder) {
      setError('В этой версии Telegram нет MediaRecorder — записать звук здесь нельзя.')
      return
    }

    setStatus('requesting')

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (mediaError) {
      setStatus('idle')
      setError(recordingErrorMessage(mediaError))
      return
    }

    streamRef.current = stream

    const preferred = pickMimeType(support.formats)
    let recorder
    try {
      recorder = preferred
        ? new window.MediaRecorder(stream, { mimeType: preferred })
        : new window.MediaRecorder(stream)
    } catch {
      // Выбранный формат не приняли — пробуем формат по умолчанию.
      try {
        recorder = new window.MediaRecorder(stream)
      } catch (recorderError) {
        releaseStream()
        setStatus('idle')
        setError(recordingErrorMessage(recorderError))
        return
      }
    }

    recorderRef.current = recorder
    chunksRef.current = []
    startedAtRef.current = Date.now()
    setSeconds(0)
    setStatus('recording')

    recorder.ondataavailable = event => {
      if (event.data?.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onerror = () => {
      clearTimers()
      const broken = recorderRef.current
      if (broken && broken.state === 'recording') {
        broken.onstop = null
        broken.stop()
      }
      recorderRef.current = null
      releaseStream()
      setStatus('idle')
      setError('Запись прервалась. Попробуй ещё раз.')
    }

    recorder.onstop = () => {
      const durationMs = Date.now() - startedAtRef.current
      clearTimers()
      releaseStream()
      recorderRef.current = null

      const mimeType = recorder.mimeType || preferred || ''
      const blob = new Blob(chunksRef.current, mimeType ? { type: mimeType } : undefined)
      chunksRef.current = []

      if (!blob.size) {
        setStatus('idle')
        setError('Запись пустая: микрофон не передал звук. Попробуй ещё раз.')
        return
      }

      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      setResult({
        url,
        mimeType: mimeType || 'не определён',
        durationMs,
        sizeKb: (blob.size / 1024).toFixed(1),
      })
      setSeconds(durationMs / 1000)
      setStatus('ready')
    }

    try {
      recorder.start()
    } catch (startError) {
      recorder.onstop = null
      recorder.onerror = null
      recorderRef.current = null
      releaseStream()
      setStatus('idle')
      setError(recordingErrorMessage(startError))
      return
    }

    tickTimerRef.current = setInterval(() => {
      setSeconds(Math.min(MAX_RECORDING_MS, Date.now() - startedAtRef.current) / 1000)
    }, 200)
    stopTimerRef.current = setTimeout(stopRecording, MAX_RECORDING_MS)
  }

  function buildReport() {
    const { telegram, getUserMedia, hasRecorder, formats } = support
    return [
      'Mentalix · лаборатория голоса',
      `Telegram.WebApp.platform: ${telegram.platform || 'не Telegram'}`,
      `Telegram.WebApp.version: ${telegram.version || 'не Telegram'}`,
      `userAgent: ${navigator.userAgent}`,
      `getUserMedia: ${getUserMedia ? 'есть' : 'нет'}`,
      `MediaRecorder: ${hasRecorder ? 'есть' : 'нет'}`,
      ...formats.map(
        format => `isTypeSupported(${format.type}): ${format.supported ? 'да' : 'нет'}`
      ),
      `Выбранный формат: ${result?.mimeType || 'не выбран'}`,
      `Длительность: ${result ? formatSeconds(result.durationMs) : '—'}`,
      `Размер: ${result ? formatSize(result.sizeKb) : '—'}`,
      `Ошибка: ${error || 'нет'}`,
    ].join('\n')
  }

  async function copyReport() {
    const text = buildReport()

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          // Webview может не дать доступ к буферу — тогда запасной путь.
          copyWithTextarea(text)
        }
      } else {
        copyWithTextarea(text)
      }
      setCopied(true)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    } catch {
      setError('Не удалось скопировать отчёт. Попробуй ещё раз.')
    }
  }

  const unsupported = !support.getUserMedia
    ? 'В этой среде нет доступа к микрофону (getUserMedia).'
    : !support.hasRecorder
      ? 'В этой среде нет MediaRecorder — запись невозможна.'
      : ''

  const statusText =
    status === 'requesting'
      ? 'Запрашиваем доступ к микрофону…'
      : status === 'recording'
        ? 'Идёт запись. Остановится сама через 10 секунд.'
        : status === 'ready'
          ? 'Запись готова — послушай и скопируй отчёт.'
          : 'Готов к проверке.'

  return (
    <Screen onBack={onBack} backTestId="voice-lab-back">
      <div className="mx-voice-lab" data-testid="voice-lab-screen">
        <CapsLabel>лаборатория</CapsLabel>
        <PageTitle className="mx-voice-lab__title">голос.</PageTitle>
        <p className="mx-voice-lab__intro">
          Проверка записи микрофона внутри Telegram. Звук остаётся на этом устройстве: мы никуда
          его не отправляем и не сохраняем.
        </p>

        <div className="mx-voice-lab__card">
          {unsupported && (
            <p className="mx-voice-lab__notice" data-testid="voice-lab-unsupported">
              {unsupported}
            </p>
          )}

          <p className="mx-voice-lab__status" data-testid="voice-lab-status">
            {statusText}
          </p>

          {status === 'recording' && (
            <p className="mx-voice-lab__timer" data-testid="voice-lab-timer">
              {seconds.toFixed(1).replace('.', ',')} с из 10
            </p>
          )}

          <div className="mx-voice-lab__actions">
            {status === 'recording' ? (
              <GlassButton
                testId="voice-lab-stop"
                onClick={stopRecording}
                className="mx-voice-lab__action"
              >
                Стоп
              </GlassButton>
            ) : (
              <PillButton
                testId="voice-lab-record"
                onClick={startRecording}
                disabled={status === 'requesting'}
                className="mx-voice-lab__action"
              >
                {status === 'requesting'
                  ? 'Ждём доступ…'
                  : status === 'ready'
                    ? 'Записать снова'
                    : 'Записать'}
              </PillButton>
            )}
          </div>

          {error && (
            <p role="alert" className="mx-voice-lab__error" data-testid="voice-lab-error">
              {error}
            </p>
          )}

          {result && (
            <div className="mx-voice-lab__result">
              <audio
                controls
                preload="metadata"
                src={result.url}
                className="mx-voice-lab__audio"
                data-testid="voice-lab-audio"
              />
              <dl className="mx-voice-lab__facts">
                <div>
                  <dt>Формат</dt>
                  <dd data-testid="voice-lab-mime">{result.mimeType}</dd>
                </div>
                <div>
                  <dt>Длительность</dt>
                  <dd data-testid="voice-lab-duration">{formatSeconds(result.durationMs)}</dd>
                </div>
                <div>
                  <dt>Размер</dt>
                  <dd data-testid="voice-lab-size">{formatSize(result.sizeKb)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="mx-voice-lab__card">
          <p className="mx-voice-lab__label">Среда</p>
          <dl className="mx-voice-lab__facts">
            <div>
              <dt>Telegram</dt>
              <dd data-testid="voice-lab-platform">
                {support.telegram.platform || 'не Telegram'}
              </dd>
            </div>
            <div>
              <dt>Версия</dt>
              <dd data-testid="voice-lab-version">{support.telegram.version || '—'}</dd>
            </div>
            <div>
              <dt>getUserMedia</dt>
              <dd data-testid="voice-lab-getusermedia">
                {support.getUserMedia ? 'есть' : 'нет'}
              </dd>
            </div>
            <div>
              <dt>MediaRecorder</dt>
              <dd data-testid="voice-lab-media-recorder">
                {support.hasRecorder ? 'есть' : 'нет'}
              </dd>
            </div>
            {support.formats.map(format => (
              <div key={format.type}>
                <dt>{format.type}</dt>
                <dd>{format.supported ? 'да' : 'нет'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <GlassButton
          testId="voice-lab-copy-report"
          onClick={copyReport}
          className="mx-voice-lab__action"
        >
          {copied ? 'Отчёт скопирован' : 'Скопировать отчёт'}
        </GlassButton>
      </div>
    </Screen>
  )
}
