import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { getFullscreenPortalTarget, useFullscreenSurface } from '../lib/fullscreenSurface'
import { isPreviewDemoMode } from '../lib/demoMode'
import { api } from '../lib/api'
import { readCanonicalStreakStats, serverSeriesBadges } from '../lib/canonicalStreak'
import { badgeGroups, daysSinceRegistration, upcomingBadges } from '../lib/badgeCatalog'
import { buildMvpBadges } from '../lib/badgesMvp'
import { readJournalHistory } from '../lib/journalHistory'
import { platform } from '../platform'
import { logEngagementEvent } from '../lib/engagementEvents'
import { formatCount } from '../lib/pluralize'
import { platformName } from '../platform'
import { buildServerSeriesViewModel } from '../lib/series'
import { useSheetSwipeDown } from '../lib/gestures/useSheetSwipeDown'
import { getNearestMilestones } from '../lib/milestones'
import { pickCurrentTheme } from '../lib/themeHelpers'

import BackButton from '../components/BackButton'
import MilestoneBars from '../components/MilestoneBars'
import './SeriesBadges.css'

function RewardIcon({ variant = 'locked', size = 72, className = '' }) {
  const isLocked = variant === 'locked'
  const isFirstStep = variant === 'first-step'

  return (
    <svg
      className={`mx-reward-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label={isLocked ? 'Награда пока закрыта' : 'Открытая награда'}
    >
      <circle className={`mx-reward-icon__glass${isLocked ? ' mx-reward-icon__glass--locked' : ''}`} cx="80" cy="68" r="48" />
      <path className="mx-reward-icon__shine" d="M48 42c7-12 17-19 29-23" />
      {isLocked ? (
        <text className="mx-reward-icon__question" x="80" y="80" textAnchor="middle">
          ?
        </text>
      ) : isFirstStep ? (
        <>
          <path className="mx-reward-icon__steps" d="M42 103h76M50 94h60M58 85h44M66 76h28" />
          <path className="mx-reward-icon__flag" d="M88 76V43m0 0h22l-7 8 7 8H88" />
          <path className="mx-reward-icon__bird" d="M104 66c5-6 11-6 16 0-5-2-9-1-12 3" />
        </>
      ) : variant === 'first_checkin' ? (
        <path className="mx-reward-icon__symbol" d="M58 68l14 13 29-30M55 44h49" />
      ) : variant === 'first_journal' ? (
        <path className="mx-reward-icon__symbol" d="M55 46h39v42H55zM64 56h20M64 66h20M64 76h13M94 46l10 7v42H65" />
      ) : variant === 'streak_7' ? (
        <path className="mx-reward-icon__symbol" d="M56 80l9-25 12 15 11-23 15 33zM54 86h52" />
      ) : variant === 'streak_30' ? (
        <path className="mx-reward-icon__symbol" d="M56 82a27 27 0 1 1 48 0M68 78l12-32 12 32M71 68h18" />
      ) : variant === 'active_days_100' ? (
        <path className="mx-reward-icon__symbol" d="M80 39l9 20 22 2-17 15 5 22-19-11-19 11 5-22-17-15 22-2z" />
      ) : variant === 'month-on-path' ? (
        <path className="mx-reward-icon__symbol" d="M91 42a26 26 0 1 0 18 43 28 28 0 0 1-18-43z" />
      ) : variant === 'voice-heard' ? (
        <>
          <path
            className="mx-reward-icon__symbol"
            d="M60 68c5-12 10 12 15 0s10-12 15 0 10 12 15 0"
          />
          <circle className="mx-reward-icon__dot" cx="80" cy="68" r="4" />
        </>
      ) : variant === 'streak-two' ? (
        [0, 1].map(index => (
          <circle className="mx-reward-icon__dot" key={index} cx={76 + index * 8} cy={66} r="3.5" />
        ))
      ) : variant === 'streak-three' ? (
        [0, 1, 2].map(index => (
          <circle
            className="mx-reward-icon__dot"
            key={index}
            cx={72 + index * 8}
            cy={68 - Math.abs(1 - index) * 4}
            r="3.5"
          />
        ))
      ) : variant === 'streak-five' ? (
        [0, 1, 2, 3, 4].map(index => (
          <circle
            className="mx-reward-icon__dot"
            key={index}
            cx={64 + index * 8}
            cy={68 - Math.abs(2 - index) * 4}
            r="3.5"
          />
        ))
      ) : variant === 'week-on-path' ? (
        [0, 1, 2, 3, 4, 5, 6].map(index => (
          <circle
            className="mx-reward-icon__dot"
            key={index}
            cx={56 + index * 8}
            cy={68 - Math.abs(3 - index) * 4}
            r="3.5"
          />
        ))
      ) : variant === 'ritual-holds' ? (
        <path className="mx-reward-icon__steps" d="M55 88h50M62 80h36M69 72h22M76 64h8" />
      ) : variant === 'asceza-power' ? (
        <path className="mx-reward-icon__symbol" d="M62 84l36-32M70 88l28-24" />
      ) : (
        <>
          <circle className="mx-reward-icon__dot" cx="80" cy="68" r="12" />
          <path className="mx-reward-icon__symbol" d="M80 52v32M64 68h32" />
        </>
      )}
      <path className="mx-reward-icon__base" d="M34 116h92l-9 16H43z" />
      <path className="mx-reward-icon__base-line" d="M27 137h106" />
    </svg>
  )
}

function ProgressBar({ progress, goal }) {
  const width = goal > 0 ? Math.min(100, Math.round((progress / goal) * 100)) : 0
  return (
    <span className="mx-path-progress" aria-label={`Прогресс: ${progress} из ${goal}`}>
      <span style={{ width: `${width}%` }} />
    </span>
  )
}

function CloseButton({ onClose, label = 'Закрыть' }) {
  // В Telegram закрытие — только нативная «Назад» (BackButton).
  // Свой ✕ остаётся только в web/PWA.
  if (platformName === 'telegram') return null
  return (
    <button
      type="button"
      className="mx-path-close mx-tap-target"
      data-testid="series-close"
      aria-label={label}
      onClick={onClose}
    >
      <X size={18} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}

/*
 * §6 Motion — анимация закрытия шторки значка (уезд вниз, 200 ms ease-in).
 * useSheetSwipeDown уже делает свою анимацию через inline-стили, поэтому
 * хук получает оригинальный onClose. Для клика по фону и кнопкам закрытия
 * используется requestClose: добавляет CSS-классы анимации и задерживает
 * размонтирование на duration ms.
 */
function useSheetExit(onClose) {
  const [closing, setClosing] = useState(false)
  const timerRef = useRef(null)

  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    timerRef.current = setTimeout(onClose, reducedMotion ? 150 : 200)
  }, [closing, onClose])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { closing, requestClose }
}

const badgeConditions = {
  'first-step': 'пройди первый чек-ин.',
  first_checkin: 'пройди первый чек-ин.',
  first_journal: 'сохрани первую запись.',
  'voice-heard': 'пройди 5 чек-инов.',
  'streak-two': 'сохраняй серию 2 дня.',
  'streak-three': 'сохраняй серию 3 дня.',
  'streak-five': 'сохраняй серию 5 дней.',
  streak_7: 'сохраняй серию 7 дней.',
  streak_30: 'сохраняй серию 30 дней.',
  'week-on-path': 'проведи 7 дней в системе.',
  'month-on-path': 'проведи 30 дней в системе.',
  active_days_100: 'сделай 100 дней активными.',
  'ritual-holds': 'поддерживай ритуал 7 дней.',
  'asceza-power': 'соблюдай аскезу 7 дней.',
}

function badgePractice(badge) {
  if (badge?.id === 'ritual-holds') return { route: 'rituals', label: 'Перейти к ритуалам' }
  if (badge?.id === 'asceza-power') return { route: 'ascezas', label: 'Перейти к аскезам' }
  if (badge?.id === 'first_journal') return { route: 'journal', label: 'Сделать запись' }
  return { route: 'checkin', label: 'Пройти чек-ин' }
}

export function BadgeSheet({ badge, onClose, onOpenPractice }) {
  const sheetRef = useRef(null)
  const { closing, requestClose } = useSheetExit(onClose)
  useSheetSwipeDown(sheetRef, onClose)

  if (!badge) return null
  const practice = badgePractice(badge)
  return createPortal(
    <div
      className={`mx-badge-sheet-layer${closing ? ' mx-badge-sheet-layer--exit' : ''}`}
      role="presentation"
      onClick={requestClose}
    >
      <section
        ref={sheetRef}
        className={`mx-badge-sheet${closing ? ' mx-badge-sheet--exit' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mx-badge-sheet-title"
        onClick={event => event.stopPropagation()}
      >
        <CloseButton onClose={requestClose} />
        <div className="mx-badge-sheet__scene">
          <RewardIcon variant={badge.done ? badge.id : 'locked'} size={92} />
        </div>
        <div className="mx-badge-sheet__body">
          <span className="mx-badge-sheet__eyebrow">{badge.done ? 'ЗНАЧОК СЕРИИ' : 'ЗНАЧОК'}</span>
          <h2 id="mx-badge-sheet-title">{badge.title}</h2>
          <p>{badge.done ? badge.desc : `Чтобы получить, ${badgeConditions[badge.id] || 'продолжай свой путь.'}`}</p>
          <div className="mx-badge-sheet__progress">
            <strong>Твой прогресс</strong>
            <span>{badge.progress}/{badge.goal}</span>
          </div>
          <ProgressBar progress={badge.progress} goal={badge.goal} />
          {practice && !badge.done && (
            <button
              type="button"
              className="mx-badge-sheet__action"
              onClick={() => onOpenPractice?.(practice.route)}
            >
              {practice.label}
            </button>
          )}
        </div>
        <BackButton onClick={requestClose} />
      </section>
    </div>,
    getFullscreenPortalTarget()
  )
}

export function NewBadgeSheet({ badge, onClose }) {
  const sheetRef = useRef(null)
  const { closing, requestClose } = useSheetExit(onClose)
  useSheetSwipeDown(sheetRef, onClose)

  if (!badge) return null
  return createPortal(
    <div
      className={`mx-badge-sheet-layer${closing ? ' mx-badge-sheet-layer--exit' : ''}`}
      role="presentation"
      onClick={requestClose}
    >
      <section
        ref={sheetRef}
        className={`mx-badge-sheet mx-badge-sheet--new${closing ? ' mx-badge-sheet--exit' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mx-new-badge-title"
        onClick={event => event.stopPropagation()}
      >
        <CloseButton onClose={requestClose} />
        <div className="mx-badge-sheet__scene">
          <RewardIcon variant={badge.id} size={92} />
        </div>
        <div className="mx-badge-sheet__body">
          <span className="mx-badge-sheet__eyebrow">НОВЫЙ ЗНАЧОК</span>
          <h2 id="mx-new-badge-title">{badge.title}</h2>
          <p>Первый утренний чек-ин пройден!</p>
          <div className="mx-badge-sheet__received">
            <strong>Получен</strong>
            <span>{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
          <button
            type="button"
            className="mx-badge-sheet__action mx-badge-sheet__share"
            onClick={requestClose}
          >
            Поделиться
          </button>
        </div>
        <BackButton onClick={requestClose} />
      </section>
    </div>,
    getFullscreenPortalTarget()
  )
}

function BadgeRow({ badge, onOpen }) {
  return (
    <button
      type="button"
      className="mx-path-award-row"
      onClick={onOpen}
      aria-label={`Открыть значок: ${badge.title}`}
      data-testid={`series-badge-${badge.id}`}
    >
      <RewardIcon variant={badge.done ? badge.id : 'locked'} size={54} />
      <span className="mx-path-row-copy-wrap">
        <strong className="mx-path-row-title">{badge.title}</strong>
        <span className="mx-path-row-copy">{badge.desc}</span>
        {badge.progressLabel && (
          <span className="mx-path-row-copy mx-path-row-progress-copy">{badge.progressLabel}</span>
        )}
      </span>
      <span className="mx-path-row-value">
        <strong>
          {badge.progress}/{badge.goal}
        </strong>
        <ProgressBar progress={badge.progress} goal={badge.goal} />
      </span>
    </button>
  )
}

function formatDays(value) {
  return formatCount(value, ['день', 'дня', 'дней'])
}

function AwardsView({ badges, onOpenBadge, onShowAll }) {
  const upcoming = upcomingBadges(badges)
  const next = upcoming[0]
  return (
    <div className="mx-path-content">
      <section className="mx-path-featured-award">
        <strong className="mx-path-award-count">{badges.filter(badge => badge.done).length}.</strong>
        <span className="mx-path-featured-award-label">ЗНАЧКОВ ПОЛУЧЕНО</span>
        <div className="mx-path-featured-scene">
          <RewardIcon variant={next?.id || 'first-step'} size={118} />
        </div>
        <div className="mx-path-featured-title">{next?.title || 'Все значки получены'}</div>
        <div className="mx-path-featured-copy">{next ? `${next.progress}/${next.goal} до получения` : 'Продолжай свой путь'}</div>
      </section>
      <button type="button" className="mx-path-see-all" onClick={onShowAll}>
        Все значки <span aria-hidden="true">›</span>
      </button>
      <section className="mx-path-awards-section">
        <h2>Следующие значки</h2>
        <div className="mx-path-award-list">
          {upcoming.slice(0, 3).map(badge => (
            <BadgeRow key={badge.id} badge={badge} onOpen={() => onOpenBadge(badge)} />
          ))}
          {!upcoming.length && <p className="mx-path-status">Новых значков пока нет</p>}
        </div>
      </section>
    </div>
  )
}

function AllBadgesView({ badges, onOpenBadge }) {
  return (
    <div className="mx-path-content mx-path-all-badges" data-testid="all-badges-screen">
      <h1>все значки.</h1>
      {badgeGroups(badges).map(group => (
        <section key={group.title} className="mx-path-all-group">
          <h2>{group.title}</h2>
          <div className="mx-path-badge-grid">
            {group.badges.map(badge => (
              <button type="button" key={badge.id} onClick={() => onOpenBadge(badge)} data-testid={`all-badge-${badge.id}`}>
                <RewardIcon variant={badge.done ? badge.id : 'locked'} size={64} />
                <strong>{badge.title}</strong>
                <span>{badge.progress}/{badge.goal}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function StatsView({ model, canonicalStats, theme, journalEntries = [] }) {
  const { currentStreak, bestStreak, activeDays } = canonicalStats ?? { currentStreak: 0, bestStreak: 0, activeDays: 0 }
  const rows = [
    ['Текущая серия', formatDays(currentStreak)],
    ['Дней с активностью', activeDays],
    ['Самая длинная серия', formatDays(bestStreak)],
  ]
  const milestones = getNearestMilestones({
    badges: model.badges,
    streak: canonicalStats ? currentStreak : null,
    theme,
  })
  return (
    <div className="mx-path-content">
      <div className="mx-path-summary-grid">
        <div className="mx-path-summary-card">
          <strong>{activeDays}</strong>
          <span>
            Дней с активностью
          </span>
        </div>
        <div className="mx-path-summary-card">
          <strong>{model.totalCheckins}</strong>
          <span>Чек-инов пройдено</span>
        </div>
      </div>
      {milestones.length > 0 && (
        <section className="mx-path-stat-section" data-testid="milestone-section">
          <h2>Ближайшее</h2>
          <MilestoneBars milestones={milestones} />
        </section>
      )}
      {canonicalStats && <StatSection title="Серия" rows={rows} note={canonicalStats.freezeUsedThisWeek ? 'Заморозка: 1 пропуск в неделю не рвёт серию' : null} />}
      <StatSection
        title="Чек-ины"
        rows={[
          ['Всего чек-инов', model.totalCheckins],
          ['Дней с чек-ином', activeDays ?? model.activeDays],
        ]}
      />
      <StatSection
        title="Практики"
        rows={[
          ['Ритуалов', 0],
          ['Аскез', 0],
        ]}
      />
      <StatSection
        title="Записи"
        rows={[
          ['Записей', journalEntries.length],
          ['Сохранено цитат', 0],
        ]}
      />
    </div>
  )
}

function StatSection({ title, rows, note }) {
  return (
    <section className="mx-path-stat-section">
      <h2>{title}</h2>
      <div className="mx-path-stat-card">
        {rows.map(([label, value], index) => (
          <Fragment key={label}>
            <div className="mx-path-stat-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
            {index === 0 && note && <p className="px-5 py-2 text-xs text-muted">{note}</p>}
          </Fragment>
        ))}
      </div>
    </section>
  )
}

export default function SeriesBadges({ user, onBack, onOpenPractice }) {
  const [model, setModel] = useState(null)
  const [modelUserId, setModelUserId] = useState(user?.id)
  const [canonicalStats, setCanonicalStats] = useState(null)
  const [checkinHistory, setCheckinHistory] = useState(null)
  const [checkinTotal, setCheckinTotal] = useState(null)
  const [profileStats, setProfileStats] = useState(null)
  const [completedSessions, setCompletedSessions] = useState(null)
  const [activeTab, setActiveTab] = useState('badges')
  const [error, setError] = useState(false)
  const [errorUserId, setErrorUserId] = useState(null)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [theme, setTheme] = useState(null)
  const { style: surfaceStyle } = useFullscreenSurface()
  const demoMode = isPreviewDemoMode()

  const screenRef = useRef(null)
  useSheetSwipeDown(screenRef, onBack, { enabled: !showAll })

  useEffect(() => {
    let active = true
    const streakRequest = api.streak(user.id)
    streakRequest
      .then(payload => {
        if (active) setCanonicalStats({ userId: user.id, value: readCanonicalStreakStats(payload) })
      })
      .catch(() => {
        if (active) setCanonicalStats({ userId: user.id, value: null })
      })

    api.journalTemplates
      .sessions(user.id, 'completed')
      .then(items => {
        if (active)
          setCompletedSessions({ userId: user.id, items: Array.isArray(items) ? items : [] })
      })
      .catch(() => {
        if (active) setCompletedSessions({ userId: user.id, items: [] })
      })

    Promise.all([
      api.profile.get(user.id),
      api.checkin.history(user.id, 90),
      api.rituals.list(user.id),
      api.ascezas.list(user.id),
    ])
      .then(([stats, checkins, rituals, ascezas]) => {
        if (!active) return
        const next = buildServerSeriesViewModel({ stats, checkins, rituals, ascezas })
        setCheckinHistory({ userId: user.id, items: checkins })
        setCheckinTotal({ userId: user.id, count: stats?.total_checkins })
        setProfileStats({ userId: user.id, value: stats })
        setModel(next)
        setModelUserId(user.id)
        setError(false)
        setErrorUserId(null)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setErrorUserId(user.id)
      })

    api.themes
      .list(user.id)
      .then(list => {
        if (!active) return
        const current = pickCurrentTheme(Array.isArray(list) ? list : [])
        if (!current) return setTheme(null)
        api.themes
          .get(current.id, user.id)
          .then(detail => {
            if (!active) return
            setTheme({ ...current, ...detail })
          })
          .catch(() => {})
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [user.id])

  const visibleModel = modelUserId === user.id ? model : null
  const serverStats = canonicalStats?.userId === user.id ? canonicalStats.value : null
  const registrationDays = daysSinceRegistration(profileStats?.userId === user.id ? profileStats.value?.created_at : user?.created_at)
  const serverBadges = serverSeriesBadges(visibleModel?.badges, serverStats, registrationDays)
  const journalEntries = useMemo(() => readJournalHistory(user.id), [user.id])
  const catalogReady = Boolean(visibleModel && checkinHistory?.userId === user.id &&
    checkinTotal?.userId === user.id && completedSessions?.userId === user.id &&
    canonicalStats?.userId === user.id && profileStats?.userId === user.id)
  const mvpBadges = catalogReady ? buildMvpBadges({
    checkins: checkinHistory.items,
    totalCheckins: checkinTotal.count,
    journalEntries,
    completedSessions: completedSessions.items,
    canonicalStats: serverStats,
  }) : []
  const badges = [...mvpBadges, ...serverBadges]
  const freezeSeen = useRef(false)
  useEffect(() => {
    if (activeTab !== 'stats' || !visibleModel || freezeSeen.current) return
    freezeSeen.current = true
    logEngagementEvent({
      user,
      demo: isPreviewDemoMode(),
      event: 'streak_freeze_seen',
      hasSession: Boolean(platform.getSessionToken?.()),
      send: api.events.log,
    })
  }, [activeTab, visibleModel, user])

  const content = (
    <div className="mx-path-layer" style={{ top: surfaceStyle.top, height: surfaceStyle.height }} onClick={onBack}>
    <section
      ref={screenRef}
      className={`mx-path-surface ${demoMode ? 'mx-path-surface--demo' : ''}${showAll ? ' mx-path-surface--all' : ''}`}
      onClick={event => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={showAll ? 'Все значки' : 'Значки и статистика'}
    >
      <header className="mx-path-header">
        {showAll && <button className="mx-path-all-back" type="button" onClick={() => setShowAll(false)} aria-label="Назад к значкам">‹</button>}
        {!showAll && <div className="mx-path-tabs" role="tablist" aria-label="Раздел серии и значков">
          <button
            type="button"
            role="tab"
            className="mx-tap-target"
            data-testid="series-tab-badges"
            aria-selected={activeTab === 'badges'}
            onClick={() => setActiveTab('badges')}
          >
            Значки
          </button>
          <button
            type="button"
            role="tab"
            className="mx-tap-target"
            data-testid="series-tab-stats"
            aria-selected={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
          >
            Статистика
          </button>
        </div>}
        <CloseButton onClose={onBack} />
        <BackButton onClick={showAll ? () => setShowAll(false) : onBack} />
      </header>
      <main className="mx-path-scroll">
        {error && errorUserId === user.id && (
          <p className="mx-path-status">
            Не удалось загрузить данные. Попробуй открыть экран ещё раз.
          </p>
        )}
        {catalogReady ? (
          showAll ? <AllBadgesView badges={badges} onOpenBadge={setSelectedBadge} /> :
          activeTab === 'badges' ? (
            <AwardsView badges={badges} onShowAll={() => setShowAll(true)} onOpenBadge={setSelectedBadge} />
          ) : (
            <StatsView
              model={{ ...visibleModel, badges: serverBadges }}
              canonicalStats={serverStats}
              theme={theme}
              journalEntries={journalEntries}
            />
          )
        ) : (
          <p className="mx-path-status">Загружаю последние данные…</p>
        )}
      </main>
      {selectedBadge && (
        <BadgeSheet
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
          onOpenPractice={practice => {
            setSelectedBadge(null)
            onOpenPractice?.(practice)
          }}
        />
      )}
    </section>
    </div>
  )

  return createPortal(content, getFullscreenPortalTarget())
}
