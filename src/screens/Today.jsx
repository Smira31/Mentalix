import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import Path from './Path'
import CheckIn from './CheckIn'

// ── лента недели, как у stoic. ──
function WeekStrip() {
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  return (
    <div className="flex justify-between w-full mb-4">
      {days.map((d) => {
        const isToday = d.toDateString() === now.toDateString()
        return (
          <div
            key={d.getDate()}
            className={[
              'flex flex-col items-center gap-1 w-11 py-2 rounded-2xl text-[12px] font-semibold',
              isToday ? 'text-cream border border-cream/15' : 'text-cream/35',
            ].join(' ')}
          >
            {names[d.getDay()]}
            <b className="text-[16px] font-bold">{d.getDate()}</b>
          </div>
        )
      })}
    </div>
  )
}

// ── line-art гора: визуальный знак Пути ──
function MountainArt() {
  return (
    <svg viewBox="0 0 200 110" fill="none" className="w-[190px] mx-auto mb-6 opacity-80">
      <path d="M10 96 L70 30 L104 62 L134 20 L190 96" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" className="text-cream/50" />
      <path d="M10 96 H190" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-cream/50" />
      <circle cx="104" cy="62" r="5" className="fill-gold" />
      <path d="M126 14 a8 8 0 1 1 16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cream/50" />
    </svg>
  )
}

// один следующий шаг по принципу One Next Action
function deriveNextAction({ rituals, ascezas }) {
  const undoneRituals = rituals.filter((r) => !r.today_level)
  if (undoneRituals.length > 0) {
    return { kind: 'ritual', title: undoneRituals[0].name, meta: 'ритуал', sub: 'rituals' }
  }
  const unmarkedAscezas = ascezas.filter((a) => !a.today_status)
  if (unmarkedAscezas.length > 0) {
    return { kind: 'asceza', title: unmarkedAscezas[0].name, meta: 'аскеза · отметься честно', sub: 'ascezas' }
  }
  return null
}

export default function Today({ user, onOpenPractice, onGoMentor }) {
  const [rituals, setRituals] = useState([])
  const [ascezas, setAscezas] = useState([])
  const [loading, setLoading] = useState(true)
  const [dailyQuote, setDailyQuote] = useState(null)
  const [checkin, setCheckin] = useState(null)
  const [sub, setSub] = useState(null) // null | 'path' | 'checkin'

  useEffect(() => {
    if (!user || sub !== null) return
    ;(async () => {
      try {
        const [r, a, q, c] = await Promise.all([
          api.rituals.list(user.id),
          api.ascezas.list(user.id),
          api.quotes.today(user.id),
          api.checkin.today(user.id).catch(() => null),
        ])
        setRituals(r)
        setAscezas(a)
        setDailyQuote(q.text)
        setCheckin(c)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, sub])

  // ── чек-ин поверх всего ──
  if (sub === 'checkin') {
    return <CheckIn user={user} onDone={() => setSub(null)} />
  }

  // ── Путь открывается прямо из «Сегодня» ──
  if (sub === 'path') {
    return (
      <div className="w-full flex flex-col items-center animate-fade-in">
        <div className="w-full max-w-md px-5 pb-2 flex items-center gap-3">
          <button
            onClick={() => { platform.haptic('light'); setSub(null) }}
            aria-label="Назад"
            className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
          >
            <ChevronLeft size={20} className="text-cream/60" />
          </button>
          <span className="font-display text-lg text-cream lowercase">путь.</span>
        </div>
        <Path user={user} />
      </div>
    )
  }

  if (loading) return <p className="text-cream/40 text-sm px-6 pt-8">Загрузка...</p>

  const total = rituals.length + ascezas.length
  const done =
    rituals.filter((r) => r.today_level).length +
    ascezas.filter((a) => a.today_status).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const next = deriveNextAction({ rituals, ascezas })
  const isEmpty = total === 0
  const hourNow = new Date().getHours()
  const checkinDone = !!checkin
  const checkinAsHero = !checkinDone && (hourNow >= 18 || (isEmpty && hourNow >= 12))
  const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']

  const remainRituals = rituals.filter((r) => !r.today_level).length
  const remainAscezas = ascezas.filter((a) => !a.today_status).length
  const remainAfter = Math.max(0, remainRituals + remainAscezas - 1)

  return (
    <div className="w-full max-w-md px-5 pb-40">
      <WeekStrip />

      {/* ── герой-карточка: One Next Action ── */}
      <div className="rounded-[32px] bg-gradient-to-b from-emerald to-emerald-light/60 px-6 py-10 text-center flex flex-col justify-center min-h-[54vh] animate-fade-in">
        <MountainArt />

        {checkinAsHero && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">Вечерний чек-ин</div>
            <h2 className="font-display text-[28px] text-cream leading-tight">Как прошёл день?</h2>
            <p className="text-[14px] text-cream/50 mt-2">Минута честности с собой</p>
            <button
              onClick={() => { platform.haptic('medium'); setSub('checkin') }}
              className="cta-pill text-[16px] px-11 py-4 mx-auto mt-7"
            >
              Начать
            </button>
            {next && (
              <p className="text-[12px] text-cream/35 mt-5">Дальше: {next.title}</p>
            )}
          </>
        )}

        {!checkinAsHero && isEmpty && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">Твой путь ждёт</div>
            <h2 className="font-display text-[26px] text-cream leading-tight">Добавь первый ритуал</h2>
            <p className="text-[14px] text-cream/50 mt-2">Система работает через регулярность — начни с одного</p>
            <button
              onClick={() => { platform.haptic('medium'); onOpenPractice('rituals') }}
              className="cta-pill text-[16px] px-11 py-4 mx-auto mt-7"
            >
              Начать
            </button>
          </>
        )}

        {!checkinAsHero && !isEmpty && next && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">Самое важное</div>
            <h2 className="font-display text-[28px] text-cream leading-tight">{next.title}</h2>
            <p className="text-[14px] text-cream/50 mt-2">{next.meta}</p>
            <button
              onClick={() => { platform.haptic('medium'); onOpenPractice(next.sub) }}
              className="cta-pill text-[16px] px-11 py-4 mx-auto mt-7"
            >
              Начать
            </button>
            <p className="text-[12px] text-cream/35 mt-5">
              {remainAfter > 0 ? `После этого останется: ${remainAfter}` : 'Это последнее на сегодня'}
            </p>
          </>
        )}

        {!checkinAsHero && !isEmpty && !next && (
          <>
            <div className="text-[13px] text-cream/40 font-semibold mb-2">Путь продолжается</div>
            <h2 className="font-display text-[26px] text-cream leading-tight">Сегодня ты выше, чем вчера</h2>
            <p className="text-[14px] text-cream/50 mt-2">Все практики закрыты</p>
            <button
              onClick={() => { platform.haptic('medium'); onGoMentor() }}
              className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
            >
              Поговорить с наставником
            </button>
          </>
        )}
      </div>

      {/* ── чек-ин: вторая карточка или итог ── */}
      {!checkinAsHero && !checkinDone && (
        <button
          onClick={() => { platform.haptic('light'); setSub('checkin') }}
          className="w-full rounded-3xl bg-emerald px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
        >
          <span className="w-9 h-9 rounded-full bg-gold/15 text-gold flex items-center justify-center text-lg shrink-0">☺</span>
          <span className="flex-1 text-left">
            <span className="block text-[14px] font-bold text-cream">Как ты?</span>
            <span className="block text-[12px] text-cream/40 font-medium">чек-ин дня · 1 минута</span>
          </span>
          <ChevronRight size={18} className="text-cream/30 shrink-0" />
        </button>
      )}
      {checkinDone && (
        <button
          onClick={() => { platform.haptic('light'); setSub('checkin') }}
          className="w-full rounded-3xl bg-emerald/60 px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
        >
          <span className="w-9 h-9 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-bold shrink-0">✓</span>
          <span className="flex-1 text-left">
            <span className="block text-[14px] font-bold text-cream">Чек-ин выполнен</span>
            <span className="block text-[12px] text-cream/40 font-medium">
              настроение: {MOOD_WORDS[(checkin.mood || 3) - 1]} · энергия {checkin.energy}/5
            </span>
          </span>
          <span className="text-[12px] font-semibold text-cream/35 shrink-0">изменить</span>
        </button>
      )}

      {/* ── карточка Пути: прогресс дня + вход в экран «Путь» ── */}
      {!isEmpty && (
        <button
          onClick={() => { platform.haptic('light'); setSub('path') }}
          className="w-full rounded-3xl bg-emerald px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
        >
          <ArrowUpRight size={18} className="text-gold shrink-0" strokeWidth={2} />
          <span className="text-[14px] font-bold text-cream whitespace-nowrap">Путь</span>
          <div className="flex-1 h-[5px] rounded-full bg-cream/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[13px] font-bold text-gold">{pct}%</span>
          <ChevronRight size={18} className="text-cream/30 shrink-0" />
        </button>
      )}

      {/* ── практики: горизонтальная лента (+ Фокус) ── */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="font-display text-[19px] text-cream">Практики</h3>
        <button
          onClick={() => onOpenPractice(null)}
          className="text-[13px] font-semibold text-cream/40 bg-transparent border-0"
        >
          Все
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { sub: 'rituals', icon: '✦', name: 'Ритуалы', st: `${rituals.filter((r) => r.today_level).length} / ${rituals.length || 0} сегодня` },
          { sub: 'ascezas', icon: '◈', name: 'Аскезы', st: `${ascezas.filter((a) => a.today_status === 'held').length} / ${ascezas.length || 0} держишь` },
          { sub: 'focus', icon: '◉', name: 'Фокус', st: 'глубокая работа' },
          { sub: 'brain', icon: '◎', name: 'Нейротренажёр', st: 'внимание · память' },
        ].map((c) => (
          <button
            key={c.sub}
            onClick={() => { platform.haptic('light'); onOpenPractice(c.sub) }}
            className="min-w-[142px] rounded-3xl bg-emerald p-5 flex flex-col items-center gap-3 text-center active:scale-[0.97] transition-transform border-0"
          >
            <span className="w-12 h-12 rounded-full bg-gold/15 text-gold text-xl flex items-center justify-center">
              {c.icon}
            </span>
            <span className="text-[14px] font-bold text-cream leading-tight">{c.name}</span>
            <span className="text-[11px] font-semibold text-cream/40">{c.st}</span>
          </button>
        ))}
      </div>

      {/* ── мысль дня ── */}
      {dailyQuote && (
        <div className="rounded-[28px] bg-emerald px-6 py-8 mt-4 text-center animate-fade-in">
          <div className="text-[12px] text-cream/40 font-semibold mb-3">Мысль дня</div>
          <p className="font-display text-[19px] text-cream leading-snug">{dailyQuote}</p>
        </div>
      )}
    </div>
  )
}
