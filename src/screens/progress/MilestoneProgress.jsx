import { getNearestDayMilestone } from './weeklySummary'

/**
 * Строка-прогресс к ближайшей вехе дней в аналитике.
 * «3 дня — первые выводы», «7 дней — итог недели», «30 дней — месяц в точках».
 * После 30 — не показывать.
 */
export default function MilestoneProgress({ totalDays }) {
  const milestone = getNearestDayMilestone(totalDays)
  if (!milestone) return null

  return (
    <section className="mx-day-milestone" data-testid="day-milestone">
      <div className="mx-day-milestone__label">
        <span>{milestone.title}</span>
        <span>
          {milestone.remaining > 0
            ? `осталось ${milestone.remaining} ${milestone.remaining === 1 ? 'день' : milestone.remaining < 5 ? 'дня' : 'дней'}`
            : 'достигнуто'}
        </span>
      </div>
      <div className="mx-day-milestone__bar" role="progressbar" aria-valuenow={milestone.percent} aria-valuemin={0} aria-valuemax={100}>
        <span className="mx-day-milestone__fill" style={{ width: `${milestone.percent}%` }} />
      </div>
    </section>
  )
}
