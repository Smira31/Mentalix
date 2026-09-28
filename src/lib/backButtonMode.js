// SDK creates WebApp in ordinary browsers too; only signed launch data identifies Telegram.
export function isTelegramBackMode(webApp) {
  return Boolean(webApp && typeof webApp.initData === 'string' && webApp.initData.trim())
}
