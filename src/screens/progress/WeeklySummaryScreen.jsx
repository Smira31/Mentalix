import { useEffect, useState } from 'react'
import Screen from '../../components/Screen'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { api } from '../../lib/api'
import { pickCurrentTheme } from '../../lib/themeHelpers'
import { pickWeekPhrase } from './weeklySummaryPhrases'
import './weeklySummary.css'

const WEEKDAY_CIRCLE_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function avgLabel(value) {
  if (value == null) return null
  return value.toFixed(1)
}

function TrendBadge({ trend }) {
  if (!trend) return null
  const cls =
    trend === '↑'
      ? 'mx-week-summary__trend mx-week-summary__trend--up'
      : trend === '↓'
        ? 'mx-week-summary__trend mx-week-summary__trend--down'
        : 'mx-week-summary__trend mx-week-summary__trend--same'
  return <span className={cls}>{trend}</span>
}

function MetricRow({ label, value, trend, suffix }) {
  if (value == null) return null
  return (
    <div className="mx-week-summary__metric-row">
      <span className="mx-week-summary__metric-label">{label}</span>
      <span className="mx-week-summary__metric-value">
        {value}
        {suffix}
        {trend && <TrendBadge trend={trend} />}
      </span>
    </div>
  )
}

export default function WeeklySummaryScreen({ summary, user, onBack }) {
  const [theme, setTheme] = useState(null)

  useBackButton(() => {
    platform.haptic('light')
    onBack()
  })

  // Загружаем текущую тему недели (существующий эндпоинт, как в SeriesBadges)
  useEffect(() => {
    if (!user?.id) return
    let active = true
    api.themes
      .list(user.id)
      .then(list => {
        if (!active) return
        const current = pickCurrentTheme(Array.isArray(list) ? list : [])
        if (!current) return
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
  }, [user?.id])

  if (!summary) {
    return (
      <Screen onBack={onBack} backTestId="week-summary-back">
        <p className="mx-week-summary__empty">Неделя только набирает форму</p>
      </Screen>
    )
  }

  const phrase = pickWeekPhrase(summary)

  // Проверяем, пересекается ли текущая тема с этой неделей
  let themeBlock = null
  if (theme && theme.days) {
    const themeStart = theme.started_on
    const themeEnd = theme.started_on
      ? new Date(theme.started_on + 'T00:00:00')
      : null
    if (themeEnd) {
      themeEnd.setDate(themeEnd.getDate() + (theme.days.length - 1))
      const themeEndStr = themeEnd.toISOString().slice(0, 10)
      // Тема попадает в эту неделю?
      if (themeStart <= summary.endDate && themeEndStr >= summary.startDate) {
        const answered = (theme.days || []).filter(d => d.reflection).length
        themeBlock = (
          <div className="mx-week-summary__block">
            <span className="mx-week-summary__block-label">Тема недели</span>
            <span className="mx-week-summary__block-value">
              {answered} из {theme.days.length} вопросов отвечено
            </span>
          </div>
        )
      }
    }
  }

  return (
    <Screen onBack={onBack} backTestId="week-summary-back">
      <div className="mx-week-summary" data-testid="week-summary-screen">
        <div className="mx-week-summary__header">
          <span className="mx-week-summary__eyebrow">ИТОГ НЕДЕЛИ</span>
          <h1 className="mx-week-summary__title">Неделя {summary.weekNumber}</h1>
          <span className="mx-week-summary__range">{summary.rangeLabel}</span>
        </div>

        {/* 7 кружков дней */}
        <div className="mx-week-summary__circles" aria-label="Дни недели">
          {summary.dayCircles.map(c => (
            <div
              key={c.date}
              className={`mx-week-summary__circle${c.active ? ' mx-week-summary__circle--active' : ''}`}
            >
              <span className="mx-week-summary__circle-dot" />
              <span className="mx-week-summary__circle-label">{c.weekday}</span>
            </div>
          ))}
        </div>

        {/* Энергия и настроение */}
        <div className="mx-week-summary__metrics">
          <MetricRow
            label="Энергия"
            value={avgLabel(summary.energyAvg)}
            trend={summary.energyTrend}
            suffix="/5"
          />
          <MetricRow
            label="Настроение"
            value={avgLabel(summary.moodAvg)}
            trend={summary.moodTrend}
            suffix="/5"
          />
        </div>

        {/* Самая частая эмоция вечерних разборов */}
        {summary.topEveningEmotion && (
          <div className="mx-week-summary__block">
            <span className="mx-week-summary__block-label">Частая эмоция вечером</span>
            <span className="mx-week-summary__block-value">
              {summary.topEveningEmotion.name}
            </span>
          </div>
        )}

        {/* Практики */}
        {summary.practiceCount > 0 && (
          <div className="mx-week-summary__block">
            <span className="mx-week-summary__block-label">Практики</span>
            <span className="mx-week-summary__block-value">
              {summary.practiceCount}{' '}
              {summary.practiceCount === 1 ? 'отметка' : summary.practiceCount < 5 ? 'отметки' : 'отметок'}
              {summary.topPractice && ` · чаще «${summary.topPractice.name}»`}
            </span>
          </div>
        )}

        {/* Тема недели */}
        {themeBlock}

        {/* Фраза-вывод */}
        <div className="mx-week-summary__phrase">
          <p>{phrase}</p>
        </div>
      </div>
    </Screen>
  )
}
