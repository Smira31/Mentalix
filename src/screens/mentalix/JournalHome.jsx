import { ArrowRight, BookOpen, Check, Compass, PenLine } from 'lucide-react'
import { useState } from 'react'
import JournalTextarea from '../../components/JournalTextarea'
import { platform } from '../../platform'
import { readJournalEntry, saveJournalPhase, todayKey } from '../../lib/journalStorage'

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
      <div className="w-full max-w-md mx-auto px-5 flex min-h-[calc(100vh-160px)] flex-col justify-center text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] border border-gold/25 bg-gold/[0.04] text-gold">
          <BookOpen size={30} strokeWidth={1.6} />
        </div>
        <span className="mx-type-meta uppercase tracking-[0.14em] text-gold">Журнал</span>
        <h1 className="mx-type-flow-title mt-4 font-display text-cream">Вернись к тому, что важно сегодня</h1>
        <p className="mx-type-flow-body mx-auto mt-4 max-w-[310px] text-muted">
          Четыре коротких шага, чтобы заметить свои мысли, выбрать то, что зависит от тебя, и спокойно продолжить.
        </p>
        <p className="mx-type-meta mt-4 text-faint">Идея · Действие · Анализ · Новый шаг</p>
        <button
          type="button"
          onClick={() => {
            platform.haptic('light')
            setJournalStarted(true)
          }}
          className="cta-pill mt-8 w-full px-6 py-4 mx-type-control"
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
    if (isLast) return
    setPhaseIndex(index => index + 1)
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
            <div
              className={`mt-2 mx-type-meta ${index === phaseIndex ? 'text-gold' : 'text-faint'}`}
            >
              {item.label}
            </div>
          </button>
        ))}
      </div>

      <div className="pt-9">
        <div className="flex items-center gap-3 mx-type-meta uppercase tracking-[0.14em] text-faint">
          <PenLine size={15} className="text-gold" />
          {phase.label}
        </div>
        <h1 className="mx-ai-title mt-4 text-cream font-display">{phase.title}</h1>
        <p className="mx-ai-body mt-4 max-w-[310px] text-muted">{phase.hint}</p>
      </div>

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
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-gold px-5 mx-type-control text-emerald-deep disabled:opacity-35"
        >
          {isLast ? <Check size={19} /> : <ArrowRight size={19} />}
          {isLast ? 'Закрыть сегодняшний цикл' : 'Продолжить'}
        </button>
        <div className="mt-3 flex items-center justify-between mx-type-meta text-faint">
          <button
            type="button"
            onClick={onOpenMentor}
            className="text-muted underline-offset-4 active:text-gold"
          >
            Пойти глубже с наставником
          </button>
          {phaseIndex > 0 && (
            <button
              type="button"
              onClick={() => setPhaseIndex(index => index - 1)}
              className="active:text-gold"
            >
              Назад
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
