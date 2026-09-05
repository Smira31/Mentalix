import { telegramAdapter } from './telegram.adapter'
import { webAdapter } from './web.adapter'

function detectPlatform() {
  if (typeof window === 'undefined') return 'web'

  const initData = window.Telegram?.WebApp?.initData
  const hashHasTelegramData = window.location?.hash?.includes('tgWebAppData=')
  const telegramBridge = typeof window.TelegramWebviewProxy !== 'undefined'

  return initData || hashHasTelegramData || telegramBridge ? 'telegram' : 'web'
}

export const platform = detectPlatform() === 'telegram' ? telegramAdapter : webAdapter
export const platformName = platform.name
