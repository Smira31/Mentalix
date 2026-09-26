// Один показ или ответ за жизнь экрана, включая повторные рендеры.
export function logOnce(seen, key, send) {
  if (seen.current.has(key)) return false
  seen.current.add(key)
  send()
  return true
}
