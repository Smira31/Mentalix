import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Timer, ChevronRight, ChevronLeft } from 'lucide-react'

import PracticeCard from '../components/PracticeCard'
import RitualsArt from '../components/practice-art/RitualsArt'
import AskesisArt from '../components/practice-art/AskesisArt'
import NeuroArt from '../components/practice-art/NeuroArt'
import BreathingArt from '../components/practice-art/BreathingArt'

import Rituals from './Rituals'
import Ascezas from './Ascezas'
import BrainTrainer from './BrainTrainer'
import Focus from './Focus'
import Breathing from './Breathing'

// Хаб «Практики»:
// ритуалы, аскезы, нейротренажёр, дыхание и фокус.
//
// Основные четыре карточки используют единую Visual Card System Mentalix.
// Фокус пока остаётся компактной широкой карточкой.
//
// Радиусы:
// 28px — основные карточки практик
// 24px — компактная карточка Фокуса
// круг — кнопки, иконки и счётчики

function WideTile({ Icon, title, subtitle, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => {
        platform.haptic('light')
        onOpen()
      }}
      className="
        col-span-2
        w-full
        rounded-3xl
        bg-emerald/60
        px-5
        py-4
        flex
        items-center
        gap-4
        text-left
        border-0
        transition-transform
        active:scale-[0.98]
      "
    >
      <div
        className="
          w-10
          h-10
          rounded-full
          bg-cream/5
          flex
          items-center
          justify-center
          shrink-0
        "
      >
        <Icon
          size={19}
          className="text-cream/50"
          strokeWidth={1.75}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-cream">
          {title}
        </div>

        <div className="text-[12px] text-cream/40 font-medium">
          {subtitle}
        </div>
      </div>

      <ChevronRight
        size={18}
        className="text-cream/30 shrink-0"
      />
    </button>
  )
}

function SubHeader({ title, onBack }) {
  return (
    <div className="w-full max-w-md px-5 pb-2 flex items-center gap-3">
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
          flex
          items-center
          justify-center
          active:scale-95
          transition-transform
          border-0
        "
      >
        <ChevronLeft
          size={20}
          className="text-cream/60"
        />
      </button>

      <span className="font-display text-lg text-cream lowercase">
        {title}
      </span>
    </div>
  )
}

export default function Practices({ user, initialSub = null }) {
  const [sub, setSub] = useState(initialSub)

  const [rituals, setRituals] = useState([])
  const [ascezas, setAscezas] = useState([])

  useEffect(() => {
    setSub(initialSub)
  }, [initialSub])

  useEffect(() => {
    if (!user || sub !== null) return

    Promise.all([
      api.rituals.list(user.id),
      api.ascezas.list(user.id),
    ])
      .then(([ritualsData, ascezasData]) => {
        setRituals(ritualsData)
        setAscezas(ascezasData)
      })
      .catch(console.error)
  }, [user, sub])

  if (sub === 'rituals') {
    return (
      <Rituals
        user={user}
        onBack={() => setSub(null)}
      />
    )
  }

  if (sub === 'ascezas') {
    return (
      <Ascezas
        user={user}
        onBack={() => setSub(null)}
      />
    )
  }

  if (sub === 'brain') {
    return (
      <BrainTrainer
        user={user}
        onBack={() => setSub(null)}
      />
    )
  }

  if (sub === 'breathing') {
    return (
      <Breathing
        user={user}
        onBack={() => setSub(null)}
      />
    )
  }

  if (sub === 'focus') {
    return (
      <div className="w-full flex flex-col items-center">
        <SubHeader
          title="фокус."
          onBack={() => setSub(null)}
        />

        <Focus user={user} />
      </div>
    )
  }

  const ritualsDone = rituals.filter(
    (ritual) => ritual.today_level
  ).length

  const ascezasHeld = ascezas.filter(
    (asceza) => asceza.today_status === 'held'
  ).length

  return (
    <div className="w-full max-w-md px-5 pb-40">
      <h2
        className="
          font-display
          text-[34px]
          text-cream
          lowercase
          mt-4
          mb-6
        "
      >
        практики.
      </h2>

      <div className="grid grid-cols-2 gap-3 mx-stagger">

        <PracticeCard
          artwork={<RitualsArt />}
          title="Ритуалы"
          subtitle="обряды, что держат твой день"
          right={
            rituals.length > 0
              ? `${ritualsDone}/${rituals.length}`
              : null
          }
          onOpen={() => setSub('rituals')}
        />

        <PracticeCard
          artwork={<AskesisArt />}
          title="Аскезы"
          subtitle="от чего ты отказываешься"
          right={
            ascezas.length > 0
              ? `${ascezasHeld}/${ascezas.length}`
              : null
          }
          onOpen={() => setSub('ascezas')}
        />

        <PracticeCard
          artwork={<NeuroArt />}
          title="Нейротренажёр"
          subtitle="внимание, память, реакция"
          onOpen={() => setSub('brain')}
        />

        <PracticeCard
          artwork={<BreathingArt />}
          title="Дыхание"
          subtitle="успокоить систему за минуту"
          onOpen={() => setSub('breathing')}
        />

        <WideTile
          Icon={Timer}
          title="Фокус"
          subtitle="таймер глубокой работы"
          onOpen={() => setSub('focus')}
        />

      </div>
    </div>
  )
}