/*
 * Водяной знак на защищённых экранах (#1112, этап 2).
 *
 * Текст водяного знака — Telegram @username пользователя (или id, если
 * username нет) + «Mentalix». В demo-режиме — «demo · Mentalix».
 *
 * Текст задаётся как CSS-переменная --mx-watermark-text на :root,
 * а CSS-часть (src/index.css) выводит его через ::after на каждом
 * элементе с классом .mx-protected-text. Прозрачность регулируется
 * одной переменной --mx-watermark-opacity (по умолчанию 0.07).
 */

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
}
