import { createPortal } from 'react-dom'
import { BookOpen, Check, PencilLine } from 'lucide-react'
import { useState } from 'react'

import JournalTextarea from '../components/JournalTextarea'
import SceneLayout from '../components/practices/SceneLayout'
import { platform } from '../platform'
import { FULLSCREEN_SHELL_CLASS, useFullscreenSurface } from '../lib/fullscreenSurface'
import {
  hasLegacyJournalData,
  migrateLegacyJournalToUser,
  readJournalEntry,
  saveJournalPhase,
  todayKey,
} from '../lib/journalStorage'

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

function JournalProgress({ current, onSelect, completed }) {
  return (
    <div className="mb-8 grid grid-cols-4 gap-2" aria-label="Прогресс журнала">
      {PHASES.map((item, index) => (
        <button
          type="button"
          key={item.key}
          onClick={() => index <= current && onSelect(index)}
          aria-current={index === current ? 'step' : undefined}
          aria-label={`${item.label}, шаг ${index + 1} из 4`}
          className="text-left"
        >
          <span className={`block h-1.5 ${index < completed ? 'bg-gold' : 'bg-cream/15'}`} />
          <span
            className={`mt-2 block text-[10px] ${index === current ? 'text-gold' : 'text-faint'}`}
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}

function JournalIntro({ completed, legacyVisible, onStart, onMigrate, onDismissLegacy }) {
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
    <SceneLayout
      onBack={onStart.close}
      label="Журнал"
      title={title}
      description={description}
      centered
      verticallyCentered
      showGlyph={false}
      className="journal-flow__intro"
    >
      <div className="mx-auto mt-8 flex h-[96px] w-[96px] items-center justify-center rounded-[32px] border border-gold/25 bg-gold/[0.06] text-gold">
        <BookOpen size={40} strokeWidth={1.45} aria-hidden="true" />
      </div>
      {legacyVisible && (
        <div className="mt-7 rounded-2xl border border-gold/20 bg-gold/[0.06] p-4 text-left">
          <p className="text-[14px] font-semibold text-cream">
            На этом устройстве есть запись старого формата.
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-muted">
            Она не была привязана к профилю. Переноси её, только если это твоя запись.
          </p>
          <div className="mt-3 flex items-center gap-4 text-[12px] font-semibold">
            <button type="button" onClick={onMigrate} className="text-gold active:text-cream">
              Перенести
            </button>
            <button
              type="button"
              onClick={onDismissLegacy}
              className="text-muted active:text-cream"
            >
              Не сейчас
            </button>
          </div>
        </div>
      )}
      <p className="mt-7 text-center text-[12px] font-semibold text-faint">
        4 коротких шага&nbsp;&nbsp;·&nbsp;&nbsp;без спешки
      </p>
      <button
        type="button"
        onClick={onStart.open}
        className="cta-pill mt-8 w-full px-6 py-4 text-[15px]"
      >
        {complete ? 'Открыть запись' : continuing ? 'Продолжить запись' : 'Начать'}
      </button>
    </SceneLayout>
  )
}

function JournalComplete({ onClose, onOpen }) {
  return (
    <SceneLayout
      onBack={onClose}
      label="Журнал"
      title="Цикл сохранён"
      description="Идея, действие, анализ и следующий шаг останутся в твоём журнале на этом устройстве."
      centered
      verticallyCentered
      showGlyph={false}
      className="journal-flow__complete"
    >
      <div className="mx-auto mt-8 flex h-[96px] w-[96px] items-center justify-center rounded-[32px] border border-gold/30 bg-gold/[0.08] text-gold">
        <Check size={44} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <p className="mt-7 text-center text-[12px] font-semibold text-faint">
        4 из 4 шагов сохранены
      </p>
      <button
        type="button"
        onClick={onClose}
        className="cta-pill mt-8 w-full px-6 py-4 text-[15px]"
      >
        Вернуться к практикам
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="mx-auto mt-3 flex min-h-11 items-center gap-2 px-3 text-[13px] font-semibold text-muted active:text-gold"
      >
        <PencilLine size={16} strokeWidth={1.8} />
        Открыть запись
      </button>
    </SceneLayout>
  )
}

export default function JournalFlow({ userId, onClose }) {
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
      saveJournalPhase({
        date: todayKey(),
        phase: phase.key,
        text,
        status,
        userId,
      })
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
    persistPhase({
      text: nextValue,
      status: isLast && isSavedComplete ? 'final' : 'draft',
    })
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

  function openSavedEntry() {
    setPhaseIndex(PHASES.length - 1)
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
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      {stage === 'intro' && (
        <JournalIntro
          completed={writtenCount}
          legacyVisible={legacyMigrationVisible}
          onStart={{ open: () => setStage('writing'), close: onClose }}
          onMigrate={migrateLegacyEntry}
          onDismissLegacy={() => setLegacyMigrationVisible(false)}
        />
      )}

      {stage === 'writing' && (
        <SceneLayout
          onBack={onClose}
          label={phase.label}
          title={phase.title}
          description={phase.hint}
          showGlyph={false}
          progress={
            <JournalProgress
              current={phaseIndex}
              completed={writtenCount}
              onSelect={setPhaseIndex}
            />
          }
          className="journal-flow__writing"
        >
          {storageError && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] leading-snug text-cream"
            >
              {storageError}
            </p>
          )}
          <JournalTextarea
            autoFocus
            value={value}
            onChange={updateValue}
            placeholder="Начни писать..."
            ariaLabel={`${phase.label}: ${phase.title}`}
            className="mt-7 min-h-[15rem]"
            editorClassName="pb-24"
            floatingToolbar
            desktopInline
            formatting={false}
            onSubmit={continueFlow}
            submitLabel={isLast ? 'Сохранить и завершить' : 'Сохранить и продолжить'}
            submitDisabled={!value.trim()}
          />
        </SceneLayout>
      )}

      {stage === 'complete' && <JournalComplete onClose={onClose} onOpen={openSavedEntry} />}
    </div>,
    document.body
  )
}
