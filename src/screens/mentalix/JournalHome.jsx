import { ArrowRight, BookOpen, Check, Compass } from 'lucide-react'
import { useState } from 'react'
import JournalTextarea from '../../components/JournalTextarea'
import { platform } from '../../platform'
import {
  hasLegacyJournalData,
  migrateLegacyJournalToUser,
  readJournalEntry,
  saveJournalPhase,
  todayKey,
} from '../../lib/journalStorage'

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
    key: 'next',
    label: 'Новый шаг',
    title: 'Что я возьму с собой дальше?',
    hint: 'Сформулируй одно продолжение, а не большой план.',
  },
]

function readSaved(userId) {
  const entry = readJournalEntry(todayKey(), userId)
  const drafts = Object.fromEntries(
    PHASES.map(({ key }) => [key, entry.cycle[key === 'next' ? 'newStep' : key]?.text || ''])
  )
  const phaseIndex = PHASES.findIndex(({ key }) => !drafts[key].trim())
  return {
    phaseIndex: phaseIndex === -1 ? PHASES.length - 1 : phaseIndex,
    drafts,
  }
}

function storageErrorMessage() {
  return 'Не удалось сохранить запись на этом устройстве. Текст пока остаётся на экране — попробуй ещё раз после проверки места в браузере.'
}

export default function JournalHome({ user, onOpenMentor }) {
  const userId = user?.id
  const [initial] = useState(() => readSaved(userId))
  const [phaseIndex, setPhaseIndex] = useState(initial.phaseIndex || 0)
  const [drafts, setDrafts] = useState(initial.drafts || {})
  const [storageError, setStorageError] = useState(null)
  const [legacyMigrationVisible, setLegacyMigrationVisible] = useState(() => hasLegacyJournalData(userId))
  const phase = PHASES[phaseIndex]
  const isLast = phaseIndex === PHASES.length - 1
  const completed = PHASES.filter(item => drafts[item.key]?.trim()).length
  const value = drafts[phase.key] || ''

  function storagePhaseKey() {
    return phase.key === 'next' ? 'newStep' : phase.key
  }

  function persistPhase(nextValue, nextStatus = 'draft') {
    try {
      saveJournalPhase({
        date: todayKey(),
        phase: storagePhaseKey(),
        text: nextValue,
        status: nextStatus,
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
    persistPhase(nextValue)
  }

  function continueFlow() {
    if (!value.trim()) return
    if (!persistPhase(value, isLast ? 'final' : 'draft')) return
    platform.haptic('light')
    if (isLast) return
    setPhaseIndex(index => index + 1)
  }

  function migrateLegacyEntry() {
    try {
      const migrated = migrateLegacyJournalToUser(userId)
      if (migrated) {
        const saved = readSaved(userId)
        setDrafts(saved.drafts)
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

  return (
    <div className="w-full max-w-md mx-auto px-5 flex min-h-[calc(100vh-160px)] flex-col animate-fade-in">
      <div className="flex items-center gap-3 pt-1">
        <div className="w-10 h-10 rounded-xl border border-gold/25 bg-gold/[0.04] flex items-center justify-center text-gold">
          <BookOpen size={21} strokeWidth={1.7} />
        </div>
        <div>
          <div className="mx-ai-title text-cream leading-none">журнал.</div>
          <div className="mx-ai-meta text-gold mt-1">сегодня · {completed}/4 шага</div>
        </div>
        <button
          type="button"
          onClick={onOpenMentor}
          aria-label="Открыть AI-наставника"
          className="ml-auto flex h-10 w-10 items-center justify-center text-muted active:scale-90"
        >
          <Compass size={22} strokeWidth={1.7} />
        </button>
      </div>

      {legacyMigrationVisible && (
        <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/[0.06] p-4">
          <p className="text-[14px] font-semibold text-cream">На этом устройстве есть запись старого формата.</p>
          <p className="mt-1.5 text-[12px] leading-snug text-muted">
            Она не была привязана к профилю. Перенеси её в свой журнал, только если это твоя запись.
          </p>
          <div className="mt-3 flex items-center gap-4 text-[12px] font-semibold">
            <button type="button" onClick={migrateLegacyEntry} className="text-gold active:text-cream">
              Перенести
            </button>
            <button
              type="button"
              onClick={() => setLegacyMigrationVisible(false)}
              className="text-muted active:text-cream"
            >
              Не сейчас
            </button>
          </div>
        </div>
      )}

      <div className="mt-7 grid grid-cols-4 gap-2" aria-label="Прогресс журнала">
        {PHASES.map((item, index) => (
          <button
            type="button"
            key={item.key}
            onClick={() => index <= phaseIndex && setPhaseIndex(index)}
            aria-label={`${item.label}, шаг ${index + 1} из 4`}
            className="text-left"
          >
            <div className={`h-1.5 ${index <= phaseIndex ? 'bg-gold' : 'bg-cream/15'}`} />
            <div className={`mt-2 text-[10px] ${index === phaseIndex ? 'text-gold' : 'text-faint'}`}>
              {item.label}
            </div>
          </button>
        ))}
      </div>

      <div className="pt-9">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          {phase.label}
        </div>
        <h1 className="mx-ai-title mt-4 text-cream font-display">{phase.title}</h1>
        <p className="mx-ai-body mt-4 max-w-[310px] text-muted">{phase.hint}</p>
      </div>

      {storageError && (
        <p role="alert" className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] leading-snug text-cream">
          {storageError}
        </p>
      )}

      <div className="mt-8 flex-1 min-h-[230px]">
        <JournalTextarea
          value={value}
          onChange={updateValue}
          placeholder="Начни писать..."
          ariaLabel={`${phase.label}: ${phase.title}`}
          formatting
          editorClassName="min-h-[14rem]"
        />
      </div>

      <div className="pb-3 pt-5">
        <button
          type="button"
          onClick={continueFlow}
          disabled={!value.trim()}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-[15px] font-semibold text-emerald-deep disabled:opacity-35"
        >
          {isLast ? <Check size={19} /> : <ArrowRight size={19} />}
          {isLast ? 'Закрыть сегодняшний цикл' : 'Продолжить'}
        </button>
        <div className="mt-3 flex items-center justify-between text-[12px] text-faint">
          <button type="button" onClick={onOpenMentor} className="text-muted underline-offset-4 active:text-gold">
            Пойти глубже с наставником
          </button>
          {phaseIndex > 0 && (
            <button type="button" onClick={() => setPhaseIndex(index => index - 1)} className="active:text-gold">
              Назад
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
