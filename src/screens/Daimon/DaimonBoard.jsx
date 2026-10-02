import { findCell } from '../../lib/daimonBoard'

/*
 * <DaimonBoard> — сетка 6×6 с клетками, змеями и стрелами.
 *
 * Сетка boustrophedon: клетки 1–6 внизу слева направо, 7–12 справа налево, и т.д.
 * Пройденные клетки — чуть светлее, текущая — белая фишка (кружок).
 * Змеи и стрелы показаны значком в углу клетки: «↓N» у головы змеи,
 * «↑N» у основания стрелы. Длинных линий через доску нет — монохром, тихо.
 * Тап по клетке открывает нижнюю шторку с номером, названием и смыслом.
 *
 * Источник правды — board (GET /api/daimon/board). Если board ещё не загружен,
 * findCell fallback на статические данные.
 */

export default function DaimonBoard({
  board,
  position,
  passedCells = new Set(),
  onSelectCell,
  testId = 'daimon-board',
}) {
  const gridCells = []
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const boardRow = 5 - row
      const leftToRight = boardRow % 2 === 0
      const inRow = leftToRight ? col : 5 - col
      const cellNum = boardRow * 6 + inRow + 1
      const cell = findCell(board, cellNum)
      const isPassed = passedCells.has(cellNum)
      const isCurrent = cellNum === position

      gridCells.push(
        <button
          key={`${row}-${col}`}
          type="button"
          className={`mx-daimon-cell${isPassed ? ' mx-daimon-cell--passed' : ''}${isCurrent ? ' mx-daimon-cell--current' : ''}`}
          data-testid={`daimon-cell-${cellNum}`}
          data-cell={cellNum}
          onClick={() => onSelectCell?.(cellNum)}
        >
          {cellNum}
          {isCurrent && <span className="mx-daimon-cell__piece" data-testid="daimon-piece" />}
          {cell?.snake_to && (
            <span className="mx-daimon-cell__marker" data-testid={`daimon-snake-${cellNum}`}>
              ↓{cell.snake_to}
            </span>
          )}
          {cell?.arrow_to && (
            <span className="mx-daimon-cell__marker" data-testid={`daimon-arrow-${cellNum}`}>
              ↑{cell.arrow_to}
            </span>
          )}
        </button>
      )
    }
  }

  return (
    <div className="mx-daimon-board__grid-wrap" data-testid={testId}>
      <div className="mx-daimon-board__grid">{gridCells}</div>
    </div>
  )
}
