import './PracticeWeek.css'
import { weekDayCircles } from '../../lib/practiceWeekGrid'

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/* Сегодняшний день в неделе Пн → Вс (Date.getDay(): 0 — воскресенье). */
function todayIndex() {
  return (new Date().getDay() + 6) % 7
}

/*
 * Неделя кружками с подписями дней — один ряд и на экране практики
 * («Эта неделя»), и на экране вехи. Заполнены последние `streak` дней,
 * но не дальше сегодняшнего: серия всегда заканчивается сегодня, а дни
 * до неё (пока серия короче недели) остаются пустыми.
 */
export default function PracticeWeek({ streak = 0 }) {
  const today = todayIndex()
  const { filled, firstFilled } = weekDayCircles(streak, today)

  return (
    <div
      className="mx-practice-week"
      role="img"
      aria-label={`Дней отмечено на этой неделе: ${filled} из ${today + 1}`}
    >
      {WEEK_DAYS.map((label, index) => (
        <span className="mx-practice-week__day" key={label}>
          <span
            className={`mx-practice-week__circle${
              index >= firstFilled && index <= today ? ' is-on' : ''
            }${index === today ? ' is-today' : ''}`}
          />
          <span className="mx-practice-week__label">{label}</span>
        </span>
      ))}
    </div>
  )
}
