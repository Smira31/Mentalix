import { useState } from 'react'
import { createPortal } from 'react-dom'

import BackButton from '../components/BackButton'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import JournalArt from '../components/practice-art/JournalArt'
import {
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SHELL_CLASS,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import {
  hasLegacyJournalData,
  migrateLegacyJournalToUser,
  readJournalEntry,
  saveJournalPhase,
  todayKey,
} from '../lib/journalStorage'
import { platform } from '../platform'
import './JournalFlow.css'

const PHASES = [
  {
    key: 'idea',
    label: 'Идея',
    title: 'Что сейчас занимает мои мысли?',
    hint: 'Запиши это так, как оно есть. Без правильного ответа.',
  },
  {
    key: 'action',
    label: 'Действие',
    title: 'Что из этого зависит от меня сегодня?',
    hint: 'Выбери один небольшой шаг, который можно проверить.',
  },
  {
    key: 'analysis',
    label: 'Анализ',
    title: 'Что произошло и что я заметил?',
    hint: 'Посмотри на день без обвинений и без необходимости всё объяснить.',
  },
  {
    key: 'newStep',
    label: 'Новый шаг',
    title: 'Что я возьму с собой дальше?',
    hint: 'Сформулируй одно продолжение, а не большой план.',
  },
]

function readSaved(userId) {
  const entry = readJournalEntry(todayKey(), userId)
  const drafts = Object.fromEntries(PHASES.map(({ key }) => [key, entry.cycle[key]?.text || '']))
  const firstUnfinished = PHASES.findIndex(({ key }) => !drafts[key].trim())
  const complete =
    entry.cycle.newStep?.status === 'final' && PHASES.every(({ key }) => drafts[key].trim())

  return {
    complete,
    drafts,
    phaseIndex: firstUnfinished === -1 ? PHASES.length - 1 : firstUnfinished,
  }
}

function storageErrorMessage() {
  return 'Не удалось сохранить запись на этом устройстве. Текст остаётся на экране — попробуй ещё раз после проверки места в браузере.'
}

function FlowBack({ onClick }) {
  return (
    <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} journal-flow__topbar`}>
      <BackButton onClick={onClick} />
    </div>
  )
}

function JournalIntro({
  completed,
  legacyVisible,
  storageError,
  onStart,
  onMigrate,
  onDismissLegacy,
  onOpenGuided,
  onClose,
}) {
  const complete = completed === PHASES.length
  const continuing = completed > 0 && !complete
  const title = complete
    ? 'Сегодняшняя запись сохранена'
    : continuing
      ? 'Продолжи спокойный разговор с собой'
      : 'Разложи день на четыре спокойных шага'
  const description = complete
    ? 'Все четыре шага уже сохранены. Можно перечитать запись или вернуться к практикам.'
    : continuing
      ? `Уже заполнено ${completed} из 4 шагов. Черновик ждёт здесь.`
      : 'Идея, действие, анализ и следующий шаг. Не дневник «на оценку», а место, чтобы заметить главное.'

  return (
    <>
      <FlowBack onClick={onClose} />
      <main className="journal-flow__intro">
        <div className="journal-flow__hero" aria-hidden="true">
          <JournalArt />
        </div>
        <div className="journal-flow__intro-copy">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">Журнал</p>
          <h1 className="journal-flow__intro-title font-display text-cream">{title}</h1>
          <p className="journal-flow__intro-description">{description}</p>
          <p className="journal-flow__intro-note">
            Ответы остаются на этом устройстве. Можно остановиться в любой момент.
          </p>
          {onOpenGuided && (
            <button type="button" onClick={onOpenGuided} className="journal-flow__guided-action">
              Разобраться в ситуации →
            </button>
          )}
        </div>
        {legacyVisible && (
          <div className="journal-flow__legacy" role="status">
            <p>На этом устройстве есть запись старого формата.</p>
            <span>Она не была привязана к профилю. Переноси её, только если это твоя запись.</span>
            <div>
              <button type="button" onClick={onMigrate}>
                Перенести
              </button>
              <button type="button" onClick={onDismissLegacy}>
                Не сейчас
              </button>
            </div>
          </div>
        )}
        {storageError && (
          <p className="journal-flow__error" role="alert">
            {storageError}
          </p>
        )}
        <div className="journal-flow__intro-actions">
          <button
            type="button"
            onClick={onStart}
            className="journal-flow__intro-cta"
            aria-label={complete ? 'Открыть запись' : continuing ? 'Продолжить' : 'Начать'}
          >
            {complete ? 'Открыть запись' : continuing ? 'Продолжить' : 'Начать'}
          </button>
        </div>
      </main>
    </>
  )
}

function JournalComplete({ onClose, onOpen }) {
  return (
    <>
      <FlowBack onClick={onClose} />
      <main className="journal-flow__completion">
        <div className="journal-flow__completion-art" aria-hidden="true">
          <JournalArt />
        </div>
        <div className="journal-flow__completion-copy">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
            Запись сохранена
          </p>
          <h1 className="journal-flow__completion-title font-display text-cream">Цикл сохранён</h1>
          <p className="journal-flow__completion-description">
            Идея, действие, анализ и следующий шаг останутся в твоём журнале на этом устройстве.
          </p>
        </div>
        <div className="journal-flow__completion-actions">
          <button
            type="button"
            onClick={onClose}
            className="cta-pill journal-flow__completion-primary"
          >
            Вернуться к практикам
          </button>
          <button type="button" onClick={onOpen} className="journal-flow__completion-secondary">
            Открыть запись
          </button>
        </div>
      </main>
    </>
  )
}

export default function JournalFlow({ userId, onClose, onOpenGuided }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [initial] = useState(() => readSaved(userId))
  const [stage, setStage] = useState('intro')
  const [isSavedComplete, setIsSavedComplete] = useState(initial.complete)
  const [phaseIndex, setPhaseIndex] = useState(initial.phaseIndex)
  const [drafts, setDrafts] = useState(initial.drafts)
  const [storageError, setStorageError] = useState(null)
  const [legacyMigrationVisible, setLegacyMigrationVisible] = useState(() =>
    hasLegacyJournalData(userId)
  )
  const phase = PHASES[phaseIndex]
  const value = drafts[phase.key] || ''
  const writtenCount = PHASES.filter(({ key }) => drafts[key]?.trim()).length
  const isLast = phaseIndex === PHASES.length - 1

  function persistPhase({ text, status = 'draft' }) {
    try {
      saveJournalPhase({ date: todayKey(), phase: phase.key, text, status, userId })
      setStorageError(null)
      return true
    } catch (error) {
      console.error(error)
      setStorageError(storageErrorMessage())
      platform.haptic('error')
      return false
    }
  }

  function updateValue(nextValue) {
    setDrafts(current => ({ ...current, [phase.key]: nextValue }))
    persistPhase({ text: nextValue, status: isLast && isSavedComplete ? 'final' : 'draft' })
  }

  function continueFlow() {
    if (!value.trim()) return
    if (!persistPhase({ text: value, status: isLast ? 'final' : 'draft' })) return
    platform.haptic(isLast ? 'success' : 'light')
    if (isLast) {
      setIsSavedComplete(true)
      setStage('complete')
      return
    }
    setPhaseIndex(index => index + 1)
  }

  function goBack() {
    if (stage === 'writing' && phaseIndex > 0) {
      platform.haptic('light')
      setPhaseIndex(index => index - 1)
      return
    }
    if (stage === 'writing') {
      platform.haptic('light')
      setStage('intro')
      return
    }
    onClose()
  }

  function start() {
    const firstIncomplete = PHASES.findIndex(item => !drafts[item.key]?.trim())
    setPhaseIndex(firstIncomplete === -1 ? PHASES.length - 1 : firstIncomplete)
    setStorageError(null)
    platform.haptic('light')
    setStage('writing')
  }

  function migrateLegacyEntry() {
    try {
      const migrated = migrateLegacyJournalToUser(userId)
      if (migrated) {
        const saved = readSaved(userId)
        setDrafts(saved.drafts)
        setIsSavedComplete(saved.complete)
        setPhaseIndex(saved.phaseIndex)
      }
      setStorageError(null)
      setLegacyMigrationVisible(false)
      platform.haptic('success')
    } catch (error) {
      console.error(error)
      setStorageError(storageErrorMessage())
      platform.haptic('error')
    }
  }

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow mx-practice-flow--journal flex flex-col`}
      style={surfaceStyle}
    >
      {stage === 'intro' && (
        <JournalIntro
          completed={writtenCount}
          legacyVisible={legacyMigrationVisible}
          storageError={storageError}
          onStart={start}
          onMigrate={migrateLegacyEntry}
          onDismissLegacy={() => setLegacyMigrationVisible(false)}
          onOpenGuided={onOpenGuided}
          onClose={onClose}
        />
      )}
      {stage === 'writing' && phase && (
        <>
          <FlowBack onClick={goBack} />
          <PracticeWritingCanvas
            value={value}
            onChange={updateValue}
            question={phase.title}
            description={phase.hint}
            placeholder="Начни писать..."
            ariaLabel={`${phase.label}: ${phase.title}`}
            autoFocus
            onSubmit={continueFlow}
            submitLabel={isLast ? 'Сохранить и завершить' : 'Сохранить и продолжить'}
            submitDisabled={!value.trim()}
            className="journal-flow__writing min-h-0 flex-1"
          />
          {storageError && (
            <p className="journal-flow__writing-error" role="alert">
              {storageError}
            </p>
          )}
        </>
      )}
      {stage === 'complete' && (
        <JournalComplete
          onClose={onClose}
          onOpen={() => {
            setPhaseIndex(PHASES.length - 1)
            setStage('writing')
          }}
        />
      )}
    </div>,
    document.body
  )
}

export { PHASES }
