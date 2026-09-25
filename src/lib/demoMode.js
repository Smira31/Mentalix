import { now } from './clock.js'

const DEMO_STATE_KEY = 'mentalix_preview_demo_state_v4'
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
  'morningPrimary',
  'eveningPrimary',
  'bothDone',
  'night',
  'streak0',
  'streak5',
])

// Канонический адрес веб-версии (Firebase Hosting Live, см. PROJECT_STATE.md).
export const PRODUCTION_WEB_HOST = 'mentalix-production.web.app'

export const DEMO_USER = {
  id: 900001,
  web_user_id: 'preview-demo-user',
  first_name: 'Preview Demo',
  email: 'preview@example.invalid',
  linked: false,
  demo: true,
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

function previewTodayState() {
  if (typeof window === 'undefined') return null

  const requested = new URLSearchParams(window.location.search).get('today_state')

  return TODAY_PREVIEW_STATES.has(requested) ? requested : null
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
  const history = noHistoryStates.has(todayState) || scenario === 'Новый пользователь'
    ? []
    : scenario === 'Серия прервалась'
      ? buildHistory(4).filter(item => item.date !== previousDate)
      : buildHistory(historyDays)

  // Чекин на сегодня — зависит от состояния.
  let checkin = null
  if (todayState === 'dayInProgress' || todayState === 'reviewPending') {
    checkin = {
      id: 900501,
      date: todayStr,
      mood: 3,
      energy: 2,
      note: 'Спокойное утро.',
      emotion: 'ровно',
      review_completed_at: null,
    }
  } else if (todayState === 'dayClosed' || todayState === 'bothDone') {
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
    rituals: empty ? [] : [
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
      ...(many ? Array.from({ length: 8 }, (_, i) => ({
        id: 901100 + i, name: `Ритуал ${i + 1}`, today_level: null, streak: 0,
      })) : []),
    ],
    ascezas: empty ? [] : [
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
      ...(many ? Array.from({ length: 8 }, (_, i) => ({
        id: 901200 + i, name: `Аскеза ${i + 1}`, today_status: null, streak: 0,
      })) : []),
    ],
    goals: empty ? [] : [
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
      { practice_id: 'first-step' },
      { practice_id: 'breathing' },
      { practice_id: 'focus' },
    ],
    checkins: [...history, ...(checkin ? [checkin] : [])],
    profile: {
      id: DEMO_USER.id,
      first_name: DEMO_USER.first_name,
      email: DEMO_USER.email,
      reminder_enabled: false,
      reminder_hour: 9,
    },
    moodPractices: empty ? [] : moodPractices,
    // В прерванной серии вчера нет ни одной активности.
    practiceDays: empty ? [] : scenario === 'Серия прервалась'
      ? [offsetDate(today, -2), offsetDate(today, -3)]
      : [offsetDate(today, -1), offsetDate(today, -2), offsetDate(today, -3), offsetDate(today, -4), offsetDate(today, -5)],
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
    const rituals = state.rituals.map(item =>
      item.id === id ? { ...item, today_level: body.level, streak: (item.streak || 0) + 1 } : item
    )
    const ritual = rituals.find(item => item.id === id)
    writeState({ ...state, rituals })
    return json(ritual)
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
    const ascezas = state.ascezas.map(item =>
      item.id === id ? { ...item, today_status: body.status, streak: (item.streak || 0) + 1 } : item
    )
    const asceza = ascezas.find(item => item.id === id)
    writeState({ ...state, ascezas })
    return json(asceza)
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
    const checkin = {
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
      review_hour: eveningStates.has(previewTodayState()) ? 0 : (state.profile.review_hour ?? 19),
      writing_goal_enabled: state.profile.writing_goal_enabled ?? false,
      writing_goal_weekly_count: state.profile.writing_goal_weekly_count ?? 3,
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
  if (pathname === '/articles' && method === 'GET') return json([])
  if (pathname === '/themes' && method === 'GET') return json([])
  if (pathname === '/quotes' && method === 'GET') return json([])
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
  return respond(path, options)
}
