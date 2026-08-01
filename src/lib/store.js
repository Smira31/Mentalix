import { useCallback, useEffect, useRef, useState } from 'react'

import { cloud } from './telegram'

/*
 * ХРАНИЛИЩЕ НАСТРОЕК: ДВА УРОВНЯ
 *
 * localStorage — мгновенный и переживает перезапуск, но привязан
 * к устройству. Человек проходил знакомство на телефоне, открыл
 * на десктопе — и всё начинается заново.
 *
 * CloudStorage Telegram переезжает вместе с человеком, но он
 * асинхронный: ответа приходится ждать. Если читать только из
 * него, первый кадр придётся рисовать вслепую, и приложение
 * будет мигать при каждом запуске.
 *
 * Поэтому оба, и роли разные:
 *
 *   читаем    — сначала локально (мгновенно, кадр не мигает),
 *               затем подтягиваем облако и обновляем, если оно
 *               говорит другое;
 *   пишем     — сразу в оба.
 *
 * Облако главнее локального при расхождении: локальное значение
 * знает только про это устройство, облачное — про человека.
 *
 * Это не замена «одно на одно» — простой поиск с заменой здесь
 * сломал бы первый кадр. Разница синхронного и асинхронного
 * доступа и есть вся сложность этого файла.
 */

export function readLocal(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)

    return raw === null ? fallback : raw
  } catch {
    return fallback
  }
}

export function writeLocal(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Приватный режим или переполненное хранилище — не повод падать.
  }
}

export function dropLocal(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // см. выше
  }
}

/*
 * Полное удаление: и здесь, и у человека. Нужно там, где значение
 * не «настройка», а «пройденный этап» — например, сброс знакомства.
 */
export async function forget(key) {
  dropLocal(key)

  await cloud.remove(key)
}

/*
 * Значение, живущее в обоих хранилищах.
 *
 * Возвращает [value, setValue] — снаружи выглядит как обычный
 * useState, и это намеренно: экраны не должны знать, что под ними
 * два хранилища с разной скоростью.
 *
 * `merge` вызывается, когда облако не совпало с локальным, и
 * решает, что победит. По умолчанию — облако. Для наборов
 * («что уже показывали») правильнее объединение, поэтому там
 * передаётся своя функция.
 */
export function useSynced(key, fallback, merge) {
  const [value, setValue] = useState(() => readLocal(key, fallback))

  const mergeRef = useRef(merge)
  mergeRef.current = merge

  useEffect(() => {
    let alive = true

    cloud.get(key).then((remote) => {
      if (!alive || remote === null || remote === undefined) return

      setValue((local) => {
        const next = mergeRef.current
          ? mergeRef.current(local, remote)
          : remote

        if (next === local) return local

        writeLocal(key, next)

        return next
      })
    })

    return () => {
      alive = false
    }
  }, [key])

  const set = useCallback(
    (next) => {
      setValue(next)
      writeLocal(key, next)
      cloud.set(key, next)
    },
    [key],
  )

  return [value, set]
}
