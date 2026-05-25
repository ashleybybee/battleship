import { useEffect } from 'react';

interface ShipSunkModalProps {
  shipName: string;
  onClose: () => void;
}

export default function ShipSunkModal({ shipName, onClose }: ShipSunkModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_200ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-orange-500/50 rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full shadow-2xl shadow-orange-900/30 animate-[zoomIn_300ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl sm:text-6xl mb-3 animate-[bounce_600ms_ease-in-out]">
          💥
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold mb-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent uppercase tracking-wider">
          KABOOM!
        </h2>
        <p className="text-sm sm:text-base text-slate-200 mb-5">
          You sank the AI&apos;s{' '}
          <span className="font-bold text-orange-300">{shipName}</span>!
          {' '}💣
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-orange-900/40 touch-manipulation"
        >
          Continue 🏆
        </button>
      </div>
    </div>
  );
}
