import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'

// Очищаем устаревший ключ масштаба из localStorage (раньше использовался
// переключателем ?type=, который удалён). Выполняется один раз при старте.
try {
  window.localStorage.removeItem('mx-type-scale')
} catch {
  /* Telegram-webview может запрещать localStorage — игнорируем */
}

export function AppProviders({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
