/*
 * Рамка телефона в обычном браузере на компьютере (не Telegram, не ?demo=1).
 *
 * Логический размер — iPhone 16 Pro Max: 440×956. Если окно ниже, рамка
 * уменьшается пропорционально, чтобы целиком влезать без прокрутки
 * страницы (вертикальные поля сцены — 10px сверху и 18px снизу).
 */
export const DESKTOP_FRAME_VIEWPORT = { width: 440, height: 956 }
export const DESKTOP_FRAME_GUTTERS = 28
export const DESKTOP_FRAME_MIN_SCALE = 0.35

export function desktopFrameScale(
  viewportHeight,
  frameHeight = DESKTOP_FRAME_VIEWPORT.height,
  gutters = DESKTOP_FRAME_GUTTERS
) {
  const available = Number(viewportHeight) - gutters

  if (!Number.isFinite(available) || !Number.isFinite(frameHeight) || frameHeight <= 0) return 1

  return Math.min(1, Math.max(DESKTOP_FRAME_MIN_SCALE, available / frameHeight))
}
