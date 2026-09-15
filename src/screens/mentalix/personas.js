import { Footprints, MessageCircle, Mountain } from 'lucide-react'
import { pickByDay, PERSONA_STARTER_PROMPTS } from '../../data/prompts'

export const MENTOR_PERSONA_KEY = 'mx-mentor-persona'

export const MENTOR_DRAFT_KEY = 'mx-mentor-draft'

// MXL-AI-REFRAME-001: отдельный флаг хендоффа от «Обсудить с AI» на
// сохранённой записи (History.jsx) — включает лид-дисклеймер и
// safety-проверку ответов в Mentalix.jsx, не влияя на остальные хендоффы
// (openScout/openListener/deepenMorningNote), которые этот флаг не пишут.
export const MENTOR_SAFETY_KEY = 'mx-mentor-safety'

export const PERSONAS = [
  {
    key: 'mayak',
    name: 'Собеседник',
    tagline: 'выслушает без оценки',
    desc: 'Тёплый и внимательный. Поможет разобраться в чувствах, когда непросто.',
    question: 'Что сейчас\nу тебя на душе?',
    intro: 'Расскажи всё, что чувствуешь. Я рядом, чтобы выслушать.',
    asking: 'Собеседник спрашивает',
    typing: 'слушает тебя…',
    Icon: MessageCircle,
    starters: [
      pickByDay(PERSONA_STARTER_PROMPTS.mayak, 0),
      pickByDay(PERSONA_STARTER_PROMPTS.mayak, 1),
    ],
  },

  {
    key: 'kompas',
    name: 'Наставник',
    tagline: 'помогает начать с малого',
    desc: 'Спокойно разберёт намерение и поможет превратить его в один небольшой шаг, который можно попробовать без давления.',
    question: 'Что ты хочешь сделать,\nно пока не начинаешь?',
    intro: 'Расскажи, что ты хочешь сделать, но пока не начинаешь. Мы попробуем уменьшить это до одного шага на несколько минут.',
    asking: 'Наставник спрашивает',
    typing: 'ищет следующий шаг…',
    Icon: Mountain,
    starters: [
      pickByDay(PERSONA_STARTER_PROMPTS.kompas, 0),
      pickByDay(PERSONA_STARTER_PROMPTS.kompas, 1),
    ],
  },

  {
    key: 'dnevnik',
    name: 'Следопыт',
    tagline: 'видит твои паттерны',
    desc: 'Наблюдательный. Подведёт итоги дня и заметит то, что ты пропустил.',
    question: 'Что сегодня\nосталось с тобой?',
    intro: 'Отвечай свободно. Я разберу твой день и помогу заметить то, что легко пропустить.',
    asking: 'Следопыт спрашивает',
    typing: 'разбирает твой день…',
    Icon: Footprints,
    starters: [
      pickByDay(PERSONA_STARTER_PROMPTS.dnevnik, 0),
      pickByDay(PERSONA_STARTER_PROMPTS.dnevnik, 1),
    ],
  },
]

export function readPendingMentor() {
  try {
    const persona = sessionStorage.getItem(MENTOR_PERSONA_KEY)

    const draft = sessionStorage.getItem(MENTOR_DRAFT_KEY) || ''

    const safety = sessionStorage.getItem(MENTOR_SAFETY_KEY) === '1'

    sessionStorage.removeItem(MENTOR_PERSONA_KEY)

    sessionStorage.removeItem(MENTOR_DRAFT_KEY)

    sessionStorage.removeItem(MENTOR_SAFETY_KEY)

    const valid = PERSONAS.some(item => item.key === persona)

    if (!valid) {
      return {
        persona: null,
        draft: '',
        safety: false,
      }
    }

    return {
      persona,
      draft,
      safety,
    }
  } catch {
    return {
      persona: null,
      draft: '',
      safety: false,
    }
  }
}
