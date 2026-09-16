import { telegramAdapter } from './telegram.adapter'
import { webAdapter } from './web.adapter'

function detectPlatform() {
  if (typeof window === 'undefined') return 'web'

  const initData = window.Telegram?.WebApp?.initData
  const hashHasTelegramData = window.location?.hash?.includes('tgWebAppData=')
  const telegramBridge = typeof window.TelegramWebviewProxy !== 'undefined'
  const standaloneSafari =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true

  // iOS can preserve a Telegram hash when a Mini App is added to Home Screen.
  // Standalone Safari has no Telegram runtime, so it must use web auth.
  return !standaloneSafari && (initData || hashHasTelegramData || telegramBridge)
    ? 'telegram'
    : 'web'
}

export const platform = detectPlatform() === 'telegram' ? telegramAdapter : webAdapter
export const platformName = platform.name
