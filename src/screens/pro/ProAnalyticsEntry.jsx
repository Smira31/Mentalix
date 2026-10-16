import { useEffect, useState } from 'react'

import { PRO_REVIEW_PLAN_ENABLED } from '../../lib/proFlag'
import { isGuestUser } from '../../lib/guestAuth'
import { isPreviewDemoMode } from '../../lib/demoMode'
import { api } from '../../lib/api'
import ProAnalyticsCard from './ProAnalyticsCard'
import ProShowcaseCard from './ProShowcaseCard'

/*
 * Витрина Pro: выбор карточки в аналитике по статусу Pro.
 *
 * Флаг VITE_PRO_REVIEW_PLAN_ENABLED — общий выключатель всей карточки:
 * если выключен, карточки нет ни у кого (как сейчас).
 *
 * Статус Pro определяется тем же способом, что использует приложение —
 * ответ /api/subscription (has_pro). Пока статус грузится, показывается
 * нейтральный скелетон, а не витрина: у платящих не мигает витрина.
 *
 * Гости — сразу non-pro без запроса: сервер вернёт 403/404, это не ошибка
 * интерфейса. Для не-Pro и гостей запросов к /api/pro/* нет.
 *
 * Dev-параметр ?proStatus=pro (только в dev/preview) переопределяет статус
 * для проверки карточки Pro без реальной подписки.
 */

/*
 * Демо-параметр ?proStatus=pro — только в dev/preview-сборке (как ?payState=).
 * В production-сборке неактивен. Позволяет проверить карточку Pro в превью
 * без реальной подписки.
 */
function getDemoProStatus() {
  if (typeof window === 'undefined') return null
  if (!isPreviewDemoMode()) return null
  if (!import.meta.env?.DEV && import.meta.env?.VITE_LOCAL_PREVIEW !== 'true') return null
  const value = new URLSearchParams(window.location.search).get('proStatus')
  return value === 'pro' ? 'pro' : null
}

/* Нейтральный скелетон: та же оболочка, что у карточки Pro, без содержания. */
function ProCardSkeleton() {
  return (
    <article
      className="mx-progress-card mx-pro-analytics-card mx-pro-analytics-card--loading"
      data-testid="progress-pro-card-skeleton"
      aria-busy="true"
    >
      <span className="mx-progress-card__head mx-pro-analytics-card__head">
        <span className="mx-progress-card__title mx-pro-analytics-card__title">
          Разбор и план недели
        </span>
        <span className="mx-progress-card__subtitle mx-pro-analytics-card__subtitle">
          Итоги недели
        </span>
      </span>
      <div className="mx-progress-practices__empty mx-pro-analytics-card__open">
        <span
          className="mx-progress-practices__empty-ring mx-pro-analytics-card__ring"
          aria-hidden="true"
        />
        <span className="mx-progress-practices__empty-text">
          <span className="mx-progress-practices__empty-dot" aria-hidden="true" />
          <span className="mx-progress-practices__empty-title">
            Проверяем готовность разбора
          </span>
          <span className="mx-progress-practices__empty-hint">
            Разбор соберётся из записей недели
          </span>
        </span>
      </div>
    </article>
  )
}

export default function ProAnalyticsEntry({
  user,
  onOpen,
  onOpenSubscription,
  refreshToken = 0,
}) {
  const [proStatus, setProStatus] = useState(() => {
    // Гости — сразу non-pro без запроса.
    if (!user || isGuestUser(user)) return 'non-pro'
    // Dev-параметр переопределяет для тестов.
    const demo = getDemoProStatus()
    if (demo === 'pro') return 'pro'
    return 'loading'
  })

  useEffect(() => {
    if (!PRO_REVIEW_PLAN_ENABLED) return
    if (!user || isGuestUser(user)) {
      setProStatus('non-pro')
      return
    }
    const demo = getDemoProStatus()
    if (demo === 'pro') {
      setProStatus('pro')
      return
    }

    let alive = true
    setProStatus('loading')
    api.subscription
      .get()
      .then(s => {
        if (!alive) return
        setProStatus(s?.has_pro ? 'pro' : 'non-pro')
      })
      .catch(() => {
        if (!alive) return
        setProStatus('non-pro')
      })
    return () => {
      alive = false
    }
  }, [user, refreshToken])

  if (!PRO_REVIEW_PLAN_ENABLED) return null

  if (proStatus === 'loading') {
    return <ProCardSkeleton />
  }

  if (proStatus === 'pro') {
    return (
      <ProAnalyticsCard
        refreshToken={refreshToken}
        onOpen={onOpen}
        onOpenSubscription={onOpenSubscription}
      />
    )
  }

  // non-pro (включая гостей) — витрина без запросов к /api/pro/*.
  if (proStatus === 'non-pro') {
    return <ProShowcaseCard onOpenSubscription={onOpenSubscription} />
  }

  return null
}
