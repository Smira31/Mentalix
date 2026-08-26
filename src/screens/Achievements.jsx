import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { readLocal, writeLocal } from '../lib/store'
import { cloud } from '../platform/telegram.hooks'
import { MotifArt } from '../components/Motif'
import { buildBadges } from '../lib/badges'

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
      readSeenEverywhere().then(seen => {
        const unlocked = list.filter(b => b.done).map(b => b.id)
        const fresh = unlocked.filter(id => !seen.includes(id))

        if (fresh.length > 0) {
          setFreshIds(fresh)
          platform.haptic('success')
        }

        writeSeen(Array.from(new Set([...seen, ...unlocked])))
      })
    })
  }, [user])

  if (!badges) return null

  const unlockedCount = badges.filter(b => b.done).length

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm text-cream">Вехи Пути</h3>
        <span className="text-[11px] text-muted">
          {unlockedCount} из {badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mx-stagger">
        {badges.map(b => (
          <div
            key={b.id}
            className={[
              'rounded-2xl p-3 flex flex-col items-center text-center relative',
              b.done
                ? 'bg-gold/10 border border-gold/25'
                : 'bg-emerald-light/15 border border-cream/8',
            ].join(' ')}
          >
            {freshIds.includes(b.id) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold animate-celebrate-pop" />
            )}
            <MotifArt name={b.motif} size={72} className={b.done ? 'mb-2' : 'mb-2 opacity-40'} />
            <span
              className={`text-[11px] font-bold leading-tight ${b.done ? 'text-cream' : 'text-muted'}`}
            >
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
