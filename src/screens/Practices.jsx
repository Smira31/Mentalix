import { useEffect, useState } from 'react'

import { platform } from '../platform'
import { api } from '../lib/api'
import { cardSystemPreviewEnabled } from '../lib/cardSystem'

import PracticeCard from '../components/PracticeCard'
import BackButton from '../components/BackButton'
import CardSystemGlyph from '../components/CardSystemGlyph'

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


function SubHeader({ title, onBack }) {
  return (
    <div
      className="
        w-full
        max-w-md
        px-5
        pb-[8px]
        flex
        items-center
        gap-[10px]
      "
    >
      <BackButton onClick={onBack} />

      <span className="font-display text-[18px] text-cream lowercase">
        {title}
      </span>
    </div>
  )
}


export default function Practices({
  user,
  initialSub = null,
  onGameChange,
  onSubChange,
}) {
  const [sub, setSub] = useState(initialSub)
  const [rituals, setRituals] = useState([])
  const [ascezas, setAscezas] = useState([])

  useEffect(() => {
    setSub(initialSub)
  }, [initialSub])

  /*
   * App.jsx не видит переходы между практиками изнутри этого
   * компонента (клик по карточке «Аскезы» и т. п.) — только то,
   * с чем сюда вошли. Экраны-карусели («аскезы») структурно
   * рассчитывают отступ до нижней навигации в App.jsx, и им нужно
   * знать актуальный sub, поэтому сообщаем о каждой смене наружу.
   */
  useEffect(() => {
    onSubChange?.(sub)
  }, [sub, onSubChange])

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [])

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
        onActiveChange={onGameChange}
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
    <div
      className={`
        w-full
        max-w-md
        px-5
        ${cardSystemPreviewEnabled ? 'mx-card-system-practices' : ''}
      `}
    >
      <h2
        className="
          font-display
          text-[32px]
          leading-[0.95]
          tracking-[-0.04em]
          text-cream
          lowercase
          mt-[12px]
          mb-[18px]
        "
      >
        практики.
      </h2>


      <div
        className="
          grid
          grid-cols-2
          gap-x-[10px]
          gap-y-[12px]
          mx-stagger
        "
      >
        <PracticeCard
          artwork={<RitualsArt />}
          artworkScale={1.04}
          title="Ритуалы"
          subtitle="обряды, что держат твой день"
          right={
            rituals.length > 0
              ? `${ritualsDone}/${rituals.length}`
              : null
          }
          onOpen={() => setSub('rituals')}
          systemPreview={cardSystemPreviewEnabled}
        />

        <PracticeCard
          artwork={<AskesisArt />}
          artworkScale={1.04}
          title="Аскезы"
          subtitle="от чего ты отказываешься"
          right={
            ascezas.length > 0
              ? `${ascezasHeld}/${ascezas.length}`
              : null
          }
          onOpen={() => setSub('ascezas')}
          systemPreview={cardSystemPreviewEnabled}
        />

        <PracticeCard
          artwork={cardSystemPreviewEnabled
            ? <CardSystemGlyph kind="neuro-synapse" />
            : <NeuroArt />}
          artworkScale={1.04}
          title="Нейротренажёр"
          subtitle="внимание, память, реакция"
          onOpen={() => setSub('brain')}
          systemPreview={cardSystemPreviewEnabled}
          soon
        />

        <PracticeCard
          artwork={<BreathingArt />}
          artworkScale={1.04}
          title="Дыхание"
          subtitle="успокоить систему за минуту"
          onOpen={() => setSub('breathing')}
          systemPreview={cardSystemPreviewEnabled}
          soon
        />

        <PracticeCard
          artwork={cardSystemPreviewEnabled
            ? <CardSystemGlyph kind="focus-convergence" />
            : <FocusArt />}
          artworkScale={1.04}
          title="Фокус"
          subtitle="таймер глубокой работы"
          onOpen={() => setSub('focus')}
          systemPreview={cardSystemPreviewEnabled}
          soon
        />

        <PracticeCard
          artwork={cardSystemPreviewEnabled
            ? <CardSystemGlyph kind="meditation-contours" />
            : <MeditationArt />}
          artworkScale={1.04}
          title="Медитации"
          subtitle="тишина для ума и тела"
          soon
          systemPreview={cardSystemPreviewEnabled}
          onOpen={() => {
            platform.haptic('light')
          }}
        />
      </div>
    </div>
  )
}
