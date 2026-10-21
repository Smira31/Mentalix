import { now } from './clock.js'
import { mskDayKey, shiftMskDay } from './mskDate.js'
import { MOCK_LONG_REPORT_TEXT } from './proMockLongText.js'

/*
 * Dev-only mock-режим Mentalix Pro (PRO-002b/c) — для проверки экранов без
 * рабочего backend. Недоступен в production: включается только при dev-сборке
 * (import.meta.env.DEV или VITE_LOCAL_PREVIEW); в production-сборке оба условия
 * ложны, код неактивен.
 *
 * Сценарий задаётся параметром URL `?proMock=…`; в тестовом окружении он может
 * быть задан переменной `VITE_PRO_MOCK` (docker-compose.base44.yml): оболочка
 * превью подменяет адрес своими служебными параметрами, поэтому `?proMock=…`
 * из выданной ссылки до приложения не доходит. URL-параметр приоритетен.
 *
 * Сценарии `proMock`:
 *   ready             (или 1) — обычный путь: согласие → сборка → готово
 *   conflict                  — POST отвечает 409 generation_in_progress,
 *                               затем GET через ~3.5 с действительно завершает
 *                               сборку готовым результатом; повторный POST не
 *                               требуется
 *   version_conflict          — любой PATCH пункта отвечает 409
 *                               detail version_conflict (детерминированно)
 *   rebuild_conflict          — POST плана с rebuild=true отвечает 409
 *                               code rebuild_conflict с сохранённым планом
 *   insufficient              — 409 insufficient_data
 *   crisis                    — 200 crisis с утверждённым ответом
 *   disabled                  — 404 detail pro_report_disabled / pro_plan_disabled
 *   nopro                     — 402 detail pro_required
 *   network                   — сбой сети: состояние ошибки с повтором, без
 *                               повторных POST
 *   nopayload                 — GET отвечает не состоянием Pro (пустой массив)
 *   nodates                   — дат недели нет (разбор, прогресс) или дата
 *                               нераспознана (план): метка недели не строится
 *   longtext                  — разбор идёт с длинными русскими текстами
 *                               (src/lib/proMockLongText.js): проверка переноса
 *                               без обрезки, кадр в прогоне ux:pro-states
 *   generation_failed         — POST разбора отвечает 502
 *                               `report_generation_failed` (как бэкенд при
 *                               отказе модели), повторный POST собирает
 *                               разбор: проверка ожидания, фразы бэкенда и
 *                               кнопки «Попробовать ещё раз»
 *
 * Реализует фактический контракт backend/pro/router.py: ошибки двух видов
 * (HTTPException → detail, JSONResponse → code), GET без признака
 * generation_in_progress, статусы действий planned|done|skipped. Правка
 * общей цели (goal_text/goal_source_reflection) повышает версии ВСЕХ дней,
 * правка действия/критерия — только изменённого дня: как на сервере.
 * Согласие обслуживается через существующий поток GET/PUT /mentalix/consent.
 */

const MOCK_STATE_KEY = 'mx-pro-mock-state:v1'

const MOCK_DISCLAIMER =
  'Это размышление на основе ваших записей, а не медицинская или психологическая консультация.'

const MOCK_CRISIS_REPLY =
  'Похоже, сейчас тебе по-настоящему тяжело. Если есть мысли о причинении себе вреда, обратись за помощью — это можно сделать бесплатно. Разбор в таком состоянии не собирается.'

// Детерминированная «сборка» для сценария conflict: POST запоминает момент
// готовности и отвечает 409 generation_in_progress; GET внутри окна отдаёт
// not_generated, после окна — завершает сборку (создаёт разбор/план) и
// отдаёт ready. Сбрасывается перезагрузкой (resetProMockState).
const MOCK_GENERATION_MS = 3500
const pendingGeneration = { report: 0, plan: 0 } // отметка готовности; 0 — нет

// Сценарий generation_failed: первый POST разбора отвечает 502
// report_generation_failed (так это делает бэкенд при отказе модели), второй —
// собирает разбор. Пауза перед отказом даёт экрану показать ожидание сборки;
// сам отказ приходит сразу после неё.
const MOCK_GENERATION_FAILURE_DELAY_MS = 1000
const generationFailure = { report: false }

export function isProMockMode() {
  if (typeof window === 'undefined') return false
  if (import.meta.env?.PROD) return false
  const devRuntime =
    import.meta.env?.DEV === true || import.meta.env?.VITE_LOCAL_PREVIEW === 'true'
  if (!devRuntime) return false
  return mockScenarioValue() != null
}

/*
 * Значение сценария: параметр URL приоритетен, иначе — переменная тестового
 * окружения. Отсутствие параметра и пустая переменная означают «mock выключен».
 */
function mockScenarioValue() {
  const fromUrl = new URLSearchParams(window.location.search).get('proMock')
  if (fromUrl != null) return fromUrl

  const fromEnv = import.meta.env?.VITE_PRO_MOCK
  return typeof fromEnv === 'string' && fromEnv !== '' ? fromEnv : null
}

function mockScenario() {
  const value = mockScenarioValue()
  return [
    'conflict',
    'version_conflict',
    'rebuild_conflict',
    'insufficient',
    'crisis',
    'disabled',
    'nopro',
    'network',
    'nopayload',
    'nodates',
    'longtext',
    'generation_failed',
  ].includes(value)
    ? value
    : 'ready'
}

/*
 * Счётчики запросов mock (только для прогонов): регрессии проверяют, что
 * экран в отказе не отправляет повторных POST и что «Повторить» действительно
 * перезапрашивает состояние.
 */
function countMockRequest(method) {
  if (typeof window === 'undefined') return

  const key = method === 'POST' ? '__mxProMockPosts' : '__mxProMockGets'
  window[key] = (window[key] || 0) + 1
}

class MockApiError extends Error {
  constructor(status, body) {
    super(`Pro mock: HTTP ${status}`)
    this.name = 'MockApiError'
    this.status = status
    this.body = body
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Последняя завершённая календарная неделя (Пн–Вс), по МСК — как в backend.
function lastCompletedWeekStart() {
  const today = mskDayKey(now())
  const dayOfWeek = (new Date(`${today}T00:00:00+03:00`).getUTCDay() + 6) % 7
  return shiftMskDay(today, -(dayOfWeek + 7))
}

/*
 * Разбор недели. При longText (сценарий longtext) тексты берутся длинные:
 * разбор — свободный текст AI, и экран обязан переносить его, а не обрезать.
 */
function buildMockReport(weekStart, longText = false) {
  const long = MOCK_LONG_REPORT_TEXT
  return {
    week_start: weekStart,
    week_end: shiftMskDay(weekStart, 6),
    themes: longText
      ? [long.theme, 'Спокойное утро']
      : ['Внимание и усталость', 'Спокойное утро'],
    difficulties: [
      {
        text: longText ? long.difficulty : 'Вечером было трудно удержать внимание на одном деле',
        days: [shiftMskDay(weekStart, 1), shiftMskDay(weekStart, 3)],
      },
      { text: 'После долгих встреч трудно было заснуть', days: [shiftMskDay(weekStart, 4)] },
    ],
    achievements: [
      {
        text: 'Три дня подряд день начинался со стакана воды',
        days: [shiftMskDay(weekStart, 0), shiftMskDay(weekStart, 2), shiftMskDay(weekStart, 5)],
      },
      { text: 'Вечерний разбор записан без пропуска', days: [shiftMskDay(weekStart, 2)] },
    ],
    patterns: [
      {
        text: longText ? long.pattern : 'Возможно, короткий вечерний разбор помогает раньше засыпать',
        confidence: 'low',
        based_on: [shiftMskDay(weekStart, 2), shiftMskDay(weekStart, 3)],
      },
      {
        text: 'Судя по записям, утро со стакана воды чаще заканчивалось спокойным вечером',
        confidence: 'medium',
        based_on: [shiftMskDay(weekStart, 0), shiftMskDay(weekStart, 5)],
      },
    ],
    reflection_questions: [
      'Что помогало возвращаться к одному делу?',
      'Что вечером забирает внимание сильнее всего?',
    ],
    focus_next_week: longText ? long.direction : 'Один небольшой шаг за вечер, без догоняния за весь день.',
    sources: { checkins: 5, habits: 3, themes: 1 },
    disclaimer: MOCK_DISCLAIMER,
  }
}

function buildMockPlanDays(weekStart, baseVersion) {
  const planWeekStart = shiftMskDay(weekStart, 7)
  const dayDate = day => shiftMskDay(planWeekStart, day - 1)
  const actions = [
    ['Выпить стакан воды до завтрака', 'Стакан выпит до первого приёма пищи', { type: 'ritual', id: 900102, title: 'Стакан воды' }],
    ['Записать одну строку о дне', 'Одна строка в дневнике до 23:00', { type: 'ritual', id: 900100, title: 'Вечерний разбор' }],
    ['Сделать 10 минут движения утром', 'Десять минут без телефона', { type: 'habit', id: 900101, title: 'Утренний спорт' }],
    ['Ответить на вопрос темы недели', 'Один ответ записан', { type: 'theme', id: 900701, title: 'Фокус без перегруза' }],
    ['Поставить телефон в другую комнату на вечер', 'Час без телефона после 21:00', { type: 'asceza', id: 900202, title: 'Без телефона за столом' }],
    ['Сделать короткую запись потока мыслей', 'Пять минут письма без остановки', { type: 'journal', id: null, title: null }],
    ['Заметить один спокойный момент дня', 'Одно наблюдение записано', { type: 'mood', id: null, title: null }],
  ]
  const initialStatus = { 1: 'done', 2: 'done', 3: 'skipped' }
  return actions.map(([action, doneCriteria, practice], index) => ({
    id: 910001 + index,
    day: index + 1,
    date: dayDate(index + 1),
    action,
    done_criteria: doneCriteria,
    practice: practice ? { ...practice } : null,
    goal_text: 'Сделать вечера спокойнее: один небольшой шаг в день.',
    goal_reflection: 'Опирается на направление внимания из разбора: шаг за вечер без догоняния.',
    status: initialStatus[index + 1] || 'planned',
    version: baseVersion,
  }))
}

function defaultMockState(weekStart) {
  return {
    week_start: weekStart,
    consent: false,
    report: null,
    plan: null,
  }
}

function readState() {
  const weekStart = lastCompletedWeekStart()
  try {
    const raw = localStorage.getItem(MOCK_STATE_KEY)
    const state = raw ? JSON.parse(raw) : null
    // Смена недели перезапускает сценарий: неделя разбора — ключ состояния.
    if (!state || state.week_start !== weekStart) {
      const fresh = defaultMockState(weekStart)
      localStorage.setItem(MOCK_STATE_KEY, JSON.stringify(fresh))
      return fresh
    }
    return state
  } catch {
    return defaultMockState(weekStart)
  }
}

function writeState(state) {
  try {
    localStorage.setItem(MOCK_STATE_KEY, JSON.stringify(state))
  } catch {
    /* переполнение localStorage не ломает mock */
  }
  return state
}

function serializePlan(state) {
  const first = state.plan.days[0]
  return {
    week_start: state.week_start,
    plan_week_start: shiftMskDay(state.week_start, 7),
    goal: { text: first.goal_text, source_reflection: first.goal_reflection },
    days: state.plan.days.map(day => ({
      id: day.id,
      day: day.day,
      date: day.date,
      action: day.action,
      practice: day.practice ? { ...day.practice } : null,
      done_criteria: day.done_criteria,
      status: day.status,
      version: day.version,
    })),
    editable: true,
    version: Math.max(...state.plan.days.map(day => day.version)),
  }
}

function progressResponse(state) {
  const days = state.plan.days
  const today = mskDayKey(now())
  const count = status => days.filter(day => day.status === status).length
  const done = count('done')
  const total = days.length

  return {
    week_start: state.week_start,
    plan_week_start: shiftMskDay(state.week_start, 7),
    status: total === 7 ? 'ready' : 'partial',
    completion: { planned: total, done, skipped: count('skipped'), unmarked: count('planned') },
    completion_rate: total > 0 ? Math.round((done / total) * 10000) / 10000 : 0,
    days: days.map(day => ({
      day: day.day,
      date: day.date,
      action: day.action,
      done_criteria: day.done_criteria,
      practice: day.practice ? { ...day.practice } : null,
      status: day.status,
      is_future: day.date > today,
      version: day.version,
    })),
    done_actions: days.filter(day => day.status === 'done').map(day => day.action),
    goal: { text: days[0].goal_text, source_reflection: days[0].goal_reflection },
  }
}

/*
 * Сценарий conflict на POST: если сборка ещё не начата — запоминаем момент
 * готовности и отвечаем 409 generation_in_progress; если окно истекло —
 * сборка действительно завершается готовым результатом (без повторного
 * POST). Внутри окна повторный POST тоже отвечает 409 без перезапуска.
 */
function conflictPost(kind, finalize) {
  const readyAt = pendingGeneration[kind]
  if (readyAt && Date.now() >= readyAt) {
    pendingGeneration[kind] = 0
    return finalize()
  }
  if (!readyAt) pendingGeneration[kind] = Date.now() + MOCK_GENERATION_MS
  return null
}

/*
 * Сценарий nodates: состояние валидно, но дат недели сервер не дал (разбор,
 * прогресс) или дал нераспознанную дату (план). Метка недели в интерфейсе
 * строиться не должна; остальное содержимое остаётся.
 * Возвращает ответ только для GET-состояний, иначе undefined.
 */
function nodatesResponse(pathname, method, state, weekStart) {
  if (method !== 'GET') return undefined

  if (pathname === '/pro/report') {
    if (!state.report) {
      state.report = buildMockReport(weekStart)
      writeState(state)
    }
    return { week_start: null, week_end: null, status: 'ready', report: state.report }
  }

  if (pathname === '/pro/plan') {
    if (!state.plan) {
      state.plan = { days: buildMockPlanDays(weekStart, 1) }
      writeState(state)
    }
    return {
      week_start: weekStart,
      status: 'ready',
      plan: { ...serializePlan(state), plan_week_start: '2026-13-45' },
    }
  }

  if (pathname === '/pro/progress') {
    if (!state.plan) {
      state.plan = { days: buildMockPlanDays(weekStart, 1) }
      writeState(state)
    }
    return { ...progressResponse(state), plan_week_start: null }
  }

  return undefined
}

export async function proMockRequest(path, options = {}) {
  const url = new URL(path, 'https://pro-mock.invalid')
  const pathname = url.pathname
  const method = (options.method || 'GET').toUpperCase()

  const isProPath = pathname.startsWith('/pro/')
  const isConsentPath = pathname === '/mentalix/consent'
  if (!isProPath && !isConsentPath) return undefined

  countMockRequest(method)

  let body = {}
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body)
    } catch {
      body = {}
    }
  }

  // ── Согласие (существующий поток GET/PUT /mentalix/consent) ──
  if (isConsentPath && method === 'GET') {
    const state = readState()
    return { enabled: Boolean(state.consent), entry_selection_window_days: 14 }
  }
  if (isConsentPath && method === 'PUT') {
    const state = readState()
    state.consent = body.enabled === true
    writeState(state)
    return { ok: true, enabled: state.consent }
  }

  const state = readState()
  const weekStart = state.week_start
  const scenario = mockScenario()

  if (scenario === 'nopro') throw new MockApiError(402, { detail: 'pro_required' })
  if (scenario === 'disabled') {
    const detail = pathname.startsWith('/pro/progress')
      ? 'pro_progress_disabled'
      : pathname === '/pro/plan' || pathname.startsWith('/pro/plan/')
        ? 'pro_plan_disabled'
        : 'pro_report_disabled'
    throw new MockApiError(404, { detail })
  }

  /*
   * Сценарии недоставленных данных (регрессии экранов Pro):
   *   network   — сбой сети на любом запросе Pro (как ApiError kind
   *               'network'): экран показывает состояние ошибки с повтором и
   *               повторных POST не отправляет;
   *   nopayload — GET отвечает не состоянием Pro (пустой массив) — так
   *               выглядит чужой или прокси-ответ: UI не форматирует
   *               отсутствующие поля;
   *   nodates   — состояние валидно, но дат недели нет (разбор, прогресс)
   *               или дата нераспознана (план): название недели не строится.
   */
  if (scenario === 'network') {
    const error = new Error('Pro mock: сеть недоступна')
    error.kind = 'network'
    throw error
  }

  if (scenario === 'nopayload') {
    return method === 'GET' ? [] : { ok: true }
  }

  if (scenario === 'nodates') {
    const withoutDates = nodatesResponse(pathname, method, state, weekStart)

    if (withoutDates) return withoutDates
  }

  // ── Разбор недели (PRO-002b) ──
  if (pathname === '/pro/report' && method === 'GET') {
    if (state.report) {
      return { week_start: weekStart, week_end: state.report.week_end, status: 'ready', report: state.report }
    }
    // Сценарий conflict: сборка идёт — GET отдаёт not_generated (GET не
    // сообщает generation_in_progress), после окна завершается готовым
    // результатом, без повторного POST.
    if (pendingGeneration.report) {
      if (Date.now() < pendingGeneration.report) {
        return { week_start: weekStart, week_end: shiftMskDay(weekStart, 6), status: 'not_generated', report: null }
      }
      state.report = buildMockReport(weekStart, scenario === 'longtext')
      pendingGeneration.report = 0
      writeState(state)
      return { week_start: weekStart, week_end: state.report.week_end, status: 'ready', report: state.report }
    }
    if (!state.consent) {
      return { week_start: weekStart, week_end: shiftMskDay(weekStart, 6), status: 'consent_required', report: null }
    }
    return { week_start: weekStart, week_end: shiftMskDay(weekStart, 6), status: 'not_generated', report: null }
  }

  if (pathname === '/pro/report' && method === 'POST') {
    if (!state.consent) {
      throw new MockApiError(409, {
        code: 'consent_required',
        message: 'Включите согласие на использование данных в AI.',
      })
    }
    if (scenario === 'insufficient') {
      throw new MockApiError(409, {
        code: 'insufficient_data',
        message: 'За эту неделю слишком мало записей для разбора.',
      })
    }
    if (scenario === 'crisis') {
      return { status: 'crisis', reply: MOCK_CRISIS_REPLY }
    }
    if (scenario === 'conflict') {
      const done = conflictPost('report', () => {
        state.report = buildMockReport(weekStart, scenario === 'longtext')
        writeState(state)
        return {
          week_start: weekStart,
          week_end: state.report.week_end,
          status: 'ready',
          created: true,
          report: state.report,
        }
      })
      if (done) return done
      throw new MockApiError(409, {
        code: 'generation_in_progress',
        message: 'Разбор этой недели уже собирается. Повторите запрос позже.',
      })
    }
    if (scenario === 'generation_failed' && !generationFailure.report) {
      generationFailure.report = true
      await delay(MOCK_GENERATION_FAILURE_DELAY_MS)
      throw new MockApiError(502, {
        code: 'report_generation_failed',
        message:
          'Не удалось собрать разбор: сервис AI временно не ответил. Попробуйте ещё раз чуть позже.',
      })
    }
    const created = state.report == null
    await delay(900)
    state.report = buildMockReport(weekStart, scenario === 'longtext')
    writeState(state)
    return { week_start: weekStart, week_end: state.report.week_end, status: 'ready', created, report: state.report }
  }

  // ── План на 7 дней (PRO-002c) ──
  if (pathname === '/pro/plan' && method === 'GET') {
    if (state.plan) return { week_start: weekStart, status: 'ready', plan: serializePlan(state) }
    // Сценарий conflict: сборка идёт — GET отдаёт not_generated, после окна
    // завершается готовым планом, без повторного POST.
    if (pendingGeneration.plan) {
      if (Date.now() < pendingGeneration.plan) {
        return { week_start: weekStart, status: 'not_generated', plan: null }
      }
      state.plan = { days: buildMockPlanDays(weekStart, 1) }
      pendingGeneration.plan = 0
      writeState(state)
      return { week_start: weekStart, status: 'ready', plan: serializePlan(state) }
    }
    if (!state.report) return { week_start: weekStart, status: 'report_required', plan: null }
    if (!state.consent) return { week_start: weekStart, status: 'consent_required', plan: null }
    return { week_start: weekStart, status: 'not_generated', plan: null }
  }

  if (pathname === '/pro/plan' && method === 'POST') {
    if (!state.report) {
      throw new MockApiError(409, {
        code: 'report_required',
        message: 'Сначала соберите разбор недели.',
      })
    }
    if (!state.consent) {
      throw new MockApiError(409, {
        code: 'consent_required',
        message: 'Включите согласие на использование данных в AI.',
      })
    }
    if (scenario === 'crisis') {
      return { status: 'crisis', reply: MOCK_CRISIS_REPLY }
    }
    if (scenario === 'rebuild_conflict' && body.rebuild === true) {
      // Детерминированный конфликт пересборки: план уже собран и изменён,
      // сервер возвращает его в теле ошибки.
      if (state.plan == null) {
        state.plan = { days: buildMockPlanDays(weekStart, 1) }
        writeState(state)
      }
      throw new MockApiError(409, {
        code: 'rebuild_conflict',
        message: 'План уже собран и изменён. Пересборка не выполнена — посмотри текущий план.',
        plan: serializePlan(state),
      })
    }
    if (scenario === 'conflict') {
      const done = conflictPost('plan', () => {
        if (state.plan == null) {
          state.plan = { days: buildMockPlanDays(weekStart, 1) }
        }
        writeState(state)
        return { week_start: weekStart, status: 'ready', created: true, plan: serializePlan(state) }
      })
      if (done) return done
      throw new MockApiError(409, {
        code: 'generation_in_progress',
        message: 'План этой недели уже собирается. Повторите запрос позже.',
      })
    }
    const created = state.plan == null
    await delay(900)
    if (state.plan == null || body.rebuild === true) {
      const baseVersion =
        state.plan == null ? 1 : Math.max(...state.plan.days.map(day => day.version)) + 1
      state.plan = { days: buildMockPlanDays(weekStart, baseVersion) }
    }
    writeState(state)
    return { week_start: weekStart, status: 'ready', created, plan: serializePlan(state) }
  }

  // ── Правка пункта плана ──
  const planItemMatch = pathname.match(/^\/pro\/plan\/(\d+)(?:\/status)?$/)
  if (planItemMatch && (method === 'PATCH' || method === 'POST')) {
    const itemId = Number(planItemMatch[1])
    if (!state.plan) throw new MockApiError(404, { detail: 'not_found' })
    const item = state.plan.days.find(day => day.id === itemId)
    if (!item) throw new MockApiError(404, { detail: 'not_found' })

    if (method === 'POST' && pathname.endsWith('/status')) {
      if (!['planned', 'done', 'skipped'].includes(body.status)) {
        throw new MockApiError(422, { detail: 'invalid_status' })
      }
      // Статус — отметка пользователя, а не правка: версия не меняется.
      item.status = body.status
      writeState(state)
      return { id: item.id, day: item.day, status: item.status, version: item.version }
    }

    if (method === 'PATCH') {
      // Детерминированный конфликт версий: любой PATCH пункта отвечает 409,
      // чтобы проверить сохранение ввода и осознанное обновление/повтор.
      if (scenario === 'version_conflict') {
        throw new MockApiError(409, { detail: 'version_conflict' })
      }
      const expected = body.expected_version ?? item.version
      if (expected !== item.version) {
        throw new MockApiError(409, { detail: 'version_conflict' })
      }
      const hasGoal = body.goal_text != null || body.goal_source_reflection != null
      if (body.action != null) item.action = body.action
      if (body.done_criteria != null) item.done_criteria = body.done_criteria
      if (hasGoal) {
        // Общая цель хранится в каждом дне: сервер повышает версии ВСЕХ
        // изменённых дней — mock делает так же.
        for (const day of state.plan.days) {
          if (body.goal_text != null) day.goal_text = body.goal_text
          if (body.goal_source_reflection != null) day.goal_reflection = body.goal_source_reflection
          day.version += 1
        }
      } else {
        item.version += 1
      }
      writeState(state)
      return {
        id: item.id,
        day: item.day,
        action: item.action,
        done_criteria: item.done_criteria,
        goal_text: item.goal_text,
        goal_source_reflection: item.goal_reflection,
        status: item.status,
        version: item.version,
      }
    }
  }

  // ── Прогресс (PRO-002c-progress) ──
  if (pathname === '/pro/progress' && method === 'GET') {
    if (!state.plan) {
      return {
        week_start: weekStart,
        plan_week_start: shiftMskDay(weekStart, 7),
        status: 'plan_required',
        completion: null,
        completion_rate: null,
        days: null,
        done_actions: null,
        goal: null,
      }
    }
    return progressResponse(state)
  }

  return undefined
}

/* Сброс mock-состояния (для проверок; не экспортируется наружу приложения). */
export function resetProMockState() {
  try {
    localStorage.removeItem(MOCK_STATE_KEY)
  } catch {
    /* empty */
  }
  pendingGeneration.report = 0
  pendingGeneration.plan = 0
  generationFailure.report = false
}
