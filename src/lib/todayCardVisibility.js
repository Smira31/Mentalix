// Видимость необязательных карточек экрана «Сегодня».
//
// Синхронизируемый (useSynced) флаг — JSON-массив id скрытых карточек,
// тот же паттерн, что APP_LOCK_ENABLED_KEY/ONBOARDED_KEY. Герой-карточка,
// основной hero, MorningPilotCard и блок «Чек-ин выполнен»
// сюда не входят — это либо ядро экрана, либо единственный путь
// переоткрыть чек-ин, тумблер для них не предусмотрен.
export const TODAY_CARDS_HIDDEN_KEY = 'mx-today-cards-hidden'

export const TODAY_CARD_IDS = ['pulse', 'dayProgress', 'theme', 'quote']

export const TODAY_CARD_LABELS = {
  pulse: {
    title: 'Пульс',
    subtitle: '«Сегодня в пути вместе с тобой»',
  },
  dayProgress: {
    title: 'День',
    subtitle: 'Прогресс-бар практик дня',
  },
  theme: {
    title: 'Тема недели',
    subtitle: 'Карточка недельной темы',
  },
  quote: {
    title: 'Мысль дня',
    subtitle: 'Цитата в конце экрана',
  },
}

export function parseHiddenCards(raw) {
  try {
    const list = JSON.parse(raw || '[]')

    return Array.isArray(list) ? list.filter(id => TODAY_CARD_IDS.includes(id)) : []
  } catch {
    return []
  }
}
