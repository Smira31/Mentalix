/**
 * tgShell — dev-only Telegram iOS simulation for the Base44 preview.
 *
 * This module is dynamically imported only in dev or when VITE_TG_SHELL=1.
 * It must never be statically imported — that would ship tgShell code in
 * the production bundle.
 *
 * Sets window.__MX_TG_SHELL so isPreviewDemoMode() in demoMode.js returns
 * true, enabling all existing demo-mode code paths (skip auth, DEMO_USER,
 * demo data, DemoTelegramChrome, 56px top inset, device frame, etc.).
 *
 * Disable with ?tgshell=0.
 */
export function initTgShell() {
  if (typeof window === 'undefined') return
  if (navigator.webdriver) return
  if (new URLSearchParams(window.location.search).get('tgshell') === '0') return
  window.__MX_TG_SHELL = true
}
