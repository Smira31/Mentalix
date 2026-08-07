import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { MotifArt } from '../components/Motif'
import BackButton from '../components/BackButton'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
} from '../lib/fullscreenSurface'

// ── Дыхание: анимированный круг, техника 4-7-8, как breathing. у stoic. ──
// Вдох 4с (круг растёт) → задержка 7с (держится) → выдох 8с (сжимается)

const PHASES = [
  { key: 'inhale', label: 'Вдох', secs: 4, scale: 1 },
  { key: 'hold', label: 'Задержи', secs: 7, scale: 1 },
  { key: 'exhale', label: 'Выдох', secs: 8, scale: 0.55 },
]


/*
 * Полноэкранная часть вынесена в отдельный компонент намеренно.
 * `useFullscreenSurface` при монтировании блокирует скролл body,
 * а экран дыхания начинается с обычной страницы выбора
 * длительности — там блокировать нечего. Хук нельзя вызвать
 * условно, поэтому условным становится сам компонент.
 */
function FullscreenStage({ className = '', children }) {
  const { style } = useFullscreenSurface()

  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} ${className}`} style={style}>
      {children}
    </div>,
    document.body,
  )
}

const DURATIONS = [
  { label: '1 мин', secs: 60 },
  { label: '2 мин', secs: 120 },
  { label: '4 мин', secs: 240 },
]

const PREPARE_SECONDS = 3
const PHASE_ENDS = PHASES.reduce((acc, p) => {
  acc.push((acc[acc.length - 1] || 0) + p.secs)
  return acc
}, [])
const CYCLE_SECONDS = PHASE_ENDS[PHASE_ENDS.length - 1]

export default function Breathing({ onBack }) {
  const [stage, setStage] = useState('intro') // intro | prepare | run | done
  const [duration, setDuration] = useState(DURATIONS[0].secs)
  const [elapsed, setElapsed] = useState(0)
  const finishedRef = useRef(false)
  const phaseRef = useRef(-1)

  /*
   * Одни часы на весь сеанс вместо цепочки setTimeout по фазам:
   * цепочка накапливала ошибку и разъезжалась в фоне. Фаза и цикл
   * теперь вычисляются из прошедшего времени, а не хранятся.
   *
   * Пока экран скрыт, время СТОИТ. Дыхание — участие, а не ожидание:
   * заблокированный телефон не должен засчитывать сеанс.
   */
  const active = stage === 'prepare' || stage === 'run'

  useEffect(() => {
    if (!active) return

    const accumulated = { seconds: 0 }
    let last = Date.now()

    const tick = () => {
      const now = Date.now()
      if (document.visibilityState === 'visible') {
        accumulated.seconds += (now - last) / 1000
      }
      last = now
      setElapsed(accumulated.seconds)
    }

    const id = setInterval(tick, 200)
    const onVisible = () => {
      last = Date.now()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active])

  const intoSession = Math.max(0, elapsed - PREPARE_SECONDS)
  const intoCycle = intoSession % CYCLE_SECONDS
  const phaseIdx = PHASE_ENDS.findIndex((end) => intoCycle < end)

  // Переход в дыхание и вибрация на смене фазы — эффектами, а не
  // изнутри апдейтера состояния: в StrictMode он вызывается дважды.
  useEffect(() => {
    if (stage === 'prepare' && elapsed >= PREPARE_SECONDS) setStage('run')
  }, [stage, elapsed])

  useEffect(() => {
    if (stage !== 'run' || phaseRef.current === phaseIdx) return
    phaseRef.current = phaseIdx
    platform.haptic('light')
  }, [stage, phaseIdx])

  useEffect(() => {
    if (stage !== 'run' || intoSession < duration || finishedRef.current) return
    finishedRef.current = true
    platform.haptic('success')
    setStage('done')
  }, [stage, intoSession, duration])

  function start() {
    platform.haptic('medium')
    finishedRef.current = false
    phaseRef.current = -1
    setElapsed(0)
    setStage('prepare')
  }

  function finish() {
    finishedRef.current = true
    platform.haptic('success')
    setStage('done')
  }

  const phase = PHASES[phaseIdx]
  const progress = stage === 'run' ? Math.min(100, (intoSession / duration) * 100) : 0

  // ── выбор длительности ──
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-md px-5 flex flex-col items-center animate-fade-in">
        <div className="w-full flex items-center gap-3 pb-6">
          <BackButton onClick={onBack} />
          <span className="font-display text-lg text-cream lowercase">дыхание.</span>
        </div>

        <svg viewBox="0 0 100 100" className="w-28 h-28 mb-6 opacity-70">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
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
                duration === d.secs ? 'bg-cream/10 text-cream' : 'bg-emerald text-muted',
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
      <FullscreenStage className="items-center justify-center px-8 text-center">
        <MotifArt name="fizio" size={140} className="mb-6" />
        <h2 className="font-display text-[26px] text-cream leading-tight">Система спокойнее</h2>
        <p className="text-[15px] text-cream/50 mt-3">Возвращайся к этому кругу, когда штормит.</p>
        <button
          onClick={() => { platform.haptic('light'); onBack() }}
          className="cta-pill text-[16px] px-12 py-4 mt-10"
        >
          Готово
        </button>
      </FullscreenStage>
    )
  }

  // ── подготовка и дыхание ──
  const isPrepare = stage === 'prepare'
  return (
    <FullscreenStage>
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

      <div className="flex justify-center shrink-0 pb-7">
        <button
          onClick={finish}
          className="px-7 py-3 rounded-full bg-emerald text-cream/60 text-[14px] font-bold border-0 active:scale-95 transition-transform"
        >
          Завершить раньше
        </button>
      </div>
    </FullscreenStage>
  )
}
