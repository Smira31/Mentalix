import './PracticeWeek.css'

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/* Сегодняшний день в неделе Пн → Вс (Date.getDay(): 0 — воскресенье). */
function todayIndex() {
  return (new Date().getDay() + 6) % 7
}

/*
 * Неделя кружками с подписями дней — один ряд и на экране практики
 * («Эта неделя»), и на экране вехи. Заполнены последние `streak` дней,
 * не больше семи: серия всегда заканчивается сегодняшним днём.
 */
export default function PracticeWeek({ streak = 0 }) {
  const today = todayIndex()
  const filled = Math.min(Math.max(streak, 0), WEEK_DAYS.length)
  const firstFilled = WEEK_DAYS.length - filled

  return (
    <div
      className="mx-practice-week"
      role="img"
      aria-label={`Дней отмечено на этой неделе: ${filled} из 7`}
    >
      {WEEK_DAYS.map((label, index) => (
        <span className="mx-practice-week__day" key={label}>
          <span
            className={`mx-practice-week__circle${index >= firstFilled ? ' is-on' : ''}${
              index === today ? ' is-today' : ''
            }`}
          />
          <span className="mx-practice-week__label">{label}</span>
        </span>
      ))}
    </div>
  )
}
