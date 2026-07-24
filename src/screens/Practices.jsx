import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Sparkles, Shield, Brain, Timer, BookOpen, Wind, ChevronRight, ChevronLeft } from 'lucide-react'
import Rituals from './Rituals'
import Ascezas from './Ascezas'
import BrainTrainer from './BrainTrainer'
import Focus from './Focus'
import Breathing from './Breathing'
import Courses from './Courses'

// Хаб «Практики»: ритуалы + аскезы + тренировка ума в одном месте.
// Сюда же переехали Фокус и Курсы, чтобы освободить таб-бар до 5 вкладок.

function BigCard({ Icon, title, subtitle, right, onOpen }) {
  return (
    <button
      onClick={() => { platform.haptic('light'); onOpen() }}
      className="w-full rounded-[28px] bg-emerald p-5 mb-3 flex items-center gap-4 transition-transform active:scale-[0.98] border-0 text-left"
    >
      <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
        <Icon size={22} className="text-gold" strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <div className="font-display text-[17px] text-cream">{title}</div>
        <div className="text-[12px] text-cream/45 font-medium mt-0.5">{subtitle}</div>
      </div>
      {right && <span className="font-mono text-xs text-cream/50 shrink-0">{right}</span>}
      <ChevronRight size={20} className="text-cream/30 shrink-0" />
    </button>
  )
}

function SmallRow({ Icon, title, subtitle, onOpen }) {
  return (
    <button
      onClick={() => { platform.haptic('light'); onOpen() }}
      className="w-full rounded-3xl bg-emerald/60 px-5 py-4 mb-3 flex items-center gap-4 transition-transform active:scale-[0.98] border-0 text-left"
    >
      <Icon size={20} className="text-cream/50 shrink-0" strokeWidth={1.75} />
      <div className="flex-1">
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
  if (sub === 'courses') {
    return (
      <div className="w-full flex flex-col items-center">
        <SubHeader title="библиотека." onBack={() => setSub(null)} />
        <Courses user={user} />
      </div>
    )
  }

  const ritualsDone = rituals.filter((r) => r.today_level).length
  const ascezasHeld = ascezas.filter((a) => a.today_status === 'held').length

  return (
    <div className="w-full max-w-md px-5 pb-40">
      <h2 className="font-display text-[34px] text-cream lowercase mt-4 mb-6">практики.</h2>

      <BigCard
        Icon={Sparkles}
        title="Ритуалы"
        subtitle="обряды, что держат твой день"
        right={rituals.length > 0 ? `${ritualsDone}/${rituals.length}` : null}
        onOpen={() => setSub('rituals')}
      />
      <BigCard
        Icon={Shield}
        title="Аскезы"
        subtitle="от чего ты отказываешься"
        right={ascezas.length > 0 ? `${ascezasHeld}/${ascezas.length}` : null}
        onOpen={() => setSub('ascezas')}
      />
      <BigCard
        Icon={Brain}
        title="Нейротренажёр"
        subtitle="внимание, память, реакция"
        onOpen={() => setSub('brain')}
      />
      <BigCard
        Icon={Wind}
        title="Дыхание"
        subtitle="успокоить систему за минуту"
        onOpen={() => setSub('breathing')}
      />

      <div className="text-[12px] text-cream/35 font-semibold mt-7 mb-3 px-1">Ещё</div>
      <SmallRow Icon={Timer} title="Фокус" subtitle="таймер глубокой работы" onOpen={() => setSub('focus')} />
      <SmallRow Icon={BookOpen} title="Библиотека" subtitle="материалы, что стоит сохранить" onOpen={() => setSub('courses')} />
    </div>
  )
}
