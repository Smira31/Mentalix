import { PRACTICE_KEYS, isPracticeAvailable } from '../config/practiceAvailability'

export const PRACTICE_CATALOG_REGISTRY = [
  {
    key: PRACTICE_KEYS.meditation,
    title: 'Медитация',
    subtitle: 'заметить своё и выбрать один спокойный шаг',
    section: 'Практики',
    kind: 'meditation',
    completionSource: 'none',
    sub: 'meditation',
  },
  {
    key: PRACTICE_KEYS.rituals,
    title: 'Ритуалы',
    subtitle: 'обряды, что держат твой день',
    section: 'Практики',
    kind: 'ritual',
    completionSource: 'server',
    sub: 'rituals',
  },
  {
    key: PRACTICE_KEYS.ascezas,
    title: 'Аскезы',
    subtitle: 'от чего ты отказываешься',
    section: 'Практики',
    kind: 'asceza',
    completionSource: 'server',
    sub: 'ascezas',
  },
  {
    key: PRACTICE_KEYS.firstStep,
    title: 'Первый шаг',
    subtitle: 'маленький шаг, когда трудно начать',
    section: 'Психологические практики',
    kind: 'next-step',
    completionSource: 'local',
    sub: 'first-step',
  },
  {
    key: PRACTICE_KEYS.noBlame,
    title: 'Без вины',
    subtitle: 'когда откладываешь и знаешь это',
    section: 'Психологические практики',
    kind: 'release',
    completionSource: 'local',
    sub: 'no-blame',
  },
  {
    key: PRACTICE_KEYS.narrowFocus,
    title: 'Одно из всех',
    subtitle: 'когда всё сразу — слишком много',
    section: 'Психологические практики',
    kind: 'focus',
    completionSource: 'local',
    sub: 'narrow-focus',
  },
  {
    key: PRACTICE_KEYS.oneFinish,
    title: 'Один финиш',
    subtitle: 'маленький кусок, доведённый до конца',
    section: 'Психологические практики',
    kind: 'next-step',
    completionSource: 'local',
    sub: 'one-finish',
  },
  {
    key: PRACTICE_KEYS.lilaDiscover || 'lila-discover',
    title: 'Разобраться через Лилу',
    subtitle: 'карта, несколько вопросов и один рабочий шаг',
    section: 'Лила',
    kind: 'journal',
    completionSource: 'none',
    sub: 'lila-discover',
  },
  {
    key: PRACTICE_KEYS.breathing,
    title: 'Дыхание',
    subtitle: 'успокоить систему за минуту',
    section: 'Живая линза',
    kind: 'breath',
    completionSource: 'none',
    sub: 'breathing',
  },
  {
    key: PRACTICE_KEYS.focus,
    title: 'Фокус',
    subtitle: 'таймер глубокой работы',
    section: 'Живая линза',
    kind: 'focus',
    completionSource: 'none',
    sub: 'focus',
  },
  {
    key: PRACTICE_KEYS.brain,
    title: 'Нейротренажёр',
    subtitle: 'внимание, память, реакция',
    section: 'Живая линза',
    kind: 'meditation',
    completionSource: 'none',
    sub: 'brain',
  },
]

export const PRACTICE_RAIL_KEYS = [
  'lila-discover',
  PRACTICE_KEYS.meditation,
  PRACTICE_KEYS.rituals,
  PRACTICE_KEYS.ascezas,
  PRACTICE_KEYS.firstStep,
  PRACTICE_KEYS.noBlame,
]

export const PRACTICE_COLLECTIONS = [
  {
    key: 'psychological',
    title: 'Психологические практики',
    description: 'Четыре коротких flow, когда нужно начать, выбрать или завершить.',
    kind: 'release',
    practiceKeys: [
      PRACTICE_KEYS.firstStep,
      PRACTICE_KEYS.noBlame,
      PRACTICE_KEYS.narrowFocus,
      PRACTICE_KEYS.oneFinish,
    ],
  },
  {
    key: 'rituals',
    title: 'Ритуалы',
    description: 'Твои повторяемые опоры и сегодняшний прогресс.',
    kind: 'ritual',
    source: 'rituals',
  },
  {
    key: 'ascezas',
    title: 'Аскезы',
    description: 'Выбранные ограничения и их текущий статус.',
    kind: 'asceza',
    source: 'ascezas',
  },
  {
    key: 'lila',
    title: 'Лила',
    description: 'Карта, несколько вопросов и один рабочий шаг.',
    kind: 'journal',
    practiceKeys: ['lila-discover'],
  },
  {
    key: 'living-lens',
    title: 'Живая линза',
    description: 'Четыре способа настроить внимание и состояние.',
    kind: 'focus',
    practiceKeys: [
      PRACTICE_KEYS.meditation,
      PRACTICE_KEYS.breathing,
      PRACTICE_KEYS.focus,
      PRACTICE_KEYS.brain,
    ],
  },
]

export function buildPracticeViewModels({ rituals = [], ascezas = [], completedToday }) {
  const ritualsDone = rituals.filter(ritual => ritual.today_level).length
  const ascezasHeld = ascezas.filter(asceza => asceza.today_status === 'held').length

  return PRACTICE_CATALOG_REGISTRY.map(practice => ({
    ...practice,
    available: isPracticeAvailable(practice.key),
    soon: !isPracticeAvailable(practice.key),
    progress:
      practice.key === PRACTICE_KEYS.rituals && rituals.length > 0
        ? `${ritualsDone}/${rituals.length}`
        : practice.key === PRACTICE_KEYS.ascezas && ascezas.length > 0
          ? `${ascezasHeld}/${ascezas.length}`
          : null,
    completedToday:
      practice.completionSource === 'local' ? completedToday?.has(practice.key) : false,
  }))
}

export function getPracticeByKey(practices, key) {
  return practices.find(practice => practice.key === key) || null
}
