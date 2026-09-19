import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { readLocal, writeLocal } from '../lib/store'
import { cloud } from '../platform/telegram.hooks'
import { MotifArt } from '../components/Motif'
import { buildBadges } from '../lib/badges'
import { loadIndependentSources, retrySources } from '../lib/pathDataLoader'

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
  const [loadResult, setLoadResult] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!user) return
    const previous = reloadToken > 0 ? loadResult : null
    loadIndependentSources(
      {
        stats: () => api.profile.get(user.id),
        rituals: () => api.rituals.list(user.id),
        ascezas: () => api.ascezas.list(user.id),
      },
      { only: previous ? retrySources(previous) : null, previous }
    ).then(result => {
      setLoadResult(result)
      if (result.status !== 'success') return
      const list = buildBadges(result.data)
      setBadges(list)
      // Обязательные источники успешны: только теперь меняем seen-состояние.
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
    // loadResult is the intentional retry snapshot, not a fetch dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken, user])

  if (!badges && !loadResult) return <p className="text-[13px] text-muted mb-6">Загружаю вехи...</p>
  if (!badges) {
    const auth = loadResult?.status === 'auth'
    return (
      <div className="mb-6" role="alert">
        <p className="text-[13px] text-muted">
          {auth ? 'Вехи требуют повторной авторизации.' : 'Не удалось загрузить вехи полностью.'}
        </p>
        <button
          type="button"
          onClick={() => setReloadToken(value => value + 1)}
          className="mt-3 min-h-11 rounded-full bg-cream px-4 py-2 text-[13px] font-semibold text-emerald-deep"
        >
          Повторить
        </button>
      </div>
    )
  }

  const unlockedCount = badges.filter(b => b.done).length

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-[13px] text-cream">Вехи Пути</h3>
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
