const BASE_FIXTURE = {
  rituals: [
    { id: 'ui-lab-ritual-1', name: 'Один честный шаг', today_level: null },
    { id: 'ui-lab-ritual-2', name: 'Пять минут внимания', today_level: null },
  ],
  ascezas: [{ id: 'ui-lab-asceza-1', name: 'Не ускоряться', today_status: null }],
  quote: { text: 'Не всё нужно решить сегодня.' },
  themes: [
    {
      id: 'ui-lab-theme-1',
      title: 'спокойная ясность',
      subtitle: 'Замечать главное без лишнего давления.',
      total_days: 7,
      reflected_days: 3,
      is_current: true,
    },
  ],
  settings: { review_hour: 19 },
}

const CHECKIN = { mood: 3, emotion: 'ровно', review_completed_at: null }

export const UI_LAB_USER = { id: 'ui-lab-fixture-user' }

export function getTodayLabFixture(state) {
  if (state === 'checkinPending') return { ...BASE_FIXTURE, checkin: null }
  if (state === 'reviewPending')
    return { ...BASE_FIXTURE, checkin: CHECKIN, settings: { review_hour: 0 } }
  if (state === 'dayClosed') {
    return {
      ...BASE_FIXTURE,
      checkin: { ...CHECKIN, review_completed_at: '2026-09-02T08:00:00.000Z' },
      settings: { review_hour: 0 },
    }
  }
  return { ...BASE_FIXTURE, checkin: CHECKIN }
}
