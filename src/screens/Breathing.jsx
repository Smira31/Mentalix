import { useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { ChevronLeft } from 'lucide-react'

// ── Дыхание: анимированный круг, техника 4-7-8, как breathing. у stoic. ──
// Вдох 4с (круг растёт) → задержка 7с (держится) → выдох 8с (сжимается)

const PHASES = [
  { key: 'inhale', label: 'Вдох', secs: 4, scale: 1 },
  { key: 'hold', label: 'Задержи', secs: 7, scale: 1 },
  { key: 'exhale', label: 'Выдох', secs: 8, scale: 0.55 },
]
const CYCLE = PHASES.reduce((s, p) => s + p.secs, 0) // 19с

const DURATIONS = [
  { label: '1 мин', secs: 60 },
  { label: '2 мин', secs: 120 },
  { label: '4 мин', secs: 240 },
]

export default function Breathing({ user, onBack }) {
  const [stage, setStage] = useState('intro') // intro | prepare | run | done
  const [duration, setDuration] = useState(DURATIONS[0].secs)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timers = useRef([])

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  function start() {
    platform.haptic('medium')
    setStage('prepare')
    setElapsed(0)
    timers.current.push(setTimeout(runCycle, 3000))
    // секундомер
    const tick = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= duration + 3) {
          clearInterval(tick)
        }
        return e + 1
      })
    }, 1000)
    timers.current.push(tick)
  }

  function runCycle() {
    setStage('run')
    let idx = 0
    setPhaseIdx(0)
    platform.haptic('light')
    function nextPhase() {
      idx = (idx + 1) % PHASES.length
      setPhaseIdx(idx)
      platform.haptic('light')
      timers.current.push(setTimeout(nextPhase, PHASES[idx].secs * 1000))
    }
    timers.current.push(setTimeout(nextPhase, PHASES[0].secs * 1000))
  }

  function finish() {
    clearTimers()
    platform.haptic('success')
    setStage('done')
  }

  // автозавершение по времени
  useEffect(() => {
    if (stage === 'run' && elapsed >= duration + 3) finish()
  }, [elapsed, stage, duration])

  const phase = PHASES[phaseIdx]
  const progress = stage === 'run' ? Math.min(100, ((elapsed - 3) / duration) * 100) : 0

  // ── выбор длительности ──
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-md px-5 pb-40 flex flex-col items-center animate-fade-in">
        <div className="w-full flex items-center gap-3 pb-6">
          <button
            onClick={() => { platform.haptic('light'); onBack() }}
            aria-label="Назад"
            className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
          >
            <ChevronLeft size={20} className="text-cream/60" />
          </button>
          <span className="font-display text-lg text-cream lowercase">дыхание.</span>
        </div>

        <svg viewBox="0 0 100 100" className="w-28 h-28 mb-6 opacity-70">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" />
        </svg>

        <h2 className="font-display text-[24px] text-cream text-center leading-tight">
          Успокоить систему
        </h2>
        <p className="text-[14px] text-cream/50 text-center mt-3 leading-relaxed max-w-xs">
          Техника 4-7-8: вдох носом на 4, задержка на 7, длинный выдох на 8.
          Несколько циклов — и шум в голове тише.
        </p>

        <div className="flex gap-2 mt-8">
          {DURATIONS.map((d) => (
            <button
              key={d.secs}
              onClick={() => { platform.haptic('light'); setDuration(d.secs) }}
              className={[
                'px-6 py-3 rounded-full text-[14px] font-bold border-0 transition-colors',
                duration === d.secs ? 'bg-cream/10 text-cream' : 'bg-emerald text-cream/40',
              ].join(' ')}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button onClick={start} className="cta-pill text-[16px] px-12 py-4 mt-8">
          Начать дыхание
        </button>
      </div>
    )
  }

  // ── завершение ──
  if (stage === 'done') {
    return (
      <div className="fixed inset-0 z-[60] bg-emerald-deep flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gold/15 flex items-center justify-center text-gold text-3xl mb-8 animate-celebrate-pop">
          ✓
        </div>
        <h2 className="font-display text-[26px] text-cream leading-tight">Система спокойнее</h2>
        <p className="text-[15px] text-cream/50 mt-3">Возвращайся к этому кругу, когда штормит.</p>
        <button
          onClick={() => { platform.haptic('light'); onBack() }}
          className="cta-pill text-[16px] px-12 py-4 mt-10"
        >
          Готово
        </button>
      </div>
    )
  }

  // ── подготовка и дыхание ──
  const isPrepare = stage === 'prepare'
  return (
    <div className="fixed inset-0 z-[60] bg-emerald-deep flex flex-col animate-fade-in">
      {/* прогресс */}
      <div className="h-[3px] bg-cream/10">
        <div className="h-full bg-gold transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div
          className="w-44 h-44 rounded-full border-2 border-cream/50 transition-transform ease-in-out"
          style={{
            transform: `scale(${isPrepare ? 0.55 : phase.scale})`,
            transitionDuration: isPrepare ? '600ms' : `${phase.secs * 1000}ms`,
            boxShadow: '0 0 60px rgba(217,180,91,0.08)',
          }}
        />
        <h2 className="font-display text-[24px] text-cream mt-14">
          {isPrepare ? 'Устройся удобно' : phase.label}
        </h2>
        <p className="text-[14px] text-cream/45 mt-2 text-center">
          {isPrepare ? 'Сядь или ляг так, чтобы дышалось свободно' : `${phase.secs} секунд`}
        </p>
      </div>

      <div className="flex justify-center pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <button
          onClick={finish}
          className="px-7 py-3 rounded-full bg-emerald text-cream/60 text-[14px] font-bold border-0 active:scale-95 transition-transform"
        >
          Завершить раньше
        </button>
      </div>
    </div>
  )
}
