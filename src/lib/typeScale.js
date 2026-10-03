/**
 * Временный переключатель масштаба типографики (QA владельца).
 *
 * ?type=100|92|86|80 → --mx-type-scale 1 / 0.92 / 0.86 / 0.80.
 * Выбор сохраняется в localStorage и работает и в ?demo=1, и в Telegram.
 * Без параметра берём сохранённое значение, иначе 0.92.
 *
 * Масштабируется только шрифт: все размеры шрифта выражены через
 * var(--mx-type-scale) (см. src/index.css и calc(Npx * var(--mx-type-scale))
 * в стилях экранов). Отступы и размеры карточек/кнопок не масштабируются.
 *
 * После того как владелец зафиксирует значение, переключатель убирается,
 * а выбранное число становится значением --mx-type-scale в :root.
 */

const STORAGE_KEY = 'mx-type-scale'

/** Значение по умолчанию, пока владелец не выбрал своё. */
export const DEFAULT_TYPE_SCALE = 0.92

/** Шаги переключателя: ?type=92 → 0.92. */
export const TYPE_SCALE_STEPS = { 100: 1, 92: 0.92, 86: 0.86, 80: 0.8 }

function readStoredScale() {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : null
  } catch {
    // Telegram-webview может запрещать localStorage — тогда работает только ?type=.
    return null
  }
}

function storeScale(scale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(scale))
  } catch {
    /* игнорируем: масштаб всё равно применится на этот сеанс */
  }
}

/**
 * Масштаб из текущего адреса (если ?type= задан корректно) иначе сохранённый,
 * иначе DEFAULT_TYPE_SCALE. Явный ?type= имеет приоритет и сохраняется.
 */
export function resolveTypeScale(search = window.location.search) {
  const step = TYPE_SCALE_STEPS[new URLSearchParams(search).get('type')]
  if (step) {
    storeScale(step)
    return step
  }
  return readStoredScale() ?? DEFAULT_TYPE_SCALE
}

/** Применяет масштаб к документу через токен --mx-type-scale. */
export function applyTypeScale(scale) {
  document.documentElement.style.setProperty('--mx-type-scale', String(scale))
}

/** Вызывается один раз при старте приложения (см. src/app/AppProviders.jsx). */
export function initTypeScale() {
  const scale = resolveTypeScale()
  applyTypeScale(scale)
  return scale
}
