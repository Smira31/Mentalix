// ── Общий помощник для выбора текущей темы недели ──
//
// Текущая тема — та, у которой is_current = true; если такой нет,
// берём первую из списка. Используется в шторке огонька для
// прогресс-баров к ближайшим вехам (H11). Профиль /api/themes не
// запрашивает (#648) и тему недели в вехах не показывает.

export function pickCurrentTheme(themes) {
  if (!Array.isArray(themes) || themes.length === 0) return null
  return themes.find(t => t?.is_current) || themes[0] || null
}
