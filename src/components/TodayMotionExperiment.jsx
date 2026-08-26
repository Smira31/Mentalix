import { ArrowRight, ChevronDown } from 'lucide-react'

import './TodayMotionExperiment.css'

const THREAD_LABELS = ['Идея', 'Действие', 'Анализ', 'Новый шаг']

const THREAD_POINTS = [
  [22, 28],
  [108, 12],
  [205, 30],
  [298, 15],
]

const THREAD_PATH = 'M22 28C52 3 78 4 108 12S165 38 205 30S260 5 298 15'

function threadState({ checkinDone, done, total, todayState }) {
  if (todayState === 'dayClosed') {
    return {
      current: 3,
      completedThrough: 3,
    }
  }

  if (todayState === 'reviewPending') {
    return {
      current: 3,
      completedThrough: 2,
    }
  }

  if (!checkinDone) {
    return {
      current: 0,
      completedThrough: -1,
    }
  }

  if (total > 0 && done >= total) {
    return {
      current: 3,
      completedThrough: 2,
    }
  }

  if (done > 0) {
    return {
      current: 2,
      completedThrough: 1,
    }
  }

  return {
    current: 1,
    completedThrough: 0,
  }
}

export function TodayCompareControl({ mode, onChange }) {
  return (
    <div className="mx-today-compare">
      <div className="mx-today-compare__copy">
        <span>Сравнение интерфейса</span>
        <small>
          {mode === 'after' ? 'Нить дня и раскрытие шага' : 'Текущий экран без эксперимента'}
        </small>
      </div>

      <div className="mx-today-compare__switch" role="group" aria-label="Сравнение вариантов">
        <span className="mx-today-compare__indicator" data-side={mode} aria-hidden="true" />

        <button type="button" aria-pressed={mode === 'before'} onClick={() => onChange('before')}>
          До
        </button>

        <button type="button" aria-pressed={mode === 'after'} onClick={() => onChange('after')}>
          После
        </button>
      </div>
    </div>
  )
}

export function DayThreadTrigger({ open, onToggle }) {
  return (
    <button
      type="button"
      className="mx-day-thread-launcher"
      data-open={open}
      aria-expanded={open}
      aria-label={open ? 'Свернуть цикл дня' : 'Открыть цикл дня'}
      onClick={onToggle}
    >
      <span className="mx-day-thread-launcher__mark" aria-hidden="true">
        <span />
      </span>
      <span>цикл</span>
    </button>
  )
}

export function DayThread({ checkinDone, done, open, onOpenChange, total, todayState }) {
  const { current, completedThrough } = threadState({
    checkinDone,
    done,
    total,
    todayState,
  })

  const progress = completedThrough < 0 ? 0 : completedThrough / 3

  return (
    <section
      className="mx-day-thread"
      data-open={open}
      aria-label="Цикл сегодняшнего дня"
      style={{
        '--mx-thread-progress': progress,
      }}
    >
      <button
        type="button"
        className="mx-day-thread__toggle"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span className="mx-day-thread__heading">
          <span>
            <strong>Цикл дня</strong>
            <small>{todayState === 'dayClosed' ? 'День завершён' : THREAD_LABELS[current]}</small>
          </span>

          <ChevronDown size={18} aria-hidden="true" />
        </span>

        <svg
          className="mx-day-thread__path"
          viewBox="0 0 320 40"
          role="img"
          aria-label={`Цикл дня: ${THREAD_LABELS[current]}`}
        >
          <path className="mx-day-thread__path-base" d={THREAD_PATH} pathLength="1" />
          <path
            className="mx-day-thread__path-progress"
            d={THREAD_PATH}
            pathLength="1"
            style={{
              strokeDashoffset: 1 - progress,
            }}
          />

          {THREAD_POINTS.map(([x, y], index) => {
            const completed = index <= completedThrough
            const active = index === current && !completed

            return (
              <g
                key={THREAD_LABELS[index]}
                className="mx-day-thread__path-node"
                data-completed={completed}
                data-active={active}
                transform={`translate(${x} ${y})`}
              >
                <circle r="8" />
                {completed && <path d="M-3 0L-1 2.5L3.5-3" />}
                {active && <circle className="mx-day-thread__path-dot" r="2.5" />}
              </g>
            )
          })}
        </svg>

        <span className="mx-day-thread__labels">
          {THREAD_LABELS.map((label, index) => (
            <span key={label} data-active={index === current}>
              {label}
            </span>
          ))}
        </span>
      </button>
    </section>
  )
}

export function FocusMark() {
  return (
    <div className="mx-today-focus-mark" aria-label="Одна главная точка внимания">
      <svg viewBox="0 0 120 72" role="img" aria-hidden="true">
        <path d="M12 42a48 48 0 0 1 96 0" />
        <path d="M26 42a34 34 0 0 1 68 0" />
        <path d="M60 7v24M60 53v13" />
        <circle cx="60" cy="42" r="4" />
      </svg>

      <span>одна точка внимания</span>
    </div>
  )
}

export function NextActionReveal({ next, remainingActionsText, onStart }) {
  return (
    <div className="mx-today-priority mx-today-priority--next">
      <small>Действие дня</small>
      <strong>{next.title}</strong>
      <span>{next.meta}</span>

      <button type="button" className="mx-today-priority__start" onClick={onStart}>
        <span>Начать</span>
        <ArrowRight size={17} aria-hidden="true" />
      </button>

      <p>{remainingActionsText}</p>
    </div>
  )
}

/*
 * «Разгрузить голову» в hero «Сегодня» (Цикл 0B): выбранный
 * фокус дня заменяет обычное «Самое важное», а не дополняет
 * его. До первого шага — только точка внимания и переход к
 * его формулировке; после — сам первый шаг как главное
 * действие, точка внимания уходит контекстом мельче под ним.
 * «Остальное» сюда не переносится — оно доступно только через
 * «изменить» (полный список виден на шаге pick флоу).
 */
export function FocusNextAction({ focus, onDefineFirstStep, onChangeFocus, onClearFocus }) {
  if (!focus?.firstStep) {
    return (
      <div className="mx-today-priority">
        <small>Точка внимания</small>
        <strong>{focus.picked}</strong>

        <button type="button" className="mx-today-priority__start" onClick={onDefineFirstStep}>
          <span>Определить первый шаг</span>
          <ArrowRight size={17} aria-hidden="true" />
        </button>

        <div className="mx-today-priority__links">
          <button type="button" onClick={onChangeFocus}>
            изменить
          </button>

          <button type="button" onClick={onClearFocus}>
            убрать
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-today-priority">
      <small>Один следующий шаг</small>
      <strong>{focus.firstStep}</strong>
      <span>{focus.picked}</span>

      <div className="mx-today-priority__links">
        <button type="button" onClick={onChangeFocus}>
          изменить
        </button>

        <button type="button" onClick={onClearFocus}>
          убрать
        </button>
      </div>
    </div>
  )
}
