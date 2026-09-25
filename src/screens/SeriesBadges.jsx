import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { getFullscreenPortalTarget, useFullscreenSurface } from '../lib/fullscreenSurface'
import { isPreviewDemoMode } from '../lib/demoMode'
import { api } from '../lib/api'
import { platform } from '../platform'
import { logEngagementEvent } from '../lib/engagementEvents'
import { pluralize, formatCount } from '../lib/pluralize'
import { platformName } from '../platform'
import { buildSeriesViewModel, peekSeriesSnapshot, rememberSeriesSnapshot } from '../lib/series'
import { getSeriesPreferences, saveSeriesPreference } from '../lib/seriesPreferences'
import { useSheetSwipeDown } from '../lib/gestures/useSheetSwipeDown'

import BackButton from '../components/BackButton'
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
      <circle className="mx-reward-icon__glass" cx="80" cy="68" r="48" />
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

function badgePractice(badge) {
  if (badge?.id === 'voice-heard') return { route: 'checkin', label: 'Утренний чек-ин' }
  if (badge?.id === 'streak-two' || badge?.id === 'streak-three' || badge?.id === 'streak-five')
    return { route: 'checkin', label: 'Утренний чек-ин' }
  if (badge?.id === 'ritual-holds') return { route: 'rituals', label: 'Ритуалы' }
  if (badge?.id === 'asceza-power') return { route: 'ascezas', label: 'Аскезы' }
  return null
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
          <p>{badge.desc}</p>
          <div className="mx-badge-sheet__progress">
            <strong>Твой прогресс</strong>
            <span>
              {badge.progress}/{badge.goal}
            </span>
          </div>
          {practice && (
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
    >
      <RewardIcon variant={badge.done ? badge.id : 'locked'} size={54} />
      <span className="mx-path-row-copy-wrap">
        <strong className="mx-path-row-title">{badge.title}</strong>
        <span className="mx-path-row-copy">{badge.desc}</span>
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

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="mx-path-toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="mx-path-toggle" aria-hidden="true" />
    </label>
  )
}

function formatDays(value) {
  return formatCount(value, ['день', 'дня', 'дней'])
}

function AwardsView({ model, onOpenBadge, preferences, onPreference }) {
  const [showAll, setShowAll] = useState(false)
  const unlocked = model.badges.filter(badge => badge.done)
  const upcoming = model.badges.filter(badge => !badge.done)
  const latest = unlocked[0]
  const visible = showAll
    ? [...upcoming, ...unlocked]
    : upcoming.length
      ? upcoming.slice(0, 3)
      : unlocked.slice(0, 3)
  const awardCount = unlocked.length

  return (
    <div className="mx-path-content">
      <section className="mx-path-featured-award">
        <strong className="mx-path-award-count">{awardCount}.</strong>
        <span className="mx-path-featured-award-label">ЗНАЧКОВ ПОЛУЧЕНО</span>
        <div className="mx-path-featured-scene">
          <RewardIcon variant={latest ? latest.id : 'locked'} size={118} />
        </div>
        <div className="mx-path-featured-title">{latest ? latest.title : 'Твой первый значок'}</div>
        <div className="mx-path-featured-copy">{latest ? 'Открыто' : 'Может, сегодня?'}</div>
      </section>
      <button type="button" className="mx-path-see-all" onClick={() => setShowAll(value => !value)}>
        {showAll ? 'Скрыть' : 'Все'} <span aria-hidden="true">›</span>
      </button>
      <section className="mx-path-awards-section">
        <h2>Следующие значки</h2>
        <div className="mx-path-award-list">
          {visible.map(badge => (
            <BadgeRow key={badge.id} badge={badge} onOpen={() => onOpenBadge(badge)} />
          ))}
        </div>
      </section>
      <div className="mx-path-preferences">
        <ToggleRow
          label="Показывать значки"
          checked={preferences.showBadges}
          onChange={value => onPreference('showBadges', value)}
        />
      </div>
    </div>
  )
}

function StatsView({ model }) {
  const rows = [
    ['Текущая серия', formatDays(model.currentStreak)],
    ['Всего завершённых дней', model.activeDays],
    ['Самая длинная серия', formatDays(model.bestStreak)],
  ]
  return (
    <div className="mx-path-content">
      <div className="mx-path-summary-grid">
        <div className="mx-path-summary-card">
          <strong>{model.activeDays}</strong>
          <span>
            {pluralize(model.activeDays, [
              'завершённый день',
              'завершённых дня',
              'завершённых дней',
            ])}
          </span>
        </div>
        <div className="mx-path-summary-card">
          <strong>{model.totalCheckins}</strong>
          <span>{pluralize(model.totalCheckins, ['чек-ин', 'чек-ина', 'чек-инов'])}</span>
        </div>
      </div>
      <StatSection title="Серия" rows={rows} note="Один пропуск в неделю серию не обрывает" />
      <StatSection
        title="Чек-ины"
        rows={[
          ['Всего чек-инов', model.totalCheckins],
          ['Дней с чек-ином', model.activeDays],
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
          ['Записей', model.totalCheckins],
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
  const initial = useMemo(() => peekSeriesSnapshot(user?.id), [user?.id])
  const [model, setModel] = useState(initial)
  const [modelUserId, setModelUserId] = useState(user?.id)
  const [activeTab, setActiveTab] = useState('badges')
  const [error, setError] = useState(false)
  const [errorUserId, setErrorUserId] = useState(null)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [preferences, setPreferences] = useState(() => getSeriesPreferences(user?.id))
  const { style: surfaceStyle } = useFullscreenSurface()
  const demoMode = isPreviewDemoMode()

  const screenRef = useRef(null)

  useEffect(() => {
    let active = true
    Promise.all([
      api.profile.get(user.id),
      api.checkin.history(user.id, 90),
      api.rituals.list(user.id),
      api.ascezas.list(user.id),
    ])
      .then(([stats, checkins, rituals, ascezas]) => {
        if (!active) return
        const next = buildSeriesViewModel({ stats, checkins, rituals, ascezas })
        setModel(next)
        setModelUserId(user.id)
        setError(false)
        setErrorUserId(null)
        rememberSeriesSnapshot(user.id, next)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setErrorUserId(user.id)
      })
    return () => {
      active = false
    }
  }, [user.id])

  const visibleModel = modelUserId === user.id ? model : null
  const freezeSeen = useRef(false)
  useEffect(() => {
    if (activeTab !== 'stats' || !visibleModel || freezeSeen.current) return
    freezeSeen.current = true
    logEngagementEvent({
      user, demo: isPreviewDemoMode(), event: 'streak_freeze_seen',
      hasSession: Boolean(platform.getSessionToken?.()), send: api.events.log,
    })
  }, [activeTab, visibleModel, user])

  const content = (
    <div
      ref={screenRef}
      className={`mx-path-surface ${demoMode ? 'mx-path-surface--demo' : ''}`}
      style={surfaceStyle}
    >
      <header className="mx-path-header">
        <div className="mx-path-tabs" role="tablist" aria-label="Раздел серии и значков">
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
        </div>
        <CloseButton onClose={onBack} />
        <BackButton onClick={onBack} label="Сегодня" />
      </header>
      <main className="mx-path-scroll">
        {error && errorUserId === user.id && (
          <p className="mx-path-status">
            Не удалось загрузить данные. Попробуй открыть экран ещё раз.
          </p>
        )}
        {visibleModel ? (
          activeTab === 'badges' ? (
            <AwardsView
              model={visibleModel}
              preferences={preferences}
              onPreference={(name, value) =>
                setPreferences(saveSeriesPreference(user.id, name, value))
              }
              onOpenBadge={setSelectedBadge}
            />
          ) : (
            <StatsView model={visibleModel} />
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
    </div>
  )

  return createPortal(content, getFullscreenPortalTarget())
}
