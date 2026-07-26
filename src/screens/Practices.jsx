import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Sparkles, Shield, Brain, Timer, Wind, ChevronRight, ChevronLeft } from 'lucide-react'
import Rituals from './Rituals'
import Ascezas from './Ascezas'
import BrainTrainer from './BrainTrainer'
import Focus from './Focus'
import Breathing from './Breathing'

// Хаб «Практики»: ритуалы + аскезы + тренировка ума в одном месте.
// Сюда же переехали Фокус и Курсы, чтобы освободить таб-бар до 5 вкладок.
//
// Радиусы по всему экрану: rounded-3xl (24) — плитка,
// rounded-full — иконка и счётчик. Других значений здесь нет.

function Tile({ Icon, title, subtitle, right, onOpen }) {
  return (
    <button
      onClick={() => { platform.haptic('light'); onOpen() }}
      className="w-full min-h-[158px] rounded-3xl bg-emerald p-4 flex flex-col justify-between text-left border-0 transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-11 h-11 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
          <Icon size={21} className="text-gold" strokeWidth={1.75} />
        </div>
        {right && (
          <span className="font-mono text-[11px] text-gold bg-gold/10 rounded-full px-2.5 py-1 shrink-0">
            {right}
          </span>
        )}
      </div>
      <div>
        <div className="font-display text-[17px] text-cream leading-tight">{title}</div>
        <div className="text-[12px] text-cream/45 font-medium mt-1 leading-snug">{subtitle}</div>
      </div>
    </button>
  )
}

function WideTile({ Icon, title, subtitle, onOpen }) {
  return (
    <button
      onClick={() => { platform.haptic('light'); onOpen() }}
      className="col-span-2 w-full rounded-3xl bg-emerald/60 px-5 py-4 flex items-center gap-4 text-left border-0 transition-transform active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full bg-cream/5 flex items-center justify-center shrink-0">
        <Icon size={19} className="text-cream/50" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-cream">{title}</div>
        <div className="text-[12px] text-cream/40 font-medium">{subtitle}</div>
      </div>
      <ChevronRight size={18} className="text-cream/30 shrink-0" />
    </button>
  )
}

function SubHeader({ title, onBack }) {
  return (
    <div className="w-full max-w-md px-5 pb-2 flex items-center gap-3">
      <button
        onClick={() => { platform.haptic('light'); onBack() }}
        aria-label="Назад"
        className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
      >
        <ChevronLeft size={20} className="text-cream/60" />
      </button>
      <span className="font-display text-lg text-cream lowercase">{title}</span>
    </div>
  )
}

export default function Practices({ user, initialSub = null }) {
  const [sub, setSub] = useState(initialSub) // null | rituals | ascezas | brain | focus | courses
  const [rituals, setRituals] = useState([])
  const [ascezas, setAscezas] = useState([])

  useEffect(() => setSub(initialSub), [initialSub])

  useEffect(() => {
    if (!user || sub !== null) return
    Promise.all([api.rituals.list(user.id), api.ascezas.list(user.id)])
      .then(([r, a]) => { setRituals(r); setAscezas(a) })
      .catch(console.error)
  }, [user, sub])

  if (sub === 'rituals') return <Rituals user={user} onBack={() => setSub(null)} />
  if (sub === 'ascezas') return <Ascezas user={user} onBack={() => setSub(null)} />
  if (sub === 'brain') return <BrainTrainer user={user} onBack={() => setSub(null)} />
  if (sub === 'breathing') return <Breathing user={user} onBack={() => setSub(null)} />
  if (sub === 'focus') {
    return (
      <div className="w-full flex flex-col items-center">
        <SubHeader title="фокус." onBack={() => setSub(null)} />
        <Focus user={user} />
      </div>
    )
  }

  const ritualsDone = rituals.filter((r) => r.today_level).length
  const ascezasHeld = ascezas.filter((a) => a.today_status === 'held').length

  return (
    <div className="w-full max-w-md px-5 pb-40">
      <h2 className="font-display text-[34px] text-cream lowercase mt-4 mb-6">практики.</h2>

      <div className="grid grid-cols-2 gap-3 mx-stagger">
        <Tile
          Icon={Sparkles}
          title="Ритуалы"
          subtitle="обряды, что держат твой день"
          right={rituals.length > 0 ? `${ritualsDone}/${rituals.length}` : null}
          onOpen={() => setSub('rituals')}
        />
        <Tile
          Icon={Shield}
          title="Аскезы"
          subtitle="от чего ты отказываешься"
          right={ascezas.length > 0 ? `${ascezasHeld}/${ascezas.length}` : null}
          onOpen={() => setSub('ascezas')}
        />
        <Tile
          Icon={Brain}
          title="Нейротренажёр"
          subtitle="внимание, память, реакция"
          onOpen={() => setSub('brain')}
        />
        <Tile
          Icon={Wind}
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
