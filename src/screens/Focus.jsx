import { useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Play, Pause, RotateCcw } from 'lucide-react'

const DURATIONS = [10, 25, 45]
const POINTS_PER_CONSTELLATION = 5

const CONSTELLATION_POINTS = [
  { x: 20, y: 75 },
  { x: 32, y: 30 },
  { x: 50, y: 55 },
  { x: 68, y: 30 },
  { x: 80, y: 75 },
]

function Constellation({ pointsUnlocked }) {
  const lit = CONSTELLATION_POINTS.slice(0, pointsUnlocked)

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Связи между зажжёнными точками — тонкая серая графика.
          Золото приберегается для одной смысловой точки (DESIGN_SYSTEM §5). */}
      {lit.slice(1).map((p, i) => {
        const prev = lit[i]
        return (
          <line
            key={`line-${i}`}
            x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
            stroke="rgb(var(--c-line-secondary))"
            strokeWidth="0.6"
          />
        )
      })}

      {/* Незажжённые точки видны с самого начала: иначе при нуле сессий
          экран показывает пустой квадрат вместо цели. */}
      {CONSTELLATION_POINTS.map((p, i) => {
        const isLit = i < pointsUnlocked
        const isLatest = i === pointsUnlocked - 1
        return (
          <circle
            key={`point-${i}`}
            cx={p.x} cy={p.y}
            r={isLatest ? 3 : 1.8}
            fill={
              isLatest
                ? 'rgb(var(--c-gold))'
                : isLit
                  ? 'rgb(var(--c-text))'
                  : 'rgb(var(--c-faint))'
            }
            className={isLatest ? 'animate-celebrate-pop' : ''}
          />
        )
      })}
    </svg>
  )
}

export default function Focus({ user }) {
  const [progress, setProgress] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1])
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS[1] * 60)

  // Момент окончания сессии, а не счётчик тиков: вебвью Telegram душит
  // таймеры в фоне, и setInterval отстаёт при блокировке экрана.
  const [endsAt, setEndsAt] = useState(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    api.focus.progress(user.id).then(setProgress).catch(console.error)
  }, [user])

  useEffect(() => {
    if (!endsAt) return
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    tick()
    // 250 мс, чтобы секунда не «залипала» после возврата из фона
    const id = setInterval(tick, 250)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [endsAt])

  // Завершение — отдельным эффектом, а не внутри апдейтера состояния:
  // в StrictMode апдейтер вызывается дважды и logSession уходил дублем.
  useEffect(() => {
    if (!endsAt || secondsLeft > 0 || finishedRef.current) return
    finishedRef.current = true
    finishSession()
  }, [secondsLeft, endsAt])

  function selectDuration(min) {
    if (running) return
    setSelectedDuration(min)
    setSecondsLeft(min * 60)
  }

  function toggleRun() {
    platform.haptic('light')
    if (running) {
      setRunning(false)
      setEndsAt(null)
      return
    }
    finishedRef.current = false
    setEndsAt(Date.now() + secondsLeft * 1000)
    setRunning(true)
  }

  function reset() {
    platform.haptic('light')
    finishedRef.current = false
    setRunning(false)
    setEndsAt(null)
    setSecondsLeft(selectedDuration * 60)
  }

  async function finishSession() {
    setRunning(false)
    setEndsAt(null)
    platform.haptic('success')
    try {
      const updated = await api.focus.logSession(user.id, selectedDuration)
      setProgress(updated)
    } catch (e) {
      console.error(e)
    }
    setSecondsLeft(selectedDuration * 60)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const pointsUnlocked = progress ? progress.points_unlocked : 0

  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center">
      <div className="w-48 h-48 mb-6">
        <Constellation pointsUnlocked={pointsUnlocked} />
      </div>

      {/* Пока прогресс не загружен — пусто, а не «0/5»: подставная цифра
          меняется на глазах и читается как сбой. Высота держится, чтобы
          макет не дёргался. */}
      <p className="text-xs text-muted mb-8 text-center min-h-[1rem]">
        {progress
          ? `Созвездие №${progress.constellation_index + 1} — ${progress.points_unlocked}/${POINTS_PER_CONSTELLATION} сессий`
          : ''}
      </p>

      <div className="font-display text-5xl text-cream mb-6 tabular-nums">
        {mm}:{ss}
      </div>

      <div className="flex gap-2 mb-8">
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => selectDuration(d)}
            disabled={running}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedDuration === d
                ? 'bg-gold text-emerald-deep'
                : `bg-emerald-light/20 text-muted ${running ? 'opacity-40' : ''}`
            }`}
          >
            {d} мин
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="w-12 h-12 rounded-full bg-emerald-light/20 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Сбросить"
        >
          <RotateCcw size={18} className="text-muted" />
        </button>
        <button
          onClick={toggleRun}
          className="w-16 h-16 rounded-full bg-gold flex items-center justify-center active:scale-90 transition-transform"
          aria-label={running ? 'Пауза' : 'Начать'}
        >
          {running ? (
            <Pause size={26} className="text-emerald-deep" />
          ) : (
            <Play size={26} className="text-emerald-deep ml-1" />
          )}
        </button>
        <div className="w-12 h-12" />
      </div>
    </div>
  )
}
