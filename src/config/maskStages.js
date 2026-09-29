// Единственный список стадий и место для будущих иллюстраций владельца.
// Пока image: null, используется существующая маска баннера профиля.
export const MASK_STAGES = Object.freeze([
  { id: 'awakening', name: 'Пробуждается', minDays: 0, image: null },
  { id: 'forming', name: 'Держит форму', minDays: 7, image: null },
  { id: 'finding-path', name: 'Находит путь', minDays: 30, image: null },
  { id: 'leading', name: 'Ведёт', minDays: 100, image: null },
])
