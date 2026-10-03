/*
 * Гарнитура с засечками — голос Mentalix.
 *
 * Временный переключатель для выбора владельцем: ?serif=playfair | cormorant
 * | prata. Выбор сохраняется в localStorage и работает и в ?demo=1, и в
 * Telegram. По умолчанию — Playfair Display. После выбора владельца остальные
 * гарнитуры уберём.
 *
 * Модуль только выставляет data-serif на <html>; сами семейства и их веса
 * описаны токеном --font-serif в src/index.css.
 */

export const SERIF_STORAGE_KEY = 'mx-serif-font'

export const SERIF_FONTS = ['playfair', 'cormorant', 'prata']

export const DEFAULT_SERIF = 'playfair'

/* Семейства и реально доступные веса каждой гарнитуры — используются для
   предзагрузки шрифта (document.fonts.load) в экранах с засечками. */
export const SERIF_FAMILIES = {
  playfair: 'Playfair Display',
  cormorant: 'Cormorant Garamond',
  prata: 'Prata',
}

export const SERIF_WEIGHTS = {
  playfair: [400, 600, 700],
  cormorant: [500, 600, 700],
  prata: [400],
}

function parseSerif(value) {
  return SERIF_FONTS.includes(value) ? value : null
}

export function resolveSerif(search = window.location.search) {
  const requested = parseSerif(new URLSearchParams(search).get('serif'))
  if (requested) {
    try {
      localStorage.setItem(SERIF_STORAGE_KEY, requested)
    } catch {
      /* приватный режим — выбор просто не переживёт перезагрузку */
    }
    return requested
  }

  try {
    const stored = parseSerif(localStorage.getItem(SERIF_STORAGE_KEY))
    if (stored) return stored
  } catch {
    /* приватный режим */
  }

  return DEFAULT_SERIF
}

export function applySerif(font = resolveSerif()) {
  document.documentElement.setAttribute('data-serif', font)
  return font
}
