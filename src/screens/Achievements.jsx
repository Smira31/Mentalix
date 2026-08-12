import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { readLocal, writeLocal } from '../lib/store'
import { cloud } from '../platform/telegram.hooks'
import { MotifArt } from '../components/Motif'

// ── Вехи Пути: достижения без давления — фиксация пройденного, не гонка ──
// Считаются на лету из существующих данных, бэкенд не нужен.

const SEEN_KEY = 'mx-badges-seen'

/*
 * Какие вехи человеку уже показывали. Хранится и локально, и в
 * облаке: иначе на втором устройстве все прошлые достижения
 * «откроются» заново и вместе с ними придёт вибрация — праздник
 * по поводу того, что случилось месяц назад.
 *
 * При расхождении списки объединяются, а не заменяют друг друга:
 * веху, показанную хоть где-то, второй раз показывать не нужно.
 */
function parseIds(raw) {
  try {
    const list = JSON.parse(raw || '[]')

    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function readSeen() {
  return parseIds(readLocal(SEEN_KEY))
}

async function readSeenEverywhere() {
  const local = readSeen()
  const remote = parseIds(await cloud.get(SEEN_KEY))

  return Array.from(new Set([...local, ...remote]))
}

function writeSeen(ids) {
  const raw = JSON.stringify(ids)

  writeLocal(SEEN_KEY, raw)
  cloud.set(SEEN_KEY, raw)
}

function buildBadges({ stats, rituals, ascezas }) {
  const bestRitual = Math.max(0, ...rituals.map((r) => r.streak || 0))
  const bestAsceza = Math.max(0, ...ascezas.map((a) => a.streak || 0))
  const checkins = stats?.total_checkins || 0
  const days = stats?.days_active || 0

  return [
    {
      id: 'first-step',
      motif: 'voshod',
      title: 'Первый шаг',
      desc: 'Первый чек-ин пройден',
      done: checkins >= 1,
      progress: Math.min(checkins, 1),
      goal: 1,
    },
    {
      id: 'voice-heard',
      motif: 'sobesednik',
      title: 'Голос услышан',
      desc: '5 чек-инов — привычка слышать себя',
      done: checkins >= 5,
      progress: Math.min(checkins, 5),
      goal: 5,
    },
    {
      id: 'week-on-path',
      motif: 'ryad',
      title: 'Неделя пути',
      desc: '7 дней в системе',
      done: days >= 7,
      progress: Math.min(days, 7),
      goal: 7,
    },
    {
      id: 'ritual-holds',
      motif: 'lestnica',
      title: 'Ритуал держит',
      desc: 'Серия ритуала — 7 дней',
      done: bestRitual >= 7,
      progress: Math.min(bestRitual, 7),
      goal: 7,
    },
    {
      id: 'asceza-power',
      motif: 'povedenie',
      title: 'Аскеза — сила',
      desc: '7 чистых дней отказа',
      done: bestAsceza >= 7,
      progress: Math.min(bestAsceza, 7),
      goal: 7,
    },
    {
      id: 'month-on-path',
      motif: 'noch',
      title: 'Месяц пути',
      desc: '30 дней в системе',
      done: days >= 30,
      progress: Math.min(days, 30),
      goal: 30,
    },
  ]
}

export default function Achievements({ user }) {
  const [badges, setBadges] = useState(null)
  const [freshIds, setFreshIds] = useState([])

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.profile.get(user.id).catch(() => null),
      api.rituals.list(user.id).catch(() => []),
      api.ascezas.list(user.id).catch(() => []),
    ]).then(([stats, rituals, ascezas]) => {
      const list = buildBadges({ stats, rituals, ascezas })
      setBadges(list)
      // отмечаем новые открытые вехи
      readSeenEverywhere().then((seen) => {
        const unlocked = list.filter((b) => b.done).map((b) => b.id)
        const fresh = unlocked.filter((id) => !seen.includes(id))

        if (fresh.length > 0) {
          setFreshIds(fresh)
          platform.haptic('success')
        }

        writeSeen(Array.from(new Set([...seen, ...unlocked])))
      })
    })
  }, [user])

  if (!badges) return null

  const unlockedCount = badges.filter((b) => b.done).length

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm text-cream">Вехи Пути</h3>
        <span className="text-[11px] text-muted">{unlockedCount} из {badges.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mx-stagger">
        {badges.map((b) => (
          <div
            key={b.id}
            className={[
              'rounded-2xl p-3 flex flex-col items-center text-center relative',
              b.done ? 'bg-gold/10 border border-gold/25' : 'bg-emerald-light/15 border border-cream/8',
            ].join(' ')}
          >
            {freshIds.includes(b.id) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold animate-celebrate-pop" />
            )}
            <MotifArt name={b.motif} size={72} className={b.done ? 'mb-2' : 'mb-2 opacity-40'} />
            <span className={`text-[11px] font-bold leading-tight ${b.done ? 'text-cream' : 'text-muted'}`}>
              {b.title}
            </span>
            <span className="text-[9px] text-faint leading-tight mt-1">{b.desc}</span>
            {!b.done && (
              <span className="text-[9px] font-mono text-faint mt-1.5">
                {b.progress}/{b.goal}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
