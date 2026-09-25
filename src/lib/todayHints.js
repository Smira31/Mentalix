/*
 * Подсказки на «Сегодня» показываются по одной. Порядок — как на экране:
 * сначала подсказка о серии, затем подсказка о двух карточках дня.
 * Следующая появляется только после того, как предыдущую закрыли
 * (крестиком или пролистыванием).
 */
export const TODAY_HINT_ORDER = ['series', 'cards']

/**
 * @param {{ series?: boolean, cards?: boolean }} eligible — какие подсказки ещё не закрыты
 * @returns {'series' | 'cards' | null} — единственная видимая подсказка
 */
export function pickVisibleTodayHint(eligible) {
  return TODAY_HINT_ORDER.find(id => Boolean(eligible?.[id])) ?? null
}
