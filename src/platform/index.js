import { telegramAdapter } from './telegram.adapter'
import { webAdapter } from './web.adapter'

function detectPlatform() {
  const isTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData
  return isTelegram ? 'telegram' : 'web'
}

export const platform = detectPlatform() === 'telegram' ? telegramAdapter : webAdapter
export const platformName = platform.name