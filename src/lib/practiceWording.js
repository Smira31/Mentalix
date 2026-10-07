import { pluralize } from './pluralize'
import { isRitualDoneToday } from './practiceDoneToday'

const DAY_FORMS = ['день', 'дня', 'дней']

/*
 * Готовые практики — один источник правды для экрана «новый ритуал.» / «новая аскеза.».
 * Каждый пресет: имя, минимум (текст-описание) и glyph-вид иконки SemanticGlyph.
 */
export const RITUAL_PRESETS = [
  { name: 'Стакан воды', minimum: 'пара глотков у кровати', glyph: 'glass' },
  { name: 'Прогулка', minimum: '10 минут вокруг дома', glyph: 'sneaker' },
  { name: 'Чтение', minimum: 'одна страница', glyph: 'book' },
  { name: 'Дыхание', minimum: '5 медленных вдохов', glyph: 'waves' },
  { name: 'Дневник', minimum: 'одна строка о дне', glyph: 'journal' },
  { name: 'Утро без телефона', minimum: '15 минут после пробуждения', glyph: 'phone-slash' },
]

export const ASCEZA_PRESETS = [
  { name: 'Без сахара', minimum: 'не покупать сладкое домой', glyph: 'candy' },
  { name: 'Соцсети до обеда', minimum: 'не открывать ленту до завтрака', glyph: 'phone-play' },
  { name: 'Без алкоголя', minimum: 'не пить в будни', glyph: 'wine-glass' },
  { name: 'Кофе после 14:00', minimum: 'не больше одной чашки после обеда', glyph: 'coffee' },
  { name: 'Без жалоб', minimum: 'поймал жалобу — переформулировал', glyph: 'speech-slash' },
  { name: 'Покупки по списку', minimum: 'ничего вне списка дороже 1000 ₽', glyph: 'shopping-bag' },
]

/*
 * Необязательные поля экрана практики: одна тихая строка «+ …» в карточке
 * «Зачем». Тап открывает экран-поле журнала (PracticeFieldFlow) и сохраняет
 * значение в практику; при создании эти поля не спрашиваются.
 */
export const RITUAL_OPTIONAL_FIELDS = [
  {
    key: 'optimal_version',
    label: 'Оптимум',
    flowLabel: 'ОПТИМУМ',
    step: {
      question: 'как сделать на полную?',
      hint: 'Версия ритуала, когда сил больше обычного.',
      chips: ['30 минут', 'два подхода', 'без спешки', 'на полную'],
    },
  },
]

export const ASCEZA_OPTIONAL_FIELDS = [
  {
    key: 'trigger',
    label: 'Что тебя тянет?',
    flowLabel: 'ТРИГГЕР',
    step: {
      question: 'что тебя тянет?',
      hint: 'Ситуация или чувство, после которого рука сама тянется к привычке.',
      chips: ['Стресс', 'Скука', 'Усталость', 'Тревога'],
    },
  },
  {
    key: 'replacement',
    label: 'Чем заменишь?',
    flowLabel: 'ЗАМЕНА',
    step: {
      question: 'чем заменишь?',
      hint: 'Действие, выбранное заранее вместо привычки.',
      chips: ['Дыхание', 'Прогулка', 'Стакан воды', 'Книга'],
    },
  },
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
        placeholder: 'Название',
        maxLength: 22,
        chips: ['Стакан воды', 'Прогулка', 'Чтение', 'Дыхание'],
      },
      {
        question: 'какой минимум даже в плохой день?',
        hint: 'Такой маленький, что не сделать — смешно.',
        placeholder: 'Мой минимум…',
        maxLength: 500,
        chips: ['пара глотков', 'одна страница', '5 вдохов', '10 минут'],
      },
    ],
    presets: RITUAL_PRESETS,
    optionalFields: RITUAL_OPTIONAL_FIELDS,
    defaultGlyph: 'hourglass',
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
        placeholder: 'Например: сахар',
        maxLength: 22,
        chips: ['Без сахара', 'Без алкоголя', 'Без жалоб', 'Без Reels'],
      },
      {
        question: 'где твоя граница даже в плохой день?',
        hint: 'Черта, которую не переходишь никогда.',
        placeholder: 'Моя граница…',
        maxLength: 500,
        chips: ['до обеда', 'в будни', 'по списку', 'после 14:00'],
      },
    ],
    presets: ASCEZA_PRESETS,
    optionalFields: ASCEZA_OPTIONAL_FIELDS,
    defaultGlyph: 'shield',
  },
}

/*
 * Тихая ссылка «Отметить вчера» под карточкой недели.
 *
 * Неделя кружками всегда заканчивается сегодняшним днём, поэтому вчера
 * не отмечено, когда серия до него не дотянулась: сегодняшний день отмечен,
 * а дни набираются с нуля (серия короче двух). Разрешает восстановление
 * сервер: лист отправляет restore_days_ago и показывает его отказ.
 */
export function canRestoreYesterday(item, kind) {
  const streak = item.streak || 0
  const done = PRACTICE_WORDING[kind].isDone(item)
  // Серия идёт сегодня, но вчера в неё не попало — есть что восстанавливать.
  // Без живой серии (0 дней) восстанавливать нечего: практика считается новой.
  return done && streak < 2
}

export const RESTORE_LINK_LABEL = 'Отметить вчера'

/*
 * Варианты отметки для восстановленного дня: у ритуала — ступени, которые
 * у него есть, у аскезы — «держусь».
 */
export function restoreChoicesFor(kind, item) {
  if (kind !== 'ritual') {
    return [{ value: 'held', label: 'Держусь', description: 'Восстановить день без срыва.' }]
  }
  const choices = []
  if (item.min_version)
    choices.push({ value: 'min', label: 'Минимум', description: item.min_version })
  if (item.optimal_version)
    choices.push({ value: 'optimal', label: 'Оптимум', description: item.optimal_version })
  if (choices.length === 0)
    choices.push({ value: 'optimal', label: 'Отметить', description: 'Восстановить день.' })
  return choices
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
 * «Знак» практики — 20 иконок сеткой 5×4.
 * Набор общий для ритуалов и аскез: визуальный язык один.
 * Порядок соответствует утверждённой таблице иконок.
 */
export const PRACTICE_GLYPHS = [
  'hourglass',
  'sneaker',
  'book',
  'journal',
  'glass',
  'waves',
  'phone-slash',
  'shield',
  'candy',
  'phone-play',
  'wine-glass',
  'coffee',
  'speech-slash',
  'shopping-bag',
  'star',
  'target',
  'praying-hands',
  'shower',
  'meditation',
  'cigarette',
]

export function isStreakMilestone(streak) {
  return PRACTICE_STREAK_MILESTONES.includes(streak)
}
