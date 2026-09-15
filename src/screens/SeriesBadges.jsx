import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flame, X } from 'lucide-react'

import { getFullscreenPortalTarget, useFullscreenSurface } from '../lib/fullscreenSurface'
import { isPreviewDemoMode } from '../lib/demoMode'
import { MotifArt } from '../components/Motif'
import { api } from '../lib/api'
import { buildSeriesViewModel } from '../lib/series'
import './SeriesBadges.css'

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
      <MotifArt name={badge.motif} size={58} className={badge.done ? '' : 'opacity-55'} />
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
  return (
    <div className="mx-path-content">
      <section className="mx-path-featured-award">
        <h2>
          <strong>{unlocked.length || 0}</strong> наград{unlocked.length === 1 ? 'а' : 'ы'} открыто
        </h2>
        {latest ? (
          <>
            <MotifArt name={latest.motif} size={154} />
            <div className="mx-path-featured-title">{latest.title}</div>
            <div className="mx-path-featured-copy">{latest.done ? 'Открыто' : latest.desc}</div>
          </>
        ) : (
          <>
            <MotifArt name="first-step" size={154} className="opacity-55" />
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
