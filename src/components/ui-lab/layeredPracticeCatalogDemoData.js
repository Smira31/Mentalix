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
      slug: 'demo-less-effort',
      title: 'Один вопрос.',
      subtitle: 'Тема недели:',
      current_day: 1,
      reflected_days: 2,
      started: true,
      is_current: true,
      questions: [
        {
          id: 'demo-question-1',
          question: 'Что сегодня можно сделать с меньшим усилием?',
          explanation: 'Заметь, где достаточно одного простого шага.',
        },
        {
          id: 'demo-question-2',
          question: 'Что ты продолжаешь тащить по привычке?',
          explanation: 'Проверь, действительно ли это всё ещё необходимо.',
        },
        {
          id: 'demo-question-3',
          question: 'Где можно попросить о поддержке?',
          explanation: 'Не всё обязательно удерживать в одиночку.',
        },
        {
          id: 'demo-question-4',
          question: 'Что поможет завершить неделю чуть легче?',
          explanation: 'Выбери один шаг, который освободит внимание.',
        },
      ],
    },
  ],
}

export const LAYERED_CATALOG_DEMO_COMPLETED_KEYS = ['first-step']
