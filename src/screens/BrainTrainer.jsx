import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { ArrowLeft, Brain, Zap, Shuffle, Wind, Check } from 'lucide-react'

function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}

const EXERCISES = [
  { key: 'attention', title: 'Внимание', subtitle: 'Струп-тест', icon: Brain, accent: 'gold' },
  { key: 'memory', title: 'Память', subtitle: 'последовательности', icon: Shuffle, accent: 'mint' },
  { key: 'reaction', title: 'Реакция', subtitle: 'на время', icon: Zap, accent: 'cognac' },
  { key: 'plasticity', title: 'Нейропластичность', subtitle: 'переключение', icon: Shuffle, accent: 'gold' },
  { key: 'gymnastics', title: 'Гимнастика для мозга', subtitle: 'дыхание', icon: Wind, accent: 'mint' },
]

const TONE = {
  gold: { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/30' },
  mint: { bg: 'bg-mint/20', text: 'text-mint', border: 'border-mint/30' },
  cognac: { bg: 'bg-cognac/20', text: 'text-cognac', border: 'border-cognac/30' },
}

function ScoreScreen({ label, score, sub, onDone }) {
  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-10">
      <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
        <Check size={28} className="text-gold" />
      </div>
      <h2 className="font-display text-xl text-cream mb-1">{label}</h2>
      <p className="text-sm text-cream/50 mb-6">{sub}</p>
      <div className="font-display text-4xl text-gold mb-8">{score}</div>
      <button
        onClick={onDone}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium active:scale-95 transition-transform"
      >
        Готово
      </button>
    </div>
  )
}

// ---------- 1. Внимание — Струп-тест ----------
const COLORS = [
  { name: 'Красный', hex: '#E85C5C' },
  { name: 'Зелёный', hex: '#5CE87A' },
  { name: 'Синий', hex: '#5C8FE8' },
  { name: 'Жёлтый', hex: '#E8D65C' },
]
const TOTAL_ROUNDS_ATTENTION = 10

function AttentionGame({ onFinish }) {
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [word, setWord] = useState(null)
  const [colorHex, setColorHex] = useState(null)
  const [isMatch, setIsMatch] = useState(false)

  function makeRound() {
    const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)]
    const match = Math.random() < 0.5
    const displayColor = match
      ? wordColor
      : COLORS.filter((c) => c.name !== wordColor.name)[Math.floor(Math.random() * 3)]
    setWord(wordColor.name)
    setColorHex(displayColor.hex)
    setIsMatch(match)
  }

  useEffect(() => { makeRound() }, [])

  function answer(userSaysMatch) {
    haptic('light')
    const wasCorrect = userSaysMatch === isMatch
    const newCorrect = correct + (wasCorrect ? 1 : 0)
    const next = round + 1
    if (next >= TOTAL_ROUNDS_ATTENTION) {
      onFinish(newCorrect)
    } else {
      setCorrect(newCorrect)
      setRound(next)
      makeRound()
    }
  }

  if (!word) return null

  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-10">
      <p className="text-xs text-cream/40 mb-8">{round + 1} / {TOTAL_ROUNDS_ATTENTION} · Слово и цвет совпадают?</p>
      <div className="font-display text-4xl mb-12" style={{ color: colorHex }}>{word}</div>
      <div className="flex gap-4 w-full">
        <button
          onClick={() => answer(true)}
          className="flex-1 py-4 rounded-2xl bg-mint/20 text-mint text-sm font-medium active:scale-95 transition-transform"
        >
          Да
        </button>
        <button
          onClick={() => answer(false)}
          className="flex-1 py-4 rounded-2xl bg-cognac/20 text-cognac text-sm font-medium active:scale-95 transition-transform"
        >
          Нет
        </button>
      </div>
    </div>
  )
}

// ---------- 2. Память — последовательности ----------
const TILE_COLORS = ['#B8952E', '#96CDB0', '#C18D52', '#5A8F76']
const MEMORY_ROUNDS = 4 // после 4-го успешного уровня — завершение

function MemoryGame({ onFinish }) {
  const [level, setLevel] = useState(1)
  const [sequence, setSequence] = useState([])
  const [userInput, setUserInput] = useState([])
  const [showing, setShowing] = useState(true)
  const [activeTile, setActiveTile] = useState(null)

  useEffect(() => {
    const seq = Array.from({ length: level + 2 }, () => Math.floor(Math.random() * 4))
    setSequence(seq)
    setUserInput([])
    setShowing(true)
    playSequence(seq)
  }, [level])

  function playSequence(seq) {
    seq.forEach((tile, i) => {
      setTimeout(() => setActiveTile(tile), i * 700)
      setTimeout(() => setActiveTile(null), i * 700 + 400)
    })
    setTimeout(() => setShowing(false), seq.length * 700)
  }

  function tapTile(i) {
    if (showing) return
    haptic('light')
    const idx = userInput.length
    const next = [...userInput, i]
    setUserInput(next)

    if (sequence[idx] !== i) {
      haptic('error')
      onFinish(level - 1)
      return
    }
    if (next.length === sequence.length) {
      if (level >= MEMORY_ROUNDS) {
        onFinish(level)
      } else {
        setTimeout(() => setLevel((l) => l + 1), 500)
      }
    }
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-10">
      <p className="text-xs text-cream/40 mb-8">
        {showing ? 'Запоминай порядок...' : 'Повтори последовательность'} · Уровень {level}/{MEMORY_ROUNDS}
      </p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-[240px]">
        {TILE_COLORS.map((color, i) => (
          <button
            key={i}
            onClick={() => tapTile(i)}
            disabled={showing}
            className="aspect-square rounded-3xl transition-all duration-150"
            style={{
              backgroundColor: color,
              opacity: activeTile === i ? 1 : 0.35,
              transform: activeTile === i ? 'scale(0.92)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- 3. Реакция ----------
const REACTION_ROUNDS = 5

function ReactionGame({ onFinish }) {
  const [phase, setPhase] = useState('waiting') // waiting | ready | tooSoon
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState([])
  const [attemptKey, setAttemptKey] = useState(0)
  const startRef = useRef(0)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (round >= REACTION_ROUNDS) {
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 1000
      onFinish(Math.max(0, Math.round(2000 - avg)))
      return
    }
    setPhase('waiting')
    const delay = 1000 + Math.random() * 1800
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now()
      setPhase('ready')
    }, delay)
    return () => clearTimeout(timeoutRef.current)
  }, [round, attemptKey])

  function tap() {
    if (phase === 'waiting') {
      clearTimeout(timeoutRef.current)
      haptic('light')
      setPhase('tooSoon')
      setTimeout(() => setAttemptKey((k) => k + 1), 900)
      return
    }
    if (phase === 'ready') {
      haptic('success')
      const ms = Date.now() - startRef.current
      setTimes((t) => [...t, ms])
      setRound((r) => r + 1)
    }
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-10">
      <p className="text-xs text-cream/40 mb-6">Раунд {Math.min(round + 1, REACTION_ROUNDS)} / {REACTION_ROUNDS}</p>
      <button
        onClick={tap}
        className="w-full aspect-square rounded-[32px] flex items-center justify-center transition-colors"
        style={{
          backgroundColor: phase === 'ready' ? '#B8952E' : phase === 'tooSoon' ? 'rgba(232,92,92,0.25)' : 'rgba(150,205,176,0.12)',
        }}
      >
        <span className="text-center text-cream/80 text-sm px-8">
          {phase === 'waiting' && 'Жди золотого сигнала...'}
          {phase === 'ready' && 'Тапни сейчас!'}
          {phase === 'tooSoon' && 'Рано! Сейчас повторим'}
        </span>
      </button>
    </div>
  )
}

// ---------- 4. Нейропластичность — слово наоборот ----------
const PLASTICITY_WORDS = ['ФОКУС', 'ПРИВЫЧКА', 'СЕРИЯ', 'РИТУАЛ', 'СИСТЕМА']

function PlasticityGame({ onFinish }) {
  const [round, setRound] = useState(0)
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const word = PLASTICITY_WORDS[round]
  const reversed = word.split('').reverse().join('')

  function submit() {
    haptic('light')
    const isRight = input.trim().toUpperCase() === reversed
    const newCorrect = correct + (isRight ? 1 : 0)
    const next = round + 1
    if (next >= PLASTICITY_WORDS.length) {
      onFinish(newCorrect)
    } else {
      setCorrect(newCorrect)
      setRound(next)
      setInput('')
    }
  }

  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-10">
      <p className="text-xs text-cream/40 mb-6">{round + 1} / {PLASTICITY_WORDS.length} · Напиши слово наоборот</p>
      <div className="font-display text-3xl text-cream mb-8 tracking-widest">{word}</div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
        className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-center text-lg text-cream outline-none focus:border-gold transition-colors mb-4 uppercase"
      />
      <button
        onClick={submit}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep text-sm font-medium active:scale-95 transition-transform"
      >
        Ответить
      </button>
    </div>
  )
}

// ---------- 5. Гимнастика — коробочное дыхание ----------
const BREATH_PHASES = [
  { label: 'Вдох', duration: 4 },
  { label: 'Задержка', duration: 4 },
  { label: 'Выдох', duration: 4 },
  { label: 'Задержка', duration: 4 },
]
const BREATH_CYCLES = 3

function GymnasticsGame({ onFinish }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(BREATH_PHASES[0].duration)
  const finishedRef = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          const nextPhase = (phaseIndex + 1) % BREATH_PHASES.length
          if (nextPhase === 0) {
            const nextCycle = cycle + 1
            if (nextCycle >= BREATH_CYCLES) {
              if (!finishedRef.current) {
                finishedRef.current = true
                clearInterval(timer)
                onFinish(1)
              }
              return 0
            }
            setCycle(nextCycle)
          }
          setPhaseIndex(nextPhase)
          return BREATH_PHASES[nextPhase].duration
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phaseIndex, cycle])

  const phase = BREATH_PHASES[phaseIndex]
  const isExpand = phase.label === 'Вдох'
  const isContract = phase.label === 'Выдох'

  return (
    <div className="w-full max-w-sm px-6 pb-10 flex flex-col items-center pt-10">
      <p className="text-xs text-cream/40 mb-8">Цикл {cycle + 1} / {BREATH_CYCLES}</p>
      <div
        className="rounded-full bg-mint/20 border-2 border-mint/50 flex items-center justify-center transition-all ease-linear"
        style={{
          width: isExpand ? 220 : isContract ? 120 : 170,
          height: isExpand ? 220 : isContract ? 120 : 170,
          transitionDuration: '1000ms',
        }}
      >
        <div className="text-center">
          <div className="font-display text-2xl text-cream">{phase.label}</div>
          <div className="text-mint text-sm mt-1">{secondsLeft}</div>
        </div>
      </div>
    </div>
  )
}

// ---------- Основной экран ----------
export default function BrainTrainer({ user, onBack }) {
  const [summary, setSummary] = useState(null)
  const [active, setActive] = useState(null)
  const [result, setResult] = useState(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (!user) return
    loadSummary()
  }, [user])

  async function loadSummary() {
    try {
      const s = await api.brain.summary(user.id)
      setSummary(s)
    } catch (e) {
      console.error(e)
    }
  }

  function start(key) {
    haptic('light')
    startTimeRef.current = Date.now()
    setActive(key)
    setResult(null)
  }

  async function finish(score) {
    const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    haptic('success')
    const finishedKey = active
    try {
      await api.brain.logSession(user.id, finishedKey, score, duration)
    } catch (e) {
      console.error(e)
    }
    setResult({ key: finishedKey, score })
    setActive(null)
    loadSummary()
  }

  if (active === 'attention') return <AttentionGame onFinish={finish} />
  if (active === 'memory') return <MemoryGame onFinish={finish} />
  if (active === 'reaction') return <ReactionGame onFinish={finish} />
  if (active === 'plasticity') return <PlasticityGame onFinish={finish} />
  if (active === 'gymnastics') return <GymnasticsGame onFinish={finish} />

  if (result) {
    const ex = EXERCISES.find((e) => e.key === result.key)
    return (
      <ScoreScreen
        label={ex.title}
        sub="Сессия завершена"
        score={result.score}
        onDone={() => setResult(null)}
      />
    )
  }

  const todayCompleted = summary?.today_completed ?? []

  return (
    <div className="w-full max-w-sm px-6 pb-24">
      <div className="w-full flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-cream/60 active:opacity-60">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-display text-lg text-cream/90">Нейротренажёр</h2>
      </div>

      {EXERCISES.map((ex) => {
        const tone = TONE[ex.accent]
        const doneToday = todayCompleted.includes(ex.key)
        const best = summary?.per_type?.[ex.key]?.best_score
        return (
          <button
            key={ex.key}
            onClick={() => start(ex.key)}
            className={`w-full rounded-[24px] border ${tone.border} bg-emerald-light/10 p-4 mb-3 flex items-center gap-3 transition-transform active:scale-[0.98]`}
          >
            <div className={`w-11 h-11 rounded-2xl ${tone.bg} flex items-center justify-center shrink-0`}>
              <ex.icon size={22} className={tone.text} strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-display text-base text-cream">{ex.title}</div>
              <div className="text-xs text-cream/50">{ex.subtitle}</div>
            </div>
            {doneToday && (
              <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <Check size={14} className="text-gold" />
              </span>
            )}
            {best !== undefined && best > 0 && (
              <span className="font-mono text-xs text-cream/40 shrink-0">{best}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}