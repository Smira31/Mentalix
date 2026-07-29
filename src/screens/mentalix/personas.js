import {
  Footprints,
  MessageCircle,
  Mountain,
} from 'lucide-react'

export const MENTOR_PERSONA_KEY =
  'mx-mentor-persona'

export const MENTOR_DRAFT_KEY =
  'mx-mentor-draft'

export const PERSONAS = [
  {
    key: 'mayak',
    name: 'Собеседник',
    tagline: 'выслушает без оценки',
    desc:
      'Тёплый и внимательный. Поможет разобраться в чувствах, когда непросто.',
    question:
      'Что сейчас\nу тебя на душе?',
    intro:
      'Расскажи всё, что чувствуешь. Я рядом, чтобы выслушать.',
    asking:
      'Собеседник спрашивает',
    typing:
      'слушает тебя…',
    Icon: MessageCircle,
    starters: [
      'Сегодня было тяжело',
      'Не могу выключить голову',
    ],
  },

  {
    key: 'kompas',
    name: 'Наставник',
    tagline: 'вернёт к действию',
    desc:
      'Строгий и честный. Разложит цель на шаги и не даст себя жалеть.',
    question:
      'Какой шаг\nты сделаешь сегодня?',
    intro:
      'Сфокусируйся на главном. Я помогу не сбиться с пути.',
    asking:
      'Наставник спрашивает',
    typing:
      'ищет следующий шаг…',
    Icon: Mountain,
    starters: [
      'Разложи цель на шаги',
      'Я топчусь на месте',
    ],
  },

  {
    key: 'dnevnik',
    name: 'Следопыт',
    tagline: 'видит твои паттерны',
    desc:
      'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
    question:
      'Что сегодня\nосталось с тобой?',
    intro:
      'Отвечай свободно. Я разберу твой день и помогу заметить то, что легко пропустить.',
    asking:
      'Следопыт спрашивает',
    typing:
      'разбирает твой день…',
    Icon: Footprints,
    starters: [
      'Подведи итоги дня',
      'Что я упускаю?',
    ],
  },
]

export function readPendingMentor() {
  try {
    const persona =
      sessionStorage.getItem(
        MENTOR_PERSONA_KEY,
      )

    const draft =
      sessionStorage.getItem(
        MENTOR_DRAFT_KEY,
      ) || ''

    sessionStorage.removeItem(
      MENTOR_PERSONA_KEY,
    )

    sessionStorage.removeItem(
      MENTOR_DRAFT_KEY,
    )

    const valid = PERSONAS.some(
      (item) =>
        item.key === persona,
    )

    if (!valid) {
      return {
        persona: null,
        draft: '',
      }
    }

    return {
      persona,
      draft,
    }
  } catch {
    return {
      persona: null,
      draft: '',
    }
  }
}