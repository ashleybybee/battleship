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
      className="inline-block bg-slate-800/50 p-2 rounded-lg border border-slate-600/30 shadow-xl"
      onMouseLeave={onMouseLeave}
    >
      {/* Column headers */}
      <div className="flex">
        <div className="w-9 h-9 sm:w-10 sm:h-10" />
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <div
            key={i}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xs font-bold text-slate-400"
          >
            {i + 1}
          </div>
        ))}
      </div>
      {/* Rows */}
      {grid.map((row, rowIdx) => (
        <div key={rowIdx} className="flex">
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xs font-bold text-slate-400">
            {ROW_LABELS[rowIdx]}
          </div>
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
                  onClick={() => onCellClick?.(rowIdx, colIdx)}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
