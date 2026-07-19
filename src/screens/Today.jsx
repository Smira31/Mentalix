import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const SCALE = [1, 2, 3, 4, 5]
const LABELS = {
  mood: 'Настроение',
  energy: 'Энергия',
  anxiety: 'Тревога',
  focus: 'Фокус',
}

function Scale({ label, value, onChange }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-cream/50 mb-1">{label}</div>
      <div className="flex gap-2">
        {SCALE.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-9 rounded-lg border text-sm transition-colors ${
              value === n
                ? 'bg-cognac border-cognac text-cream'
                : 'bg-emerald-light/20 border-cream/15 text-cream/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function derivePriorityAction({ checkin, habits }) {
  if (!checkin) {
    return 'Начни с чек-ина — отметь, как ты сейчас, это займёт 20 секунд'
  }
  if (checkin.anxiety >= 4) {
    return 'Тревога высокая — сделай паузу на 3 минуты и просто подыши, прежде чем продолжать дела'
  }
  const undone = habits.filter((h) => !h.today_level)
  if (undone.length > 0) {
    return `Есть незакрытая привычка: «${undone[0].name}» — маленький шаг сейчас удержит серию`
  }
  if (checkin.energy <= 2) {
    return 'Энергия низкая — сегодня можно снизить темп, это тоже часть системы, а не срыв'
  }
  return 'Все отметки закрыты — можно спокойно жить дальше, система держит фокус за тебя'
}

const EMPTY_DRAFT = {
  name: '', goal: '', min_version: '', optimal_version: '', skip_consequence: '', goal_id: '',
}

function HabitForm({ goals, onCreate, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  function
