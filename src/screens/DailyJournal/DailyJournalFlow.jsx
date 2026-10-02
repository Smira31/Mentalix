import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import { toLocalCalendarDate } from '../../lib/dateTimezonePolicy'
import { checkinFeedbackValue } from '../../lib/checkinFeedback'
import {
  readDailyJournalDraft,
  saveDailyJournalDraft,
  clearDailyJournalDraft,
} from '../../lib/dailyJournalDraft'
import { dispatchTabRefresh } from '../../lib/tabRefresh'
import DailyJournalSetup from './DailyJournalSetup'
import './DailyJournalFlow.css'

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatRussianDateTime(d) {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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

function stripLeadingTimestamp(text) {
  if (!text) return text
  return text.replace(/^\d{1,2}\s+\S+,\s\d{2}:\d{2}\.\s*/, '')
}

export default function DailyJournalFlow({ userId, onClose }) {
  const [todayDate] = useState(() => now())
  const dateStr = toLocalCalendarDate(todayDate)

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
  const [pendingComplete, setPendingComplete] = useState(false)
  const streamRef = useRef(null)
  const answerRef = useRef(null)

  // ── Init: fetch setup + entries, try pending draft ──
  useEffect(() => {
    let cancelled = false

    // Background: try to send a pending draft from a previous session
    const draft = readDailyJournalDraft(userId, dateStr)
    if (draft?.pendingSave) {
      api.dailyJournal
        .createEntry(userId, {
          date: dateStr,
          stream_text: draft.streamText,
          prompt_text: draft.promptText,
          prompt_answer: draft.promptAnswer,
          helpful: null,
        })
        .then(() => clearDailyJournalDraft(userId, dateStr))
        .catch(() => {})
    }

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

        if (todayEntry) {
          setEntryId(todayEntry.id)
          setStreamText(stripLeadingTimestamp(todayEntry.stream_text || ''))
          setPromptAnswer(todayEntry.prompt_answer || '')
          setPromptText(todayEntry.prompt_text || '')
        } else {
          const d = readDailyJournalDraft(userId, dateStr)
          if (d?.streamText) setStreamText(d.streamText)
          if (d?.promptAnswer) setPromptAnswer(d.promptAnswer)
          if (d?.promptText) setPromptText(d.promptText)
        }

        // Default question (cycling by total_days)
        if (!todayEntry?.prompt_text && !draft?.promptText) {
          const prompts = setupData?.prompts || []
          const qIndex = td % Math.max(1, prompts.length)
          setPromptText(prompts[qIndex] || '')
        }

        if (!setupData?.updated_at) {
          setStage('intro')
        } else if (setupHasData(setupData)) {
          setStage('review')
        } else {
          setStage('stream')
        }
      } catch (error) {
        console.error('[dailyJournal] init failed', error)
        if (!cancelled) setStage('stream')
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draft persistence ──
  useEffect(() => {
    if (stage !== 'stream' && stage !== 'question') return
    saveDailyJournalDraft(userId, dateStr, { streamText, promptAnswer, promptText })
  }, [streamText, promptAnswer, stage, userId, dateStr, promptText])

  // ── Auto-focus ──
  useEffect(() => {
    if (stage !== 'stream' && stage !== 'question') return
    const ref = stage === 'stream' ? streamRef : answerRef
    const focusField = () => ref.current?.focus({ preventScroll: true })
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
    if (stage === 'stream') {
      platform.haptic('light')
      setStage(setupHasData(setup) ? 'review' : 'intro')
      return
    }
    if (stage === 'question') {
      platform.haptic('light')
      setStage('stream')
      return
    }
    onClose()
  }, [stage, onClose, setup])

  useBackButton(goBack)

  // ── Setup handlers ──
  function handleSetupComplete(newSetup) {
    setSetup(newSetup)
    setStage(setupHasData(newSetup) ? 'review' : 'stream')
  }

  function handleSetupBack() {
    if (setup?.updated_at) {
      setStage('review')
    } else {
      setStage('intro')
    }
  }

  // ── Save entry ──
  async function saveAndComplete() {
    const active = document.activeElement
    if (active && typeof active.blur === 'function') {
      active.blur()
    }

    setSaving(true)
    try {
      const timestamp = `${formatRussianDateTime(todayDate)}.`
      const streamTextWithTs = streamText.trim() ? `${timestamp} ${streamText}` : ''
      const result = await api.dailyJournal.createEntry(userId, {
        date: dateStr,
        stream_text: streamTextWithTs,
        prompt_text: promptText,
        prompt_answer: promptAnswer,
        helpful: null,
      })
      setEntryId(result.id)
      setDayNumber(result.day_number)
      setSaveError(false)
      clearDailyJournalDraft(userId, dateStr)
      // Обновляем вкладку «Сегодня» после записи журнала —
      // вместе с ACTIVITY_WRITE (mentalix:activity-saved) из api.js.
      dispatchTabRefresh('today')
    } catch (error) {
      console.error('[dailyJournal] save failed', error)
      setSaveError(true)
      saveDailyJournalDraft(userId, dateStr, {
        streamText,
        promptAnswer,
        promptText,
        pendingSave: true,
      })
    } finally {
      setSaving(false)
    }

    const vv = window.visualViewport
    if (!vv || vv.height >= window.innerHeight - 80) {
      setStage('complete')
      return
    }
    setPendingComplete(true)
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

  // ── Footer ──
  let footerContent = null
  if (stage === 'intro') {
    footerContent = null
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
              setStage('review')
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
    if (stage === 'intro') {
      const IntroArt = illustrations.journalIntro
      return (
        <div className="mx-dj-intro">
          <div className="mx-dj-intro__art">
            {IntroArt ? <IntroArt /> : <SemanticGlyph kind="journal" animated={false} />}
          </div>
          <h1 className="mx-dj-intro__title">Страница для себя</h1>
          <p className="mx-dj-intro__text">
            Каждый день: перечитай, кем становишься, выпиши всё из головы и ответь на один
            вопрос. 5 минут.
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
              {setup.goals.filter(g => g.trim()).map((g, i) => (
                <p key={i} className="mx-dj-review__item">
                  {g}
                </p>
              ))}
            </div>
          )}
          {setup?.reminders?.filter(r => r.trim()).length > 0 && (
            <div className="mx-dj-review__section">
              <CapsLabel className="mx-dj-review__label">Кем я становлюсь</CapsLabel>
              {setup.reminders.filter(r => r.trim()).map((r, i) => (
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
          <button
            type="button"
            className="mx-dj-review__edit-link"
            data-testid="dj-review-edit"
            onClick={() => setStage('setup')}
          >
            Изменить настройку
          </button>
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
            <div
              className="mx-dj-stream__bar-fill"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <h2 className="mx-dj-stream__title">Выпиши всё из головы</h2>
          <p className="mx-dj-stream__hint">
            Где ты, что видишь, что чувствуешь — и дальше всё, что приходит в голову. Ошибки
            не важны.
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
                  <span aria-hidden="true">✓</span> день {dayNumber}
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
          {saveError && <div className="mx-dj-save-error">Сохраним, когда будет связь</div>}
        </>
      )
    }

    return null
  }

  return (
    <Screen
      onBack={goBack}
      registerSystemBack={false}
      scroll={stage === 'intro' || stage === 'review'}
      fullFrame={stage !== 'intro' && stage !== 'review'}
      footer={footerContent}
      footerClassName={stage === 'complete' ? 'mx-dj-footer--complete' : ''}
      bodyClassName={stage === 'complete' ? 'mx-dj-complete' : ''}
    >
      {renderContent()}
    </Screen>
  )
}
