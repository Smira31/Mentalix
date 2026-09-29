/*
 * ЧИСТАЯ ЛОГИКА ПОРОГОВ ЖЕСТОВ «НАЗАД» И ЗАКРЫТИЯ ШТОРКИ
 *
 * Вынесена отдельно от хуков, чтобы тестировать без React и DOM.
 * Спецификация — DESIGN_SYSTEM.md §6.
 */

export const EDGE_WIDTH = 24 // px от левого края экрана
export const EDGE_SWIPE_DISTANCE_RATIO = 0.35 // 35% ширины экрана
export const SHEET_CLOSE_RATIO = 0.25 // 25% высоты шторки
export const VELOCITY_THRESHOLD = 0.5 // px/ms

/**
 * Начался ли жест в полосе EDGE_WIDTH от левого края.
 */
export function isEdgeStart(touchX) {
  return touchX <= EDGE_WIDTH
}

/**
 * Горизонтальное движение преобладает над вертикальным.
 */
export function isHorizontalSwipe(dx, dy) {
  return Math.abs(dx) > Math.abs(dy)
}

/**
 * Достаточно ли протащили от левого края, чтобы сработал «назад».
 * Порог — 35% ширины экрана ИЛИ скорость > 0.5 px/ms.
 */
export function shouldTriggerEdgeBack(distance, screenWidth, velocity) {
  return (
    distance > screenWidth * EDGE_SWIPE_DISTANCE_RATIO ||
    velocity > VELOCITY_THRESHOLD
  )
}

/**
 * Достаточно ли протащили шторку вниз, чтобы закрыть.
 * Порог — 25% высоты шторки ИЛИ скорость > 0.5 px/ms.
 */
export function shouldTriggerSheetClose(distance, sheetHeight, velocity) {
  return (
    distance > sheetHeight * SHEET_CLOSE_RATIO ||
    velocity > VELOCITY_THRESHOLD
  )
}

/**
 * Прозрачность затемнённого слоя под экраном во время жеста.
 * Растёт от 0 до maxOpacity по мере продвижения к порогу.
 */
export function edgeBackdropOpacity(distance, screenWidth, maxOpacity = 0.5) {
  const progress = Math.min(1, distance / (screenWidth * EDGE_SWIPE_DISTANCE_RATIO))
  return progress * maxOpacity
}
