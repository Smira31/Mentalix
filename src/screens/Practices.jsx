import { useEffect, useState } from 'react'

import { platform } from '../platform'
import { fetchPracticesData, peekPracticesData } from '../lib/practicesDataCache'
import { PRACTICE_KEYS, isPracticeAvailable } from '../config/practiceAvailability'

import BackButton from '../components/BackButton'

import RitualsArt from '../components/practice-art/RitualsArt'
import AskesisArt from '../components/practice-art/AskesisArt'
import NeuroArt from '../components/practice-art/NeuroArt'
import BreathingArt from '../components/practice-art/BreathingArt'
import FocusArt from '../components/practice-art/FocusArt'
import MeditationArt from '../components/practice-art/MeditationArt'
import JournalArt from '../components/practice-art/JournalArt'
import FirstStepArt from '../components/practice-art/FirstStepArt'
import ReleaseArt from '../components/practice-art/ReleaseArt'
import NarrowFocusArt from '../components/practice-art/NarrowFocusArt'
import OneFinishArt from '../components/practice-art/OneFinishArt'

import Rituals from './Rituals'
import Ascezas from './Ascezas'
import BrainTrainer from './BrainTrainer'
import Focus from './Focus'
import Breathing from './Breathing'
import FirstStepFlow from './FirstStepFlow'
import MeditationFlow from './MeditationFlow'
import JournalFlow from './JournalFlow'
import ProcrastinationFlow from './ProcrastinationFlow'
import NarrowFocusFlow from './NarrowFocusFlow'
import FinishFlow from './FinishFlow'

function SubHeader({ title, onBack }) {
  return (
    <div
      className="
        w-full
        max-w-md
        px-5
        pb-[8px]

        grid
        grid-cols-[1fr_auto_1fr]
        items-center
        min-h-[42px]
      "
    >
      <div className="justify-self-start">
        <BackButton onClick={onBack} />
      </div>

      <span className="font-display text-[18px] text-cream lowercase">{title}</span>

      <span aria-hidden="true" />
    </div>
  )
}

function PracticeRow({ artwork, title, subtitle, right, soon = false, onOpen }) {
  return (
    <button
      type="button"
      disabled={soon}
      aria-disabled={soon}
      onClick={() => {
        if (soon) return

        platform.haptic('light')
        onOpen?.()
      }}
      className={[
        'w-full min-h-[72px] flex items-center gap-3 border-b text-left transition-colors',
        soon ? 'border-cream/[0.06] cursor-default' : 'border-cream/[0.10] active:bg-cream/[0.03]',
      ].join(' ')}
    >
      <span
        className={[
          'w-[58px] h-[42px] shrink-0 flex items-center justify-center',
          soon ? 'text-muted' : 'text-cream',
        ].join(' ')}
        aria-hidden="true"
      >
        {artwork}
      </span>

      <span className="min-w-0 flex-1 py-3">
        <span
          className={[
            'block font-display mx-type-list-title text-[16px] font-semibold leading-tight tracking-[-0.02em]',
            soon ? 'text-muted' : 'text-cream',
          ].join(' ')}
        >
          {title}
        </span>
        <span className="block mt-1 mx-type-list-body text-[12px] leading-[1.3] text-muted">
          {subtitle}
        </span>
      </span>

      <span className="w-[48px] shrink-0 flex items-center justify-end gap-2">
        {soon ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            Скоро
          </span>
        ) : (
          <>
            {right && <span className="font-mono text-[11px] text-gold">{right}</span>}
            <span className="text-[23px] leading-none text-gold" aria-hidden="true">
              ›
            </span>
          </>
        )}
      </span>
    </button>
  )
}

function PracticeCategory({ title, children }) {
  return (
    <section className="mt-7 first:mt-0">
      <h3 className="mb-2 font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  )
}

function JournalEntry({ onOpen }) {
  return (
    <section aria-label="Журнал" className="mb-9">
      <button
        type="button"
        onClick={() => {
          platform.haptic('light')
          onOpen()
        }}
        className="relative w-full overflow-hidden rounded-[28px] border border-gold/25 bg-gold/[0.08] p-5 text-left transition-colors active:bg-gold/[0.13]"
      >
        <span className="absolute right-3 top-3 h-20 w-20 text-gold/45" aria-hidden="true">
          <JournalArt />
        </span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
          Журнал
        </span>
        <span className="mt-2 block max-w-[240px] font-display text-[23px] font-semibold leading-[1.08] tracking-[-0.03em] text-cream">
          Собери день в четыре шага
        </span>
        <span className="mt-3 block max-w-[270px] text-[13px] leading-relaxed text-muted">
          Идея, действие, анализ и новый шаг — спокойно, в своём темпе.
        </span>
        <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-cream px-4 py-2 text-[13px] font-semibold text-emerald-deep">
          Открыть журнал
          <span className="text-[19px] leading-none" aria-hidden="true">
            ›
          </span>
        </span>
      </button>
    </section>
  )
}

export default function Practices({ user, initialSub = null, onGameChange, onReturnToToday }) {
  const [sub, setSub] = useState(initialSub)

  const focusedFlowOpen = [
    'first-step',
    'no-blame',
    'narrow-focus',
    'one-finish',
    'meditation',
    'journal',
  ].includes(sub)

  useEffect(() => {
    onGameChange?.(focusedFlowOpen)

    return () => onGameChange?.(false)
  }, [focusedFlowOpen, onGameChange])

  const [initialPracticesData] = useState(() => (user ? peekPracticesData(user.id) : null))
  const [rituals, setRituals] = useState(initialPracticesData?.rituals ?? [])
  const [ascezas, setAscezas] = useState(initialPracticesData?.ascezas ?? [])

  /*
   * initialSub приходит из навигации (открыть Practices сразу на
   * конкретном экране) — синхронизация с внешним пропом, без побочных
   * эффектов, поэтому во время рендера, а не в useEffect.
   */
  const [seenInitialSub, setSeenInitialSub] = useState(initialSub)
  if (seenInitialSub !== initialSub) {
    setSeenInitialSub(initialSub)
    setSub(initialSub)
  }

  useEffect(() => {
    if (!user || sub !== null) return

    let active = true

    fetchPracticesData(user.id)
      .then(({ rituals: ritualsData, ascezas: ascezasData }) => {
        if (!active) return

        setRituals(ritualsData)
        setAscezas(ascezasData)
      })
      .catch(console.error)

    return () => {
      active = false
    }
  }, [user, sub])

  if (sub === 'rituals') {
    return <Rituals user={user} onBack={() => setSub(null)} />
  }

  if (sub === 'ascezas') {
    return <Ascezas user={user} onBack={() => setSub(null)} />
  }

  if (sub === 'first-step') {
    return (
      <FirstStepFlow userId={user.id} onClose={() => setSub(null)} onComplete={onReturnToToday} />
    )
  }

  if (sub === 'meditation') {
    return <MeditationFlow onClose={() => setSub(null)} />
  }

  if (sub === 'journal') {
    return <JournalFlow userId={user.id} onClose={() => setSub(null)} />
  }

  if (sub === 'no-blame') {
    return (
      <ProcrastinationFlow
        userId={user.id}
        onClose={() => setSub(null)}
        onComplete={onReturnToToday}
      />
    )
  }

  if (sub === 'narrow-focus') {
    return (
      <NarrowFocusFlow userId={user.id} onClose={() => setSub(null)} onComplete={onReturnToToday} />
    )
  }

  if (sub === 'one-finish') {
    return <FinishFlow userId={user.id} onClose={() => setSub(null)} onComplete={onReturnToToday} />
  }

  if (sub === 'brain') {
    return <BrainTrainer user={user} onBack={() => setSub(null)} onActiveChange={onGameChange} />
  }

  if (sub === 'breathing') {
    return <Breathing user={user} onBack={() => setSub(null)} />
  }

  if (sub === 'focus') {
    return (
      <div className="w-full flex flex-col items-center">
        <SubHeader title="фокус." onBack={() => setSub(null)} />

        <Focus user={user} />
      </div>
    )
  }

  const ritualsDone = rituals.filter(ritual => ritual.today_level).length

  const ascezasHeld = ascezas.filter(asceza => asceza.today_status === 'held').length

  return (
    <div
      className={`
        w-full
        max-w-md
        px-5
      `}
    >
      <div
        className="
          w-full
          grid
          grid-cols-[1fr_auto_1fr]
          items-center
          min-h-[42px]
          mb-[28px]
        "
      >
        <span aria-hidden="true" />

        <h2
          className="
            font-display
            mx-type-page
            text-cream
            lowercase
          "
        >
          практики.
        </h2>

        <span aria-hidden="true" />
      </div>

      <JournalEntry onOpen={() => setSub('journal')} />

      <PracticeCategory title="Практики">
        <PracticeRow
          artwork={<MeditationArt />}
          title="Медитация"
          subtitle="заметить своё и выбрать один спокойный шаг"
          right="5–10 мин"
          soon={!isPracticeAvailable(PRACTICE_KEYS.meditation)}
          onOpen={() => setSub('meditation')}
        />
        <PracticeRow
          artwork={<RitualsArt />}
          title="Ритуалы"
          subtitle="обряды, что держат твой день"
          right={rituals.length > 0 ? `${ritualsDone}/${rituals.length}` : null}
          soon={!isPracticeAvailable(PRACTICE_KEYS.rituals)}
          onOpen={() => setSub('rituals')}
        />
        <PracticeRow
          artwork={<AskesisArt />}
          title="Аскезы"
          subtitle="от чего ты отказываешься"
          right={ascezas.length > 0 ? `${ascezasHeld}/${ascezas.length}` : null}
          soon={!isPracticeAvailable(PRACTICE_KEYS.ascezas)}
          onOpen={() => setSub('ascezas')}
        />
      </PracticeCategory>

      <PracticeCategory title="Психологические практики">
        <PracticeRow
          artwork={<FirstStepArt />}
          title="Первый шаг"
          subtitle="маленький шаг, когда трудно начать"
          soon={!isPracticeAvailable(PRACTICE_KEYS.firstStep)}
          onOpen={() => setSub('first-step')}
        />
        <PracticeRow
          artwork={<ReleaseArt />}
          title="Без вины"
          subtitle="когда откладываешь и знаешь это"
          soon={!isPracticeAvailable(PRACTICE_KEYS.noBlame)}
          onOpen={() => setSub('no-blame')}
        />
        <PracticeRow
          artwork={<NarrowFocusArt />}
          title="Одно из всех"
          subtitle="когда всё сразу — слишком много"
          soon={!isPracticeAvailable(PRACTICE_KEYS.narrowFocus)}
          onOpen={() => setSub('narrow-focus')}
        />
        <PracticeRow
          artwork={<OneFinishArt />}
          title="Один финиш"
          subtitle="маленький кусок, доведённый до конца"
          soon={!isPracticeAvailable(PRACTICE_KEYS.oneFinish)}
          onOpen={() => setSub('one-finish')}
        />
      </PracticeCategory>

      <PracticeCategory title="Дальше / Скоро">
        <PracticeRow
          artwork={<NeuroArt />}
          title="Нейротренажёр"
          subtitle="внимание, память, реакция"
          soon={!isPracticeAvailable(PRACTICE_KEYS.brain)}
          onOpen={() => setSub('brain')}
        />
        <PracticeRow
          artwork={<BreathingArt />}
          title="Дыхание"
          subtitle="успокоить систему за минуту"
          soon={!isPracticeAvailable(PRACTICE_KEYS.breathing)}
          onOpen={() => setSub('breathing')}
        />
        <PracticeRow
          artwork={<FocusArt />}
          title="Фокус"
          subtitle="таймер глубокой работы"
          soon={!isPracticeAvailable(PRACTICE_KEYS.focus)}
          onOpen={() => setSub('focus')}
        />
      </PracticeCategory>
    </div>
  )
}
