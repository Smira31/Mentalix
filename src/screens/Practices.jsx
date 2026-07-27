import { useEffect, useState } from 'react'

import { platform } from '../platform'
import { api } from '../lib/api'

import { ChevronLeft } from 'lucide-react'


import PracticeCard from '../components/PracticeCard'


import RitualsArt from '../components/practice-art/RitualsArt'
import AskesisArt from '../components/practice-art/AskesisArt'
import NeuroArt from '../components/practice-art/NeuroArt'
import BreathingArt from '../components/practice-art/BreathingArt'
import FocusArt from '../components/practice-art/FocusArt'
import MeditationArt from '../components/practice-art/MeditationArt'


import Rituals from './Rituals'
import Ascezas from './Ascezas'
import BrainTrainer from './BrainTrainer'
import Focus from './Focus'
import Breathing from './Breathing'


/* ============================================================
   SUB HEADER
   ============================================================ */

function SubHeader({
  title,
  onBack,
}) {
  return (
    <div
      className="
        w-full
        max-w-md
        px-[16px]
        pb-2
        flex
        items-center
        gap-3
      "
    >
      <button
        type="button"
        onClick={() => {
          platform.haptic('light')

          onBack()
        }}
        aria-label="Назад"
        className="
          w-10
          h-10
          rounded-full
          bg-emerald
          border
          border-white/[0.12]
          flex
          items-center
          justify-center
          active:scale-95
          transition-transform
        "
      >
        <ChevronLeft
          size={20}
          strokeWidth={1.7}
          className="text-cream/60"
        />
      </button>


      <span
        className="
          font-display
          text-lg
          text-cream
          lowercase
        "
      >
        {title}
      </span>
    </div>
  )
}


/* ============================================================
   PRACTICES
   ============================================================ */

export default function Practices({
  user,
  initialSub = null,
}) {
  const [sub, setSub] =
    useState(initialSub)


  const [rituals, setRituals] =
    useState([])


  const [ascezas, setAscezas] =
    useState([])


  /* ------------------------------------------------------------
     Sync
     ------------------------------------------------------------ */

  useEffect(() => {
    setSub(initialSub)
  }, [initialSub])


  /* ------------------------------------------------------------
     Scroll top
     ------------------------------------------------------------ */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [])


  /* ------------------------------------------------------------
     Data
     ------------------------------------------------------------ */

  useEffect(() => {
    if (
      !user ||
      sub !== null
    ) {
      return
    }


    Promise.all([
      api.rituals.list(user.id),
      api.ascezas.list(user.id),
    ])
      .then(([
        ritualsData,
        ascezasData,
      ]) => {
        setRituals(ritualsData)

        setAscezas(ascezasData)
      })
      .catch(console.error)
  }, [user, sub])


  /* ============================================================
     SUB SCREENS
     ============================================================ */

  if (sub === 'rituals') {
    return (
      <Rituals
        user={user}
        onBack={() => {
          setSub(null)
        }}
      />
    )
  }


  if (sub === 'ascezas') {
    return (
      <Ascezas
        user={user}
        onBack={() => {
          setSub(null)
        }}
      />
    )
  }


  if (sub === 'brain') {
    return (
      <BrainTrainer
        user={user}
        onBack={() => {
          setSub(null)
        }}
      />
    )
  }


  if (sub === 'breathing') {
    return (
      <Breathing
        user={user}
        onBack={() => {
          setSub(null)
        }}
      />
    )
  }


  if (sub === 'focus') {
    return (
      <div
        className="
          w-full
          flex
          flex-col
          items-center
        "
      >
        <SubHeader
          title="фокус."
          onBack={() => {
            setSub(null)
          }}
        />

        <Focus user={user} />
      </div>
    )
  }


  /* ============================================================
     PROGRESS
     ============================================================ */

  const ritualsDone =
    rituals.filter(
      (ritual) =>
        ritual.today_level
    ).length


  const ascezasHeld =
    ascezas.filter(
      (asceza) =>
        asceza.today_status === 'held'
    ).length


  /* ============================================================
     MAIN SCREEN
     ============================================================ */

  return (
    <div
      className="
        w-full
        max-w-md
        px-[16px]
        pb-[105px]
      "
    >

      {/* Title */}
      <h2
        className="
          font-display
          text-[34px]
          leading-[0.95]
          tracking-[-0.04em]
          text-cream
          lowercase
          mt-[18px]
          mb-[18px]
        "
      >
        практики.
      </h2>


      {/* 2 × 3 GRID */}
      <div
        className="
          grid
          grid-cols-2
          gap-[10px]
          mx-stagger
        "
      >

        {/* Rituals */}
        <PracticeCard
          artwork={
            <RitualsArt />
          }
          title="Ритуалы"
          subtitle="обряды, что держат твой день"
          right={
            rituals.length > 0
              ? `${ritualsDone}/${rituals.length}`
              : null
          }
          onOpen={() => {
            setSub('rituals')
          }}
        />


        {/* Askesis */}
        <PracticeCard
          artwork={
            <AskesisArt />
          }
          title="Аскезы"
          subtitle="от чего ты отказываешься"
          right={
            ascezas.length > 0
              ? `${ascezasHeld}/${ascezas.length}`
              : null
          }
          onOpen={() => {
            setSub('ascezas')
          }}
        />


        {/* Neuro */}
        <PracticeCard
          artwork={
            <NeuroArt />
          }
          title="Нейротренажёр"
          subtitle="внимание, память, реакция"
          onOpen={() => {
            setSub('brain')
          }}
        />


        {/* Breathing */}
        <PracticeCard
          artwork={
            <BreathingArt />
          }
          title="Дыхание"
          subtitle="успокоить систему за минуту"
          onOpen={() => {
            setSub('breathing')
          }}
        />


        {/* Focus */}
        <PracticeCard
          artwork={
            <FocusArt />
          }
          title="Фокус"
          subtitle="таймер глубокой работы"
          onOpen={() => {
            setSub('focus')
          }}
        />


        {/* Meditation */}
        <PracticeCard
          artwork={
            <MeditationArt />
          }
          title="Медитации"
          subtitle="тишина для ума и тела"
          onOpen={() => {
            platform.haptic('light')
          }}
        />

      </div>
    </div>
  )
}