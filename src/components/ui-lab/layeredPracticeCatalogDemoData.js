export const LAYERED_CATALOG_DEMO_DATA = {
  rituals: [
    { id: 'demo-ritual-1', name: 'Утренний вопрос', today_level: true },
    { id: 'demo-ritual-2', name: 'Десять минут тишины', today_level: false },
    { id: 'demo-ritual-3', name: 'Закрыть день', today_level: false },
  ],
  ascezas: [
    { id: 'demo-asceza-1', name: 'Без телефона за столом', today_status: 'held' },
    { id: 'demo-asceza-2', name: 'Не открывать ленту до завтрака', today_status: null },
  ],
  themes: [
    {
      id: 'demo-theme-1',
      slug: 'demo-presence',
      title: 'Присутствие',
      subtitle: 'Неделя о том, как возвращать внимание к тому, что происходит сейчас.',
      total_days: 7,
      current_day: 3,
      reflected_days: 2,
      started: true,
      is_current: true,
    },
    {
      id: 'demo-theme-2',
      slug: 'demo-return',
      title: 'Возвращение',
      subtitle: 'Неделя о спокойном возвращении к важному после паузы.',
      total_days: 7,
      current_day: 0,
      reflected_days: 0,
      started: false,
      is_current: false,
    },
    {
      id: 'demo-theme-3',
      slug: 'demo-pace',
      title: 'Устойчивый темп',
      subtitle: 'Неделя о маленьких действиях, которые можно повторить завтра.',
      total_days: 7,
      current_day: 0,
      reflected_days: 0,
      started: false,
      is_current: false,
    },
  ],
}

export const LAYERED_CATALOG_DEMO_COMPLETED_KEYS = ['first-step']
