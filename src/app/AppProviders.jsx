import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { initTypeScale } from '../lib/typeScale'

// Временный переключатель масштаба шрифта (?type=100|92|86|80) — до первого рендера.
initTypeScale()

export function AppProviders({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
