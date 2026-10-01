import { now } from './clock.js'
import { DEFAULT_REVIEW_HOUR } from './todayCardState.js'

const DEMO_STATE_KEY = 'mentalix_preview_demo_state_v6'

const DEMO_JOURNAL_TEMPLATES = [
  {
    id: 1,
    title: 'Разбор ситуации',
    description: 'Спокойно отдели факты от предположений и выбери один шаг.',
    category: 'личное',
    visibility: 'public',
    version: 1,
    stepCount: 3,
    steps: [
      {
        id: 'step-1',
        type: 'free_text',
        title: 'Что сейчас происходит?',
        helper: 'Опиши ситуацию так, как она выглядит сегодня.',
        required: true,
      },
      {
        id: 'step-2',
        type: 'free_text',
        title: 'Что здесь точно известно?',
        helper: 'Запиши наблюдаемые факты.',
        required: false,
      },
      {
        id: 'step-3',
        type: 'free_text',
        title: 'Что зависит от тебя сегодня?',
        helper: 'Один небольшой шаг.',
        required: true,
      },
    ],
  },
  {
    id: 2,
    title: 'Вечерняя рефлексия',
    description: 'Короткая запись в конце дня — без оценки.',
    category: 'вечер',
    visibility: 'public',
    version: 1,
    stepCount: 2,
    steps: [
      {
        id: 'step-1',
        type: 'free_text',
        title: 'Что было главным сегодня?',
        helper: 'Одно наблюдение, не итог.',
        required: true,
      },
      {
        id: 'step-2',
        type: 'free_text',
        title: 'Что возьму с собой в завтра?',
        helper: 'Не план, а направление.',
        required: false,
      },
    ],
  },
]
const SCENARIO_KEY = 'mentalix:demo-scenario:v1'
const NETWORK_KEY = 'mentalix:demo-network:v1'
export const DEMO_SCENARIOS = ['Новый пользователь', 'Неделя', 'Серия прервалась', 'Много практик']
export const DEMO_NETWORKS = ['Нормально', 'Медленно', 'Нет сети', 'Ошибка сервера']

export function demoScenario() {
  const value = sessionStorage.getItem(SCENARIO_KEY)
  return DEMO_SCENARIOS.includes(value) ? value : 'Неделя'
}

export function setDemoScenario(value) {
  if (!DEMO_SCENARIOS.includes(value)) return
  localStorage.removeItem(DEMO_STATE_KEY)
  sessionStorage.removeItem('mentalix:today:snapshot:v1:900001')
  localStorage.removeItem('mx-today-streak:900001')
  sessionStorage.setItem(SCENARIO_KEY, value)
}

export function resetDemoState() {
  localStorage.removeItem(DEMO_STATE_KEY)
  sessionStorage.removeItem('mentalix:today:snapshot:v1:900001')
  localStorage.removeItem('mx-today-streak:900001')
}

export function demoNetwork() {
  const value = sessionStorage.getItem(NETWORK_KEY)
  return DEMO_NETWORKS.includes(value) ? value : 'Нормально'
}

export function setDemoNetwork(value) {
  if (!DEMO_NETWORKS.includes(value)) return
  sessionStorage.setItem(NETWORK_KEY, value)
  sessionStorage.removeItem('mentalix:today:snapshot:v1:900001')
}
export const TODAY_PREVIEW_STATES = new Set([
  'checkinPending',
  'dayInProgress',
  'reviewPending',
  'dayClosed',
  'morning_done',
  'day_closed',
  'morningPrimary',
  'eveningPrimary',
  'bothDone',
  'night',
  'streak0',
  'streak5',
  'error',
])

// Канонический адрес веб-версии (Firebase Hosting Live, см. PROJECT_STATE.md).
export const PRODUCTION_WEB_HOST = 'mentalix-production.web.app'

export const DEMO_USER = {
  id: 900001,
  web_user_id: 'preview-demo-user',
  first_name: 'Preview Demo',
  email: 'preview@example.invalid',
  created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  linked: false,
  demo: true,
}

export const DEMO_GUEST_USER = {
  id: 900002,
  web_user_id: 'preview-demo-guest',
  first_name: 'Гость',
  email: null,
  linked: false,
  demo: true,
  is_guest: true,
}

export function isDemoGuestMode() {
  if (typeof window === 'undefined') return false
  return isPreviewDemoMode() && new URLSearchParams(window.location.search).get('guest') === '1'
}

export function isRealPhone(windowLike) {
  const w = windowLike || (typeof window !== 'undefined' ? window : null)
  if (!w) return false

  const coarsePointer = w.matchMedia?.('(pointer: coarse)')?.matches === true
  const screenWidth = w.screen?.width ?? w.innerWidth ?? 9999
  const innerWidth = w.innerWidth ?? screenWidth

  return coarsePointer && Math.min(screenWidth, innerWidth) <= 500
}

export function isPreviewDemoMode() {
  if (typeof window === 'undefined') return false

  // tgShell mode (dev-only, dynamically imported in main.jsx) sets this
  // flag so all existing demo-mode code paths (skip auth, DEMO_USER, demo
  // data, chrome) work automatically in the Base44 preview.
  if (window.__MX_TG_SHELL) return true

  const host = window.location.hostname
  const params = new URLSearchParams(window.location.search)
  const localPreviewEnabled = import.meta.env.VITE_LOCAL_PREVIEW === 'true'

  const isAllowedHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app') ||
    host === 'mentalix-owner-qa.pages.dev' ||
    host === PRODUCTION_WEB_HOST ||
    (host.endsWith('.web.app') && host.includes('--pr-')) ||
    host.endsWith('.manus.computer') ||
    host.endsWith('.trycloudflare.com') ||
    host.endsWith('.base44-preview.app')
  const isPreviewRuntime =
    import.meta.env.DEV || import.meta.env.VERCEL_ENV === 'preview' || localPreviewEnabled
  const isQaProductionHost =
    host === 'mentalix-preview.vercel.app' || host === 'mentalix-owner-qa.pages.dev'
  const isProductionDemoHost = host === PRODUCTION_WEB_HOST
  // Contract marker: (isPreviewRuntime || isQaProductionHost)

  const demoRequested = params.get('demo') === '1'
  const pwaDemoRequested = params.get('source') === 'pwa'

  return (
    (demoRequested || pwaDemoRequested) &&
    isAllowedHost &&
    (isPreviewRuntime || isQaProductionHost || isProductionDemoHost)
  )
}

export function isRecoveryDemoRequested() {
  return (
    isPreviewDemoMode() &&
    new URLSearchParams(window.location.search).get('streak_recovery') === '1'
  )
}

/*
 * Превью-ссылка на «твой профиль.»: ?demo=1&action=profile.
 * Вне демо-режима возвращает false.
 */
export function isProfileDemoRequested() {
  if (!isPreviewDemoMode()) return false
  const params = new URLSearchParams(window.location.search)
  return params.get('action') === 'profile' || params.get('tab') === 'profile'
}

/* Внутренние экраны профиля доступны владельцу по прямой демо-ссылке. */
export function previewProfileAction() {
  if (!isPreviewDemoMode()) return null
  const action = new URLSearchParams(window.location.search).get('action')
  return ['profile_checkins', 'profile_about', 'profile_wtp', 'privacy'].includes(action)
    ? action
    : null
}

/*
 * Прямые превью-ссылки на экраны завершения чек-ина — чтобы владелец
 * проверял финальные экраны без прохождения всего потока:
 *   ?demo=1&action=complete_morning
 *   ?demo=1&action=complete_evening
 * Действует только в демо-режиме; вне демо возвращает null.
 */
export const DEMO_COMPLETION_ACTIONS = new Set(['complete_morning', 'complete_evening'])

export function previewDemoAction() {
  if (typeof window === 'undefined') return null
  if (!isPreviewDemoMode()) return null

  const requested = new URLSearchParams(window.location.search).get('action')

  return DEMO_COMPLETION_ACTIONS.has(requested) ? requested : null
}

/*
 * Превью экрана серии после чек-ина:
 *   ?demo=1&action=streak_celebration            — серия 3 дня
 *   ?demo=1&action=streak_celebration&streak_days=N — другое число дней
 * Вне демо-режима возвращает null.
 */
/*
 * Прямые превью-ссылки на экраны ритуалов и аскез:
 *   ?demo=1&tab=practices&action=rituals_list  — список «ритуалы.»
 *   ?demo=1&tab=practices&action=ritual_detail — экран ритуала
 *   ?demo=1&tab=practices&action=ascezas_list  — список «аскезы.»
 *   ?demo=1&tab=practices&action=asceza_detail  — экран аскезы
 * Действует только в демо-режиме; вне демо возвращает null.
 */
export const DEMO_PRACTICE_ACTIONS = new Set([
  'rituals_list',
  'ritual_detail',
  'ascezas_list',
  'asceza_detail',
])

export function previewPracticeAction() {
  if (typeof window === 'undefined') return null
  if (!isPreviewDemoMode()) return null

  const requested = new URLSearchParams(window.location.search).get('action')

  return DEMO_PRACTICE_ACTIONS.has(requested) ? requested : null
}

/*
 * Прямая превью-ссылка на шторку «Твои практики» (настройка набора):
 *   ?demo=1&action=practices_manage
 * Действует только в демо-режиме; вне демо возвращает null.
 */
export const DEMO_PINNED_PRACTICES_ACTION = 'practices_manage'
export const DEMO_PINNED_PRACTICES_LIBRARY_ACTION = 'practices_library'

export function previewPinnedPracticesAction() {
  if (typeof window === 'undefined') return null
  if (!isPreviewDemoMode()) return null

  const requested = new URLSearchParams(window.location.search).get('action')

  if (requested === DEMO_PINNED_PRACTICES_LIBRARY_ACTION) return 'library'
  return requested === DEMO_PINNED_PRACTICES_ACTION ? 'manage' : null
}

export function previewStreakCelebrationDays() {
  if (typeof window === 'undefined') return null
  if (!isPreviewDemoMode()) return null

  const params = new URLSearchParams(window.location.search)
  if (params.get('action') !== 'streak_celebration') return null

  const requested = Number(params.get('streak_days'))
  return Number.isSafeInteger(requested) && requested > 0 ? requested : 3
}

/*
 * Прямые превью-ссылки на страницу значков:
 *   ?demo=1&action=badges      — «Значки | Статистика»
 *   ?demo=1&action=all_badges  — «все значки.»
 * Вне демо-режима возвращает null.
 */
export const DEMO_SERIES_ACTIONS = new Set(['badges', 'all_badges'])

export function previewSeriesAction() {
  if (typeof window === 'undefined') return null
  if (!isPreviewDemoMode()) return null

  const requested = new URLSearchParams(window.location.search).get('action')

  return DEMO_SERIES_ACTIONS.has(requested) ? requested : null
}

function previewTodayState() {
  if (typeof window === 'undefined') return null

  const requested = new URLSearchParams(window.location.search).get('today_state')

  return TODAY_PREVIEW_STATES.has(requested) ? requested : null
}

export function demoReviewNow(reviewHour, real = now()) {
  if (
    !isPreviewDemoMode() ||
    new URLSearchParams(window.location.search).get('review_open') !== '1'
  )
    return real
  const date = new Date(real)
  date.setHours(Math.min(23, Math.max(Number(reviewHour) || DEFAULT_REVIEW_HOUR, 19) + 1), 30, 0, 0)
  return date
}

function offsetDate(date, amount) {
  const value = new Date(date)
  value.setDate(value.getDate() + amount)
  return value.toISOString().slice(0, 10)
}

function seedState(todayState = null) {
  const today = now()
  const todayStr = today.toISOString().slice(0, 10)
  const scenario = demoScenario()
  const previousDate = offsetDate(today, -1)

  // Строим серию из N предыдущих дней (с review_completed_at).
  function buildHistory(days) {
    return Array.from({ length: days }, (_, i) => {
      const d = offsetDate(today, -(i + 1))
      return {
        id: 900500 - i,
        date: d,
        mood: 3,
        energy: 2,
        note: 'Демо-запись.',
        emotion: 'ровно',
        review_completed_at: new Date(`${d}T20:00:00Z`).toISOString(),
      }
    })
  }

  const noHistoryStates = new Set(['streak0'])
  const historyDays = todayState === 'streak5' ? 4 : scenario === 'Неделя' ? 5 : 1
  const history =
    noHistoryStates.has(todayState) || scenario === 'Новый пользователь'
      ? []
      : scenario === 'Серия прервалась'
        ? buildHistory(4).filter(item => item.date !== previousDate)
        : buildHistory(historyDays)

  // Чекин на сегодня — зависит от состояния.
  let checkin = null
  if (
    todayState === 'dayInProgress' ||
    todayState === 'reviewPending' ||
    todayState === 'morning_done'
  ) {
    checkin = {
      id: 900501,
      date: todayStr,
      mood: 3,
      energy: 2,
      sleep_quality: 4,
      focus: 3,
      day_focus: 'Работа',
      note: 'Спокойное утро.',
      emotion: 'ровно',
      review_completed_at: null,
    }
  } else if (
    todayState === 'dayClosed' ||
    todayState === 'bothDone' ||
    todayState === 'day_closed'
  ) {
    checkin = {
      id: 900501,
      date: todayStr,
      mood: 3,
      energy: 2,
      note: 'Спокойное утро.',
      emotion: 'ровно',
      review_completed_at: now().toISOString(),
    }
  } else if (todayState === 'streak5') {
    checkin = {
      id: 900501,
      date: todayStr,
      mood: 3,
      energy: 2,
      note: 'Спокойное утро.',
      emotion: 'ровно',
      review_completed_at: null,
    }
  }
  // morningPrimary, eveningPrimary, night, streak0, checkinPending → checkin = null

  // Настроения для демо
  const moodPractices =
    todayState === 'streak0' || scenario === 'Серия прервалась'
      ? []
      : [
          {
            id: 900601,
            user_id: DEMO_USER.id,
            recorded_at: new Date(`${previousDate}T15:30:00`).toISOString(),
            mood: 2,
            emotion: 'устал',
            context: 'work',
            note: 'Долгий день, много встреч.',
            breathing_completed: false,
          },
          {
            id: 900602,
            user_id: DEMO_USER.id,
            recorded_at: new Date(`${todayStr}T11:00:00`).toISOString(),
            mood: 4,
            emotion: 'бодро',
            context: null,
            note: null,
            breathing_completed: true,
          },
        ]

  const empty = scenario === 'Новый пользователь'
  const many = scenario === 'Много практик'
  return {
    rituals: empty
      ? []
      : [
          {
            // Демо-случай «вчера пропущено»: серия начата сегодня,
            // поэтому на экране практики видна ссылка «Отметить вчера».
            id: 900100,
            name: 'Вечерний разбор',
            goal: 'Отделить сделанное от шума дня.',
            min_version: 'одна строка о дне',
            today_level: 'optimal',
            streak: 1,
          },
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
            // Серия 2 — отметка доводит до вехи 3 (демо-проверка награды).
            streak: 2,
          },
          {
            id: 900103,
            name: 'Три минуты тишины',
            goal: 'Вернуть внимание к текущему моменту.',
            optimal_version: 'Три минуты без экрана',
            today_level: 'optimal',
            streak: 3,
          },
          ...(many
            ? Array.from({ length: 8 }, (_, i) => ({
                id: 901100 + i,
                name: `Ритуал ${i + 1}`,
                today_level: null,
                streak: 0,
              }))
            : []),
        ],
    ascezas: empty
      ? []
      : [
          {
            // Демо-случай «вчера пропущено»: триггер и замена ещё не заданы —
            // на экране практики видны строки «+ Что тебя тянет?» и «+ Чем заменишь?».
            id: 900200,
            name: 'Без сахара после ужина',
            reason: 'Ровный сон и лёгкое утро важнее вечернего сладкого.',
            today_status: 'held',
            streak: 1,
          },
          {
            id: 900201,
            name: 'Без Reels после 22:00',
            category: 'narrow-focus',
            replacement: 'Открыть книгу или лечь спать.',
            today_status: 'held',
            streak: 2,
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
          ...(many
            ? Array.from({ length: 8 }, (_, i) => ({
                id: 901200 + i,
                name: `Аскеза ${i + 1}`,
                today_status: null,
                streak: 0,
              }))
            : []),
        ],
    goals: empty
      ? []
      : [
          {
            id: 900301,
            title: 'Собрать спокойное утро',
            description: 'Сделать утренний ритуал устойчивой опорой.',
            target_date: '2026-09-30',
            progress: 3,
          },
        ],
    courses: [
      {
        id: 900401,
        title: 'Фокус без перегруза',
        source: 'Mentalix Preview',
        duration_estimate_min: 20,
        status: 'in_progress',
        cover_url: '',
      },
    ],
    notes: { 900401: [] },
    messages: [],
    pinnedPractices: [
      { practice_id: 'lila-discover' },
      { practice_id: 'rituals' },
      { practice_id: 'ascezas' },
      { practice_id: 'mood' },
      { practice_id: 'alter-ego' },
    ],
    checkins: [...history, ...(checkin ? [checkin] : [])],
    profile: {
      id: DEMO_USER.id,
      first_name: DEMO_USER.first_name,
      email: DEMO_USER.email,
      created_at: empty
        ? today.toISOString()
        : scenario === 'Неделя'
          ? offsetDate(today, -6)
          : offsetDate(today, -2),
      reminder_enabled: false,
      reminder_hour: 9,
      days_active: empty ? 0 : scenario === 'Неделя' ? 6 : 3,
      total_checkins: empty ? 0 : scenario === 'Неделя' ? 6 : 3,
      best_streak: empty ? 0 : scenario === 'Неделя' ? 5 : 2,
      current_streak: empty
        ? 0
        : scenario === 'Серия прервалась'
          ? 0
          : scenario === 'Неделя'
            ? 5
            : 2,
    },
    themes: [
      {
        id: 900701,
        title: 'Фокус без перегруза',
        subtitle: 'Неделя про внимание и усталость',
        is_current: true,
        current_day: empty ? 1 : 3,
        free_days: 2,
        total_days: 7,
        reflected_days: empty ? 0 : 2,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          text:
            [
              'Что сегодня забирало твоё внимание сильнее всего?',
              'Где напряжение маскировалось под усилие?',
              'Что помогло вернуться к одному делу?',
              'Когда усталость стала сигналом, а не помехой?',
              'Что ты выбрал не делать — и стало ли легче?',
              'Какой отдых действительно восстановил тебя сегодня?',
              'Что из этой недели ты заберёшь с собой?',
            ][i] || 'Следующий вопрос недели.',
          prompt: 'Запиши одно наблюдение без оценки.',
          reflection: i < (empty ? 0 : 2) ? 'Демо-разбор.' : null,
        })),
      },
      {
        id: 900702,
        title: 'О меньшем усилии',
        subtitle: 'Семь коротких наблюдений о том, что действительно двигает.',
        is_current: false,
        current_day: 7,
        free_days: 0,
        total_days: 7,
        reflected_days: 7,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          text:
            [
              'Бывало так, что ты переставал давить — и дело вдруг шло легче?',
              'Усилие и напряжение — разные вещи. Первое двигает, второе только изматывает.',
              'Где сегодня ты напрягался вместо того, чтобы делать?',
              'Какое маленькое действие оказалось достаточным?',
              'Что помогло тебе не форсировать результат?',
              'Где «отпустить» оказалось сильнее, чем «сделать во что бы то ни стало»?',
              'Что из этой недели ты заберёшь с собой?',
            ][i] || 'Следующий вопрос недели.',
          prompt: 'Запиши одно наблюдение без оценки.',
          reflection: 'Демо-разбор.',
        })),
      },
      {
        id: 900703,
        title: 'Границы и забота о себе',
        subtitle: 'Неделя про «нет», которое бережёт «да».',
        is_current: false,
        current_day: 4,
        free_days: 3,
        total_days: 7,
        reflected_days: 3,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          text:
            [
              'Какое «нет» сегодня было трудным и почему?',
              'Где отказ оказался заботой о себе, а не эгоизмом?',
              'Что ты выбрал впустить — и стало ли от этого теплее?',
              'Какая граница сегодня была мягкой, но прочной?',
              'Где ты удержал границу и что это дало?',
              'Какое «да» стало возможным благодаря чёткому «нет»?',
              'Что из этой недели ты заберёшь с собой?',
            ][i] || 'Следующий вопрос недели.',
          prompt: 'Запиши одно наблюдение без оценки.',
          reflection: i < 3 ? 'Демо-разбор.' : null,
        })),
      },
      {
        id: 900704,
        title: 'Одиночество и тишина',
        subtitle: 'Что слышно, когда замолкает внешний шум.',
        is_current: false,
        current_day: 1,
        free_days: 7,
        total_days: 7,
        reflected_days: 0,
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          text:
            [
              'Что ты слышишь, когда замолкает внешний шум?',
              'Где тишина была неприятной, а где — уютной?',
              'Что ты чувствуешь, оставаясь наедине с собой?',
              'Какая мысль пришла первой, когда ты ни от кого не отвлекался?',
              'Где одиночество было выбором, а где — неприятностью?',
              'Что тишина сегодня позволила услышать?',
              'Что из этой недели ты заберёшь с собой?',
            ][i] || 'Следующий вопрос недели.',
          prompt: 'Запиши одно наблюдение без оценки.',
          reflection: null,
        })),
      },
    ],
    moodPractices: empty ? [] : moodPractices,
    // В прерванной серии вчера нет ни одной активности.
    practiceDays: empty
      ? []
      : scenario === 'Серия прервалась'
        ? [offsetDate(today, -2), offsetDate(today, -3)]
        : [
            offsetDate(today, -1),
            offsetDate(today, -2),
            offsetDate(today, -3),
            offsetDate(today, -4),
            offsetDate(today, -5),
          ],
  }
}

function readState() {
  const todayState = previewTodayState()
  const stateKey = todayState ? `${DEMO_STATE_KEY}:${todayState}` : DEMO_STATE_KEY

  try {
    const raw = localStorage.getItem(stateKey)
    return raw ? JSON.parse(raw) : seedState(todayState)
  } catch {
    return seedState(todayState)
  }
}

function writeState(state) {
  const todayState = previewTodayState()
  const stateKey = todayState ? `${DEMO_STATE_KEY}:${todayState}` : DEMO_STATE_KEY
  localStorage.setItem(stateKey, JSON.stringify(state))
  return state
}

function bodyOf(options) {
  if (!options.body || typeof options.body !== 'string') return {}

  try {
    return JSON.parse(options.body)
  } catch {
    return {}
  }
}

function json(value) {
  return Promise.resolve(value)
}

function numericId(pathname) {
  const match = pathname.match(/\/(\d+)(?:\/|$)/)
  return match ? Number(match[1]) : null
}

function respond(path, options = {}) {
  const url = new URL(path, 'https://preview-demo.invalid')
  const pathname = url.pathname
  const method = (options.method || 'GET').toUpperCase()
  const body = bodyOf(options)
  const state = readState()

  if (pathname === '/rituals' && method === 'GET') return json(state.rituals)
  if (pathname === '/rituals' && method === 'POST') {
    const ritual = { id: Date.now(), ...body, today_level: null, streak: 0 }
    writeState({ ...state, rituals: [...state.rituals, ritual] })
    return json(ritual)
  }
  if (pathname.match(/^\/rituals\/\d+\/log$/) && method === 'POST') {
    const id = numericId(pathname)
    // Восстановление пропущенного дня продлевает серию, но не отмечает сегодня.
    const rituals = state.rituals.map(item =>
      item.id === id
        ? body.restore_days_ago
          ? { ...item, streak: (item.streak || 0) + 1 }
          : { ...item, today_level: body.level, streak: (item.streak || 0) + 1 }
        : item
    )
    const ritual = rituals.find(item => item.id === id)
    writeState({ ...state, rituals })
    return json(ritual)
  }
  if (pathname.match(/^\/rituals\/\d+$/) && method === 'PATCH') {
    const id = numericId(pathname)
    const { user_id: _userId, ...patch } = body
    const rituals = state.rituals.map(item => (item.id === id ? { ...item, ...patch, id } : item))
    writeState({ ...state, rituals })
    return json(rituals.find(item => item.id === id))
  }
  if (pathname.match(/^\/rituals\/\d+$/) && method === 'DELETE') {
    const id = numericId(pathname)
    writeState({ ...state, rituals: state.rituals.filter(item => item.id !== id) })
    return json({ ok: true })
  }

  if (pathname === '/ascezas' && method === 'GET') return json(state.ascezas)
  if (pathname === '/ascezas' && method === 'POST') {
    const asceza = { id: Date.now(), ...body, today_status: null, streak: 0 }
    writeState({ ...state, ascezas: [...state.ascezas, asceza] })
    return json(asceza)
  }
  if (pathname.match(/^\/ascezas\/\d+\/log$/) && method === 'POST') {
    const id = numericId(pathname)
    // Восстановление пропущенного дня продлевает серию, но не отмечает сегодня.
    const ascezas = state.ascezas.map(item =>
      item.id === id
        ? body.restore_days_ago
          ? { ...item, streak: (item.streak || 0) + 1 }
          : { ...item, today_status: body.status, streak: (item.streak || 0) + 1 }
        : item
    )
    const asceza = ascezas.find(item => item.id === id)
    writeState({ ...state, ascezas })
    return json(asceza)
  }
  if (pathname.match(/^\/ascezas\/\d+$/) && method === 'PATCH') {
    const id = numericId(pathname)
    const { user_id: _userId, ...patch } = body
    const ascezas = state.ascezas.map(item => (item.id === id ? { ...item, ...patch, id } : item))
    writeState({ ...state, ascezas })
    return json(ascezas.find(item => item.id === id))
  }
  if (pathname.match(/^\/ascezas\/\d+$/) && method === 'DELETE') {
    const id = numericId(pathname)
    writeState({ ...state, ascezas: state.ascezas.filter(item => item.id !== id) })
    return json({ ok: true })
  }

  if (pathname === '/goals' && method === 'GET') return json(state.goals)
  if (pathname === '/goals' && method === 'POST') {
    const goal = { id: Date.now(), ...body, progress: 0 }
    writeState({ ...state, goals: [...state.goals, goal] })
    return json(goal)
  }
  if (pathname.match(/^\/goals\/\d+$/) && method === 'DELETE') {
    const id = numericId(pathname)
    writeState({ ...state, goals: state.goals.filter(item => item.id !== id) })
    return json({ ok: true })
  }

  if (pathname === '/courses' && method === 'GET') return json(state.courses)
  if (pathname === '/courses' && method === 'POST') {
    const course = { id: Date.now(), ...body, status: 'in_progress' }
    writeState({ ...state, courses: [...state.courses, course], notes: state.notes })
    return json(course)
  }
  if (pathname.match(/^\/courses\/\d+\/status$/) && method === 'PATCH') {
    const id = numericId(pathname)
    const courses = state.courses.map(item =>
      item.id === id ? { ...item, status: body.status } : item
    )
    writeState({ ...state, courses })
    return json(courses.find(item => item.id === id))
  }
  if (pathname.match(/^\/courses\/\d+\/notes$/) && method === 'GET') {
    const id = numericId(pathname)
    return json(state.notes[id] || [])
  }
  if (pathname.match(/^\/courses\/\d+\/notes$/) && method === 'POST') {
    const id = numericId(pathname)
    const note = { id: Date.now(), text: body.text, created_at: now().toISOString() }
    writeState({ ...state, notes: { ...state.notes, [id]: [note, ...(state.notes[id] || [])] } })
    return json(note)
  }
  if (pathname.match(/^\/courses\/\d+$/) && method === 'DELETE') {
    const id = numericId(pathname)
    writeState({ ...state, courses: state.courses.filter(item => item.id !== id) })
    return json({ ok: true })
  }

  if (pathname === '/streak' && method === 'GET') {
    const today = now().toISOString().slice(0, 10)
    return json({
      current_streak: state.profile.current_streak ?? 0,
      longest_streak: state.profile.best_streak ?? 0,
      total_active_days: state.profile.days_active ?? 0,
      is_active_today:
        state.checkins.some(item => item?.date === today) ||
        state.rituals.some(item => item.today_level) ||
        state.ascezas.some(item => item.today_status) ||
        (state.moodPractices || []).some(item => item.recorded_at?.slice(0, 10) === today) ||
        (state.journalCompletedSessions || []).some(
          item => item.completedAt?.slice(0, 10) === today
        ),
      freeze_used_this_week: demoScenario() === 'Неделя',
      recoverable:
        (demoScenario() === 'Серия прервалась' || isRecoveryDemoRequested()) &&
        state.recoverySavedDate !== offsetDate(now(), -1),
    })
  }

  if (pathname === '/streak/recovery' && method === 'GET') {
    if (
      url.searchParams.get('user_id') &&
      (demoScenario() === 'Серия прервалась' || isRecoveryDemoRequested())
    ) {
      const yesterday = offsetDate(now(), -1)
      return json({
        recoverable: state.recoverySavedDate !== yesterday,
        date: yesterday,
        streak_before: 3,
      })
    }
    return json({ recoverable: false, date: null, streak_before: 0 })
  }
  if (pathname === '/checkin/yesterday' && method === 'PUT') {
    const yesterday = offsetDate(now(), -1)
    const checkin = {
      id: Date.now(),
      date: yesterday,
      ...body,
      review_completed_at: now().toISOString(),
    }
    writeState({
      ...state,
      profile: {
        ...state.profile,
        current_streak: 4,
        best_streak: Math.max(4, state.profile.best_streak || 0),
      },
      checkins: [checkin, ...state.checkins.filter(item => item.date !== yesterday)],
      practiceDays: [...new Set([...(state.practiceDays || []), yesterday])],
      recoverySavedDate: yesterday,
    })
    return json(checkin)
  }
  if (pathname === '/checkin/today' && method === 'GET') {
    // checkin/today uses the PR-aware state.checkins[0] fixture anchor.
    const today = now().toISOString().slice(0, 10)
    return json(state.checkins.find(item => item?.date === today) || null)
  }
  if (pathname === '/checkin/history' && method === 'GET') return json(state.checkins)
  if (pathname === '/checkin' && method === 'POST') {
    // Одна запись на день: вечерний разбор дополняет утреннюю запись,
    // а не создаёт дубль (иначе История показывала утро без эмоции разбора).
    const today = now().toISOString().slice(0, 10)
    const existing = state.checkins.find(item => item?.date === today)
    const checkin = {
      ...existing,
      id: existing?.id || Date.now(),
      date: today,
      ...body,
      ...(body.review_completed ? { review_completed_at: now().toISOString() } : {}),
    }
    writeState({
      ...state,
      checkins: [checkin, ...state.checkins.filter(item => item?.date !== today)],
    })
    return json(checkin)
  }
  if (pathname === '/checkin/today' && method === 'PUT') {
    const today = now().toISOString().slice(0, 10)
    const existing = state.checkins.find(item => item?.date === today)
    // Как на сервере: поля, которых нет в запросе, остаются прежними —
    // повтор утра не стирает разбор, повтор разбора не стирает утро.
    // Время закрытия дня ставится один раз: повторный PUT с
    // review_completed: true (например, «Пройти утро заново»)
    // перезаписывает запись, но не переоткрывает и не перезакрывает день.
    const checkin = {
      ...existing,
      id: existing?.id || Date.now(),
      date: today,
      ...body,
      ...(body.review_completed
        ? { review_completed_at: existing?.review_completed_at || now().toISOString() }
        : {}),
    }
    writeState({
      ...state,
      checkins: [checkin, ...state.checkins.filter(item => item?.date !== today)],
    })
    return json(checkin)
  }

  if (pathname === '/mood-practices' && method === 'GET') return json(state.moodPractices || [])
  if (pathname === '/practice-days' && method === 'GET')
    return json({ days: state.practiceDays || [] })
  if (pathname === '/mood-practices' && method === 'POST') {
    const record = {
      id: Date.now(),
      user_id: DEMO_USER.id,
      recorded_at: now().toISOString(),
      mood: body.mood,
      emotion: body.emotion,
      context: body.context ?? null,
      note: body.note ?? null,
      breathing_completed: Boolean(body.breathing_completed),
    }
    writeState({ ...state, moodPractices: [record, ...(state.moodPractices || [])] })
    return json(record)
  }

  if (pathname === '/profile/settings' && method === 'GET') {
    const eveningStates = new Set(['reviewPending', 'dayClosed', 'eveningPrimary', 'bothDone'])
    return json({
      // prettier-ignore
      review_hour: eveningStates.has(previewTodayState()) ? 0 : (state.profile.review_hour ?? DEFAULT_REVIEW_HOUR),
      writing_goal_enabled: state.profile.writing_goal_enabled ?? false,
      writing_goal_weekly_count: state.profile.writing_goal_weekly_count ?? 3,
      insights_enabled: state.profile.insights_enabled !== false,
      reminder_enabled: state.profile.reminder_enabled ?? false,
      reminder_hour: state.profile.reminder_hour ?? DEFAULT_REVIEW_HOUR,
      reminder_timezone: state.profile.reminder_timezone ?? 'Europe/Moscow',
      quiet_hours_start: state.profile.quiet_hours_start ?? null,
      quiet_hours_end: state.profile.quiet_hours_end ?? null,
    })
  }
  if (pathname === '/profile/writing-goal/progress' && method === 'GET') {
    const enabled = Boolean(state.profile.writing_goal_enabled)
    const goal = state.profile.writing_goal_weekly_count || 3
    const completed = enabled ? 2 : 0
    return json({
      enabled,
      completed,
      goal,
      reached: completed >= goal,
      remaining: Math.max(0, goal - completed),
    })
  }
  if (pathname === '/profile' && method === 'GET') return json(state.profile)
  if (pathname.startsWith('/profile/') && method === 'GET') return json(state.profile)
  if (pathname.startsWith('/profile/') && ['POST', 'PATCH'].includes(method)) {
    const profile = { ...state.profile, ...body }
    writeState({ ...state, profile })
    return json(profile)
  }
  if (pathname === '/analytics' && method === 'GET') return json({ daily: [], summary: {} })
  if (pathname === '/analytics/influences' && method === 'GET') {
    const period = url.searchParams.get('period') || 'week'
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const empty =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('empty') === '1'

    const today = now()
    let from, to
    if (period === 'week') {
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      monday.setDate(monday.getDate() - offset * 7)
      from = monday.toISOString().slice(0, 10)
      const end = new Date(monday)
      end.setDate(monday.getDate() + 6)
      to = end.toISOString().slice(0, 10)
    } else if (period === 'month') {
      from = new Date(today.getFullYear(), today.getMonth() - offset, 1).toISOString().slice(0, 10)
      to = new Date(today.getFullYear(), today.getMonth() - offset + 1, 0)
        .toISOString()
        .slice(0, 10)
    } else {
      const year = today.getFullYear() - offset
      from = `${year}-01-01`
      to = `${year}-12-31`
    }

    if (empty) {
      return json({
        period: { from, to },
        days_with_data: 1,
        top_emotions: [],
        lifts: [],
        drags: [],
        enough_data: false,
      })
    }

    const fixtures = {
      week: {
        days_with_data: 5,
        top_emotions: [
          { emotion: 'спокойствие', count: 4 },
          { emotion: 'радость', count: 3 },
          { emotion: 'усталость', count: 2 },
        ],
        lifts: [
          { factor: 'Утренний спорт', kind: 'practice', delta: 1.2, days: 4 },
          { factor: 'спокойствие', kind: 'emotion', delta: 0.8, days: 3 },
        ],
        drags: [{ factor: 'Недосып', kind: 'tag', delta: -1.5, days: 3 }],
        enough_data: true,
      },
      month: {
        days_with_data: 18,
        top_emotions: [
          { emotion: 'спокойствие', count: 12 },
          { emotion: 'радость', count: 8 },
          { emotion: 'усталость', count: 6 },
          { emotion: 'напряжение', count: 4 },
          { emotion: 'интерес', count: 3 },
        ],
        lifts: [
          { factor: 'Утренний спорт', kind: 'practice', delta: 1.4, days: 12 },
          { factor: 'Медитация', kind: 'practice', delta: 0.9, days: 8 },
          { factor: 'спокойствие', kind: 'emotion', delta: 0.7, days: 10 },
        ],
        drags: [
          { factor: 'Недосып', kind: 'tag', delta: -1.8, days: 8 },
          { factor: 'Напряжённый день', kind: 'tag', delta: -1.2, days: 6 },
          { factor: 'усталость', kind: 'emotion', delta: -0.6, days: 5 },
        ],
        enough_data: true,
      },
      year: {
        days_with_data: 120,
        top_emotions: [
          { emotion: 'спокойствие', count: 45 },
          { emotion: 'радость', count: 32 },
          { emotion: 'усталость', count: 28 },
          { emotion: 'интерес', count: 18 },
          { emotion: 'напряжение', count: 12 },
        ],
        lifts: [
          { factor: 'Утренний спорт', kind: 'practice', delta: 1.6, days: 80 },
          { factor: 'Медитация', kind: 'practice', delta: 1.1, days: 60 },
          { factor: 'Достаточный сон', kind: 'tag', delta: 0.9, days: 70 },
        ],
        drags: [
          { factor: 'Недосып', kind: 'tag', delta: -2.0, days: 45 },
          { factor: 'Напряжённый день', kind: 'tag', delta: -1.4, days: 30 },
          { factor: 'усталость', kind: 'emotion', delta: -0.8, days: 25 },
        ],
        enough_data: true,
      },
    }

    const result = fixtures[period] || fixtures.week
    return json({ period: { from, to }, ...result })
  }
  if (pathname === '/articles' && method === 'GET') return json([])
  if (pathname === '/themes' && method === 'GET') return json(state.themes || [])
  if (pathname.match(/^\/themes\/\d+$/) && method === 'GET') {
    const id = numericId(pathname)
    return json((state.themes || []).find(t => t.id === id) || null)
  }
  /*
   * /quotes — записи пользователя: обычные фразы и разметка «Мысли дня»
   * (tag thought:YYYY-MM-DD / saved:YYYY-MM-DD). Держим их в демо-состоянии,
   * чтобы фича была проверяема в превью (?demo=1).
   */
  if (pathname === '/quotes' && method === 'GET') return json(state.quotes || [])
  if (pathname === '/quotes' && method === 'POST') {
    const quote = {
      id: Date.now(),
      user_id: body.user_id,
      text: body.text,
      tag: typeof body.tag === 'string' ? body.tag : null,
      // Время записи — как на сервере: лента «История» показывает его в карточке.
      created_at: now().toISOString(),
    }
    writeState({ ...state, quotes: [quote, ...(state.quotes || [])] })
    return json(quote)
  }
  if (pathname.match(/^\/quotes\/\d+$/) && method === 'DELETE') {
    const id = numericId(pathname)
    writeState({ ...state, quotes: (state.quotes || []).filter(q => q.id !== id) })
    return json({ ok: true })
  }
  if (pathname === '/analytics/pulse' && method === 'GET') return json({})

  if (pathname === '/pinned-practices' && method === 'GET') {
    return json(state.pinnedPractices || [])
  }
  if (pathname === '/pinned-practices' && method === 'POST') {
    const item = { id: Date.now(), practice_id: body.practice_id }
    const pinnedPractices = [...(state.pinnedPractices || []), item]
    writeState({ ...state, pinnedPractices })
    return json(item)
  }
  if (pathname.match(/^\/pinned-practices\/[^/]+$/) && method === 'DELETE') {
    const practiceId = decodeURIComponent(pathname.split('/').pop())
    const pinnedPractices = (state.pinnedPractices || []).filter(
      item => item.practice_id !== practiceId
    )
    writeState({ ...state, pinnedPractices })
    return json({ ok: true })
  }

  if (pathname === '/mentalix/daily-task' && method === 'GET') {
    return json({
      task: {
        id: 900701,
        title: 'Заметь один спокойный момент',
        body: 'Остановись на пару минут и запиши, что сейчас помогает тебе дышать свободнее.',
        minutes: 3,
      },
      status:
        state.dailyTask?.date === url.searchParams.get('date') ? state.dailyTask.status : 'new',
    })
  }
  if (pathname === '/mentalix/daily-task' && method === 'POST') {
    writeState({ ...state, dailyTask: { date: body.date, status: body.status } })
    return json({ ok: true })
  }

  if (pathname === '/mentalix/messages' && method === 'GET') {
    return json(state.messages || [])
  }
  if (pathname === '/mentalix/messages' && method === 'POST') {
    const userMessage = {
      id: `demo-user-${Date.now()}`,
      role: 'user',
      content: body.content || '',
    }
    const personaNames = { kompas: 'Наставник', mayak: 'Собеседник', dnevnik: 'Следопыт' }
    const personaName = personaNames[body.persona] || 'Собеседник'
    const reply = {
      id: `demo-reply-${Date.now()}`,
      role: 'assistant',
      content: `${personaName} рядом. Давай разберём это спокойно: что в этой ситуации сейчас важнее всего заметить?`,
    }
    writeState({ ...state, messages: [...(state.messages || []), userMessage, reply] })
    return json(reply)
  }
  if (pathname === '/mentalix/feedback' && method === 'POST') return json({ ok: true })
  /*
   * Обратная связь с экрана завершения чек-ина. В демо ответ просто
   * сохраняется в состоянии — экран завершения должен работать без бэкенда.
   */
  if (pathname.match(/^\/checkins\/\d+\/feedback$/) && method === 'POST') {
    const id = numericId(pathname)
    const value = body.value || null
    const checkins = state.checkins.map(item =>
      item?.id === id ? { ...item, feedback: value } : item
    )
    writeState({ ...state, checkins })
    return json({ ok: true, value })
  }
  // Гостевой режим (демо): создание гостя и перенос записей.
  if (pathname === '/auth/guest' && method === 'POST') {
    return json({ ok: true, merge_token: 'demo-guest-merge-token', user: DEMO_GUEST_USER })
  }
  if (pathname === '/auth/guest/merge' && method === 'POST') {
    return json({ user: { ...DEMO_USER, merged_from_guest: true } })
  }

  // ── Journal templates (demo) ──

  if (pathname === '/journal/templates' && method === 'GET') {
    return json(DEMO_JOURNAL_TEMPLATES)
  }
  if (pathname.match(/^\/journal\/templates\/(\d+)$/) && method === 'GET') {
    const id = numericId(pathname)
    return json(DEMO_JOURNAL_TEMPLATES.find(t => t.id === id) || null)
  }
  if (pathname === '/journal/templates/sessions/complete' && method === 'POST') {
    const template = DEMO_JOURNAL_TEMPLATES.find(t => t.id === Number(body.template_id))
    const session = {
      id: Date.now(),
      user_id: body.user_id,
      template_id: body.template_id,
      answers: body.answers,
      idempotency_key: body.idempotency_key,
      status: 'completed',
      template: template || null,
      completedAt: now().toISOString(),
      updatedAt: now().toISOString(),
    }
    writeState({
      ...state,
      journalCompletedSessions: [session, ...(state.journalCompletedSessions || [])],
    })
    return json(session)
  }
  if (pathname === '/journal/templates/sessions/mine' && method === 'GET') {
    const status = url.searchParams.get('status')
    if (status === 'completed') return json(state.journalCompletedSessions || [])
    return json([])
  }

  if (pathname === '/health' && method === 'GET') return json({ status: 'ok' })

  if (pathname === '/mentalix/transcribe' && method === 'POST') {
    return json({ text: 'Хочу разобраться в том, что сейчас для меня важно.' })
  }

  if (method === 'GET') return json([])
  if (method === 'DELETE') return json({ ok: true })
  return json({ ok: true })
}

export async function demoRequest(path, options = {}) {
  const network = demoNetwork()
  if (network === 'Медленно') await new Promise(resolve => setTimeout(resolve, 4000))
  if (network === 'Нет сети') throw new Error('Нет сети')
  if (network === 'Ошибка сервера') {
    const error = new Error('Сервер недоступен: 503')
    error.status = 503
    throw error
  }
  // today_state=error: имитируем ошибку загрузки дня (не повторяемую —
  // 400, чтобы автоповтор сразу выбросил и показал экран ошибки).
  if (previewTodayState() === 'error' && !path.startsWith('/health')) {
    const error = new Error('Демо: ошибка загрузки дня')
    error.status = 400
    throw error
  }
  return respond(path, options)
}
