import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// ============================================================
// О ТЕБЕ
//
// Только данные человека: имя и статистика из профиля (один раз, под именем).
// Лента пути, «личный максимум» и вехи убраны — серия и
// значки уже есть в шторке серии.
// ============================================================

export default function Profile({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!user) return
    let active = true

    api.profile
      .get(user.id)
      .then(data => {
        if (!active) return
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, reloadToken])

  function retryProfile() {
    setLoading(true)
    setError(false)
    setReloadToken(token => token + 1)
  }

  return (
    <div
      className="w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in"
      data-testid="profile-about"
    >
      <div className="flex items-center gap-3.5 mt-4 mb-7">
        <div className="w-12 h-12 rounded-full border border-[rgb(var(--c-border))] bg-[rgb(var(--c-card2))] flex items-center justify-center shrink-0">
          <span className="font-display text-[16px] text-cream">
            {user.first_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-[20px] text-cream leading-tight truncate">
            {user.first_name}
          </h2>

          {stats && (
            <p className="text-[12px] text-muted mt-0.5" data-testid="profile-about-stats">
              {stats.days_active} дней в системе · {stats.total_checkins} чек-инов
            </p>
          )}
        </div>
      </div>

      {loading && <p className="text-muted text-[13px]">Загрузка…</p>}

      {error && (
        <div role="alert" className="mb-4">
          <p className="text-[13px] leading-relaxed text-muted">
            Не удалось загрузить профиль. Попробуй ещё раз.
          </p>
          <button
            type="button"
            onClick={retryProfile}
            className="mt-5 min-h-11 rounded-full bg-cream px-4 py-2 text-[13px] font-semibold text-emerald-deep"
          >
            Повторить
          </button>
        </div>
      )}
    </div>
  )
}
