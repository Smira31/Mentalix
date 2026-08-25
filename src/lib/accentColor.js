// Акцентный цвет интерфейса — косметическая персонализация.
//
// Синхронизируемый (useSynced) флаг, тот же паттерн, что
// APP_LOCK_ENABLED_KEY/TODAY_CARDS_HIDDEN_KEY. Фон (--c-bg) не меняется —
// только --c-gold, единственный источник акцента в проекте
// (src/index.css, tailwind.config.js). Переключение — CSS-override
// переменной по data-accent на <html>, см. src/App.jsx.
export const ACCENT_COLOR_KEY = 'mx-accent-color'

export const ACCENT_COLORS = {
  gold: {
    label: 'Золотой',
    hex: '#EDBD60',
  },
  ice: {
    label: 'Лазурный',
    hex: '#5EB2ED',
  },
}

export const DEFAULT_ACCENT = 'gold'

export function parseAccent(raw) {
  return raw && ACCENT_COLORS[raw] ? raw : DEFAULT_ACCENT
}
