import { useEffect, useState } from 'react'

import { platform } from '../platform'
import { fetchPracticesData, peekPracticesData } from '../lib/practicesDataCache'

import BackButton from '../components/BackButton'

import RitualsArt from '../components/practice-art/RitualsArt'
import AskesisArt from '../components/practice-art/AskesisArt'
import NeuroArt from '../components/practice-art/NeuroArt'
import BreathingArt from '../components/practice-art/BreathingArt'
import FocusArt from '../components/practice-art/FocusArt'
import MeditationArt from '../components/practice-art/MeditationArt'
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
            'block font-display text-[16px] font-semibold leading-tight tracking-[-0.02em]',
            soon ? 'text-muted' : 'text-cream',
          ].join(' ')}
        >
          {title}
        </span>
        <span className="block mt-1 text-[12px] leading-[1.3] text-muted">{subtitle}</span>
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
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  )
}

export default function Practices({ user, initialSub = null, onGameChange }) {
  const [sub, setSub] = useState(initialSub)

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
    return <FirstStepFlow userId={user.id} onClose={() => setSub(null)} />
  }

  if (sub === 'no-blame') {
    return <ProcrastinationFlow userId={user.id} onClose={() => setSub(null)} />
  }

  if (sub === 'narrow-focus') {
    return <NarrowFocusFlow userId={user.id} onClose={() => setSub(null)} />
  }

  if (sub === 'one-finish') {
    return <FinishFlow userId={user.id} onClose={() => setSub(null)} />
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
        mx-card-system-practices
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
            text-[32px]
            leading-[0.95]
            tracking-[-0.04em]
            text-cream
            lowercase
          "
        >
          практики.
        </h2>

        <span aria-hidden="true" />
      </div>

      <PracticeCategory title="Доступно сейчас">
        <PracticeRow
          artwork={<RitualsArt />}
          title="Ритуалы"
          subtitle="обряды, что держат твой день"
          right={rituals.length > 0 ? `${ritualsDone}/${rituals.length}` : null}
          onOpen={() => setSub('rituals')}
        />
        <PracticeRow
          artwork={<AskesisArt />}
          title="Аскезы"
          subtitle="от чего ты отказываешься"
          right={ascezas.length > 0 ? `${ascezasHeld}/${ascezas.length}` : null}
          onOpen={() => setSub('ascezas')}
        />
      </PracticeCategory>

      <PracticeCategory title="Психологические практики">
        <PracticeRow
          artwork={<FirstStepArt />}
          title="Первый шаг"
          subtitle="маленький шаг, когда трудно начать"
          onOpen={() => setSub('first-step')}
        />
        <PracticeRow
          artwork={<ReleaseArt />}
          title="Без вины"
          subtitle="когда откладываешь и знаешь это"
          onOpen={() => setSub('no-blame')}
        />
        <PracticeRow
          artwork={<NarrowFocusArt />}
          title="Одно из всех"
          subtitle="когда всё сразу — слишком много"
          onOpen={() => setSub('narrow-focus')}
        />
        <PracticeRow
          artwork={<OneFinishArt />}
          title="Один финиш"
          subtitle="маленький кусок, доведённый до конца"
          onOpen={() => setSub('one-finish')}
        />
      </PracticeCategory>

      <PracticeCategory title="Дальше / Скоро">
        <PracticeRow
          artwork={<NeuroArt />}
          title="Нейротренажёр"
          subtitle="внимание, память, реакция"
          soon
        />
        <PracticeRow
          artwork={<BreathingArt />}
          title="Дыхание"
          subtitle="успокоить систему за минуту"
          soon
        />
        <PracticeRow artwork={<FocusArt />} title="Фокус" subtitle="таймер глубокой работы" soon />
        <PracticeRow
          artwork={<MeditationArt />}
          title="Медитации"
          subtitle="тишина для ума и тела"
          soon
        />
      </PracticeCategory>
    </div>
  )
}
