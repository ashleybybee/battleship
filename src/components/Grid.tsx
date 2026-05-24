import type { CellState, PlacementPreview } from '../types';
import { GRID_SIZE, ROW_LABELS } from '../types';
import Cell from './Cell';

interface GridProps {
  grid: CellState[][];
  isEnemy: boolean;
  preview?: PlacementPreview | null;
  onCellClick?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
}

export default function Grid({
  grid,
  isEnemy,
  preview,
  onCellClick,
  onCellHover,
  onMouseLeave,
  disabled,
}: GridProps) {
  const previewSet = new Set(
    preview?.coords.map(([r, c]) => `${r},${c}`) ?? []
  );

  return (
    <div
      className="w-full max-w-[396px] rounded-lg overflow-hidden shadow-lg shadow-black/30"
      onMouseLeave={onMouseLeave}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `minmax(1.5rem, 2.25rem) repeat(${GRID_SIZE}, 1fr)` }}
      >
        {/* Top-left corner (empty) */}
        <div />
        {/* Column headers */}
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <div
            key={i}
            className="aspect-square w-full flex items-center justify-center text-[10px] sm:text-xs font-semibold text-cyan-300/70"
          >
            {i + 1}
          </div>
        ))}
        {/* Grid rows */}
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="contents">
            {/* Row label */}
            <div className="flex items-center justify-center text-[10px] sm:text-xs font-semibold text-cyan-300/70">
              {ROW_LABELS[rowIdx]}
            </div>
            {/* Cells */}
            {row.map((cell, colIdx) => {
              const key = `${rowIdx},${colIdx}`;
              const inPreview = previewSet.has(key);
              return (
                <div
                  key={colIdx}
                  onMouseEnter={() => onCellHover?.(rowIdx, colIdx)}
                >
                  <Cell
                    state={cell}
                    isEnemy={isEnemy}
                    isPreview={inPreview}
                    isPreviewInvalid={inPreview && !preview?.valid}
                    onClick={
                      disabled ? undefined : () => onCellClick?.(rowIdx, colIdx)
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
