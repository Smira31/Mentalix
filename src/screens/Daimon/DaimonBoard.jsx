import { DAIMON_CELLS, DAIMON_SNAKES, DAIMON_ARROWS, cellGridPosition, getCell } from '../../lib/daimonBoard'

/*
 * <DaimonBoard> — сетка 6×6 с клетками, змеями и стрелами.
 *
 * Сетка boustrophedon: клетки 1–6 внизу слева направо, 7–12 справа налево, и т.д.
 * Пройденные клетки — чуть светлее, текущая — фишка (кружок).
 * Змеи — пунктирные линии вниз, стрелы — сплошные вверх.
 */

const VIEWBOX = 600
const CELL = VIEWBOX / 6

function cellCenter(n) {
  const { row, col } = cellGridPosition(n)
  return { cx: col * CELL + CELL / 2, cy: row * CELL + CELL / 2 }
}

function snakePath(from, to) {
  const a = cellCenter(from)
  const b = cellCenter(to)
  const midX = (a.cx + b.cx) / 2 + 20
  const midY = (a.cy + b.cy) / 2
  return `M ${a.cx} ${a.cy} Q ${midX} ${midY} ${b.cx} ${b.cy}`
}

function arrowPath(from, to) {
  const a = cellCenter(from)
  const b = cellCenter(to)
  return `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}`
}

export default function DaimonBoard({ position, passedCells = new Set(), testId = 'daimon-board' }) {
  const gridCells = []
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const n = row * 6 + col + 1
      // boustrophedon: вычисляем реальный номер клетки
      const boardRow = 5 - row
      const leftToRight = boardRow % 2 === 0
      const inRow = leftToRight ? col : 5 - col
      const cellNum = boardRow * 6 + inRow + 1
      const cell = getCell(cellNum)
      const isPassed = passedCells.has(cellNum)
      const isCurrent = cellNum === position

      gridCells.push(
        <div
          key={`${row}-${col}`}
          className={`mx-daimon-cell${isPassed ? ' mx-daimon-cell--passed' : ''}${isCurrent ? ' mx-daimon-cell--current' : ''}`}
          data-testid={`daimon-cell-${cellNum}`}
        >
          {cellNum}
          {isCurrent && <span className="mx-daimon-cell__piece" data-testid="daimon-piece" />}
          {cell?.snake_to && (
            <span className="mx-daimon-cell__marker mx-daimon-cell__marker--snake">↘</span>
          )}
          {cell?.arrow_to && (
            <span className="mx-daimon-cell__marker mx-daimon-cell__marker--arrow">↗</span>
          )}
        </div>
      )
    }
  }

  return (
    <div className="mx-daimon-board__grid-wrap" data-testid={testId}>
      <div className="mx-daimon-board__grid">
        {gridCells}
      </div>
      <svg
        className="mx-daimon-board__svg"
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {Object.entries(DAIMON_SNAKES).map(([from, to]) => (
          <path
            key={`snake-${from}`}
            className="mx-daimon-board__snake-line"
            d={snakePath(Number(from), to)}
          />
        ))}
        {Object.entries(DAIMON_ARROWS).map(([from, to]) => (
          <path
            key={`arrow-${from}`}
            className="mx-daimon-board__arrow-line"
            d={arrowPath(Number(from), to)}
          />
        ))}
      </svg>
    </div>
  )
}
