// Очищаем устаревший ключ масштаба из localStorage (раньше использовался
// переключателем ?type=, который удалён). Выполняется один раз при старте.
try {
  window.localStorage.removeItem('mx-type-scale')
} catch {
  /* Telegram-webview может запрещать localStorage — игнорируем */
}

/*
 * Провайдеров у приложения нет: react-query не использовался ни в одном
 * экране (PERF-001), поэтому QueryClientProvider и его клиент удалены.
 * Компонент остаётся точкой расширения и не даёт менять запрещённый к
 * правке src/main.jsx, который продолжает оборачивать в него приложение.
 */
export function AppProviders({ children }) {
  return <>{children}</>
}
