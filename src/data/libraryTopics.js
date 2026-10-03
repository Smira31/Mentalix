const mountain = new URL('../assets/library/placeholder-mountain.svg', import.meta.url).href
const mask = new URL('../assets/library/placeholder-mask.svg', import.meta.url).href
const book = new URL('../assets/library/placeholder-book.svg', import.meta.url).href

export const LIBRARY_TOPICS = {
  'путь-героя': { title: 'Путь героя', image: mountain },
  юнг: { title: 'Юнг', image: mask },
  кризис: { title: 'Кризис', image: book },
  ии: { title: 'ИИ', image: book },
  тревога: { title: 'Тревога', image: book },
  сон: { title: 'Сон', image: book },
  rest: { title: 'Ещё почитать', image: book },
}

export function libraryTopic(tag) {
  return LIBRARY_TOPICS[tag] || { title: (tag || 'Статья').replaceAll('-', ' '), image: book }
}
