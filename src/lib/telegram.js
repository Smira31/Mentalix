import {
  useEffect,
  useRef,
} from 'react'

import WebApp from '@twa-dev/sdk'


/*
 * ПЛАТФОРМЕННЫЙ СЛОЙ TELEGRAM
 *
 * Всё общение с Mini App API живёт здесь и больше нигде. Причина
 * из опыта: разрозненные вызовы к платформе уже один раз довели
 * до `--tg-top` — переменной, которой не существовало, но которую
 * запрашивали два экрана.
 *
 * Второе правило: каждый вызов защищён. Telegram обновляет API
 * версиями, и на старом клиенте метода может просто не быть.
 * Приложение обязано продолжать работать, просто без украшения.
 */


function api() {
  return typeof window === 'undefined'
    ? null
    : window.Telegram?.WebApp ?? null
}


function safely(action, label) {
  try {
    return action()
  } catch (error) {
    console.info(
      `Telegram WebApp: ${label} недоступен на этом клиенте.`,
      error,
    )

    return undefined
  }
}


/* ============================================================
   КНОПКА «НАЗАД»

   Telegram даёт одну системную кнопку на всё приложение: когда
   она показана, она заменяет «Закрыть» в шапке. Экранов, которые
   хотят «назад», может быть несколько один в другом — поэтому
   здесь стек.

   Верхний обработчик в стеке и есть текущее «назад». Экран
   объявляет своё намерение одной строкой и не думает ни о
   порядке, ни о том, кто под ним.
   ============================================================ */

const stack = []

let bound = false


function syncBackButton() {
  const backButton = api()?.BackButton

  if (!backButton) return

  safely(
    () =>
      stack.length
        ? backButton.show()
        : backButton.hide(),
    'BackButton',
  )
}


function handleBackClick() {
  const top = stack[stack.length - 1]

  top?.()
}


export function useBackButton(
  handler,
  active = true,
) {
  const ref = useRef(handler)

  ref.current = handler

  useEffect(() => {
    if (!active) return

    const backButton = api()?.BackButton

    if (!backButton) return

    const entry = () => ref.current?.()

    stack.push(entry)

    if (!bound) {
      safely(
        () =>
          backButton.onClick(
            handleBackClick,
          ),
        'BackButton.onClick',
      )

      bound = true
    }

    syncBackButton()

    return () => {
      const index = stack.indexOf(entry)

      if (index >= 0) {
        stack.splice(index, 1)
      }

      syncBackButton()
    }
  }, [active])
}


/* ============================================================
   ГЛАВНАЯ КНОПКА

   Живёт вне веб-вью и всегда остаётся над клавиатурой. Это её
   единственное, но решающее преимущество: половина наших
   мучений с чек-ином была про кнопку, уезжающую под клавиатуру.
   ============================================================ */

/*
 * Цвета берутся из тех же токенов, что и наша CTA-кнопка,
 * иначе внизу появится синяя кнопка Telegram, не имеющая
 * отношения к Mentalix.
 */
function ctaColors() {
  if (typeof window === 'undefined') return null

  const style = getComputedStyle(
    document.documentElement,
  )

  const background = style
    .getPropertyValue('--btn-bg')
    .trim()

  const text = style
    .getPropertyValue('--btn-text')
    .trim()

  if (!background || !text) return null

  return { background, text }
}


export function useMainButton({
  text,
  onClick,
  visible = true,
  enabled = true,
  loading = false,
}) {
  const ref = useRef(onClick)

  ref.current = onClick

  useEffect(() => {
    const button = api()?.MainButton

    if (!button || !visible) return

    const handler = () => ref.current?.()

    const colors = ctaColors()

    safely(() => {
      if (colors) {
        button.setParams({
          text,
          color: colors.background,
          text_color: colors.text,
        })
      } else {
        button.setText(text)
      }

      button.onClick(handler)
      button.show()
    }, 'MainButton')

    return () => {
      safely(() => {
        button.offClick(handler)
        button.hide()
      }, 'MainButton cleanup')
    }
  }, [text, visible])


  useEffect(() => {
    const button = api()?.MainButton

    if (!button || !visible) return

    safely(() => {
      if (enabled) {
        button.enable()
      } else {
        button.disable()
      }

      if (loading) {
        button.showProgress(true)
      } else {
        button.hideProgress()
      }
    }, 'MainButton state')
  }, [enabled, loading, visible])
}


/* ============================================================
   ВТОРАЯ КНОПКА

   Для действия рядом с главным: «Пропустить» рядом с
   «Завершить». Появилась позже основной, поэтому на части
   клиентов её не будет — и это нормально.
   ============================================================ */

export function useSecondaryButton({
  text,
  onClick,
  visible = true,
}) {
  const ref = useRef(onClick)

  ref.current = onClick

  useEffect(() => {
    const button = api()?.SecondaryButton

    if (!button || !visible) return

    const handler = () => ref.current?.()

    safely(() => {
      button.setParams({
        text,
        position: 'bottom',
      })

      button.onClick(handler)
      button.show()
    }, 'SecondaryButton')

    return () => {
      safely(() => {
        button.offClick(handler)
        button.hide()
      }, 'SecondaryButton cleanup')
    }
  }, [text, visible])
}


/* ============================================================
   КНОПКА НАСТРОЕК В МЕНЮ «⋯»
   ============================================================ */

export function useSettingsButton(onClick) {
  const ref = useRef(onClick)

  ref.current = onClick

  useEffect(() => {
    const button = api()?.SettingsButton

    if (!button) return

    const handler = () => ref.current?.()

    safely(() => {
      button.onClick(handler)
      button.show()
    }, 'SettingsButton')

    return () => {
      safely(() => {
        button.offClick(handler)
        button.hide()
      }, 'SettingsButton cleanup')
    }
  }, [])
}


/* ============================================================
   НАТИВНЫЕ ДИАЛОГИ

   Подтверждение удаления должно выглядеть как решение, а не
   как два мелких слова в углу карточки.
   ============================================================ */

export function confirmAction(message) {
  return new Promise((resolve) => {
    const webApp = api()

    if (!webApp?.showConfirm) {
      resolve(
        typeof window !== 'undefined'
          ? window.confirm(message)
          : false,
      )

      return
    }

    safely(
      () =>
        webApp.showConfirm(
          message,
          (ok) => resolve(Boolean(ok)),
        ),
      'showConfirm',
    )
  })
}


/* ============================================================
   ОБЛАЧНОЕ ХРАНИЛИЩЕ

   До 1024 записей на человека, живёт в Telegram и переезжает
   вместе с ним на другое устройство. Сюда переезжает то, что
   нельзя терять: недописанная вечерняя мысль, пройденный
   онбординг, выбранная тема.
   ============================================================ */

export const cloud = {
  get(key) {
    return new Promise((resolve) => {
      const storage = api()?.CloudStorage

      if (!storage?.getItem) {
        resolve(null)

        return
      }

      safely(
        () =>
          storage.getItem(
            key,
            (error, value) =>
              resolve(
                error ? null : value || null,
              ),
          ),
        'CloudStorage.getItem',
      )
    })
  },

  set(key, value) {
    return new Promise((resolve) => {
      const storage = api()?.CloudStorage

      if (!storage?.setItem) {
        resolve(false)

        return
      }

      safely(
        () =>
          storage.setItem(
            key,
            String(value ?? ''),
            (error) => resolve(!error),
          ),
        'CloudStorage.setItem',
      )
    })
  },

  remove(key) {
    return new Promise((resolve) => {
      const storage = api()?.CloudStorage

      if (!storage?.removeItem) {
        resolve(false)

        return
      }

      safely(
        () =>
          storage.removeItem(
            key,
            (error) => resolve(!error),
          ),
        'CloudStorage.removeItem',
      )
    })
  },
}


/* ============================================================
   ЦВЕТ ШАПКИ И НИЖНЕЙ ПОЛОСЫ

   Без этого между шапкой Telegram и приложением видна граница:
   два разных чёрных.
   ============================================================ */

export function paintChrome(color) {
  const webApp = api()

  if (!webApp) return

  safely(
    () => webApp.setHeaderColor?.(color),
    'setHeaderColor',
  )

  safely(
    () => webApp.setBottomBarColor?.(color),
    'setBottomBarColor',
  )

  safely(
    () =>
      webApp.setBackgroundColor?.(color),
    'setBackgroundColor',
  )
}


/* ============================================================
   ПРОЧЕЕ
   ============================================================ */

// Вертикальный свайп закрывает приложение — на длинных
// прокручиваемых экранах это происходит случайно.
export function lockVerticalSwipes() {
  safely(
    () =>
      api()?.disableVerticalSwipes?.(),
    'disableVerticalSwipes',
  )
}


// Разрешение боту писать. Спрашиваем только в момент, когда
// человек сам включает напоминание, — не раньше.
export function requestMessages() {
  return new Promise((resolve) => {
    const webApp = api()

    if (!webApp?.requestWriteAccess) {
      resolve(false)

      return
    }

    safely(
      () =>
        webApp.requestWriteAccess(
          (granted) =>
            resolve(Boolean(granted)),
        ),
      'requestWriteAccess',
    )
  })
}


// Иконка на домашнем экране — самый честный ответ на вопрос
// «почему человек откроет Mentalix завтра».
export function offerHomeScreen() {
  safely(
    () => api()?.addToHomeScreen?.(),
    'addToHomeScreen',
  )
}


export { WebApp }
