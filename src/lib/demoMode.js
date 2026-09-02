const DEMO_STATE_KEY = 'mentalix_preview_demo_state_v1'
const TODAY_PREVIEW_STATES = new Set([
  'checkinPending',
  'dayInProgress',
  'reviewPending',
  'dayClosed',
])

export const DEMO_USER = {
  id: 900001,
  web_user_id: 'preview-demo-user',
  first_name: 'Preview Demo',
  email: 'preview@example.invalid',
  linked: false,
  demo: true,
}

export function isPreviewDemoMode() {
  if (typeof window === 'undefined') return false

  const host = window.location.hostname
  const params = new URLSearchParams(window.location.search)

  const isAllowedHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.manus.computer')
  const isPreviewRuntime = import.meta.env.DEV || import.meta.env.VERCEL_ENV === 'preview'

  return params.get('demo') === '1' && isAllowedHost && isPreviewRuntime
}

function previewTodayState() {
  if (typeof window === 'undefined') return null

  const requested = new URLSearchParams(window.location.search).get('today_state')

  return TODAY_PREVIEW_STATES.has(requested) ? requested : null
}

function seedState(todayState = null) {
  const checkin =
    todayState && todayState !== 'checkinPending'
      ? {
          id: 900501,
          date: new Date().toISOString().slice(0, 10),
          mood: 3,
          emotion: 'ровно',
          review_completed_at: todayState === 'dayClosed' ? new Date().toISOString() : null,
        }
      : null

  return {
    rituals: [
      {
        id: 900101,
        name: 'Утренний спорт',
        goal: 'Разбудить тело и внимание.',
        min_version: '10 минут движения',
        optimal_version: '30 минут тренировки',
        skip_consequence: 'День начинается тяжелее.',
        today_level: null,
        streak: 4,
      },
    ],
    ascezas: [
      {
        id: 900201,
        name: 'Без Reels после 22:00',
        category: 'narrow-focus',
        replacement: 'Открыть книгу или лечь спать.',
        today_status: null,
        streak: 2,
      },
    ],
    goals: [
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
    checkins: checkin ? [checkin] : [],
    profile: {
      id: DEMO_USER.id,
      first_name: DEMO_USER.first_name,
      email: DEMO_USER.email,
      reminder_enabled: false,
      reminder_hour: 9,
    },
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

export function demoRequest(path, options = {}) {
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
    const note = { id: Date.now(), text: body.text, created_at: new Date().toISOString() }
    writeState({ ...state, notes: { ...state.notes, [id]: [note, ...(state.notes[id] || [])] } })
    return json(note)
  }
  if (pathname.match(/^\/courses\/\d+$/) && method === 'DELETE') {
    const id = numericId(pathname)
    writeState({ ...state, courses: state.courses.filter(item => item.id !== id) })
    return json({ ok: true })
  }

  if (pathname === '/checkin/today' && method === 'GET') return json(state.checkins[0] || null)
  if (pathname === '/checkin/history' && method === 'GET') return json(state.checkins)
  if (pathname === '/checkin' && method === 'POST') {
    const checkin = { id: Date.now(), date: new Date().toISOString().slice(0, 10), ...body }
    writeState({ ...state, checkins: [checkin, ...state.checkins] })
    return json(checkin)
  }

  if (pathname === '/profile' && method === 'GET') return json(state.profile)
  if (pathname.startsWith('/profile/') && method === 'GET') return json(state.profile)
  if (pathname.startsWith('/profile/') && ['POST', 'PATCH'].includes(method)) {
    const profile = { ...state.profile, ...body }
    writeState({ ...state, profile })
    return json(profile)
  }
  if (pathname === '/profile/settings' && method === 'GET') {
    return json({
      review_hour:
        previewTodayState() === 'reviewPending' || previewTodayState() === 'dayClosed' ? 0 : 19,
    })
  }
  if (pathname === '/analytics' && method === 'GET') return json({ daily: [], summary: {} })
  if (pathname === '/articles' && method === 'GET') return json([])
  if (pathname === '/themes' && method === 'GET') return json([])
  if (pathname === '/quotes' && method === 'GET') return json([])
  if (pathname === '/analytics/pulse' && method === 'GET') return json({})

  if (method === 'GET') return json([])
  if (method === 'DELETE') return json({ ok: true })
  return json({ ok: true })
}
