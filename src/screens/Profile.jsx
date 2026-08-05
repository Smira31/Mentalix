import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Achievements from './Achievements'

// ============================================================
// МОЙ ПУТЬ
//
// Профиль показывает историю человека, а не витрину цифр.
// Вехи собираются из того, что действительно есть в данных:
// первый чек-ин, текущая серия закрытых дней, аскезы, которые
// держатся, пройденные темы, датированные срывы.
//
// Событие попадает в ленту только если его можно чем-то
// подтвердить. Ничего не достраиваем ради красивой хронологии:
// пустой путь честнее выдуманного.
// ============================================================

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]


function formatDay(iso) {
  const date = new Date(iso + 'T00:00:00')

  if (Number.isNaN(date.getTime())) return ''

  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}


function currentStreak(checkins) {
  let streak = 0

  for (let i = checkins.length - 1; i >= 0; i -= 1) {
    if (!checkins[i]?.review_completed_at) break

    streak += 1
  }

  return streak
}


function buildPath({ checkins, ascezas, rituals, themes, activity }) {
  const now = []
  const dated = []

  const streak = currentStreak(checkins)

  if (streak >= 2) {
    now.push({
      mark: 'сейчас',
      text: `${streak} закрытых дней подряд — серия идёт прямо сейчас.`,
      strong: true,
    })
  }


  for (const asceza of [...(ascezas || [])]
    .filter((item) => (item.held_days || 0) >= 3)
    .sort((a, b) => (b.held_days || 0) - (a.held_days || 0))
    .slice(0, 3)) {
    now.push({
      mark: 'держится',
      text: `«${asceza.name}» — ${asceza.held_days} дней без срыва.`,
      strong: (asceza.breaks || 0) === 0,
    })
  }


  const bestRitual = [...(rituals || [])]
    .sort(
      (a, b) =>
        (b.completion_rate || 0) - (a.completion_rate || 0),
    )[0]

  if (bestRitual && (bestRitual.completion_rate || 0) >= 70) {
    now.push({
      mark: 'ритуал',
      text: `«${bestRitual.name}» держится на ${Math.round(bestRitual.completion_rate)}%.`,
    })
  }


  for (const theme of themes || []) {
    if (
      theme.total_days
      && theme.reflected_days === theme.total_days
    ) {
      now.push({
        mark: 'пройдено',
        text: `Тема «${theme.title}» пройдена целиком.`,
        strong: true,
      })
    }
  }


  for (const day of (activity || [])
    .filter((item) => item.breaks > 0)
    .slice(-4)) {
    dated.push({
      date: day.date,
      mark: formatDay(day.date),
      text:
        day.breaks === 1
          ? 'Срыв аскезы. Отмечен честно — это тоже часть пути.'
          : `${day.breaks} срыва за день. Отмечены честно.`,
    })
  }


  const first = checkins?.[0]

  if (first?.date) {
    dated.push({
      date: first.date,
      mark: formatDay(first.date),
      text: 'Начало. Первый чек-ин.',
      strong: true,
      last: true,
    })
  }


  dated.sort((a, b) => String(b.date).localeCompare(String(a.date)))

  return [...now, ...dated]
}


function PathEvent({ event, isLast }) {
  return (
    <div className="flex gap-3.5">
      <div className="w-[9px] flex flex-col items-center shrink-0">
        <span
          className={[
            'w-[7px] h-[7px] rounded-full mt-[7px] shrink-0',
            event.strong ? 'bg-gold' : 'bg-cream/25',
          ].join(' ')}
        />

        {!isLast && (
          <span className="w-px flex-1 bg-cream/10" />
        )}
      </div>

      <div className={isLast ? 'pb-1' : 'pb-5'}>
        <div className="text-[11px] text-faint mb-1">
          {event.mark}
        </div>

        <p className="text-[14px] text-cream/75 leading-snug">
          {event.text}
        </p>
      </div>
    </div>
  )
}


export default function Profile({ user }) {
  const [stats, setStats] = useState(null)
  const [path, setPath] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    Promise.all([
      api.profile.get(user.id),
      api.checkin.history(user.id, 90).catch(() => []),
      api.ascezas.list(user.id).catch(() => []),
      api.rituals.list(user.id).catch(() => []),
      api.themes.list(user.id).catch(() => []),
      api.analytics.get(user.id, 90).catch(() => null),
    ])
      .then(([profile, checkins, ascezas, rituals, themes, analytics]) => {
        setStats(profile)

        setPath(
          buildPath({
            checkins: checkins || [],
            ascezas: ascezas || [],
            rituals: rituals || [],
            themes: themes || [],
            activity: analytics?.daily_activity || [],
          }),
        )
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="w-full max-w-md px-5 animate-fade-in">
      <div className="flex items-center gap-3.5 mt-4 mb-7">
        <div className="w-12 h-12 rounded-full border border-gold/60 flex items-center justify-center shrink-0">
          <span className="font-display text-[18px] text-gold">
            {user.first_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-[22px] text-cream leading-tight truncate">
            {user.first_name}
          </h2>

          {stats && (
            <p className="text-[12px] text-faint mt-0.5">
              {stats.days_active} дней в системе · {stats.total_checkins} чек-инов
            </p>
          )}
        </div>
      </div>


      <h3 className="font-display text-[30px] text-cream lowercase mb-5">
        мой путь.
      </h3>

      {loading && (
        <p className="text-cream/40 text-sm mb-8">Собираю историю...</p>
      )}

      {!loading && path.length === 0 && (
        <p className="text-[14px] text-cream/45 leading-relaxed mb-8">
          Путь начнётся с первого чек-ина. Здесь появятся серии,
          удержанные аскезы и пройденные темы — всё, что было на
          самом деле.
        </p>
      )}

      {!loading && path.length > 0 && (
        <div className="mb-8">
          {path.map((event, index) => (
            <PathEvent
              key={index}
              event={event}
              isLast={index === path.length - 1}
            />
          ))}
        </div>
      )}

      {!loading && stats?.best_streak > 0 && (
        <div className="rounded-[22px] border border-gold/25 bg-emerald px-5 py-4 mb-8">
          <div className="text-[11px] text-faint mb-1">личный максимум</div>

          <p className="text-[15px] text-cream/80 leading-snug">
            Лучшая серия — {stats.best_streak} дней подряд.
          </p>
        </div>
      )}


      <Achievements user={user} />
    </div>
  )
}
