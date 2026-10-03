import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import Screen from '../../components/Screen'
import CapsLabel from '../../components/ui/CapsLabel'
import RoundNextButton from '../../components/ui/RoundNextButton'
import SemanticGlyph from '../../components/SemanticGlyph'
import CheckInCompletion from '../../components/CheckInCompletion'
import { illustrations } from '../../assets/illustrations'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { api } from '../../lib/api'
import { now } from '../../lib/clock'
import { toLocalCalendarDate, toMoscowCalendarDate } from '../../lib/dateTimezonePolicy'
import { isPreviewDemoMode } from '../../lib/demoMode'
import { checkinFeedbackValue } from '../../lib/checkinFeedback'
import {
  readDailyJournalDraft,
  saveDailyJournalDraft,
  clearDailyJournalDraft,
} from '../../lib/dailyJournalDraft'
import { dispatchTabRefresh } from '../../lib/tabRefresh'
import { DEFAULT_JOURNAL_PROMPTS } from '../../lib/dailyJournalConstants'
import DailyJournalSetup from './DailyJournalSetup'
import DailyJournalEntries from './DailyJournalEntries'
import './DailyJournalFlow.css'

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

function formatRussianDateTime(d) {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatRussianDate(d) {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
}

function wordCount(text) {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

function setupHasData(setup) {
  if (!setup) return false
  return Boolean(
    setup.goals?.some(g => g.trim()) ||
    setup.reminders?.some(r => r.trim()) ||
    setup.vision?.scene?.trim() ||
    setup.vision?.obstacle?.trim() ||
    setup.vision?.plan?.trim()
  )
}

const JOURNAL_TEXT_MAX = 4000
const DRAFT_DEBOUNCE_MS = 400

// День записи считает сервер по Москве; в демо — часы демо-клока на устройстве.
function journalDate(date) {
  return isPreviewDemoMode() ? toLocalCalendarDate(date) : toMoscowCalendarDate(date)
}

function stripLeadingTimestamp(text) {
  if (!text) return text
  return text.replace(/^\d{1,2}\s+\S+,\s\d{2}:\d{2}\.\s*/, '')
}

export default function DailyJournalFlow({ userId, onClose, reflectionPrompt = null }) {
  const [todayDate, setTodayDate] = useState(() => now())
  const dateStr = journalDate(todayDate)

  const [stage, setStage] = useState('loading')
  const [setup, setSetup] = useState(null)
  const [totalDays, setTotalDays] = useState(0)
  const [streamText, setStreamText] = useState('')
  const [promptText, setPromptText] = useState('')
  const [promptAnswer, setPromptAnswer] = useState('')
  const [entryId, setEntryId] = useState(null)
  const [dayNumber, setDayNumber] = useState(null)
  const [helpful, setHelpful] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [resetError, setResetError] = useState(false)
  const [pendingComplete, setPendingComplete] = useState(false)
  const [hasTodayEntry, setHasTodayEntry] = useState(false)
  const [entriesReturnStage, setEntriesReturnStage] = useState(null)
  const streamRef = useRef(null)
  const answerRef = useRef(null)
  const appendCursorRef = useRef(false)
  const savingRef = useRef(false)
  const flushingRef = useRef(false)
  const pendingRef = useRef(false)
  const dateStrRef = useRef(dateStr)
  const latestRef = useRef({})
  useLayoutEffect(() => {
    dateStrRef.current = dateStr
    latestRef.current = { stage, streamText, promptAnswer, promptText, userId, dateStr }
  })

  // Отправка записи; бросает ошибку при сбое. Дата — по Москве в момент отправки.
  const postEntry = useCallback(
    async ({ stream, answer, prompt, date, stampDate }) => {
      const timestamp = `${formatRussianDateTime(stampDate)}.`
      const result = await api.dailyJournal.createEntry(userId, {
        date,
        stream_text: stream.trim() ? `${timestamp} ${stream}` : '',
        prompt_text: prompt,
        prompt_answer: answer,
        helpful: null,
      })
      setEntryId(result.id)
      setDayNumber(result.day_number)
      setSaveError(false)
      pendingRef.current = false
      clearDailyJournalDraft(userId, date)
      if (date !== dateStrRef.current) clearDailyJournalDraft(userId, dateStrRef.current)
      // Обновляем вкладку «Сегодня» после записи журнала —
      // вместе с ACTIVITY_WRITE (mentalix:activity-saved) из api.js.
      dispatchTabRefresh('today')
      return result
    },
    [userId]
  )

  // Новый день по Москве / возврат на вкладку: пересчитать «сегодня».
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      setTodayDate(prev => {
        const next = now()
        return journalDate(next) === journalDate(prev) ? prev : next
      })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Автоповтор неотправленной записи: появилась связь или вернулись на вкладку.
  const flushPending = useCallback(async () => {
    if (flushingRef.current || savingRef.current || !pendingRef.current) return
    const date = dateStrRef.current
    const draft = readDailyJournalDraft(userId, date)
    if (!draft?.pendingSave) return
    flushingRef.current = true
    try {
      const entries = await api.dailyJournal.entries(userId, { limit: 50 })
      if (entries.items?.some(e => e.date === date)) {
        pendingRef.current = false
        saveDailyJournalDraft(userId, date, { ...draft, pendingSave: false })
        return
      }
      await postEntry({
        stream: draft.streamText,
        answer: draft.promptAnswer,
        prompt: draft.promptText,
        date,
        stampDate: draft.updatedAt ? new Date(draft.updatedAt) : now(),
      })
    } catch (error) {
      console.error('[dailyJournal] retry failed', error)
    } finally {
      flushingRef.current = false
    }
  }, [userId, postEntry])

  useEffect(() => {
    function onOnline() {
      flushPending()
    }
    function onVisible() {
      if (document.visibilityState === 'visible') flushPending()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [flushPending])

  // ── Init: fetch setup + entries, try pending draft ──
  useEffect(() => {
    let cancelled = false

    const draft = readDailyJournalDraft(userId, dateStr)
    pendingRef.current = Boolean(draft?.pendingSave)

    async function init() {
      try {
        const [setupData, entriesData] = await Promise.all([
          api.dailyJournal.getSetup(userId),
          api.dailyJournal.entries(userId, { limit: 50 }),
        ])
        if (cancelled) return

        setSetup(setupData)
        const td = entriesData.total_days || 0
        setTotalDays(td)

        const todayEntry = entriesData.items?.find(e => e.date === dateStr)

        const restoreDraftAndStage = () => {
          const d = readDailyJournalDraft(userId, dateStr)
          if (d?.streamText) setStreamText(d.streamText)
          if (d?.promptAnswer) setPromptAnswer(d.promptAnswer)
          if (d?.promptText) setPromptText(d.promptText)

          // Default question (cycling by total_days)
          if (!d?.promptText) {
            const prompts = setupData?.prompts || []
            const qIndex = td % Math.max(1, prompts.length)
            setPromptText(reflectionPrompt || prompts[qIndex] || '')
          }

          if (!setupData?.updated_at) {
            setStage(reflectionPrompt ? 'setup' : 'intro')
          } else if (setupHasData(setupData)) {
            setStage('review')
          } else {
            setStage('stream')
          }
        }

        if (todayEntry) {
          const serverStream = stripLeadingTimestamp(todayEntry.stream_text || '')
          const serverAnswer = todayEntry.prompt_answer || ''
          setHasTodayEntry(true)
          setEntryId(todayEntry.id)
          setPromptText(todayEntry.prompt_text || '')
          // «Дописать»: непустой локальный черновик не затираем серверным текстом
          const local = readDailyJournalDraft(userId, dateStr)
          const localStream = local?.streamText || ''
          const localAnswer = local?.promptAnswer || ''
          const hasUnsavedDraft =
            (localStream.trim() && localStream.trim() !== serverStream.trim()) ||
            (localAnswer.trim() && localAnswer.trim() !== serverAnswer.trim())
          if (local?.pendingSave) pendingRef.current = false
          if (hasUnsavedDraft) {
            setStreamText(localStream.trim() ? localStream : serverStream)
            setPromptAnswer(localAnswer.trim() ? localAnswer : serverAnswer)
            appendCursorRef.current = true
            setStage('stream')
          } else {
            setStreamText(serverStream)
            setPromptAnswer(serverAnswer)
            setStage('today')
          }
        } else if (draft?.pendingSave && (draft.streamText || draft.promptAnswer)) {
          // Повтор черновика — только после загрузки и если записи за сегодня нет
          try {
            await postEntry({
              stream: draft.streamText,
              answer: draft.promptAnswer,
              prompt: draft.promptText,
              date: dateStr,
              stampDate: draft.updatedAt ? new Date(draft.updatedAt) : todayDate,
            })
            if (cancelled) return
            setHasTodayEntry(true)
            setStreamText(draft.streamText)
            setPromptAnswer(draft.promptAnswer)
            setPromptText(draft.promptText)
            setStage('today')
            return
          } catch (error) {
            console.error('[dailyJournal] pending send failed', error)
            if (cancelled) return
          }
          restoreDraftAndStage()
        } else {
          restoreDraftAndStage()
        }
      } catch (error) {
        console.error('[dailyJournal] init failed', error)
        if (cancelled) return
        // Сервер недоступен — покажем локально сохранённый черновик как «не отправлено»
        const d = readDailyJournalDraft(userId, dateStr)
        if (d?.streamText || d?.promptAnswer) {
          setHasTodayEntry(true)
          setSaveError(true)
          pendingRef.current = Boolean(d.pendingSave)
          setStreamText(d.streamText || '')
          setPromptAnswer(d.promptAnswer || '')
          setPromptText(d.promptText || '')
          setStage('today')
        } else {
          setStage('stream')
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draft persistence ──
  // Запись — с задержкой 400 мс; при сворачивании/закрытии — сразу.
  const flushDraft = useCallback(() => {
    const cur = latestRef.current
    if (cur.stage !== 'stream' && cur.stage !== 'question') return
    saveDailyJournalDraft(cur.userId, cur.dateStr, {
      streamText: cur.streamText,
      promptAnswer: cur.promptAnswer,
      promptText: cur.promptText,
      pendingSave: pendingRef.current,
    })
  }, [])

  useEffect(() => {
    if (stage !== 'stream' && stage !== 'question') return undefined
    const timer = window.setTimeout(flushDraft, DRAFT_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [streamText, promptAnswer, stage, dateStr, promptText, flushDraft])

  useEffect(() => {
    function onHidden() {
      if (document.visibilityState === 'hidden') flushDraft()
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', flushDraft)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', flushDraft)
      flushDraft()
    }
  }, [flushDraft])

  // ── Auto-focus ──
  useEffect(() => {
    if (stage !== 'stream' && stage !== 'question') return
    const ref = stage === 'stream' ? streamRef : answerRef
    const focusField = () => {
      ref.current?.focus({ preventScroll: true })
      if (appendCursorRef.current && ref.current) {
        const len = ref.current.value.length
        ref.current.setSelectionRange(len, len)
        appendCursorRef.current = false
      }
    }
    const frame = window.requestAnimationFrame(focusField)
    const retry = window.setTimeout(focusField, 80)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [stage])

  // ── Pending complete (wait for keyboard to close) ──
  useEffect(() => {
    if (!pendingComplete) return
    const vv = window.visualViewport
    const isStable = () => !vv || vv.height >= window.innerHeight - 80
    if (isStable()) {
      setPendingComplete(false)
      setStage('complete')
      return
    }
    function onResize() {
      if (isStable()) {
        setPendingComplete(false)
        setStage('complete')
      }
    }
    vv.addEventListener('resize', onResize)
    const fallback = setTimeout(() => {
      if (isStable()) {
        setPendingComplete(false)
        setStage('complete')
      }
    }, 400)
    return () => {
      vv.removeEventListener('resize', onResize)
      clearTimeout(fallback)
    }
  }, [pendingComplete])

  // ── Back button ──
  const goBack = useCallback(() => {
    if (stage === 'setup') return
    if (stage === 'entries') return
    if (stage === 'today') {
      onClose()
      return
    }
    if (reflectionPrompt && (stage === 'stream' || stage === 'review')) {
      flushDraft()
      onClose()
      return
    }
    if (stage === 'stream') {
      platform.haptic('light')
      if (hasTodayEntry) {
        setStage('today')
      } else {
        setStage(setupHasData(setup) ? 'review' : 'intro')
      }
      return
    }
    if (stage === 'question') {
      platform.haptic('light')
      setStage('stream')
      return
    }
    if (stage === 'review' && hasTodayEntry) {
      setStage('today')
      return
    }
    onClose()
  }, [stage, onClose, setup, hasTodayEntry, reflectionPrompt, flushDraft])

  useBackButton(goBack)

  // ── Setup handlers ──
  function handleSetupComplete(newSetup) {
    setSetup(newSetup)
    setStage(setupHasData(newSetup) ? 'review' : 'stream')
  }

  function handleSetupBack() {
    if (reflectionPrompt && !setup?.updated_at) {
      onClose()
      return
    }
    if (setup?.updated_at) {
      setStage('review')
    } else {
      setStage('intro')
    }
  }

  // ── Reset setup ──
  async function handleResetSetup() {
    const confirmed = await platform.showConfirm(
      'Сбросить цели, напоминания и картинку будущего? Записи журнала останутся.'
    )
    if (!confirmed) return

    platform.haptic('light')
    try {
      const result = await api.dailyJournal.saveSetup(userId, {
        goals: [],
        reminders: [],
        vision: { scene: '', obstacle: '', plan: '' },
        prompts: [...DEFAULT_JOURNAL_PROMPTS],
        reminder: { enabled: false, time: '21:00' },
      })
      setSetup(result)
      setResetError(false)
      setStage('intro')
    } catch (error) {
      console.error('[dailyJournal] reset failed', error)
      setResetError(true)
      setTimeout(() => setResetError(false), 3000)
    }
  }

  // ── Мои записи ──
  function openEntries() {
    platform.haptic('light')
    setEntriesReturnStage(stage)
    setStage('entries')
  }

  function closeEntries() {
    setStage(entriesReturnStage || (hasTodayEntry ? 'today' : 'review'))
  }

  // ── Дописать: открыть поток с уже введённым текстом ──
  function handleAppend() {
    platform.haptic('light')
    appendCursorRef.current = true
    if (streamText.trim()) {
      setStreamText(prev => prev + '\n')
    }
    setStage('stream')
  }

  // ── Save entry ──
  async function saveAndComplete() {
    // Замок от двойного тапа: setSaving асинхронный, ref — мгновенный
    if (savingRef.current) return
    savingRef.current = true

    const active = document.activeElement
    if (active && typeof active.blur === 'function') {
      active.blur()
    }

    setSaving(true)
    try {
      await postEntry({
        stream: streamText,
        answer: promptAnswer,
        prompt: promptText,
        date: journalDate(now()),
        stampDate: todayDate,
      })
    } catch (error) {
      console.error('[dailyJournal] save failed', error)
      setSaveError(true)
      pendingRef.current = true
      saveDailyJournalDraft(userId, dateStrRef.current, {
        streamText,
        promptAnswer,
        promptText,
        pendingSave: true,
      })
    } finally {
      savingRef.current = false
      setSaving(false)
    }

    const vv = window.visualViewport
    if (!vv || vv.height >= window.innerHeight - 80) {
      setStage('complete')
      return
    }
    setPendingComplete(true)
  }

  // ── Отправить неотправленный локальный черновик (экран «Запись сегодня») ──
  async function sendUnsent() {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    platform.haptic('light')
    try {
      await postEntry({
        stream: streamText,
        answer: promptAnswer,
        prompt: promptText,
        date: journalDate(now()),
        stampDate: todayDate,
      })
    } catch (error) {
      console.error('[dailyJournal] send failed', error)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  // ── Feedback ──
  function handleFeedback(label) {
    platform.haptic('light')
    const value = checkinFeedbackValue(label)
    setHelpful(value)
    if (entryId) {
      api.dailyJournal.updateEntry(entryId, userId, value).catch(error => {
        console.error('[dailyJournal] feedback failed', error)
      })
    }
  }

  // ── Derived values ──
  const streamWords = wordCount(streamText)
  const streamHasContent = streamText.trim().length > 0
  const fillPercent = Math.min(100, (streamWords / 250) * 100)
  const answerHasContent = promptAnswer.trim().length > 0
  // ── Loading ──
  if (stage === 'loading') {
    return (
      <Screen onBack={onClose} scroll={false}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgb(var(--c-muted))',
            fontSize: '15px',
          }}
        >
          Загрузка…
        </div>
      </Screen>
    )
  }

  // ── Setup ──
  if (stage === 'setup') {
    return (
      <DailyJournalSetup
        userId={userId}
        initialSetup={setup}
        onComplete={handleSetupComplete}
        onBack={handleSetupBack}
      />
    )
  }

  // ── Entries (Мои записи) ──
  if (stage === 'entries') {
    return <DailyJournalEntries userId={userId} onBack={closeEntries} />
  }

  // ── Footer ──
  let footerContent = null
  if (stage === 'intro') {
    footerContent = null
  } else if (stage === 'today') {
    footerContent = (
      <div className="mx-dj-today__footer">
        <button
          type="button"
          className="cta-pill mx-dj-today__append-btn"
          data-testid="dj-today-append"
          onClick={handleAppend}
        >
          Дописать
        </button>
        {saveError && !entryId && (
          <button
            type="button"
            className="mx-dj-today__review-link"
            data-testid="dj-today-send"
            disabled={saving}
            onClick={sendUnsent}
          >
            Отправить
          </button>
        )}
        <div className="mx-dj-today__links">
          {setupHasData(setup) && (
            <button
              type="button"
              className="mx-dj-today__review-link"
              data-testid="dj-today-review"
              onClick={() => {
                platform.haptic('light')
                setStage('review')
              }}
            >
              Перечитай
            </button>
          )}
          <button
            type="button"
            className="mx-dj-today__review-link"
            data-testid="dj-today-entries"
            onClick={openEntries}
          >
            Мои записи
          </button>
        </div>
      </div>
    )
  } else if (stage === 'review') {
    footerContent = (
      <div className="mx-dj-footer-bar">
        <RoundNextButton
          onClick={() => {
            platform.haptic('light')
            setStage('stream')
          }}
          icon="check"
          label="Далее"
          testId="dj-review-next"
        />
      </div>
    )
  } else if (stage === 'stream') {
    footerContent = (
      <div className="mx-dj-footer-bar">
        <RoundNextButton
          onClick={() => {
            platform.haptic('light')
            if (streamHasContent) {
              setStage('question')
            } else {
              setStage(setupHasData(setup) ? 'review' : 'intro')
            }
          }}
          icon={streamHasContent ? 'check' : 'close'}
          label={streamHasContent ? 'Далее' : 'Назад'}
          testId="dj-stream-next"
        />
      </div>
    )
  } else if (stage === 'question' && !pendingComplete) {
    footerContent = (
      <div className="mx-dj-footer-bar">
        <RoundNextButton
          onClick={() => {
            if (answerHasContent) {
              saveAndComplete()
            } else {
              platform.haptic('light')
              setStage('stream')
            }
          }}
          icon={answerHasContent ? 'check' : 'close'}
          label={answerHasContent ? 'Сохранить' : 'Назад'}
          disabled={saving}
          testId="dj-question-next"
        />
      </div>
    )
  } else if (stage === 'complete') {
    footerContent = (
      <div className="mx-completion-action mx-completion-action--evening">
        <button
          type="button"
          onClick={onClose}
          className="cta-pill"
          data-testid="dj-complete-close"
        >
          Сохранить и выйти
        </button>
      </div>
    )
  }

  // ── Render stage content ──
  function renderContent() {
    if (stage === 'today') {
      return (
        <div className="mx-dj-today" data-testid="dj-today">
          <CapsLabel className="mx-dj-today__label">
            СЕГОДНЯ · {formatRussianDate(todayDate)}
          </CapsLabel>
          <h2 className="mx-dj-today__title">
            {saveError && !entryId ? 'Запись не отправлена' : 'Запись сохранена'}
          </h2>
          {saveError && !entryId && (
            <div className="mx-dj-save-error" data-testid="dj-today-unsent">
              Не отправлено — отправим, когда появится связь
            </div>
          )}
          {streamText.trim() && (
            <div className="mx-dj-today__section" data-testid="dj-today-stream">
              <CapsLabel className="mx-dj-today__section-label">Поток</CapsLabel>
              <p className="mx-dj-today__text">{streamText}</p>
            </div>
          )}
          {promptText && promptAnswer.trim() && (
            <div className="mx-dj-today__section" data-testid="dj-today-question">
              <p className="mx-dj-today__question">{promptText}</p>
              <p className="mx-dj-today__text">{promptAnswer}</p>
            </div>
          )}
        </div>
      )
    }

    if (stage === 'intro') {
      const IntroArt = illustrations.journalIntro
      return (
        <div className="mx-dj-intro">
          <div className="mx-dj-intro__art">
            {IntroArt ? <IntroArt /> : <SemanticGlyph kind="journal" animated={false} />}
          </div>
          <h1 className="mx-dj-intro__title">Страница для себя</h1>
          <p className="mx-dj-intro__text">
            Каждый день: перечитай, кем становишься, выпиши всё из головы и ответь на один вопрос. 5
            минут.
          </p>
          <div className="mx-dj-intro__actions">
            <button
              type="button"
              className="cta-pill mx-dj-intro__cta"
              data-testid="dj-intro-setup"
              onClick={() => {
                platform.haptic('light')
                setStage('setup')
              }}
            >
              Настроить — 2 минуты
            </button>
            <button
              type="button"
              className="mx-dj-intro__skip"
              data-testid="dj-intro-skip"
              onClick={() => {
                platform.haptic('light')
                setStage('stream')
              }}
            >
              Начать без настройки
            </button>
          </div>
        </div>
      )
    }

    if (stage === 'review') {
      return (
        <div className="mx-dj-review">
          <CapsLabel className="mx-dj-review__label">ПЕРЕЧИТАЙ</CapsLabel>
          <h2 className="mx-dj-review__title">Вспомни, куда идёшь</h2>
          {setup?.goals?.filter(g => g.trim()).length > 0 && (
            <div className="mx-dj-review__section">
              <CapsLabel className="mx-dj-review__label">Цели</CapsLabel>
              {setup.goals
                .filter(g => g.trim())
                .map((g, i) => (
                  <p key={i} className="mx-dj-review__item">
                    {g}
                  </p>
                ))}
            </div>
          )}
          {setup?.reminders?.filter(r => r.trim()).length > 0 && (
            <div className="mx-dj-review__section">
              <CapsLabel className="mx-dj-review__label">Кем я становлюсь</CapsLabel>
              {setup.reminders
                .filter(r => r.trim())
                .map((r, i) => (
                  <p key={i} className="mx-dj-review__item">
                    {r}
                  </p>
                ))}
            </div>
          )}
          {(setup?.vision?.scene?.trim() ||
            setup?.vision?.obstacle?.trim() ||
            setup?.vision?.plan?.trim()) && (
            <div className="mx-dj-review__section">
              <CapsLabel className="mx-dj-review__label">Картинка будущего</CapsLabel>
              {setup.vision.scene?.trim() && (
                <p className="mx-dj-review__item">{setup.vision.scene}</p>
              )}
              {setup.vision.obstacle?.trim() && (
                <p className="mx-dj-review__item mx-dj-review__item--muted">
                  Что может помешать: {setup.vision.obstacle}
                </p>
              )}
              {setup.vision.plan?.trim() && (
                <p className="mx-dj-review__item mx-dj-review__item--muted">
                  Тогда я: {setup.vision.plan}
                </p>
              )}
            </div>
          )}
          {setup?.reminder && (
            <div className="mx-dj-review__section">
              <CapsLabel className="mx-dj-review__label">Напоминание</CapsLabel>
              <p className="mx-dj-review__reminder">
                {setup.reminder.enabled ? `Каждый день в ${setup.reminder.time}` : 'Выключено'}
              </p>
            </div>
          )}
          <button
            type="button"
            className="mx-dj-review__edit-link"
            data-testid="dj-review-edit"
            onClick={() => setStage('setup')}
          >
            Изменить настройку
          </button>
          <button
            type="button"
            className="mx-dj-review__edit-link"
            data-testid="dj-review-entries"
            onClick={openEntries}
          >
            Мои записи
          </button>
          <button
            type="button"
            className="mx-dj-review__reset-link"
            data-testid="dj-review-reset"
            onClick={handleResetSetup}
          >
            Сбросить и начать заново
          </button>
          {resetError && (
            <div className="mx-dj-reset-error">Не получилось сбросить, попробуй ещё раз</div>
          )}
        </div>
      )
    }

    if (stage === 'stream') {
      return (
        <div className="mx-dj-stream">
          <CapsLabel className="mx-dj-stream__label">
            ПОТОК · {formatRussianDateTime(todayDate)}
          </CapsLabel>
          <div className="mx-dj-stream__bar" aria-hidden="true">
            <div className="mx-dj-stream__bar-fill" style={{ width: `${fillPercent}%` }} />
          </div>
          <h2 className="mx-dj-stream__title">Выпиши всё из головы</h2>
          <p className="mx-dj-stream__hint">
            Где ты, что видишь, что чувствуешь — и дальше всё, что приходит в голову. Ошибки не
            важны.
          </p>
          <textarea
            ref={streamRef}
            className="mx-dj-stream__field"
            value={streamText}
            onChange={e => setStreamText(e.target.value)}
            onInput={e => setStreamText(e.target.value)}
            placeholder="Я сейчас…"
            aria-label="Поток сознания"
            data-testid="dj-stream-input"
            maxLength={JOURNAL_TEXT_MAX}
          />
        </div>
      )
    }

    if (stage === 'question') {
      return (
        <div className="mx-dj-question">
          <CapsLabel className="mx-dj-question__label">Вопрос дня</CapsLabel>
          <p className="mx-dj-question__text">{promptText}</p>
          <textarea
            ref={answerRef}
            className="mx-dj-question__field"
            value={promptAnswer}
            onChange={e => setPromptAnswer(e.target.value)}
            placeholder="Ответь коротко или развёрнуто — как хочется."
            aria-label={promptText}
            data-testid="dj-question-input"
            maxLength={JOURNAL_TEXT_MAX}
          />
        </div>
      )
    }

    if (stage === 'complete') {
      const CompleteArt = illustrations.journalComplete
      return (
        <>
          <CheckInCompletion
            evening
            art={
              CompleteArt ? (
                <CompleteArt />
              ) : (
                <div className="mx-dj-complete__art">
                  <SemanticGlyph kind="journal" animated={false} />
                </div>
              )
            }
            title={
              <>
                <strong>Запись</strong>
                <span>сохранена.</span>
              </>
            }
            datePill={
              dayNumber ? (
                <>
                  <span aria-hidden="true">✓</span>{' '}
                  {dayNumber >= 90
                    ? dayNumber === 90
                      ? '90 дней. Ты сделал это.'
                      : `день ${dayNumber}`
                    : `день ${dayNumber} из 90`}
                </>
              ) : (
                <>
                  <span aria-hidden="true">✓</span> Сохранено
                </>
              )
            }
            feedbackQuestion="Помогло?"
            onFeedback={handleFeedback}
          />
          {saveError && (
            <div className="mx-dj-save-error" data-testid="dj-save-error">
              Не отправлено — отправим, когда появится связь
            </div>
          )}
        </>
      )
    }

    return null
  }

  return (
    <Screen
      onBack={goBack}
      registerSystemBack={false}
      scroll={stage === 'intro' || stage === 'review' || stage === 'today'}
      fullFrame={stage !== 'intro' && stage !== 'review' && stage !== 'today'}
      footer={footerContent}
      footerClassName={stage === 'complete' ? 'mx-dj-footer--complete' : ''}
      bodyClassName={stage === 'complete' ? 'mx-dj-complete' : ''}
    >
      {renderContent()}
    </Screen>
  )
}
