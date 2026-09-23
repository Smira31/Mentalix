/**
 * Рассинхрон (P0): если existing изменился во время шага шкалы,
 * step может оказаться пустым (scale === null/undefined) или
 * за пределами нового layout. Функция возвращает скорректированный
 * step: пропускает пустой шаг шкалы или зажимает в валидный диапазон,
 * чтобы пользователь не застрял на белом экране и не увидел финал
 * без сохранения.
 *
 * @param {object} params
 * @param {number} params.step — текущий шаг
 * @param {number} params.doneStep — шаг финала (зависит от existing)
 * @param {boolean} params.isScaleStep — текущий шаг является шагом шкалы
 * @param {number} params.scaleStepsLength — длина массива MORNING_SCALE_STEPS
 * @returns {number} скорректированный step (или step без изменений)
 */
export function resolveDesyncStep({ step, doneStep, isScaleStep, scaleStepsLength }) {
  if (step >= doneStep) {
    return Math.max(0, doneStep - 1)
  }
  if (isScaleStep && step >= scaleStepsLength) {
    return step + 1
  }
  return step
}
