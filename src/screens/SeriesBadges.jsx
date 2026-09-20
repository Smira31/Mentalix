import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flame, X } from 'lucide-react'

import { getFullscreenPortalTarget, useFullscreenSurface } from '../lib/fullscreenSurface'
import { isPreviewDemoMode } from '../lib/demoMode'
import { api } from '../lib/api'
import { buildSeriesViewModel } from '../lib/series'
import './SeriesBadges.css'

function RewardIcon({ variant = 'locked', size = 110, className = '' }) {
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
      ) : variant === 'week-on-path' ? (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map(index => (
            <circle
              className="mx-reward-icon__dot"
              key={index}
              cx={56 + index * 8}
              cy={68 - Math.abs(3 - index) * 4}
              r="3.5"
            />
          ))}
        </>
      ) : variant === 'ritual-holds' ? (
        <path className="mx-reward-icon__steps" d="M55 88h50M62 80h36M69 72h22M76 64h8" />
      ) : variant === 'asceza-power' ? (
        <path className="mx-reward-icon__symbol" d="M62 84l36-32M70 88l28-24" />
      ) : variant === 'month-on-path' ? (
        <path
          className="mx-reward-icon__symbol"
          d="m80 50 5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z"
        />
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
    <div className="mx-path-progress" aria-label={`Прогресс: ${progress} из ${goal}`}>
      <span style={{ width: `${width}%` }} />
    </div>
  )
}

function BadgeRow({ badge, expanded, onToggle }) {
  return (
    <button
      type="button"
      className={`mx-path-award-row ${expanded ? 'is-expanded' : ''}`}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <RewardIcon variant={badge.done ? badge.id : 'locked'} size={76} />
      <div className="min-w-0 flex-1">
        <div className="mx-path-row-title">{badge.title}</div>
        <div className="mx-path-row-copy">{badge.desc}</div>
      </div>
      <div className="mx-path-row-value">
        <strong>
          {badge.progress}/{badge.goal}
        </strong>
        <ProgressBar progress={badge.progress} goal={badge.goal} />
      </div>
      {expanded && (
        <div className="mx-path-award-detail">
          {badge.done
            ? 'Награда открыта. Продолжай в своём темпе.'
            : `Осталось: ${Math.max(0, badge.goal - badge.progress)}.`}
        </div>
      )}
    </button>
  )
}

function SummaryCard({ value, label }) {
  return (
    <div className="mx-path-summary-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function StatSection({ title, rows }) {
  const [open, setOpen] = useState(true)
  return (
    <section className={`mx-path-stat-section ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="mx-path-stat-heading"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
      >
        <h2>{title}</h2>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div className="mx-path-stat-card" hidden={!open}>
        {rows.map(([label, value]) => (
          <div className="mx-path-stat-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function AwardsView({ unlocked, upcoming }) {
  const latest = unlocked[0]
  const [showAll, setShowAll] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const awardCountLabel =
    unlocked.length === 1 ? 'награда' : unlocked.length < 5 ? 'награды' : 'наград'
  return (
    <div className="mx-path-content">
      <section className="mx-path-featured-award">
        <h2>
          <strong>{unlocked.length || 0}</strong>
          <span className="mx-path-featured-award-label">{awardCountLabel} открыто</span>
        </h2>
        {latest ? (
          <>
            <RewardIcon variant={latest.id} size={128} />
            <div className="mx-path-featured-title">{latest.title}</div>
            <div className="mx-path-featured-copy">{latest.done ? 'Открыто' : latest.desc}</div>
          </>
        ) : (
          <>
            <RewardIcon variant="first-step" size={128} />
            <div className="mx-path-featured-title">Первый шаг</div>
            <div className="mx-path-featured-copy">Сделай первый чек-ин</div>
          </>
        )}
      </section>

      <button
        type="button"
        className="mx-path-see-all"
        onClick={() => setShowAll(value => !value)}
        aria-expanded={showAll}
      >
        {showAll ? 'Скрыть награды' : 'Смотреть все'}{' '}
        <span aria-hidden="true">{showAll ? '⌃' : '›'}</span>
      </button>
      <section className={`mx-path-awards-section ${showAll ? 'is-expanded' : ''}`}>
        <h2>Следующие награды</h2>
        <div className="mx-path-award-list">
          {(showAll
            ? [...upcoming, ...unlocked]
            : (upcoming.length ? upcoming : unlocked).slice(0, 3)
          ).map(badge => (
            <BadgeRow
              key={`${badge.id}-${showAll}`}
              badge={badge}
              expanded={expandedId === badge.id}
              onToggle={() => setExpandedId(id => (id === badge.id ? null : badge.id))}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function StatsView({ model }) {
  const completedDays = model.activeDays || model.totalCheckins || 0
  return (
    <div className="mx-path-content">
      <div className="mx-path-summary-grid">
        <SummaryCard value={completedDays} label="завершённых дня" />
        <SummaryCard value={0} label="минут осознанности" />
      </div>
      <StatSection
        title="Рекорды"
        rows={[
          ['Самая долгая медитация', '0 мин 0 сек'],
          ['Самая долгая дыхательная практика', '0 мин 0 сек'],
          ['Самая длинная запись', model.totalCheckins ? '1 слово' : '0 слов'],
          ['Самое долгое чтение', '0 мин 5 сек'],
        ]}
      />
      <StatSection
        title="Общее"
        rows={[
          ['Текущая серия', `${model.currentStreak} ${model.currentStreak === 1 ? 'день' : 'дня'}`],
          ['Всего завершённых дней', completedDays],
          ['Самая длинная серия', `${model.bestStreak} ${model.bestStreak === 1 ? 'день' : 'дня'}`],
          ['Сохранено цитат', 0],
        ]}
      />
      <StatSection
        title="Дневник"
        rows={[
          ['Написано слов', model.totalCheckins ? 1 : 0],
          ['Изображений', 0],
          ['Рисунков', 0],
          ['Записей', model.totalCheckins],
          ['Разных дневников', 0],
        ]}
      />
      <StatSection
        title="Осознанность"
        rows={[
          ['Минут осознанности', 0],
          ['Медитаций', 0],
          ['Дыхательных практик', 0],
          ['Выполнено вдохов', 0],
          ['Разных практик дыхания', 0],
          ['Разных медитаций', 0],
        ]}
      />
      <StatSection
        title="Настроение"
        rows={[
          ['Отметок энергии', 0],
          ['Отметок настроения', 0],
        ]}
      />
    </div>
  )
}

export default function SeriesBadges({ user, onBack }) {
  const [model, setModel] = useState(null)
  const [activeTab, setActiveTab] = useState('badges')
  const [error, setError] = useState(false)
  const { style: surfaceStyle } = useFullscreenSurface()
  const demoMode = isPreviewDemoMode()

  useEffect(() => {
    let active = true
    Promise.all([
      api.profile.get(user.id),
      api.checkin.history(user.id, 90),
      api.rituals.list(user.id),
      api.ascezas.list(user.id),
    ])
      .then(([stats, checkins, rituals, ascezas]) => {
        if (active) setModel(buildSeriesViewModel({ stats, checkins, rituals, ascezas }))
      })
      .catch(() => active && setError(true))
    return () => {
      active = false
    }
  }, [user.id])

  const unlocked = useMemo(() => model?.badges.filter(badge => badge.done) || [], [model])
  const upcoming = useMemo(() => model?.badges.filter(badge => !badge.done) || [], [model])

  const content = (
    <div
      className={`mx-path-surface ${demoMode ? 'mx-path-surface--demo' : ''}`}
      style={surfaceStyle}
    >
      <header className="mx-path-header">
        <div className="mx-path-tabs" role="tablist" aria-label="Раздел моего пути">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'badges'}
            onClick={() => setActiveTab('badges')}
          >
            Награды
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
          >
            Статистика
          </button>
        </div>
        <button
          type="button"
          className="mx-path-close"
          aria-label="Закрыть мой путь"
          onClick={onBack}
        >
          <X size={28} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>
      <main className="mx-path-scroll">
        {error && (
          <p className="mx-path-status">
            Не удалось загрузить данные. Попробуй открыть экран ещё раз.
          </p>
        )}
        {!error && !model && <p className="mx-path-status">Собираю твой путь…</p>}
        {model &&
          (activeTab === 'badges' ? (
            <AwardsView unlocked={unlocked} upcoming={upcoming} />
          ) : (
            <StatsView model={model} />
          ))}
      </main>
    </div>
  )

  return createPortal(content, getFullscreenPortalTarget())
}
