import type { CellState } from '../types';

interface CellProps {
  state: CellState;
  isEnemy: boolean;
  isPreview?: boolean;
  isPreviewInvalid?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function getCellClasses(
  state: CellState,
  isEnemy: boolean,
  isPreview?: boolean,
  isPreviewInvalid?: boolean,
  disabled?: boolean
): string {
  const base =
    'w-9 h-9 sm:w-10 sm:h-10 border border-slate-600/50 flex items-center justify-center text-sm font-bold transition-all duration-200 select-none rounded-sm';

  if (isPreview) {
    return `${base} ${isPreviewInvalid ? 'bg-red-500/50 border-red-400' : 'bg-emerald-500/50 border-emerald-400'} scale-95`;
  }

  const interactive =
    !disabled && (isEnemy || state === 'empty')
      ? 'cursor-pointer hover:scale-105 hover:z-10'
      : '';

  switch (state) {
    case 'empty':
      if (isEnemy && !disabled) {
        return `${base} ${interactive} bg-slate-700/80 hover:bg-sky-600/40 hover:border-sky-400/50`;
      }
      return `${base} bg-slate-700/80`;
    case 'ship':
      if (isEnemy) return `${base} ${interactive} bg-slate-700/80 hover:bg-sky-600/40 hover:border-sky-400/50`;
      return `${base} bg-blue-500/80 border-blue-400/50 shadow-inner shadow-blue-900/30`;
    case 'hit':
      return `${base} bg-red-600 border-red-500 shadow-lg shadow-red-900/40 animate-pulse`;
    case 'miss':
      return `${base} bg-slate-500/60 border-slate-400/30`;
    case 'sunk':
      return `${base} bg-red-900 border-red-700 shadow-inner shadow-black/40`;
    default:
      return base;
  }
}

function getCellContent(state: CellState, isEnemy: boolean): string {
  switch (state) {
    case 'hit':
      return '\u{1F525}';
    case 'miss':
      return '\u{1F4A7}';
    case 'sunk':
      return '\u2716';
    case 'ship':
      return isEnemy ? '' : '\u25A0';
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
  disabled,
}: CellProps) {
  return (
    <div
      className={getCellClasses(state, isEnemy, isPreview, isPreviewInvalid, disabled)}
      onClick={disabled ? undefined : onClick}
      role={onClick && !disabled ? 'button' : undefined}
      aria-label={onClick && !disabled ? 'Grid cell' : undefined}
    >
      {getCellContent(state, isEnemy)}
    </div>
  );
}
