import { useEffect, useMemo, useState } from 'react'
import { Flame, ChevronRight } from 'lucide-react'

import BackButton from '../components/BackButton'
import { MotifArt } from '../components/Motif'
import StreakBar from '../components/StreakBar'
import { api } from '../lib/api'
import { buildSeriesViewModel } from '../lib/series'

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-emerald-light/15 px-4 py-3">
      <div className="font-display text-[20px] text-cream">{value}</div>
      <div className="mx-type-meta mt-1 text-faint">{label}</div>
    </div>
  )
}

function BadgeRow({ badge, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(badge)}
      className="flex w-full items-center gap-3 rounded-2xl border border-cream/10 bg-emerald-light/15 px-3 py-3 text-left transition-transform active:scale-[0.99]"
      aria-label={`${badge.title}: открыть подробности`}
    >
      <MotifArt name={badge.motif} size={48} className={badge.done ? '' : 'opacity-40'} />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13px] leading-tight ${badge.done ? 'text-cream' : 'text-muted'}`}
        >
          {badge.title}
        </span>
        <span className="mt-1 block text-[11px] leading-snug text-faint">{badge.desc}</span>
        {!badge.done && (
          <span className="mt-1.5 block font-mono text-[10px] text-faint">
            {badge.progress}/{badge.goal}
          </span>
        )}
      </span>
      <ChevronRight size={16} className="shrink-0 text-faint" aria-hidden="true" />
    </button>
  )
}

function BadgeDetail({ badge, onBack }) {
  return (
    <div className="w-full max-w-md px-5 pb-8">
      <div className="flex items-center gap-3 py-4">
        <BackButton onClick={onBack} />
        <span className="mx-type-meta text-muted">Веха пути</span>
      </div>
      <div className="rounded-[28px] border border-cream/10 bg-emerald-light/15 px-5 py-7 text-center">
        <MotifArt name={badge.motif} size={112} className={badge.done ? '' : 'opacity-40'} />
        <h2 className="mt-4 font-display text-[24px] text-cream">{badge.title}</h2>
        <p className="mx-type-body mt-2 text-muted">{badge.desc}</p>
        <div className="mt-5 rounded-2xl bg-emerald px-4 py-3">
          <div className="flex items-center justify-between text-[11px] text-faint">
            <span>{badge.done ? 'Открыто' : 'Прогресс'}</span>
            <span>
              {badge.progress}/{badge.goal}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream/10">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${Math.min(100, (badge.progress / badge.goal) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SeriesBadges({ user, onBack }) {
  const [model, setModel] = useState(null)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      api.profile.get(user.id),
      api.checkin.history(user.id, 90),
      api.rituals.list(user.id),
      api.ascezas.list(user.id),
    ])
      .then(([stats, checkins, rituals, ascezas]) => {
        if (active) {
          setModel(buildSeriesViewModel({ stats, checkins, rituals, ascezas }))
        }
      })
      .catch(() => {
        if (active) setError(true)
      })

    return () => {
      active = false
    }
  }, [user.id])

  const unlocked = useMemo(() => model?.badges.filter(badge => badge.done) || [], [model])
  const upcoming = useMemo(() => model?.badges.filter(badge => !badge.done) || [], [model])

  if (selectedBadge) {
    return <BadgeDetail badge={selectedBadge} onBack={() => setSelectedBadge(null)} />
  }

  return (
    <div className="w-full max-w-md px-5 pb-8 animate-fade-in">
      <div className="flex items-center gap-3 py-4">
        <BackButton onClick={onBack} />
        <h1 className="font-display text-[20px] lowercase text-cream">серии и вехи.</h1>
      </div>

      {error && (
        <div className="rounded-2xl border border-cream/10 bg-emerald-light/15 px-4 py-4 text-[13px] text-muted">
          Не удалось загрузить серии и вехи. Попробуй открыть экран ещё раз.
        </div>
      )}

      {!error && !model && (
        <p role="status" className="px-1 pt-4 text-[13px] text-muted">
          Собираю твой путь…
        </p>
      )}

      {model && (
        <>
          <section className="rounded-[28px] border border-gold/25 bg-emerald-light/15 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <Flame size={25} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="mx-type-meta text-faint">текущая серия</div>
                <div className="mt-1 font-display text-[25px] text-cream">
                  {model.currentStreak} {model.currentStreak === 1 ? 'день' : 'дней'} подряд
                </div>
              </div>
            </div>
            <div className="mt-5">
              <StreakBar streak={model.currentStreak} />
            </div>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="дней в системе" value={model.activeDays} />
            <Stat label="чек-инов" value={model.totalCheckins} />
            <Stat label="личный максимум" value={model.bestStreak} />
            <Stat label="вех открыто" value={`${unlocked.length}/${model.badges.length}`} />
          </div>

          {unlocked.length > 0 && (
            <section className="mt-7">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[13px] text-cream">Открыто</h2>
                <span className="mx-type-meta text-faint">{unlocked.length}</span>
              </div>
              <div className="space-y-2">
                {unlocked.map(badge => (
                  <BadgeRow key={badge.id} badge={badge} onOpen={setSelectedBadge} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="mt-7">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[13px] text-cream">Следующие вехи</h2>
                <span className="mx-type-meta text-faint">{upcoming.length}</span>
              </div>
              <div className="space-y-2">
                {upcoming.map(badge => (
                  <BadgeRow key={badge.id} badge={badge} onOpen={setSelectedBadge} />
                ))}
              </div>
            </section>
          )}

          {model.badges.length === 0 && (
            <p className="mt-7 text-[13px] leading-relaxed text-muted">
              Вехи появятся по мере движения.
            </p>
          )}
        </>
      )}
    </div>
  )
}
