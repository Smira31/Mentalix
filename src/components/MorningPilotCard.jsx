import {
  useEffect,
  useState,
} from 'react'

import {
  BatteryLow,
  ChevronRight,
  Clock3,
} from 'lucide-react'

import { platform } from '../platform'
import {
  clearMorningPilotDecision,
  isMorningPilotTime,
  morningRituals,
  readMorningPilotDay,
  recordMorningPilotEvent,
} from '../lib/morningPilot'


const RESOLUTION_COPY = {
  no_time: {
    title: 'Сохрани время',
    body:
      'План останется в ритуалах. Сегодня без долга.',
  },
  low_energy: {
    title: 'Сначала ресурс',
    body:
      'Не дави на себя. Верни план, если состояние изменится.',
  },
}


export default function MorningPilotCard({
  userId,
  rituals,
  onOpenRituals,
  now = null,
}) {
  const [currentDate] =
    useState(() =>
      now || new Date(),
    )

  const [dayState, setDayState] =
    useState(() =>
      readMorningPilotDay(
        userId,
        currentDate,
      ),
    )

  const isMorning =
    isMorningPilotTime(
      currentDate,
    )

  const pilotVisible =
    isMorning
    || Boolean(dayState?.viewed_at)

  const visibleRituals =
    morningRituals(rituals)


  useEffect(() => {
    setDayState(
      readMorningPilotDay(
        userId,
        currentDate,
      ),
    )
  }, [
    currentDate,
    userId,
  ])


  useEffect(() => {
    if (
      !isMorning
      || dayState?.viewed_at
    ) {
      return
    }

    setDayState(
      recordMorningPilotEvent(
        userId,
        'viewed',
        currentDate,
      ),
    )
  }, [
    dayState?.viewed_at,
    isMorning,
    currentDate,
    userId,
  ])


  if (!pilotVisible) {
    return null
  }


  const resolution =
    RESOLUTION_COPY[
      dayState?.outcome
    ]


  if (resolution) {
    return (
      <div className="rounded-[24px] bg-emerald px-5 py-4 mb-4 border border-cream/10 animate-fade-in">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-gold/70 mb-1">
          Утро учтено
        </span>

        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-[18px] text-cream">
              {resolution.title}
            </h2>

            <p className="text-[12px] text-cream/45 mt-1 leading-relaxed">
              {resolution.body}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              platform.haptic(
                'light',
              )

              setDayState(
                clearMorningPilotDecision(
                  userId,
                  currentDate,
                ),
              )
            }}
            className="shrink-0 text-[12px] font-semibold text-cream/45 bg-transparent border-0 px-2 py-2"
          >
            вернуть
          </button>
        </div>
      </div>
    )
  }


  function chooseOutcome(outcome) {
    platform.haptic('light')

    setDayState(
      recordMorningPilotEvent(
        userId,
        outcome,
        currentDate,
      ),
    )
  }


  function openRituals() {
    platform.haptic('medium')

    setDayState(
      recordMorningPilotEvent(
        userId,
        'opened_rituals',
        currentDate,
      ),
    )

    onOpenRituals()
  }


  return (
    <section className="rounded-[28px] bg-emerald px-5 py-5 mb-4 border border-cream/10 animate-fade-in">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-gold/70 mb-2">
        Пилот · утро
      </span>

      <h2 className="font-display text-[22px] text-cream leading-tight">
        До других дел
      </h2>

      <p className="text-[13px] text-cream/45 mt-1 leading-relaxed">
        Один ближайший шаг — не весь день.
      </p>

      {visibleRituals.length > 0 ? (
        <div className="mt-4 space-y-2">
          {visibleRituals.map(
            (ritual, index) => (
              <div
                key={ritual.id}
                className={[
                  'rounded-2xl px-4 py-3 flex items-center gap-3',
                  index === 0
                    ? 'bg-gold/10 border border-gold/25'
                    : 'bg-cream/5 border border-transparent',
                ].join(' ')}
              >
                <span
                  className={[
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                    index === 0
                      ? 'bg-gold text-emerald-deep'
                      : 'bg-cream/10 text-cream/45',
                  ].join(' ')}
                >
                  {index + 1}
                </span>

                <span className="flex-1 min-w-0 text-left">
                  <span className="block text-[14px] font-bold text-cream truncate">
                    {ritual.name}
                  </span>

                  {ritual.min_version && (
                    <span className="block text-[11px] text-cream/40 truncate mt-0.5">
                      минимум:{' '}
                      {ritual.min_version}
                    </span>
                  )}
                </span>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-cream/5 px-4 py-4 mt-4">
          <p className="text-[13px] text-cream/55 leading-relaxed">
            Добавь один ритуал, который важно увидеть утром.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={openRituals}
        className="cta-pill w-full text-[14px] px-6 py-3.5 mt-4 flex items-center justify-center gap-2"
      >
        {visibleRituals.length > 0
          ? 'Открыть первый шаг'
          : 'Добавить ритуал'}

        <ChevronRight
          size={16}
          strokeWidth={2.2}
        />
      </button>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          type="button"
          onClick={() =>
            chooseOutcome(
              'no_time',
            )
          }
          className="rounded-full bg-cream/5 border-0 text-cream/45 text-[12px] font-semibold py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <Clock3 size={14} />
          Не успеваю
        </button>

        <button
          type="button"
          onClick={() =>
            chooseOutcome(
              'low_energy',
            )
          }
          className="rounded-full bg-cream/5 border-0 text-cream/45 text-[12px] font-semibold py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <BatteryLow size={14} />
          Нет сил
        </button>
      </div>
    </section>
  )
}
