// Ручной выбор визуальной темы Mentalix.
// Сохраняется через useSynced так же, как акцент и остальные пользовательские флаги.
export const THEME_KEY = 'mx-theme'
export const DEFAULT_THEME = 'dark'
export const THEMES = {
  dark: { label: 'Тёмная' },
  light: { label: 'Светлая' },
}

// Только тёмная тема (#1109): парсер всегда возвращает дефолт.
// Пользователь со сохранённой светлой темой при входе получает тёмную.
export function parseTheme(raw) {
  return DEFAULT_THEME
}
