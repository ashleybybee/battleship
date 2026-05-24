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
    'w-9 h-9 border border-cyan-900/40 flex items-center justify-center text-xs font-bold transition-all duration-150 select-none';

  if (isPreview) {
    return `${base} ${isPreviewInvalid ? 'bg-red-400/50 border-red-500/60' : 'bg-emerald-400/50 border-emerald-500/60'}`;
  }

  switch (state) {
    case 'empty':
      return `${base} bg-slate-800/80 hover:bg-cyan-700/40 cursor-pointer`;
    case 'ship':
      if (isEnemy) return `${base} bg-slate-800/80 hover:bg-cyan-700/40 cursor-pointer`;
      return `${base} bg-blue-600/70 border-blue-500/50`;
    case 'hit':
      return `${base} bg-red-600/80 border-red-500/50`;
    case 'miss':
      return `${base} bg-slate-500/50 border-slate-400/30`;
    case 'sunk':
      return `${base} bg-red-900/80 border-red-700/50`;
    default:
      return base;
  }
}

function getCellContent(state: CellState, isEnemy: boolean): string {
  switch (state) {
    case 'hit':
      return '🔥';
    case 'miss':
      return '•';
    case 'sunk':
      return '✕';
    case 'ship':
      return isEnemy ? '' : '■';
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
      {getCellContent(state, isEnemy)}
    </div>
  );
}
