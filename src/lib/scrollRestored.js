/*
 * Программное восстановление прокрутки (возврат на экран, где человек был
 * раньше) — не жест. Экран, который сам ставит scrollTop, сообщает об этом
 * нижней панели, и та перечитывает позицию, не сворачиваясь от «скачка».
 * Переключение вкладок делает то же через navRef.reset() в App.
 */
export const SCROLL_RESTORED_EVENT = 'mx:scroll-restored'

export function notifyScrollRestored() {
  window.dispatchEvent(new Event(SCROLL_RESTORED_EVENT))
}
