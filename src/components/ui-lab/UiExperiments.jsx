import { useEffect, useRef, useState } from 'react'

import { ArrowRight, Check, ChevronDown, Pause, Play, RotateCcw, X } from 'lucide-react'

import { DayArc } from '../Motif'
import SemanticGlyph from '../SemanticGlyph'
import { DayThread, DayThreadTrigger, FocusMark, NextActionReveal } from '../TodayMotionExperiment'
import MyPathGlyph from './MyPathGlyph'
import UiLabSwitch from './UiLabSwitch'
import './UiExperiments.css'

const DURATION = 60_000
const PHI = (1 + Math.sqrt(5)) / 2
const BREATH_PHASES = ['вдох', 'пауза', 'выдох', 'пауза']

function makeGoldenSpiralPath() {
  const centerX = 160
  const centerY = 126
  const points = 144

  return Array.from({ length: points }, (_, index) => {
    const angle = (index / (points - 1)) * Math.PI * 3.5
    const radius = 112 * Math.pow(PHI, -angle / (Math.PI / 2))
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)

    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

const GOLDEN_SPIRAL_PATH = makeGoldenSpiralPath()

function PreviewWeek() {
  const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const today = new Date()
  const monday = new Date(today)

  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  return (
    <div className="mx-lab-today__week">
      {names.map((name, index) => {
        const date = new Date(monday)

        date.setDate(monday.getDate() + index)

        const active = date.toDateString() === today.toDateString()

        return (
          <div key={name} data-active={active}>
            <span>{name}</span>
            <strong>{date.getDate()}</strong>
          </div>
        )
      })}
    </div>
  )
}

function TodayScreenPreview({ mode }) {
  const [threadOpen, setThreadOpen] = useState(false)
  const next = {
    title: 'Записать главную мысль',
    meta: 'ритуал',
  }

  return (
    <section className="mx-lab-today-context">
      <div className="mx-lab-today-context__head">
        <span>В контексте приложения</span>
        <h2>Экран «Сегодня»</h2>
        <p>
          Переключатель выше меняет текущую композицию на экспериментальную без изменения данных.
        </p>
      </div>

      <div className="mx-lab-today">
        <div className="mx-lab-today__app-head">
          <span className="mx-lab-today__thread-slot">
            {mode === 'after' && (
              <DayThreadTrigger open={threadOpen} onToggle={() => setThreadOpen(value => !value)} />
            )}
          </span>
          <strong>добрый день.</strong>
          <button type="button" className="mx-lab-today__settings" aria-label="Настройки">
            <span />
          </button>
        </div>

        <p className="mx-lab-today__tagline">шаг за шагом — выход находится</p>

        <PreviewWeek />

        {mode === 'after' && threadOpen && (
          <DayThread
            checkinDone
            done={1}
            open={threadOpen}
            onOpenChange={setThreadOpen}
            total={3}
            todayState="dayInProgress"
          />
        )}

        <div className="mx-lab-today__hero">
          {mode === 'after' ? (
            <FocusMark />
          ) : (
            <div className="mx-lab-today__art">
              <DayArc state="dayInProgress" done={1} total={3} className="w-full h-full" />
            </div>
          )}

          {mode === 'after' ? (
            <NextActionReveal next={next} remainAfter={2} onStart={() => {}} />
          ) : (
            <div className="mx-lab-today__before-action">
              <small>Самое важное</small>
              <strong>{next.title}</strong>
              <span>{next.meta}</span>
              <button type="button">Начать</button>
              <p>После этого останется: 2</p>
            </div>
          )}
        </div>

        <div className="mx-lab-today__nav" aria-hidden="true">
          {[0, 1, 2, 3, 4].map(item => (
            <span key={item} data-active={item === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ExperimentShell({ number, eyebrow, title, purpose, mode, children }) {
  return (
    <section className="mx-lab-experiment" data-mode={mode}>
      <div className="mx-lab-experiment__head">
        <span className="mx-lab-experiment__number">{number}</span>

        <div>
          <p className="mx-lab-experiment__eyebrow">{eyebrow}</p>

          <h2>{title}</h2>

          <p className="mx-lab-experiment__purpose">{purpose}</p>
        </div>
      </div>

      <div className="mx-lab-stage">{children}</div>
    </section>
  )
}

function ExpansionExperiment({ mode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <ExperimentShell
      number="01"
      eyebrow="Раскрытие"
      title="Один ближайший шаг"
      purpose="Карточка сохраняет пространственный контекст и раскрывает ровно ту информацию, которая нужна перед началом ритуала."
      mode={mode}
    >
      <div className="mx-lab-expand" data-open={open}>
        <button
          type="button"
          className="mx-lab-expand__trigger"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className="mx-lab-orbit-mark" aria-hidden="true">
            <span />
          </span>

          <span className="mx-lab-expand__copy">
            <small>Ритуал · 5 минут</small>
            <strong>Записать главную мысль</strong>
            <span>Сначала увидеть, потом действовать</span>
          </span>

          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <div className="mx-lab-expand__layer" aria-hidden={!open}>
          <button
            type="button"
            className="mx-lab-expand__backdrop"
            tabIndex={open ? 0 : -1}
            aria-label="Закрыть карточку"
            onClick={() => setOpen(false)}
          />

          <div
            className="mx-lab-expand__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Записать главную мысль"
          >
            <div className="mx-lab-expand__dialog-head">
              <span className="mx-lab-orbit-mark" aria-hidden="true">
                <span />
              </span>

              <button
                type="button"
                className="mx-lab-icon-button"
                tabIndex={open ? 0 : -1}
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <small>Ритуал · 5 минут</small>
            <h3>Записать главную мысль</h3>
            <p>Сформулируй одно предложение: что сегодня действительно требует твоего внимания?</p>

            <div className="mx-lab-expand__prompt">
              Не план на весь день. Только одна ясная мысль.
            </div>

            <button
              type="button"
              className="mx-lab-primary"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              Начать
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </ExperimentShell>
  )
}

function FocusExperiment({ mode }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(22_000)
  const startedAt = useRef(null)

  useEffect(() => {
    if (!running) return undefined

    const timer = window.setInterval(() => {
      const next = Math.min(Date.now() - startedAt.current, DURATION)

      setElapsed(next)

      if (next >= DURATION) {
        setRunning(false)
      }
    }, 100)

    const pauseWhenHidden = () => {
      if (document.hidden) {
        setRunning(false)
      }
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', pauseWhenHidden)
    }
  }, [running])

  const progress = Math.min(elapsed / DURATION, 1)
  const remaining = Math.max(0, Math.ceil((DURATION - elapsed) / 1000))

  return (
    <ExperimentShell
      number="02"
      eyebrow="Атмосфера"
      title="Поле внимания"
      purpose="Геометрия показывает ход короткой фокус-сессии: движение начинается только вместе с таймером и замирает на паузе."
      mode={mode}
    >
      <div className="mx-lab-focus" data-running={running} style={{ '--mx-progress': progress }}>
        <svg
          className="mx-lab-focus__field"
          viewBox="0 0 320 250"
          role="img"
          aria-label={`Осталось ${remaining} секунд`}
        >
          <g className="mx-lab-focus__quiet-lines">
            <path d="M40 126H280" />
            <path d="M160 24V226" />
            <circle cx="160" cy="126" r="92" />
            <circle cx="160" cy="126" r="66" />
          </g>

          <g className="mx-lab-focus__moving-field">
            <path d="M72 84A102 102 0 0 1 248 84" />
            <path d="M86 190A96 96 0 0 0 234 190" />
          </g>

          <circle className="mx-lab-focus__track" cx="160" cy="126" r="48" />

          <circle
            className="mx-lab-focus__progress"
            cx="160"
            cy="126"
            r="48"
            pathLength="1"
            style={{
              strokeDashoffset: 1 - progress,
            }}
          />

          <g
            className="mx-lab-focus__marker"
            style={{
              transform: `rotate(${progress * 360}deg)`,
            }}
          >
            <circle cx="160" cy="78" r="3.5" />
          </g>

          <circle className="mx-lab-focus__center" cx="160" cy="126" r="3" />
        </svg>

        <div className="mx-lab-focus__readout">
          <small>{running ? 'Сессия идёт' : 'Короткий фокус'}</small>
          <strong>0:{String(remaining).padStart(2, '0')}</strong>
          <span>одна задача · без переключений</span>
        </div>

        <div className="mx-lab-focus__actions">
          <button
            type="button"
            className="mx-lab-primary"
            onClick={() => {
              if (running) {
                setRunning(false)
                return
              }

              startedAt.current = Date.now() - elapsed
              setRunning(true)
            }}
          >
            {running ? <Pause size={17} /> : <Play size={17} />}
            {running ? 'Пауза' : 'Продолжить'}
          </button>

          <button
            type="button"
            className="mx-lab-icon-button"
            aria-label="Начать заново"
            onClick={() => {
              setRunning(false)
              setElapsed(0)
            }}
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>
    </ExperimentShell>
  )
}

function CompletionExperiment({ mode }) {
  const [complete, setComplete] = useState(false)

  return (
    <ExperimentShell
      number="03"
      eyebrow="Micro-interaction"
      title="Ритуал услышал действие"
      purpose="Нажатие сразу подтверждается, а завершённое состояние остаётся спокойным и однозначным — без конфетти и декоративного шума."
      mode={mode}
    >
      <div className="mx-lab-completion" data-complete={complete}>
        <div className="mx-lab-completion__art" aria-hidden="true">
          <svg viewBox="0 0 140 100">
            <circle cx="70" cy="50" r="33" />
            <path d="M26 50H114" />
            <path d="M70 14V86" />
            <path className="mx-lab-completion__check" d="m55 50 10 10 22-24" />
            <circle className="mx-lab-completion__point" cx="103" cy="50" r="3.5" />
          </svg>
        </div>

        <div className="mx-lab-completion__copy">
          <small>{complete ? 'Отмечено сегодня' : 'Утренний ритуал'}</small>
          <h3>Стакан воды</h3>
          <p>
            {complete
              ? 'Шаг учтён. Ничего больше не требуется.'
              : 'Маленькое действие перед началом дня.'}
          </p>
        </div>

        <button
          type="button"
          className="mx-lab-complete-button"
          onClick={() => setComplete(current => !current)}
        >
          <span className="mx-lab-complete-button__icon">
            <Check size={17} />
          </span>
          <span>{complete ? 'Готово' : 'Отметить'}</span>
        </button>
      </div>
    </ExperimentShell>
  )
}

function BreathingExperiment({ mode }) {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return undefined

    const timer = window.setInterval(() => {
      setPhase(current => (current + 1) % BREATH_PHASES.length)
    }, 3_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [active])

  return (
    <ExperimentShell
      number="04"
      eyebrow="SVG + motion"
      title="Дыхательный ориентир"
      purpose="Фирменные дуги объясняют фазу упражнения. Движение не украшает экран, а заменяет необходимость постоянно читать таймер."
      mode={mode}
    >
      <div className="mx-lab-breath" data-active={active} data-phase={phase}>
        <div className="mx-lab-breath__visual">
          <svg viewBox="0 0 240 240" aria-hidden="true">
            <g className="mx-lab-breath__rays">
              <path d="M120 18V42" />
              <path d="m48 48 17 17" />
              <path d="M18 120H42" />
              <path d="m48 192 17-17" />
              <path d="M120 222V198" />
              <path d="m192 192-17-17" />
              <path d="M222 120H198" />
              <path d="m192 48-17 17" />
            </g>

            <circle
              className="mx-lab-breath__ring mx-lab-breath__ring--outer"
              cx="120"
              cy="120"
              r="72"
            />
            <circle
              className="mx-lab-breath__ring mx-lab-breath__ring--inner"
              cx="120"
              cy="120"
              r="47"
            />
            <path className="mx-lab-breath__arc" d="M120 48a72 72 0 0 1 72 72" />
            <circle className="mx-lab-breath__core" cx="120" cy="120" r="8" />
          </svg>

          <div className="mx-lab-breath__label" aria-live="polite">
            <small>{active ? 'Следуй за кругом' : 'Практика · 1 минута'}</small>
            <strong>{active ? BREATH_PHASES[phase] : 'готов?'}</strong>
          </div>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => {
            setActive(current => !current)
            if (active) setPhase(0)
          }}
        >
          {active ? <Pause size={17} /> : <Play size={17} />}
          {active ? 'Остановить' : 'Начать дыхание'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function CheckinExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)

  const labels = ['бережно', 'ровно', 'есть импульс']

  return (
    <ExperimentShell
      number="05"
      eyebrow="State prototype"
      title="Состояние отвечает формой"
      purpose="Rive-подобная логика без чужого визуала: одна иллюстрация меняет состояние вслед за выбором энергии и подтверждает, что check-in понят."
      mode={mode}
    >
      <div className="mx-lab-checkin" data-energy={energy}>
        <div className="mx-lab-checkin__visual" aria-hidden="true">
          <svg viewBox="0 0 300 190">
            <g className="mx-lab-checkin__horizon">
              <path d="M32 95H268" />
              <circle cx="150" cy="95" r="62" />
            </g>

            <g className="mx-lab-checkin__orbit mx-lab-checkin__orbit--one">
              <ellipse cx="150" cy="95" rx="98" ry="32" />
            </g>

            <g className="mx-lab-checkin__orbit mx-lab-checkin__orbit--two">
              <ellipse cx="150" cy="95" rx="82" ry="46" />
            </g>

            <g className="mx-lab-checkin__needle">
              <path d="M150 95 150 45" />
              <circle cx="150" cy="42" r="4" />
            </g>

            <circle className="mx-lab-checkin__core" cx="150" cy="95" r="8" />
          </svg>
        </div>

        <div className="mx-lab-checkin__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>

        <div className="mx-lab-checkin__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function GoldenSpiralExperiment({ mode }) {
  const [drawKey, setDrawKey] = useState(0)

  return (
    <ExperimentShell
      number="06"
      eyebrow="Пропорция φ"
      title="Спираль внимания"
      purpose="Каждая четверть оборота уменьшается в φ раз. Линия не просто украшает экран — она показывает, как широкое поле внимания последовательно сводится к одной мысли."
      mode={mode}
    >
      <div className="mx-lab-phi mx-lab-phi-spiral">
        <div className="mx-lab-phi__visual">
          <svg
            viewBox="0 0 320 252"
            role="img"
            aria-label="Золотая спираль сужается к точке внимания"
          >
            <g className="mx-lab-phi__guides">
              <path d="M24 126H296" />
              <path d="M160 20V232" />
              <rect x="48" y="57" width="224" height="138.44" rx="4" />
              <circle cx="160" cy="126" r="42.8" />
            </g>

            <path key={drawKey} className="mx-lab-phi-spiral__path" d={GOLDEN_SPIRAL_PATH} />

            <circle className="mx-lab-phi__core" cx="160" cy="126" r="4" />
          </svg>
        </div>

        <div className="mx-lab-phi__copy">
          <small>φ = 1.618</small>
          <strong>От поля — к одной точке</strong>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDrawKey(value => value + 1)}
        >
          <RotateCcw size={17} />
          Дорисовать снова
        </button>
      </div>
    </ExperimentShell>
  )
}

function GoldenEllipseExperiment({ mode }) {
  const [running, setRunning] = useState(false)

  return (
    <ExperimentShell
      number="07"
      eyebrow="Золотая орбита"
      title="Ритм без случайных пропорций"
      purpose="Большая и малая оси орбиты соотносятся как 1.618. Точка движется только во время фокус-сессии и делает её ход видимым без отдельного таймера в центре."
      mode={mode}
    >
      <div className="mx-lab-phi mx-lab-phi-ellipse" data-running={running && mode === 'after'}>
        <div className="mx-lab-phi__visual mx-lab-phi-ellipse__visual">
          <svg
            viewBox="0 0 320 252"
            role="img"
            aria-label="Эллиптическая орбита с пропорцией золотого сечения"
          >
            <g className="mx-lab-phi__guides">
              <path d="M36 126H284" />
              <path d="M160 40V212" />
              <rect x="55" y="61.1" width="210" height="129.8" rx="4" />
            </g>

            <ellipse className="mx-lab-phi-ellipse__orbit" cx="160" cy="126" rx="105" ry="64.9" />

            <ellipse className="mx-lab-phi-ellipse__inner" cx="160" cy="126" rx="64.9" ry="40.1" />

            <circle className="mx-lab-phi-ellipse__center" cx="160" cy="126" r="3" />
          </svg>

          <span className="mx-lab-phi-ellipse__marker" aria-hidden="true" />
        </div>

        <div className="mx-lab-phi__copy">
          <small>210 ÷ 129.8 = 1.618</small>
          <strong>{running ? 'Фокус удерживается' : 'Орбита ждёт действия'}</strong>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setRunning(value => !value)}
        >
          {running ? <Pause size={17} /> : <Play size={17} />}
          {running ? 'Пауза' : 'Начать фокус'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function GoldenApertureExperiment({ mode }) {
  const [depth, setDepth] = useState(0)
  const radii = [104, 64.3, 39.7, 24.5]

  return (
    <ExperimentShell
      number="08"
      eyebrow="Собственная идея"
      title="Золотая диафрагма"
      purpose="Четыре уровня внимания уменьшаются последовательно по φ. Нажатие не запускает декоративный цикл, а буквально сужает область выбора до следующего уровня."
      mode={mode}
    >
      <div className="mx-lab-phi mx-lab-phi-aperture" data-depth={depth}>
        <div className="mx-lab-phi__visual">
          <svg viewBox="0 0 320 252" role="img" aria-label={`Глубина фокуса: ${depth + 1} из 4`}>
            <g className="mx-lab-phi__guides">
              <path d="M32 126H288" />
              <path d="M160 22V230" />
            </g>

            {radii.map((radius, index) => (
              <g
                key={radius}
                className="mx-lab-phi-aperture__ring"
                data-ring={index}
                data-reached={index <= depth}
              >
                <path d={`M${160 - radius} 126A${radius} ${radius} 0 0 1 ${160 + radius} 126`} />
                <path d={`M${160 + radius} 126A${radius} ${radius} 0 0 1 ${160 - radius} 126`} />
              </g>
            ))}

            <circle className="mx-lab-phi__core" cx="160" cy="126" r="4" />
          </svg>
        </div>

        <div className="mx-lab-phi__copy">
          <small>Уровень {depth + 1} · радиус ÷ φ</small>
          <strong>{depth === 3 ? 'Осталась одна точка' : 'Сузить область выбора'}</strong>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDepth(value => (value + 1) % radii.length)}
        >
          {depth === 3 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {depth === 3 ? 'Начать снова' : 'Следующий уровень'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function SoftFacetExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)
  const labels = ['бережно', 'ровно', 'есть импульс']

  return (
    <ExperimentShell
      number="09"
      eyebrow="Мягкая геометрия"
      title="Состояние получает огранку"
      purpose="Альтернатива круговой «Энергии сейчас»: пересекающиеся линзы сохраняют мягкость, а четыре спокойные вершины показывают направленность выбранного состояния."
      mode={mode}
    >
      <div className="mx-lab-facet" data-energy={energy}>
        <div className="mx-lab-facet__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-facet__guides">
              <path d="M32 126H288" />
              <path d="M160 24V228" />
            </g>

            <path
              className="mx-lab-facet__frame"
              d="M160 24C190 55 230 88 282 126C230 164 190 197 160 228C130 197 90 164 38 126C90 88 130 55 160 24Z"
            />

            <g className="mx-lab-facet__lenses">
              <path d="M48 126C86 72 234 72 272 126C234 180 86 180 48 126Z" />
              <path d="M160 34C214 70 214 182 160 218C106 182 106 70 160 34Z" />
            </g>

            <g className="mx-lab-facet__needle">
              <path d="M160 126L160 67" />
              <circle cx="160" cy="62" r="4" />
            </g>

            <circle className="mx-lab-facet__core" cx="160" cy="126" r="6" />
          </svg>
        </div>

        <div className="mx-lab-facet__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>

        <div className="mx-lab-facet__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function FillingRitualExperiment({ mode }) {
  const [complete, setComplete] = useState(false)

  return (
    <ExperimentShell
      number="10"
      eyebrow="Альтернатива ритуалу"
      title="Шаг наполняет форму"
      purpose="Более выразительная замена простому знаку стакана: завершение утреннего действия спокойно наполняет сосуд и оставляет видимый след без конфетти."
      mode={mode}
    >
      <div className="mx-lab-vessel" data-complete={complete}>
        <div className="mx-lab-vessel__visual">
          <svg
            viewBox="0 0 320 252"
            role="img"
            aria-label={complete ? 'Утренний ритуал завершён' : 'Утренний ритуал ожидает действия'}
          >
            <defs>
              <clipPath id="mx-lab-vessel-clip">
                <path d="M82 55C90 157 112 205 160 220C208 205 230 157 238 55Z" />
              </clipPath>
            </defs>

            <g className="mx-lab-vessel__guides">
              <path d="M46 55H274" />
              <path d="M160 24V228" />
            </g>

            <g className="mx-lab-vessel__water" clipPath="url(#mx-lab-vessel-clip)">
              <path className="mx-lab-vessel__fill" d="M64 118H256V236H64Z" />
              <path d="M64 118C100 102 124 134 160 118C196 102 220 134 256 118" />
              <path d="M76 151C108 137 130 165 160 151C190 137 212 165 244 151" />
            </g>

            <path
              className="mx-lab-vessel__body"
              d="M82 55C90 157 112 205 160 220C208 205 230 157 238 55"
            />
            <path
              className="mx-lab-vessel__rim"
              d="M82 55C112 43 208 43 238 55C208 67 112 67 82 55Z"
            />

            <g className="mx-lab-vessel__drop">
              <path d="M160 30C151 42 148 48 160 56C172 48 169 42 160 30Z" />
              <circle cx="160" cy="49" r="3" />
            </g>
          </svg>
        </div>

        <div className="mx-lab-vessel__copy">
          <small>{complete ? 'Отмечено сегодня' : 'Утренний ритуал'}</small>
          <strong>Стакан воды</strong>
          <span>
            {complete ? 'Форма заполнена — шаг учтён.' : 'Одно спокойное действие для начала дня.'}
          </span>
        </div>

        <button
          type="button"
          className="mx-lab-complete-button"
          onClick={() => setComplete(value => !value)}
        >
          <span className="mx-lab-complete-button__icon">
            <Check size={17} />
          </span>
          <span>{complete ? 'Готово' : 'Отметить'}</span>
        </button>
      </div>
    </ExperimentShell>
  )
}

function PetalBreathingExperiment({ mode }) {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return undefined

    const timer = window.setInterval(() => {
      setPhase(current => (current + 1) % BREATH_PHASES.length)
    }, 3_000)

    return () => window.clearInterval(timer)
  }, [active])

  return (
    <ExperimentShell
      number="11"
      eyebrow="Линзы и лепестки"
      title="Дыхание раскрывается формой"
      purpose="Вместо ещё одного круга четыре линзы раскрываются на вдохе и собираются на выдохе. Движение остаётся инструкцией практики, а не фоновым украшением."
      mode={mode}
    >
      <div className="mx-lab-petal" data-active={active} data-phase={phase}>
        <div className="mx-lab-petal__visual">
          <svg viewBox="0 0 320 252" aria-hidden="true">
            <g className="mx-lab-petal__guides">
              <path d="M42 126H278" />
              <path d="M160 20V232" />
              <path d="M82 48L238 204" />
              <path d="M238 48L82 204" />
            </g>

            <path
              className="mx-lab-petal__frame"
              d="M160 30C190 68 226 96 272 126C226 156 190 184 160 222C130 184 94 156 48 126C94 96 130 68 160 30Z"
            />

            <g className="mx-lab-petal__petals">
              <path d="M160 126C128 94 132 52 160 28C188 52 192 94 160 126Z" />
              <path d="M160 126C192 94 234 98 258 126C234 154 192 158 160 126Z" />
              <path d="M160 126C192 158 188 200 160 224C132 200 128 158 160 126Z" />
              <path d="M160 126C128 158 86 154 62 126C86 98 128 94 160 126Z" />
            </g>

            <circle className="mx-lab-petal__halo" cx="160" cy="126" r="34" />
            <circle className="mx-lab-petal__core" cx="160" cy="126" r="6" />
          </svg>

          <div className="mx-lab-petal__label" aria-live="polite">
            <small>{active ? 'Следуй за формой' : 'Практика · 1 минута'}</small>
            <strong>{active ? BREATH_PHASES[phase] : 'готов?'}</strong>
          </div>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => {
            setActive(value => !value)
            if (active) setPhase(0)
          }}
        >
          {active ? <Pause size={17} /> : <Play size={17} />}
          {active ? 'Остановить' : 'Начать дыхание'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function ChoiceLensExperiment({ mode }) {
  const [depth, setDepth] = useState(0)
  const labels = ['Широкое поле', 'Только важное', 'Одна мысль']

  return (
    <ExperimentShell
      number="12"
      eyebrow="Референс · линза"
      title="Выбор становится уже"
      purpose="Три мягкие линзы заменяют привычную мишень: каждый шаг убирает лишнее и оставляет более точную область решения."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-choice-lens" data-depth={depth}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M28 126H292" />
              <path d="M160 26V226" />
            </g>
            <path
              className="mx-lab-choice-lens__shape"
              data-lens="0"
              d="M32 126C82 48 238 48 288 126C238 204 82 204 32 126Z"
            />
            <path
              className="mx-lab-choice-lens__shape"
              data-lens="1"
              d="M68 126C106 76 214 76 252 126C214 176 106 176 68 126Z"
            />
            <path
              className="mx-lab-choice-lens__shape"
              data-lens="2"
              d="M108 126C130 101 190 101 212 126C190 151 130 151 108 126Z"
            />
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="5" />
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>Уровень выбора {depth + 1} из 3</small>
          <strong>{labels[depth]}</strong>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDepth(value => (value + 1) % labels.length)}
        >
          {depth === 2 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {depth === 2 ? 'Сначала' : 'Сузить выбор'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function LivingContourExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)
  const labels = ['тихо', 'устойчиво', 'живой импульс']

  return (
    <ExperimentShell
      number="13"
      eyebrow="Референс · контур"
      title="Энергия меняет границу"
      purpose="Не круг и не ромб, а мягкая мембрана: выбранная энергия меняет её напряжение, наклон и внутреннее пространство."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-contour" data-energy={energy}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M34 126H286" />
              <path d="M160 24V228" />
            </g>
            <g className="mx-lab-contour__membrane">
              <path d="M160 28C216 32 276 72 278 126C276 180 216 220 160 224C104 220 44 180 42 126C44 72 104 32 160 28Z" />
              <path d="M160 58C202 60 244 88 246 126C244 164 202 192 160 194C118 192 76 164 74 126C76 88 118 60 160 58Z" />
            </g>
            <g className="mx-lab-contour__axis">
              <path d="M103 157L217 95" />
              <path d="M112 102L208 150" />
            </g>
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="6" />
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>
        <div className="mx-lab-ref__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function BreathingWaveExperiment({ mode }) {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return undefined
    const timer = window.setInterval(() => {
      setPhase(value => (value + 1) % BREATH_PHASES.length)
    }, 3_000)
    return () => window.clearInterval(timer)
  }, [active])

  return (
    <ExperimentShell
      number="14"
      eyebrow="Референс · волна"
      title="Дыхание проходит через линию"
      purpose="Две волны расходятся на вдохе и возвращаются на выдохе. Такой ориентир мягче лепестков и подходит для спокойной ежедневной практики."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-wave" data-active={active} data-phase={phase}>
        <div className="mx-lab-ref__visual mx-lab-wave__visual">
          <svg viewBox="0 0 320 252" aria-hidden="true">
            <g className="mx-lab-ref__guides">
              <path d="M26 126H294" />
              <path d="M160 34V218" />
            </g>
            <g className="mx-lab-wave__upper">
              <path d="M30 126C68 74 108 74 146 126C184 178 224 178 290 126" />
              <path d="M46 126C82 94 114 94 150 126C186 158 218 158 274 126" />
            </g>
            <g className="mx-lab-wave__lower">
              <path d="M30 126C68 178 108 178 146 126C184 74 224 74 290 126" />
              <path d="M46 126C82 158 114 158 150 126C186 94 218 94 274 126" />
            </g>
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="5" />
          </svg>
          <div className="mx-lab-wave__label" aria-live="polite">
            <small>{active ? 'Следуй за волной' : 'Практика · 1 минута'}</small>
            <strong>{active ? BREATH_PHASES[phase] : 'готов?'}</strong>
          </div>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => {
            setActive(value => !value)
            if (active) setPhase(0)
          }}
        >
          {active ? <Pause size={17} /> : <Play size={17} />}
          {active ? 'Остановить' : 'Начать дыхание'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function FibonacciRouteExperiment({ mode }) {
  const [step, setStep] = useState(0)
  const points = [
    [58, 194],
    [96, 194],
    [96, 156],
    [158, 156],
    [158, 94],
    [258, 94],
  ]
  const [x, y] = points[step]

  return (
    <ExperimentShell
      number="15"
      eyebrow="Референс · Fibonacci"
      title="Шаги складываются в маршрут"
      purpose="Последовательность 1·1·2·3·5 превращается в путь практики: золотая точка переходит только после реального следующего шага."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-route" data-step={step}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides mx-lab-route__blocks">
              <rect x="40" y="176" width="36" height="36" />
              <rect x="76" y="176" width="36" height="36" />
              <rect x="76" y="140" width="72" height="72" />
              <rect x="148" y="104" width="108" height="108" />
            </g>
            <path className="mx-lab-route__path" d="M58 194H96V156H158V94H258" />
            {points.map(([pointX, pointY], index) => (
              <circle
                key={`${pointX}-${pointY}`}
                className="mx-lab-route__node"
                data-reached={index <= step}
                cx={pointX}
                cy={pointY}
                r="3"
              />
            ))}
            <g className="mx-lab-route__marker" style={{ transform: `translate(${x}px, ${y}px)` }}>
              <circle r="6" />
            </g>
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>
            Шаг {step + 1} из {points.length}
          </small>
          <strong>{step === points.length - 1 ? 'Маршрут собран' : 'Следующий шаг виден'}</strong>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setStep(value => (value + 1) % points.length)}
        >
          {step === points.length - 1 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {step === points.length - 1 ? 'Пройти снова' : 'Сделать шаг'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function NextStepGateExperiment({ mode }) {
  const [open, setOpen] = useState(false)

  return (
    <ExperimentShell
      number="16"
      eyebrow="Референс · портал"
      title="Следующий шаг открывается"
      purpose="Две вертикальные дуги расходятся только после решения начать. Композиция показывает переход к действию без карточки, круга или декоративной сцены."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-gate" data-open={open}>
        <div className="mx-lab-ref__visual mx-lab-gate__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M34 126H286" />
              <path d="M160 22V230" />
            </g>
            <g className="mx-lab-gate__side mx-lab-gate__side--left">
              <path d="M56 32C138 58 138 194 56 220" />
              <path d="M88 52C142 76 142 176 88 200" />
            </g>
            <g className="mx-lab-gate__side mx-lab-gate__side--right">
              <path d="M264 32C182 58 182 194 264 220" />
              <path d="M232 52C178 76 178 176 232 200" />
            </g>
            <path className="mx-lab-gate__path" d="M160 70V182" />
            <circle className="mx-lab-ref__core mx-lab-gate__core" cx="160" cy="126" r="6" />
          </svg>
          <div className="mx-lab-gate__label">
            <small>{open ? 'Путь открыт' : 'Ближайшее действие'}</small>
            <strong>{open ? 'Начать практику' : 'Записать главную мысль'}</strong>
          </div>
        </div>
        <button type="button" className="mx-lab-primary" onClick={() => setOpen(value => !value)}>
          {open ? <X size={17} /> : <ArrowRight size={17} />}
          {open ? 'Закрыть' : 'Открыть шаг'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function FlowRouteExperiment({ mode }) {
  const [step, setStep] = useState(0)
  const points = [
    [48, 176],
    [126, 76],
    [204, 176],
    [274, 104],
  ]
  const labels = ['Начало видно', 'Первый поворот', 'Ритм удержан', 'Шаг завершён']
  const [x, y] = points[step]

  return (
    <ExperimentShell
      number="17"
      eyebrow="Новый референс маршрута"
      title="Путь течёт, а не складывается"
      purpose="Альтернатива ступенчатому Fibonacci-маршруту: одна непрерывная нить мягко проводит через четыре действия и сохраняет ощущение движения вперёд."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-flow-route" data-step={step}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M28 126H292" />
              <path d="M160 26V226" />
            </g>
            <path
              className="mx-lab-flow-route__echo"
              d="M48 176C88 176 82 76 126 76S166 176 204 176S238 104 274 104"
            />
            <path
              className="mx-lab-flow-route__path"
              d="M48 176C88 176 82 76 126 76S166 176 204 176S238 104 274 104"
            />
            {points.map(([pointX, pointY], index) => (
              <g
                key={`${pointX}-${pointY}`}
                className="mx-lab-flow-route__node"
                data-reached={index <= step}
              >
                <path d={`M${pointX - 12} ${pointY}H${pointX + 12}`} />
                <circle cx={pointX} cy={pointY} r="3" />
              </g>
            ))}
            <g
              className="mx-lab-flow-route__marker"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <circle r="6" />
            </g>
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>
            Этап {step + 1} из {points.length}
          </small>
          <strong>{labels[step]}</strong>
        </div>
        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setStep(value => (value + 1) % points.length)}
        >
          {step === points.length - 1 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}
          {step === points.length - 1 ? 'Пройти снова' : 'Следующий этап'}
        </button>
      </div>
    </ExperimentShell>
  )
}

function ResonanceExperiment({ mode }) {
  const [energy, setEnergy] = useState(1)
  const labels = ['тихий отклик', 'ровный резонанс', 'живой импульс']

  return (
    <ExperimentShell
      number="18"
      eyebrow="Новый референс энергии"
      title="Импульс раскрывает крылья"
      purpose="Вместо замкнутой мембраны энергия расходится от центральной оси двумя волнами. Чем больше импульс, тем шире пространство действия."
      mode={mode}
    >
      <div className="mx-lab-ref mx-lab-resonance" data-energy={energy}>
        <div className="mx-lab-ref__visual" aria-hidden="true">
          <svg viewBox="0 0 320 252">
            <g className="mx-lab-ref__guides">
              <path d="M30 126H290" />
              <path d="M160 24V228" />
            </g>
            <g className="mx-lab-resonance__wing mx-lab-resonance__wing--left">
              <path d="M156 126C126 94 92 70 42 68C72 104 72 148 42 184C92 182 126 158 156 126Z" />
              <path d="M146 126C118 108 94 102 70 104C88 126 88 126 70 148C94 150 118 144 146 126Z" />
            </g>
            <g className="mx-lab-resonance__wing mx-lab-resonance__wing--right">
              <path d="M164 126C194 94 228 70 278 68C248 104 248 148 278 184C228 182 194 158 164 126Z" />
              <path d="M174 126C202 108 226 102 250 104C232 126 232 126 250 148C226 150 202 144 174 126Z" />
            </g>
            <path className="mx-lab-resonance__spine" d="M160 54V198" />
            <circle className="mx-lab-ref__core" cx="160" cy="126" r="6" />
          </svg>
        </div>
        <div className="mx-lab-ref__copy">
          <small>Энергия сейчас</small>
          <strong>{labels[energy]}</strong>
        </div>
        <div className="mx-lab-ref__choices" aria-label="Уровень энергии">
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              aria-pressed={energy === index}
              onClick={() => setEnergy(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
    </ExperimentShell>
  )
}

function SemanticAtlasExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const cards = [
    { label: 'Стакан воды', meta: 'утренний ритуал' },
    { label: 'Главная мысль', meta: 'фокус дня' },
    { label: 'Дыхание', meta: 'восстановление' },
    { label: 'Тихая прогулка', meta: 'практика' },
  ]

  const marks = [
    <svg key="water" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M34 18C38 58 46 70 60 74C74 70 82 58 86 18" />
      <path d="M34 18C47 13 73 13 86 18C73 23 47 23 34 18Z" />
      <path d="M39 48C50 43 70 53 81 48" />
      <circle cx="60" cy="39" r="3" />
    </svg>,
    <svg key="thought" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M22 58C40 28 80 28 98 58C80 48 40 48 22 58Z" />
      <path d="M60 22V62" />
      <path d="M40 34L60 22L80 34" />
      <circle cx="60" cy="22" r="3" />
    </svg>,
    <svg key="breath" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M60 42C46 30 48 15 60 8C72 15 74 30 60 42Z" />
      <path d="M60 42C74 30 89 32 96 42C89 52 74 54 60 42Z" />
      <path d="M60 42C74 54 72 69 60 76C48 69 46 54 60 42Z" />
      <path d="M60 42C46 54 31 52 24 42C31 32 46 30 60 42Z" />
      <circle cx="60" cy="42" r="3" />
    </svg>,
    <svg key="walk" viewBox="0 0 120 84" aria-hidden="true">
      <path d="M16 60C34 60 32 24 50 24S68 60 84 60S98 38 106 38" />
      <path d="M16 68H106" />
      <circle cx="50" cy="24" r="3" />
    </svg>,
  ]

  return (
    <ExperimentShell
      number="19"
      eyebrow="Система смысловых рисунков"
      title="У каждой карточки свой знак"
      purpose="Принцип стакана воды превращается в систему: рисунок показывает смысл конкретного действия, но остаётся частью единого языка тонких линий Mentalix."
      mode={mode}
    >
      <div className="mx-lab-atlas">
        <div className="mx-lab-atlas__grid">
          {cards.map((card, index) => (
            <button
              type="button"
              key={card.label}
              className="mx-lab-atlas__card"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <span className="mx-lab-atlas__mark">{marks[index]}</span>
              <small>{card.meta}</small>
              <strong>{card.label}</strong>
            </button>
          ))}
        </div>
        <p className="mx-lab-atlas__note">
          Выбран знак: <strong>{cards[selected].label}</strong>
        </p>
      </div>
    </ExperimentShell>
  )
}

function RitualCardsExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const rituals = [
    {
      title: 'Утренняя молитва',
      meta: 'намерение перед началом дня',
      kind: 'prayer',
    },
    {
      title: 'Холодный душ',
      meta: 'пробуждение через действие',
      kind: 'shower',
    },
    {
      title: 'Зачем ты проснулся',
      meta: 'возвращение к смыслу дня',
      kind: 'purpose',
    },
  ]

  const drawings = rituals.map((ritual, index) => (
    <SemanticGlyph
      key={ritual.kind}
      kind={ritual.kind}
      animated={selected === index}
      highlighted={selected === index}
    />
  ))

  return (
    <ExperimentShell
      number="20"
      eyebrow="Ваши ритуалы"
      title="Три действия — три собственных знака"
      purpose="Каждая карточка буквально переводит смысл ритуала в геометрию. Нажатие выбирает действие и запускает только связанную с ним короткую реакцию формы."
      mode={mode}
    >
      <div className="mx-lab-ritual-cards">
        {rituals.map((ritual, index) => (
          <button
            type="button"
            key={ritual.title}
            className="mx-lab-ritual-card"
            data-kind={ritual.kind}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span className="mx-lab-ritual-card__art">{drawings[index]}</span>
            <span className="mx-lab-ritual-card__copy">
              <small>{selected === index ? 'Выбранный ритуал' : 'Утренний ритуал'}</small>
              <strong>{ritual.title}</strong>
              <span>{ritual.meta}</span>
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </ExperimentShell>
  )
}

function AscezaCardsExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const ascezas = [
    {
      title: 'Отказ от алкоголя',
      meta: 'ясность вместо привычного импульса',
      kind: 'alcohol',
    },
    {
      title: 'Отказ от курения',
      meta: 'свободное дыхание без дыма',
      kind: 'smoking',
    },
    {
      title: 'Осознанный отказ',
      meta: 'прямой курс остаётся сильнее бокового импульса',
      kind: 'asceza',
    },
  ]

  const drawings = ascezas.map((asceza, index) => (
    <SemanticGlyph
      key={asceza.kind}
      kind={asceza.kind}
      animated={selected === index}
      highlighted={selected === index}
    />
  ))

  return (
    <ExperimentShell
      number="21"
      eyebrow="Ваши аскезы"
      title="Отказ тоже получает ясный знак"
      purpose="Три карточки показывают не запрет ради запрета, а выбранное направление: линия решения пересекает алкоголь, дым исчезает из разорванной привычки, а общий знак удерживает прямой курс при угасающем боковом импульсе."
      mode={mode}
    >
      <div className="mx-lab-asceza-cards">
        {ascezas.map((asceza, index) => (
          <button
            type="button"
            key={asceza.title}
            className="mx-lab-asceza-card"
            data-kind={asceza.kind}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span className="mx-lab-asceza-card__art">{drawings[index]}</span>
            <span className="mx-lab-asceza-card__copy">
              <small>{selected === index ? 'Выбранная аскеза' : 'Личная аскеза'}</small>
              <strong>{asceza.title}</strong>
              <span>{asceza.meta}</span>
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </ExperimentShell>
  )
}

function SemanticSystemCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      className="mx-lab-system-card"
      data-kind={item.kind}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="mx-lab-system-card__art">
        <SemanticGlyph kind={item.kind} animated={selected} highlighted={selected} />
      </span>
      <span className="mx-lab-system-card__copy">
        <small>{selected ? item.activeLabel : item.label}</small>
        <strong>{item.title}</strong>
        <span>{item.meta}</span>
      </span>
    </button>
  )
}

function SemanticSystemGrid({ items }) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="mx-lab-system-grid" data-count={items.length}>
      {items.map((item, index) => (
        <SemanticSystemCard
          key={item.title}
          item={item}
          selected={selected === index}
          onSelect={() => setSelected(index)}
        />
      ))}
    </div>
  )
}

function PracticeSystemExperiment({ mode }) {
  const items = [
    {
      title: 'Нейротренажёр',
      meta: 'связи собираются в один ясный маршрут',
      kind: 'neuro',
      label: 'тренировка связи',
      activeLabel: 'связь активна',
    },
    {
      title: 'Дыхание',
      meta: 'две доли освобождают место для вдоха',
      kind: 'breath',
      label: 'практика дыхания',
      activeLabel: 'идёт вдох',
    },
    {
      title: 'Фокус',
      meta: 'поле сужается до выбранной точки',
      kind: 'focus',
      label: 'инструмент внимания',
      activeLabel: 'фокус найден',
    },
    {
      title: 'Медитация',
      meta: 'внутренние волны возвращаются к тишине',
      kind: 'meditation',
      label: 'практика тишины',
      activeLabel: 'внимание осело',
    },
  ]

  return (
    <ExperimentShell
      number="22"
      eyebrow="Практики Mentalix"
      title="У каждого инструмента — собственная работа формы"
      purpose="Не набор абстрактных кругов, а четыре понятных процесса: нейронная связь собирается, дыхание раскрывается, оптика фокуса сужается, а волны медитации оседают. Нажмите на карточку, чтобы увидеть её смысловое состояние."
      mode={mode}
    >
      <SemanticSystemGrid items={items} />
    </ExperimentShell>
  )
}

function MentorSystemExperiment({ mode }) {
  const items = [
    {
      title: 'Наставник',
      meta: 'помогает сверить направление',
      kind: 'mentor',
      label: 'роль проводника',
      activeLabel: 'курс выстроен',
    },
    {
      title: 'Собеседник',
      meta: 'слышит и возвращает мысль яснее',
      kind: 'companion',
      label: 'роль диалога',
      activeLabel: 'контакт установлен',
    },
    {
      title: 'Следопыт',
      meta: 'показывает следующий достижимый след',
      kind: 'pathfinder',
      label: 'роль маршрута',
      activeLabel: 'след найден',
    },
  ]

  return (
    <ExperimentShell
      number="23"
      eyebrow="Раздел наставника"
      title="Три роли говорят разной геометрией"
      purpose="Наставник выстраивает курс, Собеседник соединяет две стороны разговора, Следопыт проводит живую точку к следующему следу. Так роль считывается ещё до текста и не превращается в безымянную декоративную иконку."
      mode={mode}
    >
      <SemanticSystemGrid items={items} />
    </ExperimentShell>
  )
}

function ArticleSystemExperiment({ mode }) {
  const items = [
    {
      title: 'Тревога',
      meta: 'распутать напряжение до ровной опоры',
      kind: 'anxiety',
      label: 'тема состояния',
      activeLabel: 'контур распутан',
    },
    {
      title: 'Сон',
      meta: 'закрыть внешний контур и отпустить день',
      kind: 'sleep',
      label: 'тема восстановления',
      activeLabel: 'контур закрыт',
    },
    {
      title: 'Новая тема',
      meta: 'каркас для будущей функции или статьи',
      kind: 'template',
      label: 'расширяемая система',
      activeLabel: 'смысл собран',
    },
  ]

  return (
    <ExperimentShell
      number="24"
      eyebrow="Статьи и новые функции"
      title="Тема получает знак из своего внутреннего действия"
      purpose="Тревога распутывается в опору, сон мягко закрывает внешний контур, а модульная рамка показывает правило для будущих тем: сначала определяется смысл действия, затем вокруг него строится уникальная геометрия."
      mode={mode}
    >
      <SemanticSystemGrid items={items} />
    </ExperimentShell>
  )
}

function MyPathCardExperiment({ mode }) {
  const [drawKey, setDrawKey] = useState(0)

  return (
    <ExperimentShell
      number="25"
      eyebrow="Askeza / Ritual · «Мой путь»"
      title="Путь нарисован сразу — движется точка, а не линия"
      purpose="Линии показаны сразу полностью и статично — путь уже существует. Акцентная точка едет по готовому маршруту, и тонкий золотой оверлей растёт следом за ней до её текущей позиции: «иду по пути», а не «путь рисуется»."
      mode={mode}
    >
      <div className="mx-lab-my-path">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '180px' }}>
            <MyPathGlyph key={`progress-${drawKey}`} animated={mode === 'after'} />
          </div>
        </div>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(var(--c-line), 0.16)',
          }}
        >
          <p
            style={{ fontSize: '0.8rem', opacity: 0.68, textAlign: 'center', marginBottom: '1rem' }}
          >
            Акцентный цвет — вариант для сравнения (закреплён в PR #143)
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <MyPathGlyph key={`primary-${drawKey}`} animated={mode === 'after'} />
              <small style={{ opacity: 0.68 }}>Основной (золото)</small>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <MyPathGlyph
                key={`secondary-${drawKey}`}
                animated={mode === 'after'}
                accent="secondary"
              />
              <small style={{ opacity: 0.68 }}>Вариант (#C77D7A)</small>
            </div>
          </div>
        </div>

        <div className="mx-lab-my-path__copy">
          <small>Пилот · только ui-lab</small>
          <strong>Мой путь</strong>
          <span>
            В прод не деплоится — карточка ждёт отдельного решения о переносе в Askeza/Ritual.
          </span>
        </div>

        <button
          type="button"
          className="mx-lab-primary"
          onClick={() => setDrawKey(value => value + 1)}
        >
          <RotateCcw size={17} />
          Проиграть снова
        </button>
      </div>
    </ExperimentShell>
  )
}

function RitualAscezaStylesExperiment({ mode }) {
  const [selected, setSelected] = useState(0)
  const rituals = [
    { title: 'Стакан воды', kind: 'ritual', variant: 'primary' },
    { title: 'Стакан воды', kind: 'ritual', variant: 'secondary' },
    { title: 'Аскеза', kind: 'asceza', variant: 'primary' },
    { title: 'Аскеза', kind: 'asceza', variant: 'secondary' },
  ]

  return (
    <ExperimentShell
      number="26"
      eyebrow="Стиль Ritual & Askeza"
      title="Два цветовых варианта для различения категорий"
      purpose="Золотой акцент (основной) для Askeza/Ritual. Медный/лиловый акцент (вариант) для будущих категорий (например, Наставник). Оба варианта показаны рядом. Не деплоится в прод — только в ui-lab (при ?ui_lab=1)."
      mode={mode}
    >
      <div
        className="mx-lab-styles-comparison"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}
      >
        {rituals.map((ritual, index) => (
          <div
            key={`${ritual.kind}-${ritual.variant}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(var(--c-line), 0.24)',
            }}
          >
            <div style={{ width: '80px', height: '80px' }}>
              <SemanticGlyph
                kind={ritual.kind}
                animated={selected === index}
                highlighted={selected === index}
                accent={ritual.variant === 'secondary' ? 'secondary' : undefined}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <small style={{ opacity: 0.68 }}>
                {ritual.variant === 'primary' ? 'Основной' : 'Вариант'}
              </small>
              <strong style={{ display: 'block' }}>{ritual.title}</strong>
              <span style={{ fontSize: '0.875rem', opacity: 0.56 }}>{ritual.kind}</span>
            </div>
          </div>
        ))}
      </div>
    </ExperimentShell>
  )
}

export default function UiExperiments() {
  const [mode, setMode] = useState('after')

  return (
    <main className="mx-lab" data-mode={mode}>
      <header className="mx-lab-header">
        <div className="mx-lab-header__mark" aria-hidden="true">
          <span />
        </div>

        <p className="mx-lab-kicker">Mentalix · лаборатория интерфейса</p>

        <UiLabSwitch active="experiments" />

        <h1>Движение, которое помогает сделать шаг.</h1>

        <p className="mx-lab-intro">
          Двадцать пять изолированных прототипов. Они не меняют продуктовые данные и доступны только
          в режиме разработки.
        </p>

        <div className="mx-lab-toggle" role="group" aria-label="Сравнение вариантов">
          <span className="mx-lab-toggle__indicator" data-side={mode} aria-hidden="true" />

          <button type="button" aria-pressed={mode === 'before'} onClick={() => setMode('before')}>
            Текущий
          </button>

          <button type="button" aria-pressed={mode === 'after'} onClick={() => setMode('after')}>
            Эксперимент
          </button>
        </div>

        <p className="mx-lab-mode-note" aria-live="polite">
          {mode === 'after'
            ? 'Анимация объясняет состояние и подтверждает действие.'
            : 'Состояния переключаются без пространственного и тактильного контекста.'}
        </p>
      </header>

      <TodayScreenPreview mode={mode} />

      <div className="mx-lab-list">
        <ExpansionExperiment mode={mode} />
        <FocusExperiment mode={mode} />
        <CompletionExperiment mode={mode} />
        <BreathingExperiment mode={mode} />
        <CheckinExperiment mode={mode} />
        <GoldenSpiralExperiment mode={mode} />
        <GoldenEllipseExperiment mode={mode} />
        <GoldenApertureExperiment mode={mode} />
        <SoftFacetExperiment mode={mode} />
        <FillingRitualExperiment mode={mode} />
        <PetalBreathingExperiment mode={mode} />
        <ChoiceLensExperiment mode={mode} />
        <LivingContourExperiment mode={mode} />
        <BreathingWaveExperiment mode={mode} />
        <FibonacciRouteExperiment mode={mode} />
        <NextStepGateExperiment mode={mode} />
        <FlowRouteExperiment mode={mode} />
        <ResonanceExperiment mode={mode} />
        <SemanticAtlasExperiment mode={mode} />
        <RitualCardsExperiment mode={mode} />
        <AscezaCardsExperiment mode={mode} />
        <PracticeSystemExperiment mode={mode} />
        <MentorSystemExperiment mode={mode} />
        <ArticleSystemExperiment mode={mode} />
        <MyPathCardExperiment mode={mode} />
        <RitualAscezaStylesExperiment mode={mode} />
      </div>

      <footer className="mx-lab-footer">
        <span />
        Прототипы не подключены к API
        <span />
      </footer>
    </main>
  )
}
