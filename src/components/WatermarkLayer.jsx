/*
 * Водяной знак — один фиксированный слой на экран (#1112, этап 2).
 *
 * position: fixed, pointer-events: none, z-index ниже кнопок и полей ввода.
 * Текст повторяется по диагонали через SVG-паттерн в --mx-watermark-bg.
 * Прозрачность — --mx-watermark-opacity (0.07).
 *
 * Добавляется явно только в StepIntro, WriteScreen (HeroJourneyMap)
 * и LibraryArticleReader — на остальных экранах водяного знака нет.
 */
export default function WatermarkLayer() {
  return (
    <div
      className="mx-watermark-layer"
      aria-hidden="true"
      data-testid="watermark-layer"
    />
  )
}
