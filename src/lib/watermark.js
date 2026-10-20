/*
 * Водяной знак на защищённых экранах (#1112, этап 2).
 *
 * Текст водяного знака — Telegram @username пользователя (или id, если
 * username нет) + «Mentalix». В demo-режиме — «demo · Mentalix».
 *
 * Текст повторяется по диагонали через SVG-паттерн (data URI), который
 * записывается в CSS-переменную --mx-watermark-bg. Слой .mx-watermark-layer
 * (компонент WatermarkLayer) выводит этот паттерн как background-image
 * на весь экран. Прозрачность — --mx-watermark-opacity (по умолчанию 0.07).
 *
 * Слой показывается только на экране шага «Пути героя» (чтение/запись)
 * и в статье Библиотеки — компонент WatermarkLayer добавляется явно
 * в StepIntro, WriteScreen и LibraryArticleReader.
 */

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildWatermarkSvg(text) {
  const safe = escapeXml(text)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">` +
    `<g transform="rotate(-30 160 160)" fill="white" font-size="11" ` +
    `font-family="sans-serif" font-weight="400">` +
    `<text x="0" y="50">${safe}</text>` +
    `<text x="0" y="130">${safe}</text>` +
    `<text x="0" y="210">${safe}</text>` +
    `<text x="0" y="290">${safe}</text>` +
    `</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function setupWatermark(user) {
  if (typeof document === 'undefined') return

  let text
  if (!user || user.demo) {
    text = 'demo · Mentalix'
  } else if (user.username) {
    text = `@${user.username} · Mentalix`
  } else {
    text = `id:${user.id} · Mentalix`
  }

  document.documentElement.style.setProperty('--mx-watermark-text', `"${text}"`)
  document.documentElement.style.setProperty('--mx-watermark-bg', buildWatermarkSvg(text))
}
