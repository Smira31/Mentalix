import Screen from '../../components/Screen'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { daysSinceFirst } from './weeklySummary'
import './weeklySummary.css'

export default function FirstDayScreen({ firstDate, firstEntry, user, onBack }) {
  useBackButton(() => {
    platform.haptic('light')
    onBack()
  })

  const dayNumber = daysSinceFirst(firstDate)

  // Пытаемся извлечь данные первого запуска из первой записи
  let firstChoice = null
  if (firstEntry) {
    if (firstEntry.checkin?.day_focus) {
      firstChoice = `Фокус дня: ${firstEntry.checkin.day_focus}`
    } else if (firstEntry.checkin?.emotion) {
      firstChoice = `Эмоция: ${firstEntry.checkin.emotion}`
    }
  }

  const dateLabel = firstDate
    ? new Date(firstDate + 'T00:00:00').toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <Screen onBack={onBack} backTestId="first-day-back">
      <div className="mx-week-summary mx-first-day" data-testid="first-day-screen">
        <div className="mx-week-summary__header">
          <span className="mx-week-summary__eyebrow">НАЧАЛО</span>
          <h1 className="mx-week-summary__title">первый день.</h1>
          <span className="mx-week-summary__range">{dateLabel}</span>
        </div>

        {firstChoice && (
          <div className="mx-week-summary__block">
            <span className="mx-week-summary__block-label">При первом запуске</span>
            <span className="mx-week-summary__block-value">{firstChoice}</span>
          </div>
        )}

        <div className="mx-week-summary__phrase">
          <p>
            С этого дня ты отмечаешь путь.
            {dayNumber != null && ` Сегодня — день ${dayNumber}.`}
          </p>
        </div>
      </div>
    </Screen>
  )
}
