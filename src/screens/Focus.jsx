import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
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

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

function Constellation({ pointsUnlocked }) {
  const visible = CONSTELLATION_POINTS.slice(0, pointsUnlocked)
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {visible.slice(1).map((p, i) => {
        const prev = visible[i]
        return (
          <line
            key={i}
            x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
            stroke="#B8952E"
            strokeWidth="0.6"
            strokeOpacity="0.6"
          />
        )
      })}
      {visible.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r={i === visible.length - 1 ? 3 : 1.8}
          fill={i === visible.length - 1 ? '#B8952E' : '#F3E9DD'}
          className={i === visible.length - 1 ? 'animate-celebrate-pop' : ''}
        />
      ))}
    </svg>
  )
}

export default function Focus({ user }) {
  const [progress, setProgress] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1])
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS[1] * 60)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!user) return
    api.focus.progress(user.id).then(setProgress).catch(console.error)
  }, [user])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          finishSession()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  function selectDuration(min) {
    if (running) return
    setSelectedDuration(min)
    setSecondsLeft(min * 60)
  }

  function toggleRun() {
    haptic('light')
    setRunning((r) => !r)
  }

  function reset() {
    haptic('light')
    setRunning(false)
    setSecondsLeft(selectedDuration * 60)
  }

  async function finishSession() {
    setRunning(false)
    haptic('success')
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
  const constellationIndex = progress ? progress.constellation_index : 0

  return (
    <div className="w-full max-w-sm px-6 pb-24 flex flex-col items-center">
      <h2 className="font-display text-lg mb-6 text-cream/90 self-start">Фокус</h2>

      <div className="w-48 h-48 mb-6">
        <Constellation pointsUnlocked={pointsUnlocked} />
      </div>

      <p className="text-xs text-sage/60 mb-8 text-center">
        Созвездие №{constellationIndex + 1} — {pointsUnlocked}/{POINTS_PER_CONSTELLATION} сессий
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
            className={`px-4 py-2 rounded-full text-sm transition-colors disabled:opacity-40 ${
              selectedDuration === d ? 'bg-gold text-emerald-deep' : 'bg-emerald-light/20 text-cream/60'
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
          <RotateCcw size={18} className="text-cream/60" />
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