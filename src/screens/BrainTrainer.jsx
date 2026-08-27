import { useEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Check } from 'lucide-react'
import BackButton from '../components/BackButton'
import SemanticGlyph from '../components/SemanticGlyph'

const EXERCISES = [
  { key: 'attention', title: 'Внимание', subtitle: 'Струп-тест', kind: 'brain-attention' },
  { key: 'memory', title: 'Память', subtitle: 'последовательности', kind: 'brain-memory' },
  { key: 'reaction', title: 'Реакция', subtitle: 'на время', kind: 'brain-reaction' },
  {
    key: 'plasticity',
    title: 'Нейропластичность',
    subtitle: 'переключение',
    kind: 'brain-plasticity',
  },
  {
    key: 'gymnastics',
    title: 'Гимнастика для мозга',
    subtitle: 'дыхание',
    kind: 'brain-gymnastics',
  },
]

function ScoreScreen({ label, score, sub, onDone }) {
  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center pt-6">
      <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
        <Check size={28} className="text-gold" />
      </div>
      <h2 className="font-display mx-type-section text-cream mb-1">{label}</h2>
      <p className="text-[13px] text-muted mb-6">{sub}</p>
      <div className="font-display text-4xl text-gold mb-8">{score}</div>
      <button
        onClick={onDone}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep mx-type-flow-action active:scale-95 transition-transform"
      >
        Готово
      </button>
    </div>
  )
}

function ActiveGameFrame({ onExit, children }) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md px-5">
        <BackButton onClick={onExit} label="Практики" />
      </div>

      {children}
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

function randomAttentionRound() {
  const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)]
  const match = Math.random() < 0.5
  const displayColor = match
    ? wordColor
    : COLORS.filter(c => c.name !== wordColor.name)[Math.floor(Math.random() * 3)]
  return { word: wordColor.name, colorHex: displayColor.hex, isMatch: match }
}

function AttentionGame({ onFinish }) {
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [current, setCurrent] = useState(randomAttentionRound)
  const { word, colorHex, isMatch } = current

  function answer(userSaysMatch) {
    platform.haptic('light')
    const wasCorrect = userSaysMatch === isMatch
    const newCorrect = correct + (wasCorrect ? 1 : 0)
    const next = round + 1
    if (next >= TOTAL_ROUNDS_ATTENTION) {
      onFinish(newCorrect)
    } else {
      setCorrect(newCorrect)
      setRound(next)
      setCurrent(randomAttentionRound())
    }
  }

  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center pt-6">
      <p className="text-xs text-muted mb-8">
        {round + 1} / {TOTAL_ROUNDS_ATTENTION} · Слово и цвет совпадают?
      </p>
      <div className="font-display text-4xl mb-12" style={{ color: colorHex }}>
        {word}
      </div>
      <div className="flex gap-4 w-full">
        <button
          onClick={() => answer(true)}
          className="flex-1 py-4 rounded-2xl bg-mint/20 text-mint mx-type-flow-action active:scale-95 transition-transform"
        >
          Да
        </button>
        <button
          onClick={() => answer(false)}
          className="flex-1 py-4 rounded-2xl bg-cognac/20 text-cognac mx-type-flow-action active:scale-95 transition-transform"
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

function randomSequence(level) {
  return Array.from({ length: level + 2 }, () => Math.floor(Math.random() * 4))
}

function MemoryGame({ onFinish }) {
  const [level, setLevel] = useState(1)
  const [sequence, setSequence] = useState(() => randomSequence(1))
  const [userInput, setUserInput] = useState([])
  const [showing, setShowing] = useState(true)
  const [activeTile, setActiveTile] = useState(null)
  const isFirstLevelRef = useRef(true)

  useEffect(() => {
    sequence.forEach((tile, i) => {
      setTimeout(() => setActiveTile(tile), i * 700)
      setTimeout(() => setActiveTile(null), i * 700 + 400)
    })
    setTimeout(() => setShowing(false), sequence.length * 700)
  }, [sequence])

  // Новая последовательность на смену уровня — отдельным эффектом, а не
  // внутри апдейтера setLevel (тот же баг-класс, что уже чинили в
  // Focus.jsx/NarrowFocusFlow.jsx/ProcrastinationFlow.jsx/FirstStepFlow.jsx/
  // FinishFlow.jsx: в StrictMode функциональный апдейтер может быть вызван
  // дважды, и sequence/userInput/showing разъехались бы с level). Начальный
  // уровень уже получил свою последовательность через lazy useState выше —
  // ref пропускает этот первый рендер, чтобы не сгенерировать её повторно.
  useEffect(() => {
    if (isFirstLevelRef.current) {
      isFirstLevelRef.current = false
      return
    }

    setSequence(randomSequence(level))
    setUserInput([])
    setShowing(true)
  }, [level])

  function tapTile(i) {
    if (showing) return
    platform.haptic('light')
    const idx = userInput.length
    const next = [...userInput, i]
    setUserInput(next)

    if (sequence[idx] !== i) {
      platform.haptic('error')
      onFinish(level - 1)
      return
    }
    if (next.length === sequence.length) {
      if (level >= MEMORY_ROUNDS) {
        onFinish(level)
      } else {
        setTimeout(() => setLevel(l => l + 1), 500)
      }
    }
  }

  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center pt-6">
      <p className="text-xs text-muted mb-8">
        {showing ? 'Запоминай порядок...' : 'Повтори последовательность'} · Уровень {level}/
        {MEMORY_ROUNDS}
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

  // Каждая новая попытка (новый round или повтор после tooSoon) должна
  // сразу сбросить фазу на 'waiting' — до срабатывания случайной задержки
  // ниже. Правка состояния во время рендера, а не в эффекте: это не
  // побочный эффект (таймер/вызов onFinish), а сброс на конкретное
  // значение при смене round/attemptKey.
  const attemptId = `${round}:${attemptKey}`
  const [seenAttemptId, setSeenAttemptId] = useState(attemptId)
  if (seenAttemptId !== attemptId) {
    setSeenAttemptId(attemptId)
    setPhase('waiting')
  }

  useEffect(() => {
    if (round >= REACTION_ROUNDS) {
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 1000
      onFinish(Math.max(0, Math.round(2000 - avg)))
      return
    }
    const delay = 1000 + Math.random() * 1800
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now()
      setPhase('ready')
    }, delay)
    return () => clearTimeout(timeoutRef.current)
  }, [round, attemptKey, times, onFinish])

  function tap() {
    if (phase === 'waiting') {
      clearTimeout(timeoutRef.current)
      platform.haptic('light')
      setPhase('tooSoon')
      setTimeout(() => setAttemptKey(k => k + 1), 900)
      return
    }
    if (phase === 'ready') {
      platform.haptic('success')
      const ms = Date.now() - startRef.current
      setTimes(t => [...t, ms])
      setRound(r => r + 1)
    }
  }

  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center pt-6">
      <p className="text-xs text-muted mb-6">
        Раунд {Math.min(round + 1, REACTION_ROUNDS)} / {REACTION_ROUNDS}
      </p>
      <button
        onClick={tap}
        className="w-full aspect-square rounded-[32px] flex items-center justify-center transition-colors"
        style={{
          backgroundColor:
            phase === 'ready'
              ? '#B8952E'
              : phase === 'tooSoon'
                ? 'rgba(232,92,92,0.25)'
                : 'rgba(150,205,176,0.12)',
        }}
      >
        <span className="text-center text-cream text-[13px] px-8">
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
    platform.haptic('light')
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
    <div className="w-full max-w-md px-5 flex flex-col items-center pt-6">
      <p className="text-xs text-muted mb-6">
        {round + 1} / {PLASTICITY_WORDS.length} · Напиши слово наоборот
      </p>
      <div className="font-display text-3xl text-cream mb-8 tracking-widest">{word}</div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        autoFocus
        className="w-full bg-emerald-light/20 border border-cream/15 rounded-xl px-4 py-3 text-center text-[16px] text-cream outline-none focus:border-gold transition-colors mb-4 uppercase"
      />
      <button
        onClick={submit}
        className="w-full py-3.5 rounded-2xl bg-gold text-emerald-deep mx-type-flow-action active:scale-95 transition-transform"
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

const PHASE_ENDS = BREATH_PHASES.reduce((acc, p) => {
  acc.push((acc[acc.length - 1] || 0) + p.duration)
  return acc
}, [])
const CYCLE_SECONDS = PHASE_ENDS[PHASE_ENDS.length - 1]
const TOTAL_SECONDS = CYCLE_SECONDS * BREATH_CYCLES

function GymnasticsGame({ onFinish }) {
  const [elapsed, setElapsed] = useState(0)
  const finishedRef = useRef(false)

  /*
   * Время считается по часам, а не сложением тиков: вебвью Telegram
   * душит таймеры, и цепочка setInterval разъезжается с реальностью.
   * Но пока экран скрыт, время СТОИТ — упражнение дыхательное, и
   * заблокированный телефон не должен «проходить» его за человека.
   */
  useEffect(() => {
    const accumulated = { seconds: 0 }
    let last = Date.now()

    const tick = () => {
      const now = Date.now()
      if (document.visibilityState === 'visible') {
        accumulated.seconds += (now - last) / 1000
      }
      last = now
      setElapsed(Math.min(TOTAL_SECONDS, accumulated.seconds))
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
  }, [])

  useEffect(() => {
    if (elapsed < TOTAL_SECONDS || finishedRef.current) return
    finishedRef.current = true
    onFinish(1)
  }, [elapsed, onFinish])

  const cycle = Math.min(BREATH_CYCLES - 1, Math.floor(elapsed / CYCLE_SECONDS))
  const intoCycle = elapsed % CYCLE_SECONDS
  const phaseIndex = PHASE_ENDS.findIndex(end => intoCycle < end)
  const secondsLeft = Math.max(1, Math.ceil(PHASE_ENDS[phaseIndex] - intoCycle))

  const phase = BREATH_PHASES[phaseIndex]
  const isExpand = phase.label === 'Вдох'
  const isContract = phase.label === 'Выдох'

  return (
    <div className="w-full max-w-md px-5 flex flex-col items-center pt-6">
      <p className="text-xs text-muted mb-8">
        Цикл {cycle + 1} / {BREATH_CYCLES}
      </p>
      <div
        className="rounded-full bg-mint/20 border-2 border-mint/50 flex items-center justify-center transition-all ease-linear"
        style={{
          width: isExpand ? 220 : isContract ? 120 : 170,
          height: isExpand ? 220 : isContract ? 120 : 170,
          transitionDuration: '1000ms',
        }}
      >
        <div className="text-center">
          <div className="font-display text-[22px] text-cream">{phase.label}</div>
          <div className="text-mint text-[13px] mt-1">{secondsLeft}</div>
        </div>
      </div>
    </div>
  )
}

async function fetchBrainSummary(userId) {
  try {
    return await api.brain.summary(userId)
  } catch (e) {
    console.error(e)
    return null
  }
}

// ---------- Основной экран ----------
export default function BrainTrainer({ user, onBack, onActiveChange }) {
  const [summary, setSummary] = useState(null)
  const [active, setActive] = useState(null)
  const [result, setResult] = useState(null)
  const startTimeRef = useRef(null)

  const gameOpen = active !== null || result !== null

  useEffect(() => {
    onActiveChange?.(gameOpen)
  }, [gameOpen, onActiveChange])

  useEffect(() => {
    return () => {
      onActiveChange?.(false)
    }
  }, [onActiveChange])

  useEffect(() => {
    if (!user) return

    let active = true

    fetchBrainSummary(user.id).then(s => {
      if (active && s) setSummary(s)
    })

    return () => {
      active = false
    }
  }, [user])

  function start(key) {
    platform.haptic('light')
    // start() — обработчик onClick, не рендер; Date.now() здесь не влияет
    // на чистоту рендера. eslint-plugin-react-hooks путает это с рендером
    // только после того, как loadSummary выше перестал быть forward-reference.
    // eslint-disable-next-line react-hooks/purity
    startTimeRef.current = Date.now()
    setActive(key)
    setResult(null)
  }

  async function finish(score) {
    const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    platform.haptic('success')
    const finishedKey = active
    try {
      await api.brain.logSession(user.id, finishedKey, score, duration)
    } catch (e) {
      console.error(e)
    }
    setResult({ key: finishedKey, score })
    setActive(null)

    const s = await fetchBrainSummary(user.id)
    if (s) setSummary(s)
  }

  let activeGame = null

  if (active === 'attention') {
    activeGame = <AttentionGame onFinish={finish} />
  }

  if (active === 'memory') {
    activeGame = <MemoryGame onFinish={finish} />
  }

  if (active === 'reaction') {
    activeGame = <ReactionGame onFinish={finish} />
  }

  if (active === 'plasticity') {
    activeGame = <PlasticityGame onFinish={finish} />
  }

  if (active === 'gymnastics') {
    activeGame = <GymnasticsGame onFinish={finish} />
  }

  if (activeGame) {
    return <ActiveGameFrame onExit={onBack}>{activeGame}</ActiveGameFrame>
  }

  if (result) {
    const ex = EXERCISES.find(e => e.key === result.key)
    return (
      <ScoreScreen label={ex.title} sub="Сессия завершена" score={result.score} onDone={onBack} />
    )
  }

  const todayCompleted = summary?.today_completed ?? []

  return (
    <div className="w-full max-w-md px-5">
      <div className="w-full flex items-center gap-2 mb-6">
        <BackButton onClick={onBack} />
        <h2 className="font-display mx-type-section text-cream">Нейротренажёр</h2>
      </div>

      <div className="w-full h-[164px] rounded-[24px] overflow-hidden px-4 mb-4 bg-transparent border [border-color:rgb(var(--c-border))]" />

      {EXERCISES.map(ex => {
        const doneToday = todayCompleted.includes(ex.key)
        const best = summary?.per_type?.[ex.key]?.best_score
        return (
          <button
            key={ex.key}
            onClick={() => start(ex.key)}
            className="w-full min-h-[112px] rounded-[24px] border border-cream/[0.10] bg-emerald overflow-hidden mb-3 grid grid-cols-[124px_minmax(0,1fr)] text-left transition-transform active:scale-[0.985]"
          >
            <span className="h-full min-h-[112px] bg-artbed border-r border-cream/[0.06] overflow-hidden px-1">
              <SemanticGlyph
                kind={ex.kind}
                animated={false}
                highlighted={doneToday}
                className="w-full h-full scale-[1.04]"
              />
            </span>

            <span className="min-w-0 px-4 py-4 flex flex-col justify-center">
              <span className="flex items-start justify-between gap-2">
                <span className="font-display mx-type-list-title text-cream leading-[1.12]">
                  {ex.title}
                </span>

                {doneToday && (
                  <span className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                    <Check size={14} className="text-gold" />
                  </span>
                )}
              </span>

              <span className="text-[12px] text-muted mt-2 leading-tight">{ex.subtitle}</span>

              {best !== undefined && best > 0 && (
                <span className="font-mono text-[11px] text-muted mt-2">
                  Лучший результат: {best}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
