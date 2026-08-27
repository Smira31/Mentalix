import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Шаблон для JD-001–JD-005.
 *
 * Текущий Mentalix хранит production-код journalStorage в JavaScript.
 * Перед включением этого файла в CI нужно выбрать TS runner (например, Vitest),
 * добавить типизированный adapter или декларации для JS-модуля и подключить
 * фактический импорт из src/lib/journalStorage.js.
 */

type JournalPhase = 'idea' | 'action' | 'analysis' | 'newStep'
type PhaseStatus = 'draft' | 'final'

type JournalEntry = {
  date: string
  version: number
  cycle: Record<JournalPhase, { text: string; status: PhaseStatus; updatedAt: string | null }>
  freeWrites: Array<{ id: string; text: string; status: PhaseStatus; updatedAt: string | null }>
  updatedAt: string | null
}

type JournalStorage = {
  readJournalEntry: (date: string) => JournalEntry
  saveJournalPhase: (input: {
    date: string
    phase: JournalPhase
    text: string
    status?: PhaseStatus
  }) => JournalEntry
  clearJournalStore: () => boolean
}

function createMemoryStorage() {
  const values = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
  }
}

describe('MXL-JOURNAL-PERSISTENCE-001: JD-001–JD-005', () => {
  const date = '2026-08-27'
  let storage: ReturnType<typeof createMemoryStorage>
  let journal: JournalStorage

  beforeEach(async () => {
    storage = createMemoryStorage()
    vi.stubGlobal('localStorage', storage)

    // Заменить на реальный typed adapter после добавления TS runner:
    // journal = await import('../../src/lib/journalStorage.js')
    journal = (await import('../../src/lib/journalStorage.js')) as unknown as JournalStorage
    journal.clearJournalStore()
    storage.removeItem('mx-journal-prototype-v1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('JD-001: показывает безопасную пустую запись при чистом storage', () => {
    const entry = journal.readJournalEntry(date)

    expect(entry.date).toBe(date)
    expect(entry.cycle.idea.text).toBe('')
    expect(entry.cycle.action.text).toBe('')
    expect(entry.cycle.idea.status).toBe('draft')
    expect(entry.updatedAt).toBeNull()
  })

  it('JD-002: сохраняет введённую Идею как draft до нажатия CTA', () => {
    journal.saveJournalPhase({ date, phase: 'idea', text: 'Что зависит от меня?' })

    const entry = journal.readJournalEntry(date)
    expect(entry.cycle.idea).toMatchObject({
      text: 'Что зависит от меня?',
      status: 'draft',
    })
    expect(entry.cycle.idea.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('JD-003: сохраняет Идею при переходе к Действию', () => {
    journal.saveJournalPhase({ date, phase: 'idea', text: 'Наблюдение дня' })
    journal.saveJournalPhase({ date, phase: 'action', text: 'Один проверяемый шаг' })

    const entry = journal.readJournalEntry(date)
    expect(entry.cycle.idea.text).toBe('Наблюдение дня')
    expect(entry.cycle.action.text).toBe('Один проверяемый шаг')
    expect(entry.cycle.analysis.text).toBe('')
  })

  it('JD-004: сохраняет обе заполненные фазы при возврате назад', () => {
    journal.saveJournalPhase({ date, phase: 'idea', text: 'Идея' })
    journal.saveJournalPhase({ date, phase: 'action', text: 'Действие' })

    const afterBack = journal.readJournalEntry(date)
    expect(afterBack.cycle.idea.text).toBe('Идея')
    expect(afterBack.cycle.action.text).toBe('Действие')
  })

  it('JD-005: не перезаписывает соседние фазы четырёхфазного цикла', () => {
    const values: Array<[JournalPhase, string]> = [
      ['idea', 'Идея'],
      ['action', 'Действие'],
      ['analysis', 'Анализ'],
      ['newStep', 'Новый шаг'],
    ]

    for (const [phase, text] of values) journal.saveJournalPhase({ date, phase, text })

    const entry = journal.readJournalEntry(date)
    for (const [phase, text] of values) expect(entry.cycle[phase].text).toBe(text)
    expect(Object.values(entry.cycle).filter(phase => phase.text).length).toBe(4)
  })
})
