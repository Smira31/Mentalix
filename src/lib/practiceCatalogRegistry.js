import { PRACTICE_KEYS, isPracticeAvailable } from '../config/practiceAvailability'

export const PRACTICE_CATALOG_REGISTRY = [
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
    key: PRACTICE_KEYS.lilaDiscover || 'lila-discover',
    title: 'Разобраться через Лилу',
    subtitle: 'карта, несколько вопросов и один рабочий шаг',
    section: 'Лила',
    kind: 'journal',
    completionSource: 'none',
    sub: 'lila-discover',
  },
]

export const PRACTICE_RAIL_KEYS = [
  'lila-discover',
  PRACTICE_KEYS.rituals,
  PRACTICE_KEYS.ascezas,
]

export const PRACTICE_COLLECTIONS = [
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
    key: 'psychological',
    title: 'Психологические практики',
    description: 'Четыре коротких практики для начала, выбора и завершения.',
    kind: 'release',
    active: false,
    soon: true,
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
    active: false,
    soon: true,
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
