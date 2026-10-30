import { useEffect, useState } from 'react'

/*
 * MXL-CONNECTION-OFFLINE-001: «Нет связи» вместо вечной загрузки.
 *
 * Если ожидание ответа API длится дольше порога, экран показывает тихий
 * текст «Нет связи» и «Повторить» вместо «Подключаемся…»/«Загрузка…».
 * Как только ожидание закончилось (успех, ошибка, повтор), флаг снимается
 * в cleanup эффекта — следующий запрос снова начинает отсчёт с нуля.
 *
 * Порог 8 с выбран владельцем: обычный ответ укладывается в первые
 * секунды, а API-клиент держит собственный таймаут 10 с с одним повтором.
 */
export const SLOW_CONNECTION_MS = 8000

export function useSlowConnection(pending, delayMs = SLOW_CONNECTION_MS) {
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    if (!pending) return undefined

    const timer = setTimeout(() => setStalled(true), delayMs)

    return () => {
      clearTimeout(timer)
      setStalled(false)
    }
  }, [pending, delayMs])

  return Boolean(pending) && stalled
}
