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
 *  - одна попытка фокусировки на вход в активный шаг ввода: фокус ставится
 *    только в момент активации поля (смена activationKey), а не на каждом
 *    рендере — курсор и выделение не сбрасываются;
 *  - программный фокус не перехватывается, если пользователь уже пишет в
 *    другом поле;
 *  - ручное закрытие клавиатуры (blur) — конец попытки: отложенные повторы
 *    отменяются, и поле больше не «отбирает» фокус обратно. Новый фокус
 *    возможен только при новом явном входе пользователя в шаг;
 *  - при смене шага и размонтировании снимаются таймеры и обработчик, а в
 *    отложенном повторе проверяется, что узел ещё в документе: старая
 *    DOM-поверхность фокус не получает;
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

    const element = ref.current
    if (!element) return undefined

    // Одна попытка на активацию: после ручного blur отложенные повторы
    // отменяются и поле не забирает фокус до следующего входа в шаг.
    let cancelled = false
    let blurred = false
    let frame = 0
    let retry = 0

    const cancelDeferred = () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
      if (retry) {
        window.clearTimeout(retry)
        retry = 0
      }
    }

    const focusField = () => {
      if (cancelled || blurred) return
      // Узел мог быть заменён при смене шага: старую поверхность не фокусируем.
      if (!element.isConnected || ref.current !== element) return

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

    /*
     * Ручное закрытие клавиатуры / уход фокуса вручную: пользователь закончил
     * ввод — отложенные повторы больше не имеют права вернуть фокус.
     */
    const handleBlur = () => {
      blurred = true
      cancelDeferred()
    }
    element.addEventListener('blur', handleBlur)

    // Отложенные повторы планируем ДО синхронной попытки: если пользователь
    // закроет клавиатуру в том же кадре, они уже будут отменены и не сработают.
    // Синхронный вызов в том же тике надёжнее всего открывает клавиатуру;
    // повторы страхуют случай, когда узел ещё не готов или фокус «съеден»
    // анимацией входа экрана.
    frame = window.requestAnimationFrame(() => {
      frame = 0
      focusField()
    })
    retry = window.setTimeout(() => {
      retry = 0
      focusField()
    }, 120)
    focusField()

    return () => {
      cancelled = true
      cancelDeferred()
      element.removeEventListener('blur', handleBlur)
    }
    // afterFocus намеренно не в зависимостях: новый идентификатор колбэка
    // не должен перезапускать автофокус и повторно захватывать поле.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activationKey, enabled, ref])
}
