import { formatDayList } from './weekLabel'
import { buildAchievementWeek } from './achievementMiniWeek'

/*
 * Карточка одного достижения разбора: «одна мысль на карточку».
 *
 * Название 17/600, под ним мини-неделя из 7 точек Пн–Вс (≈15 px, календарные
 * точки §5.5): дни достижения закрашены акцентом, остальные — контуром.
 * Подписи дней 10/600 muted; даты достижения — мелко muted. Мини-неделя
 * строится только из распознанной даты начала недели — иначе остаются
 * только даты текстом (см. achievementMiniWeek.js).
 */
export default function ProAchievementCard({ achievement, weekStart, testId = 'pro-achievement' }) {
  const week = buildAchievementWeek(weekStart, achievement.days)
  const dates = formatDayList(achievement.days)

  return (
    <article className="mx-pro-achievement" data-testid={testId}>
      <p className="mx-pro-achievement__title">{achievement.text}</p>
      {week && (
        <div className="mx-pro-achievement__week" role="img" aria-label="Дни достижения на неделе">
          {week.map(day => (
            <span key={day.label} className="mx-pro-achievement__day">
              <span
                className={`mx-pro-achievement__dot${day.filled ? ' mx-pro-achievement__dot--filled' : ''}`}
                aria-hidden="true"
              />
              <span className="mx-pro-achievement__day-label">{day.label}</span>
            </span>
          ))}
        </div>
      )}
      {dates && <p className="mx-pro-achievement__dates">{dates}</p>}
    </article>
  )
}
