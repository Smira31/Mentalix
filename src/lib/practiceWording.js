import { pluralize } from './pluralize'
import { isRitualDoneToday } from './practiceDoneToday'

const DAY_FORMS = ['день', 'дня', 'дней']

/*
 * Готовые практики — один источник правды для экрана «новый ритуал.» / «новая аскеза.».
 * Каждый пресет: имя, минимум (текст-описание) и glyph-вид иконки SemanticGlyph.
 */
export const RITUAL_PRESETS = [
  { name: 'Стакан воды', minimum: 'пара глотков у кровати', glyph: 'water' },
  { name: 'Прогулка', minimum: '10 минут вокруг дома', glyph: 'ritual' },
  { name: 'Чтение', minimum: 'одна страница', glyph: 'journal' },
  { name: 'Дыхание', minimum: '5 медленных вдохов', glyph: 'breath' },
  { name: 'Дневник', minimum: 'одна строка о дне', glyph: 'journal' },
  { name: 'Утро без телефона', minimum: '15 минут после пробуждения', glyph: 'purpose' },
]

export const ASCEZA_PRESETS = [
  { name: 'Без сахара', minimum: 'не покупать сладкое домой', glyph: 'asceza' },
  { name: 'Соцсети до обеда', minimum: 'не открывать ленту до завтрака', glyph: 'asceza' },
  { name: 'Без алкоголя', minimum: 'не пить в будни', glyph: 'alcohol' },
  { name: 'Кофе после 14:00', minimum: 'не больше одной чашки после обеда', glyph: 'asceza' },
  { name: 'Без жалоб', minimum: 'поймал жалобу — переформулировал', glyph: 'asceza' },
  { name: 'Покупки по списку', minimum: 'ничего вне списка дороже 1000 ₽', glyph: 'asceza' },
]

/*
 * Единый каркас для ритуалов и аскез — отличаются только слова.
 * kind, поля и API-вызовы остаются на стороне сервера; здесь — только подача.
 */
export const PRACTICE_WORDING = {
  ritual: {
    kind: 'ritual',
    title: 'ритуалы.',
    subtitle: 'обряды, что держат твой день',
    newLabel: 'Новый ритуал',
    ownPill: 'Свой ритуал',
    readyTitle: 'новый ритуал.',
    readySubtitle: 'Выбери готовый — или придумай свой.',
    addedToast: 'Ритуал добавлен',
    savedToast: 'Изменено',
    ownLabel: 'НОВЫЙ РИТУАЛ',
    editLabel: 'ИЗМЕНИТЬ',
    signTitle: 'знак.',
    signSubtitle: 'Выбери иконку ритуала.',
    createCta: 'Создать ритуал',
    cardMinimumLabel: 'минимум',
    // Ноль дней — это не «серия 0 дней», а ещё не начатая практика.
    statusLabel: streak =>
      streak > 0 ? `серия ${streak} ${pluralize(streak, DAY_FORMS)}` : 'новый ритуал',
    markButton: 'Отметить сегодня',
    markedButton: 'Отмечено сегодня',
    isDone: item => isRitualDoneToday(item.today_level),
    markValue: item => (item.optimal_version ? 'optimal' : item.min_version ? 'min' : 'optimal'),
    unmarkValue: () => null,
    minimumValue: item => item.min_version || '',
    ownSteps: [
      {
        question: 'как назовёшь ритуал?',
        hint: 'Коротко — так, как скажешь себе утром.',
        chips: ['Стакан воды', 'Прогулка', 'Чтение', 'Дыхание'],
      },
      {
        question: 'какой минимум даже в плохой день?',
        hint: 'Такой маленький, что не сделать — смешно.',
        chips: ['пара глотков', 'одна страница', '5 вдохов', '10 минут'],
      },
    ],
    presets: RITUAL_PRESETS,
    defaultGlyph: 'ritual',
  },
  asceza: {
    kind: 'asceza',
    title: 'аскезы.',
    subtitle: 'от чего ты отказываешься',
    newLabel: 'Новая аскеза',
    ownPill: 'Своя аскеза',
    readyTitle: 'новая аскеза.',
    readySubtitle: 'Выбери готовый — или придумай свой.',
    addedToast: 'Аскеза добавлена',
    savedToast: 'Изменено',
    ownLabel: 'НОВАЯ АСКЕЗА',
    editLabel: 'ИЗМЕНИТЬ',
    signTitle: 'знак.',
    signSubtitle: 'Выбери иконку аскезы.',
    createCta: 'Принять аскезу',
    cardMinimumLabel: 'граница',
    statusLabel: streak =>
      streak > 0 ? `держишься ${streak} ${pluralize(streak, DAY_FORMS)}` : 'новая аскеза',
    markButton: 'Держусь сегодня',
    markedButton: 'Держусь ✓',
    isDone: item => item.today_status === 'held',
    markValue: () => 'held',
    unmarkValue: () => null,
    minimumValue: item => item.reason || item.trigger || '',
    ownSteps: [
      {
        question: 'от чего отказываешься?',
        hint: 'Одна вещь — не список.',
        chips: ['Без сахара', 'Без алкоголя', 'Без жалоб', 'Без Reels'],
      },
      {
        question: 'где твоя граница даже в плохой день?',
        hint: 'Черта, которую не переходишь никогда.',
        chips: ['до обеда', 'в будни', 'по списку', 'после 14:00'],
      },
    ],
    presets: ASCEZA_PRESETS,
    defaultGlyph: 'asceza',
  },
}

/*
 * Собирает драфт создания из 2-шагового флоу «Свой».
 * Шаг 1 → name, шаг 2 → минимум (min_version для ритуала, reason для аскезы).
 * Серверные поля не добавляются — только те, что уже принимает API.
 */
export function buildOwnDraft(kind, name, minimum) {
  if (kind === 'ritual') {
    return { name, category: 'psycho', min_version: minimum }
  }
  return { name, category: 'psycho', reason: minimum }
}

/*
 * Собирает патч правки: имя практики и её минимум.
 * Серверные поля те же, что при создании, — новых полей не вводим.
 */
export function buildEditPatch(kind, name, minimum) {
  return kind === 'ritual' ? { name, min_version: minimum } : { name, reason: minimum }
}

/*
 * Собирает драфт из готового пресета — добавляется сразу, одним тапом.
 */
export function buildPresetDraft(kind, preset) {
  if (kind === 'ritual') {
    return { name: preset.name, category: 'psycho', min_version: preset.minimum }
  }
  return { name: preset.name, category: 'psycho', reason: preset.minimum }
}

/*
 * Вехи серии — дни, которые отмечаются отдельно: 3 / 7 / 21 / 30.
 * На отметке, доводящей серию до вехи, каркас открывает экран вехи.
 */
export const PRACTICE_STREAK_MILESTONES = [3, 7, 21, 30]

/* Одна фраза на ступень — что человек уже доказал себе. */
export const MILESTONE_PHRASES = {
  3: 'Три дня подряд — ты уже не новичок.',
  7: 'Неделя. Привычка начинает держаться сама.',
  21: 'Три недели. Это уже часть тебя.',
  30: 'Месяц. Ты доказал себе, что можешь.',
}

export function milestonePhrase(streak) {
  return MILESTONE_PHRASES[streak] || ''
}

/* Подпись под кругом вехи: «3 дня.» / «7 дней.» / «21 день.». */
export function milestoneDayLabel(streak) {
  return `${streak} ${pluralize(streak, DAY_FORMS)}.`
}

/*
 * «Знак» практики — 12 иконок SemanticGlyph сеткой 4×3.
 * Набор общий для ритуалов и аскез: визуальный язык один.
 */
export const PRACTICE_GLYPHS = [
  'ritual',
  'water',
  'breath',
  'journal',
  'prayer',
  'purpose',
  'shower',
  'meditation',
  'asceza',
  'alcohol',
  'smoking',
  'focus',
]

export function isStreakMilestone(streak) {
  return PRACTICE_STREAK_MILESTONES.includes(streak)
}
