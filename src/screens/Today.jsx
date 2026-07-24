import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import Rituals from './Rituals'
import Ascezas from './Ascezas'
import BrainTrainer from './BrainTrainer'
import { Sparkles, Shield, ChevronRight, Compass, Brain } from 'lucide-react'

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

function EntryCard({ Icon, title, subtitle, right, onOpen, accent = 'gold' }) {
  const tone = {
    gold: { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/30', grad: 'from-gold/15' },
    mint: { bg: 'bg-mint/20', text: 'text-mint', border: 'border-mint/30', grad: 'from-mint/15' },
    cognac: { bg: 'bg-cognac/20', text: 'text-cognac', border: 'border-cognac/30', grad: 'from-cognac/15' },
  }[accent]

  return (
    <button
      onClick={() => { haptic('light'); onOpen() }}
      className={`w-full rounded-[24px] border ${tone.border} bg-gradient-to-br ${tone.grad} to-emerald-light/20 p-4 mb-3 flex items-center gap-3 transition-transform active:scale-[0.98]`}
    >
      <div className={`w-11 h-11 rounded-2xl ${tone.bg} flex items-center justify-center shrink-0`}>
        <Icon size={22} className={tone.text} strokeWidth={1.75} />
      </div>
      <div className="flex-1 text-left">
        <div className="font-display text-lg text-cream">{title}</div>
        <div className="text-xs text-cream/50">{subtitle}</div>
      </div>
      {right && <div className="shrink-0 mr-1">{right}</div>}
      <ChevronRight size={20} className="text-cream/40 shrink-0" />
    </button>
  )
}

function derivePriorityAction({ rituals, ascezas }) {
  if (rituals.length === 0 && ascezas.length === 0) {
    return 'Начни с одного ритуала или одной аскезы — система работает через регулярность'
  }
  const undoneRituals = rituals.filter((r) => !r.today_level)
  if (undoneRituals.length > 0) {
    return `Незакрытый ритуал: «${undoneRituals[0].name}» — маленький шаг сейчас удержит серию`
  }
  const unmarkedAscezas = ascezas.filter((a) => !a.today_status)
  if (unmarkedAscezas.length > 0) {
    return `Отметься по аскезе «${unmarkedAscezas[0].name}» — честность важнее результата`
  }
  const broke = ascezas.filter((a) => a.today_status === 'broke')
  if (broke.length > 0) {
    return 'Сорвался — это данные, а не приговор. Завтра снова считаем с чистого листа'
  }
  return 'Всё закрыто — можно спокойно жить дальше, система держит фокус за тебя'
}

export default function Today({ user }) {
  const [rituals, setRituals] = useState([])
  const [ascezas, setAscezas] = useState([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState(null) // null | 'rituals' | 'ascezas' | 'brain'
  const [dailyQuote, setDailyQuote] = useState(null)

  useEffect(() => {
    if (!user) return
    load()
  }, [user, screen])

  async function load() {
    try {
      const [r, a, q] = await Promise.all([
        api.rituals.list(user.id),
        api.ascezas.list(user.id),
        api.quotes.today(user.id),
      ])
      setRituals(r)
      setAscezas(a)
      setDailyQuote(q.text)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (screen === 'rituals') {
    return <Rituals user={user} onBack={() => setScreen(null)} />
  }

  if (screen === 'ascezas') {
    return <Ascezas user={user} onBack={() => setScreen(null)} />
  }

  if (screen === 'brain') {
    return <BrainTrainer user={user} onBack={() => setScreen(null)} />
  }

  if (loading) return <p className="text-cream/40 text-sm px-6">Загрузка...</p>

  const ritualsDone = rituals.filter((r) => r.today_level).length
  const ascezasHeld = ascezas.filter((a) => a.today_status === 'held').length
  const priorityAction = derivePriorityAction({ rituals, ascezas })

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <div className="rounded-[24px] border border-gold/40 bg-gradient-to-br from-gold/10 to-emerald-light/20 px-5 py-4 mb-6 animate-fade-in">
        <div className="text-[11px] text-gold mb-1.5 font-mono uppercase tracking-wide">Сейчас важнее всего</div>
        <p className="text-base text-cream leading-snug">{priorityAction}</p>
      </div>

      {dailyQuote && (
        <div className="rounded-[24px] border border-mint/30 bg-gradient-to-br from-mint/10 to-emerald-light/20 px-5 py-4 mb-6 animate-fade-in flex items-start gap-3">
          <Compass size={18} className="text-mint shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <div className="text-[11px] text-mint mb-1.5 font-mono uppercase tracking-wide">Считка дня</div>
            <p className="text-base text-cream/90 leading-snug italic">{dailyQuote}</p>
          </div>
        </div>
      )}

      <EntryCard
        Icon={Sparkles}
        title="Ритуалы"
        subtitle="обряды, что держат твой день"
        right={rituals.length > 0 ? <span className="font-mono text-xs text-gold">{ritualsDone}/{rituals.length}</span> : null}
        onOpen={() => setScreen('rituals')}
        accent="gold"
      />

      <EntryCard
        Icon={Shield}
        title="Аскезы"
        subtitle="от чего ты отказываешься"
        right={ascezas.length > 0 ? <span className="font-mono text-xs text-mint">{ascezasHeld}/{ascezas.length}</span> : null}
        onOpen={() => setScreen('ascezas')}
        accent="mint"
      />

      <EntryCard
        Icon={Brain}
        title="Нейротренажёр"
        subtitle="внимание, память, реакция"
        onOpen={() => setScreen('brain')}
        accent="cognac"
      />
    </div>
  )
}