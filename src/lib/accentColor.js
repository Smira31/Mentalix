// Акцентный цвет интерфейса — косметическая персонализация.
//
// Синхронизируемый (useSynced) флаг, тот же паттерн, что
// APP_LOCK_ENABLED_KEY/TODAY_CARDS_HIDDEN_KEY. Фон (--c-bg) не меняется —
// только --c-gold, единственный источник акцента в проекте
// (src/index.css, tailwind.config.js). Переключение — CSS-override
// переменной по data-accent на <html>, см. src/App.jsx. Набор опций
// зависит от темы, но ключ хранения остаётся общим.
export const ACCENT_COLOR_KEY = 'mx-accent-color'

export const DARK_ACCENT_COLORS = {
  gold: {
    label: 'Золотой',
    hex: '#EDBD60',
  },
  ice: {
    label: 'Лазурный',
    hex: '#5EB2ED',
  },
}

export const LIGHT_ACCENT_COLORS = {
  sage: {
    label: 'Шалфейный',
    hex: '#6B7A52',
  },
  terracotta: {
    label: 'Терракота',
    hex: '#B97355',
  },
}

export const ACCENT_COLORS = DARK_ACCENT_COLORS
export const DEFAULT_ACCENT = 'gold'
export const LIGHT_DEFAULT_ACCENT = 'sage'

export function getAccentColors(theme) {
  return theme === 'light' ? LIGHT_ACCENT_COLORS : DARK_ACCENT_COLORS
}

export function parseAccent(raw, theme = 'dark') {
  const colors = getAccentColors(theme)
  return raw && colors[raw] ? raw : theme === 'light' ? LIGHT_DEFAULT_ACCENT : DEFAULT_ACCENT
}
