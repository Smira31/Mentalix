import './ProWaiting.css'

/*
 * Спокойное состояние ожидания на экранах Pro: тихий индикатор и одна строка
 * текста. Показывается там, где запрос занимает секунды-минуты — первичная
 * загрузка состояния и сборка разбора/плана с AI-вызовом на бэкенде, — чтобы
 * ожидание было видно, а не выглядело пустым экраном.
 *
 * Процентов готовности нет намеренно: сколько именно займёт вызов модели,
 * интерфейс не знает и не выдумывает — индикатор только показывает, что
 * приложение ждёт ответ, а не зависло.
 */
export default function ProWaiting({ label, testId = 'pro-waiting' }) {
  return (
    <div className="mx-pro-waiting" data-testid={testId} role="status" aria-live="polite">
      <span className="mx-pro-waiting__indicator" aria-hidden="true" />
      <p className="mx-pro-waiting__label">{label}</p>
    </div>
  )
}
