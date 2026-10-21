/*
 * Защита контента от копирования (#1112, этап 1).
 *
 * Один общий класс .mx-protected-text вешается на тексты «Пути героя»
 * (вступления и тексты шагов), курсов и статей Библиотеки. CSS-часть
 * (src/index.css) отключает выделение и системное меню долгого нажатия,
 * а этот модуль один раз ставит глобальные перехватчики copy и
 * contextmenu для узлов внутри класса.
 *
 * Поля ввода внутри защищённых экранов («Запиши», «Одно действие») и все
 * экраны без класса работают как раньше: и CSS, и перехватчики исключают
 * input, textarea и contenteditable — выделение, вставка и редактирование
 * сохраняются.
 */

const PROTECTED_SELECTOR = '.mx-protected-text'

/* Элементы внутри защищённого блока, которые продолжают работать как раньше. */
const SELECTABLE_SELECTOR = 'input, textarea, [contenteditable="true"], [contenteditable=""]'

let installed = false

function inProtectedText(target) {
  if (!target || typeof target.closest !== 'function') return false
  if (target.closest(SELECTABLE_SELECTOR)) return false
  return Boolean(target.closest(PROTECTED_SELECTOR))
}

/* Copy-событие приходит без осмысленного target (обычно document),
   поэтому блокируем по фактическому выделению. */
function selectionInProtectedText() {
  const selection = document.getSelection()
  if (!selection || selection.isCollapsed) return false
  const node = selection.anchorNode
  const element = node && (node.nodeType === 1 ? node : node.parentElement)
  return inProtectedText(element)
}

export function installProtectedTextGuards() {
  if (installed || typeof document === 'undefined') return
  installed = true
  document.addEventListener('copy', event => {
    if (selectionInProtectedText()) event.preventDefault()
  })
  document.addEventListener('contextmenu', event => {
    if (inProtectedText(event.target)) event.preventDefault()
  })
}
