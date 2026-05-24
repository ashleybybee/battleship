import type { CellState } from '../types';

interface CellProps {
  state: CellState;
  isEnemy: boolean;
  isPreview?: boolean;
  isPreviewInvalid?: boolean;
  onClick?: () => void;
}

function getCellClasses(
  state: CellState,
  isEnemy: boolean,
  isPreview?: boolean,
  isPreviewInvalid?: boolean
): string {
  const base =
    'w-8 h-8 border border-slate-600 flex items-center justify-center text-xs font-bold transition-colors duration-150 cursor-pointer select-none';

  if (isPreview) {
    return `${base} ${isPreviewInvalid ? 'bg-red-400/60' : 'bg-green-400/60'}`;
  }

  switch (state) {
    case 'empty':
      return `${base} bg-slate-700 hover:bg-slate-600`;
    case 'ship':
      if (isEnemy) return `${base} bg-slate-700 hover:bg-slate-600`;
      return `${base} bg-blue-500`;
    case 'hit':
      return `${base} bg-red-600`;
    case 'miss':
      return `${base} bg-slate-400`;
    case 'sunk':
      return `${base} bg-red-900`;
    default:
      return base;
  }
}

function getCellContent(state: CellState): string {
  switch (state) {
    case 'hit':
      return '🔥';
    case 'miss':
      return '•';
    case 'sunk':
      return '✕';
    default:
      return '';
  }
}

export default function Cell({
  state,
  isEnemy,
  isPreview,
  isPreviewInvalid,
  onClick,
}: CellProps) {
  return (
    <div
      className={getCellClasses(state, isEnemy, isPreview, isPreviewInvalid)}
      onClick={onClick}
    >
      {getCellContent(state)}
    </div>
  );
}
