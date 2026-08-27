import { useState } from 'react'
import { ArrowRight, BookOpen, Check, Compass, PenLine } from 'lucide-react'
import JournalTextarea from '../../components/JournalTextarea'
import { platform } from '../../platform'
import { readJournalEntry, saveJournalPhase, todayKey } from '../../lib/journalStorage'
import './JournalHome.css'

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

function readSaved() {
  const entry = readJournalEntry(todayKey())
  const drafts = Object.fromEntries(
    PHASES.map(({ key }) => [key, entry.cycle[key === 'next' ? 'newStep' : key]?.text || ''])
  )
  const phaseIndex = PHASES.findIndex(({ key }) => !drafts[key].trim())
  return {
    phaseIndex: phaseIndex === -1 ? PHASES.length - 1 : phaseIndex,
    drafts,
  }
}

export default function JournalHome({ onOpenMentor, showIntro = false }) {
  const [initial] = useState(readSaved)
  const [journalStarted, setJournalStarted] = useState(!showIntro)
  const [phaseIndex, setPhaseIndex] = useState(initial.phaseIndex || 0)
  const [drafts, setDrafts] = useState(initial.drafts || {})
  const phase = PHASES[phaseIndex]
  const isLast = phaseIndex === PHASES.length - 1
  const completed = PHASES.filter(item => drafts[item.key]?.trim()).length
  const value = drafts[phase.key] || ''

  if (showIntro && !journalStarted) {
    return (
      <div className="mx-journal-intro w-full max-w-md mx-auto px-5 flex min-h-[calc(100dvh-160px)] flex-col justify-center text-center animate-fade-in">
        <div className="mx-journal-intro__art mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#5EB2ED]/35 bg-[#5EB2ED]/[0.05] text-[#5EB2ED]">
          <BookOpen size={30} strokeWidth={1.6} />
        </div>
        <span className="mx-type-meta uppercase tracking-[0.14em] text-[#5EB2ED]">Журнал</span>
        <h1 className="mx-type-flow-title mt-4 font-display text-cream">
          Вернись к тому, что важно сегодня
        </h1>
        <p className="mx-type-flow-body mx-auto mt-4 max-w-[310px] text-muted">
          Четыре коротких шага, чтобы заметить свои мысли, выбрать то, что зависит от тебя, и
          спокойно продолжить.
        </p>
        <p className="mx-type-meta mt-4 text-faint">Идея · Действие · Анализ · Новый шаг</p>
        <button
          type="button"
          onClick={() => {
            platform.haptic('light')
            setJournalStarted(true)
          }}
          className="cta-pill mt-8 w-full px-6 py-4 mx-type-control mx-journal-primary-action"
        >
          Начать запись
        </button>
      </div>
    )
  }

  function storagePhaseKey() {
    return phase.key === 'next' ? 'newStep' : phase.key
  }

  function updateValue(nextValue) {
    const nextDrafts = { ...drafts, [phase.key]: nextValue }
    setDrafts(nextDrafts)
    saveJournalPhase({ date: todayKey(), phase: storagePhaseKey(), text: nextValue })
  }

  function continueFlow() {
    if (!value.trim()) return
    platform.haptic('light')
    saveJournalPhase({
      date: todayKey(),
      phase: storagePhaseKey(),
      text: value,
      status: isLast ? 'final' : 'draft',
    })
    if (!isLast) setPhaseIndex(index => index + 1)
  }

  return (
    <div className="mx-journal-screen w-full max-w-md mx-auto px-5 flex min-h-[calc(100dvh-160px)] flex-col animate-fade-in">
      <div className="mx-journal-day-header flex items-center gap-3">
        <div className="mx-journal-day-header__mark flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[#5EB2ED]/35 bg-[#5EB2ED]/[0.05] text-[#5EB2ED]">
          <BookOpen size={22} strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <div className="mx-journal-day-header__title font-display text-[25px] leading-none text-cream">
            журнал.
          </div>
          <div className="mx-journal-day-header__meta mx-type-meta mt-1 text-[#5EB2ED]">
            сегодня · {completed}/4 шага
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenMentor}
          aria-label="Открыть AI-наставника"
          className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream/10 bg-emerald text-muted active:scale-90"
        >
          <Compass size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div
        className="mx-journal-step-note mx-type-meta mt-5 text-faint"
        aria-label={`Шаг ${phaseIndex + 1} из ${PHASES.length}`}
      >
        шаг {phaseIndex + 1} из {PHASES.length} · {phase.label}
      </div>

      <div className="mx-journal-prompt pt-7">
        <div className="flex items-center gap-3 mx-type-meta uppercase tracking-[0.14em] text-faint">
          <PenLine size={15} className="text-[#5EB2ED]" />
          {phase.label}
        </div>
        <h1 className="mx-type-flow-title mt-4 font-display text-cream">{phase.title}</h1>
        <p className="mx-type-flow-body mt-4 max-w-[320px] text-muted">{phase.hint}</p>
      </div>

      <div className="mx-journal-editor-wrap mt-7 flex min-h-0 flex-1" data-keyboard-safe="true">
        <JournalTextarea
          value={value}
          onChange={updateValue}
          placeholder="Начни писать..."
          ariaLabel={`${phase.label}: ${phase.title}`}
          formatting
          stickyToolbar={false}
          className="w-full min-h-[15rem]"
          editorClassName="min-h-[11rem] pb-4"
        />
      </div>

      <div className="mx-journal-footer pt-4 pb-3" data-keyboard-safe-footer="true">
        <button
          type="button"
          onClick={continueFlow}
          disabled={!value.trim()}
          className="mx-journal-primary-action flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#5EB2ED] px-5 mx-type-control font-semibold text-[#07131c] disabled:opacity-35"
        >
          {isLast ? <Check size={19} /> : <ArrowRight size={19} />}
          {isLast ? 'Завершить запись' : 'Продолжить'}
        </button>
        <div className="mt-3 flex items-center justify-between gap-3 mx-type-meta text-faint">
          <button
            type="button"
            onClick={onOpenMentor}
            className="text-left text-muted underline-offset-4 active:text-[#5EB2ED]"
          >
            Пойти глубже с наставником
          </button>
          {phaseIndex > 0 && (
            <button
              type="button"
              onClick={() => setPhaseIndex(index => index - 1)}
              className="shrink-0 active:text-[#5EB2ED]"
            >
              Назад
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
