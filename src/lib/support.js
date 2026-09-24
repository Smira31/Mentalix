import { platform } from '../platform'

/*
 * Единственный адрес поддержки Mentalix. Раньше ссылка была продублирована
 * в профиле и в «политика и данные.» и вела на несуществующий аккаунт.
 */
export const SUPPORT_TELEGRAM = 'smira31'

export const SUPPORT_TELEGRAM_URL = `https://t.me/${SUPPORT_TELEGRAM}`

// В Telegram — нативно через openTelegramLink, в вебе — новая вкладка.
export function openSupportChat(event) {
  event?.preventDefault?.()
  platform.openTelegramLink(SUPPORT_TELEGRAM_URL)
}
