import { PRACTICE_KEYS, isPracticeAvailable } from '../config/practiceAvailability'

export const PRACTICE_CATALOG_REGISTRY = [
  {
    key: PRACTICE_KEYS.rituals,
    title: 'Ритуалы',
    subtitle: 'обряды, что держат твой день',
    description: 'Маленькие ежедневные действия, которые собирают день.',
    section: 'Практики',
    kind: 'ritual',
    completionSource: 'server',
    sub: 'rituals',
  },
  {
    key: PRACTICE_KEYS.ascezas,
    title: 'Аскезы',
    subtitle: 'от чего ты отказываешься',
    description: 'Добровольный отказ от лишнего, чтобы вернуть себе контроль.',
    section: 'Практики',
    kind: 'asceza',
    completionSource: 'server',
    sub: 'ascezas',
  },
  {
    key: PRACTICE_KEYS.daimon,
    title: 'Даймон',
    subtitle: 'игра для самопознания: вопрос, кубик, разговор с внутренним голосом',
    description: 'Игра для самопознания: задай вопрос, брось кубик, поговори с внутренним голосом.',
    section: 'Самопознание',
    kind: 'daimon',
    completionSource: 'none',
    sub: 'daimon',
  },
]

export const PRACTICE_RAIL_KEYS = [
  PRACTICE_KEYS.daimon,
  PRACTICE_KEYS.rituals,
  PRACTICE_KEYS.ascezas,
]

export const PRACTICE_COLLECTIONS = [
  {
    key: 'rituals',
    title: 'Ритуалы',
    description: 'Твои опоры и прогресс на сегодня',
    kind: 'ritual',
    source: 'rituals',
  },
  {
    key: 'ascezas',
    title: 'Аскезы',
    description: 'Твои ограничения и их статус',
    kind: 'asceza',
    source: 'ascezas',
  },
  {
    key: 'lila',
    title: 'Даймон',
    description: 'Игра для самопознания: вопрос, кубик, разговор с внутренним голосом.',
    kind: 'daimon',
    practiceKeys: [PRACTICE_KEYS.daimon],
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
