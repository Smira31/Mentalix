/**
 * Shared QA fixtures — derived from tests/ux/ux-check.spec.mjs fixtureFor.
 * Exposed so both the UX gate and the QA crawl use the same API contract.
 */

export const TEST_USER = {
  id: 900001,
  first_name: 'UX',
  username: 'local_ux_check',
}

export const QA_FIXED_TIME = process.env.QA_FIXED_TIME || '08:00'

export const TODAY_PREVIEW_STATES = [
  'checkinPending',
  'dayInProgress',
  'reviewPending',
  'dayClosed',
  'morningPrimary',
  'eveningPrimary',
  'bothDone',
  'night',
  'streak0',
  'streak5',
]

export const VIEWPORTS = [
  { name: '393x852', width: 393, height: 852 },
  { name: '440x956', width: 440, height: 956 },
]

const FIXTURES = {
  rituals: [
    {
      id: 900101,
      name: 'Утренний спорт',
      goal: 'Разбудить тело и внимание.',
      min_version: '10 минут движения',
      optimal_version: '30 минут тренировки',
      skip_consequence: 'День начинается тяжелее.',
      today_level: 'optimal',
      streak: 4,
    },
    {
      id: 900102,
      name: 'Стакан воды',
      goal: 'Начать день с простого действия в пользу тела.',
      min_version: 'Один стакан',
      optimal_version: 'Два стакана и пауза',
      today_level: null,
      streak: 1,
    },
    {
      id: 900103,
      name: 'Три минуты тишины',
      goal: 'Вернуть внимание к текущему моменту.',
      optimal_version: 'Три минуты без экрана',
      today_level: 'optimal',
      streak: 3,
    },
  ],
  ascezas: [
    {
      id: 900201,
      name: 'Без Reels после 22:00',
      category: 'narrow-focus',
      replacement: 'Открыть книгу или лечь спать.',
      today_status: 'held',
      streak: 2,
      reason: 'Сон важнее.',
      trigger: 'Открыть телефон перед сном.',
    },
    {
      id: 900202,
      name: 'Без телефона за столом',
      category: 'narrow-focus',
      reason: 'Есть внимательнее и быть рядом с людьми.',
      trigger: 'Автоматически тянуться к экрану.',
      replacement: 'Сделать один спокойный вдох.',
      today_status: null,
      streak: 0,
    },
    {
      id: 900203,
      name: 'Не открывать ленту до завтрака',
      category: 'narrow-focus',
      reason: 'Сохранить своё внимание для начала дня.',
      today_status: 'held',
      streak: 5,
    },
  ],
  quote: { text: 'Один спокойный шаг важнее идеального плана.' },
  checkin: null,
  themes: [
    {
      id: 701,
      title: 'о меньшем усилии',
      subtitle: 'Семь коротких наблюдений о том, что действительно двигает.',
      total_days: 7,
      reflected_days: 1,
    },
  ],
  theme: {
    id: 701,
    title: 'о меньшем усилии',
    subtitle: 'Семь коротких наблюдений о том, что действительно двигает.',
    current_day: 2,
    free_days: 7,
    days: [
      {
        day: 1,
        text: 'Бывало так, что ты переставал давить — и дело вдруг шло легче?',
        prompt: 'Что тогда произошло на самом деле?',
        reflection: 'Я сделал **один** спокойный шаг.',
        locked: false,
      },
      {
        day: 2,
        text: 'Усилие и напряжение — разные вещи. Первое двигает, второе только изматывает.',
        prompt: 'Где сегодня ты напрягался вместо того, чтобы делать?',
        reflection: '',
        locked: false,
      },
      ...Array.from({ length: 5 }, (_, index) => ({
        day: index + 3,
        text: 'Следующий вопрос недели.',
        prompt: 'Что замечаешь?',
        reflection: '',
        locked: false,
      })),
    ],
  },
  settings: { review_hour: 24 },
  pulse: { active_today: 12 },
  pinnedPractices: [
    { practice_id: 'first-step' },
    { practice_id: 'breathing' },
    { practice_id: 'focus' },
  ],
  articles: [
    {
      id: 1,
      title: 'Как начать с одного шага',
      excerpt: 'Короткий локальный материал для проверки карточки библиотеки.',
      tag: 'Фокус',
      minutes: 4,
      date: '2026-08-22',
      body: 'Первый абзац локального материала.\n\nВторой абзац не обращается к production.',
    },
  ],
  analytics: {
    period_days: 14,
    rituals: [],
    ascezas: [],
    insights: [],
    daily_activity: [],
  },
  history: [
    {
      id: 900500,
      date: '2026-09-22',
      mood: 3,
      energy: 2,
      note: 'Спокойный день.',
      emotion: 'ровно',
      review_completed_at: '2026-09-22T20:00:00Z',
    },
  ],
}

export function jsonResponse(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

export function fixtureFor(request) {
  const url = new URL(request.url())
  const pathname = url.pathname
  const method = request.method()

  if (method !== 'GET') {
    if (pathname === '/api/checkin') {
      return jsonResponse({ mood: 3, energy: 3, anxiety: 3, focus: 3 })
    }

    return jsonResponse({ ok: true })
  }

  if (pathname === '/api/profile') return jsonResponse(TEST_USER)
  if (pathname === '/api/rituals') return jsonResponse(FIXTURES.rituals)
  if (pathname === '/api/ascezas') return jsonResponse(FIXTURES.ascezas)
  if (pathname === '/api/quotes/today') return jsonResponse(FIXTURES.quote)
  if (pathname === '/api/checkin/today') return jsonResponse(FIXTURES.checkin)
  if (pathname === '/api/checkin/history') return jsonResponse(FIXTURES.history)
  if (pathname === '/api/themes') return jsonResponse(FIXTURES.themes)
  if (pathname === '/api/themes/701') return jsonResponse(FIXTURES.theme)
  if (pathname === '/api/profile/settings') return jsonResponse(FIXTURES.settings)
  if (pathname === '/api/analytics/pulse') return jsonResponse(FIXTURES.pulse)
  if (pathname === '/api/pinned-practices') return jsonResponse(FIXTURES.pinnedPractices)
  if (pathname === '/api/mood-practices') return jsonResponse([])
  if (pathname === '/api/practice-days') return jsonResponse({ days: [] })
  if (pathname === '/api/articles') return jsonResponse(FIXTURES.articles)
  if (pathname === '/api/analytics') return jsonResponse(FIXTURES.analytics)
  if (pathname === '/api/mentalix/consent') return jsonResponse({ context_consent: false })
  if (pathname === '/api/mentalix/messages') {
    const persona = url.searchParams.get('persona') || 'unknown'
    return jsonResponse([
      {
        id: `fixture-${persona}`,
        role: 'assistant',
        content: `История ${persona}`,
      },
    ])
  }
  if (pathname === '/api/goals') return jsonResponse([{ id: 900301, title: 'Собрать спокойное утро', description: 'Сделать утренний ритуал устойчивой опорой.', target_date: '2026-09-30', progress: 3 }])
  if (pathname === '/api/courses') return jsonResponse([{ id: 900401, title: 'Фокус без перегруза', source: 'Mentalix Preview', duration_estimate_min: 20, status: 'in_progress', cover_url: '' }])
  if (pathname === '/api/subscription') return jsonResponse({ plan: 'free', trial_end: null })

  return jsonResponse({ error: `Нет локального fixture для ${method} ${pathname}` }, 501)
}

export function sanitizeReason(error) {
  return String(error?.message || error || 'Неизвестная ошибка')
    .split('\n')[0]
    .replaceAll(/\u001b\[[0-9;]*m/g, '')
    .replaceAll('|', '\\|')
    .slice(0, 240)
}

export async function freezePageTime(page) {
  await page.clock.setFixedTime(`2026-09-23T${QA_FIXED_TIME}:00+03:00`)
}
