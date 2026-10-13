import { useEffect } from 'react'

/*
 * MXL-KEYBOARD-001 — единое правило клавиатуры Mentalix.
 *
 * Когда пользователь нажатием переходит на экран или шаг, основная задача
 * которого — написать текст, активное поле само получает фокус и открывает
 * клавиатуру. Второе нажатие не требуется.
 *
 * Это единственная реализация правила: раньше тот же приём (синхронный
 * focus + повтор в requestAnimationFrame + отложенный повтор) был скопирован
 * в JournalTextarea, PracticeWritingCanvas, DailyJournalFlow,
 * DailyJournalSetup, PracticeFieldFlow и RequestView — шесть независимых
 * копий с разными задержками. Теперь они используют один хук.
 *
 * Контракт поведения (полностью в DESIGN_SYSTEM.md, § «Клавиатура и фокус»):
 *  - фокус ставится только в момент активации поля (смена activationKey),
 *    а не на каждом рендере — курсор и выделение не сбрасываются;
 *  - программный фокус не перехватывается, если пользователь уже пишет в
 *    другом поле;
 *  - поле не «отбирает» фокус обратно после того, как пользователь закрыл
 *    клавиатуру: повтор срабатывает только по активации;
 *  - на экранах чтения, каталогах, списках и в настройках хук не вызывается.
 */

export function isEditableElement(element) {
  if (!element) return false

  const tag = element.tagName

  return tag === 'INPUT' || tag === 'TEXTAREA' || element.isContentEditable === true
}

/*
 * @param {React.RefObject<HTMLElement>} ref — поле, которое должно получить фокус
 * @param {*} activationKey — экран/шаг; смена значения = «пользователь только что сюда пришёл»
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] — выключить правило на этом экране
 * @param {(element: HTMLElement) => void} [options.afterFocus] — действие постановки курсора после успешного фокуса
 */
export function useAutoFocusField(ref, activationKey, options = {}) {
  const { enabled = true, afterFocus } = options

  useEffect(() => {
    if (!enabled) return undefined
    if (activationKey === null || activationKey === undefined || activationKey === false) {
      return undefined
    }

    const focusField = () => {
      const element = ref.current
      if (!element) return

      const ownerDocument = element.ownerDocument
      const active = ownerDocument.activeElement

      // Пользователь уже пишет в другом поле — не перехватываем фокус.
      if (active !== element && isEditableElement(active)) return
      if (active === element) return

      element.focus({ preventScroll: true })

      // Программный focus на iOS/Telegram WebView не всегда открывает
      // клавиатуру — после фактической постановки фокуса возвращаем курсор.
      if (ownerDocument.activeElement === element) afterFocus?.(element)
    }

    // Синхронный вызов в том же тике надёжнее всего открывает клавиатуру;
    // повторы страхуют случай, когда узел ещё не готов или фокус «съеден»
    // анимацией входа экрана.
    focusField()
    const frame = window.requestAnimationFrame(focusField)
    const retry = window.setTimeout(focusField, 120)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
    // afterFocus намеренно не в зависимостях: новый идентификатор колбэка
    // не должен перезапускать автофокус и повторно захватывать поле.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activationKey, enabled, ref])
}
