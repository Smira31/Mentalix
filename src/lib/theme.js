// Ручной выбор визуальной темы Mentalix.
// Сохраняется через useSynced так же, как акцент и остальные пользовательские флаги.
export const THEME_KEY = 'mx-theme'
export const DEFAULT_THEME = 'dark'
export const THEMES = {
  dark: { label: 'Тёмная' },
  light: { label: 'Светлая' },
}

export function parseTheme(raw) {
  return raw && THEMES[raw] ? raw : DEFAULT_THEME
}
