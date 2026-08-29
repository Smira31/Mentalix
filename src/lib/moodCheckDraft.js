import { toLocalCalendarDate } from './dateTimezonePolicy.js'

// Быстрый mood-check при запуске (MXL-MOOD-CHECK-001, идея 12 ROADMAP.md).
//
// Тумблер — синхронизируемый флаг (useSynced в App.jsx/Settings.jsx), тот
// же паттерн, что APP_LOCK_ENABLED_KEY/TODAY_CARDS_HIDDEN_KEY. Дефолт '0':
// фича opt-in — без этого она добавляла бы трение всем при каждом
// запуске, а не только тем, кто сам её включил (см. pre-mortem
// MXL-MOOD-CHECK-001 — сценарий провала владельца).
export const MOOD_CHECK_ENABLED_KEY = 'mx-mood-check-enabled'

// Остальные два ключа — чисто локальные, не облако и не бэкенд.
//
// LAST_SHOWN (localStorage) — календарная дата последнего показа
// оверлея. Оверлей никогда не пишет в api.checkin.save() (см. ниже),
// поэтому «чек-ина ещё нет» держится весь день до настоящего
// чек-ина — без этой метки оверлей всплывал бы на каждом запуске,
// а не раз в день, что и было ключевым риском провала в pre-mortem.
const LAST_SHOWN_KEY = 'mx-mood-check-last-shown'

// DRAFT (sessionStorage) — выбранный уровень настроения. CheckIn.jsx
// подхватывает его как prefill первого шага при следующем открытии
// (см. consumeMoodDraft() в values useState). Оверлей сам никогда не
// вызывает api.checkin.save() — иначе фиктивные energy/anxiety/focus
// молча заняли бы место настоящего чек-ина (см. Today.jsx todayState).
const DRAFT_KEY = 'mx-mood-check-draft'

// MXL-DATE-POLICY-UTC-FIX-001: было new Date().toISOString().slice(0, 10) —
// UTC-дата, не локальная. На границе полуночи в любом ненулевом часовом
// поясе это давало двойной показ гейта в один локальный день или пропуск в
// начале следующего (LAST_SHOWN_KEY сравнивался с чужим, UTC-календарём).
// toLocalCalendarDate — тот же единый паттерн, что checkinDraft.todayCheckinKey()
// и journalStorage.todayKey() (src/lib/dateTimezonePolicy.js).
export function today(now = new Date()) {
  return toLocalCalendarDate(now)
}

export function shouldOfferMoodCheck() {
  try {
    return localStorage.getItem(LAST_SHOWN_KEY) !== today()
  } catch {
    return true
  }
}

export function markMoodCheckShown() {
  try {
    localStorage.setItem(LAST_SHOWN_KEY, today())
  } catch {
    // приватный режим/переполненное хранилище — не повод падать
  }
}

export function writeMoodDraft(level) {
  try {
    sessionStorage.setItem(DRAFT_KEY, String(level))
  } catch {
    // см. выше
  }
}

export function consumeMoodDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null

    sessionStorage.removeItem(DRAFT_KEY)

    const level = Number(raw)

    return Number.isFinite(level) && level >= 1 && level <= 5 ? level : null
  } catch {
    return null
  }
}
