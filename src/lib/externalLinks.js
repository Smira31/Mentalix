import { platform, platformName } from '../platform'

/*
 * Единая точка открытия ссылок из Профиля:
 *   t.me   → openTelegramLink (остаёмся внутри Telegram);
 *   https  → openLink;
 *   mailto → в Telegram не открывается почтовым клиентом надёжно, поэтому там
 *            адрес показываем текстом с копированием (см. canOpenMailto).
 */
export function isTelegramLink(href) {
  return /^https?:\/\/(?:www\.)?(?:t|telegram)\.me\//i.test(href)
}

export const canOpenMailto = () => platformName !== 'telegram'

export function openExternal(href) {
  if (!href) return
  if (isTelegramLink(href)) platform.openTelegramLink(href)
  else platform.openLink(href)
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}
