import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { api } from '../lib/api'
import { TickGauge } from './Path'

/*
 * MXL-YEAR-PATH-001 — «Год пути».
 *
 * Ридж-график по образцу WireframeMountain (Path.jsx): волнистая
 * полилиния, filter glow. Но данные здесь настоящие, не декоративные —
 * поэтому визуальный язык другой, а не просто перекраска: одна линия
 * вместо пяти декоративных рядов, currentColor вместо сплошного gold
 * (правило Motif.jsx — линии наследуют системную палитру через
 * прозрачность, золото не заливает рисунок, а отмечает одну точку),
 * заливка-силуэт под линией, толще штрих. Единственный золотой акцент —
 * точка на лучшей неделе периода (не «сейчас», см. TASKS.md).
 */

const WEEK_SIZE = 7
const MIN_ACTIVE_DAYS = 3

const RIDGE_WIDTH = 400
const RIDGE_HEIGHT = 120
const RIDGE_TOP = 14
const RIDGE_BASELINE = 104

function bucketByWeek(days) {
  const buckets = []
  for (let i = 0; i < days.length; i += WEEK_SIZE) {
    const slice = days.slice(i, i + WEEK_SIZE)
    const value = slice.reduce((sum, d) => sum + d.count + d.held_ascezas, 0)
    buckets.push(value)
  }
  return buckets
}

function YearRidge({ values }) {
  const max = Math.max(1, ...values)
  const n = values.length

  const points = values.map((v, i) => {
    const x = n > 1 ? (i / (n - 1)) * RIDGE_WIDTH : RIDGE_WIDTH / 2
    const y = RIDGE_BASELINE - (v / max) * (RIDGE_BASELINE - RIDGE_TOP)
    return [x, y]
  })

  const linePoints = points.map(([x, y]) => `${x},${y}`).join(' ')
  const areaPoints = `0,${RIDGE_BASELINE} ${linePoints} ${RIDGE_WIDTH},${RIDGE_BASELINE}`

  const peakIndex = values.reduce((best, v, i) => (v > values[best] ? i : best), 0)
  const [peakX, peakY] = points[peakIndex]

  return (
    <svg
      viewBox={`0 0 ${RIDGE_WIDTH} ${RIDGE_HEIGHT}`}
      className="w-full h-[100px] text-cream/70"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="year-ridge-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <polygon points={areaPoints} fill="currentColor" fillOpacity="0.08" stroke="none" />

      <polyline
        points={linePoints}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {values[peakIndex] > 0 && (
        <circle
          cx={peakX}
          cy={peakY}
          r={3.5}
          fill="rgb(var(--c-gold))"
          filter="url(#year-ridge-glow)"
        />
      )}
    </svg>
  )
}

function YearPathEmpty() {
  return (
    <div className="rounded-[28px] bg-emerald-deep border border-cream/10 px-6 py-8 text-center mb-5">
      <div className="w-12 h-12 rounded-2xl bg-emerald-light/30 flex items-center justify-center mx-auto mb-3">
        <TrendingUp size={22} className="text-gold" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg text-cream mb-1">Пока рано подводить итоги</h3>
      <p className="font-body text-sm text-muted leading-relaxed">
        График появится, когда наберётся несколько дней практики
      </p>
    </div>
  )
}

export default function YearPath({ user }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.analytics
      .get(user.id, 365)
      .then(setAnalytics)
      .catch((e) => {
        console.error(e)
        setAnalytics(null)
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return null

  const daily = analytics?.daily_activity || []

  const firstActiveIndex = daily.findIndex((d) => d.count + d.held_ascezas > 0)

  if (firstActiveIndex === -1) return <YearPathEmpty />

  // Считаем «путь» с первого реального дня практики, а не за весь
  // 365-дневный запрошенный период — иначе новый аккаунт видел бы
  // заведомо низкий процент из-за дней до своего появления.
  const relevant = daily.slice(firstActiveIndex)
  const activeDaysCount = relevant.filter((d) => d.count + d.held_ascezas > 0).length

  if (activeDaysCount < MIN_ACTIVE_DAYS) return <YearPathEmpty />

  const percent = Math.round((activeDaysCount / relevant.length) * 100)
  const weeklyBuckets = bucketByWeek(relevant)

  return (
    <div className="rounded-[28px] bg-emerald-deep border border-cream/10 overflow-hidden mb-5">
      <div className="text-[13px] text-muted font-semibold text-center pt-5">Мой путь</div>
      <p className="text-[12px] text-faint text-center mt-1">История регулярности и движения</p>

      <div className="flex justify-center pt-2 pb-6">
        <TickGauge value={percent} max={100} sublabel="дней с практикой" size={104} />
      </div>

      <div className="px-6 pb-1 text-center text-[12px] text-muted">
        {activeDaysCount} активных {activeDaysCount === 1 ? 'день' : activeDaysCount < 5 ? 'дня' : 'дней'} в периоде
      </div>
      <div className="mt-2">
        <YearRidge values={weeklyBuckets} />
      </div>
    </div>
  )
}
