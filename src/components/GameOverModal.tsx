interface GameOverModalProps {
  winner: 'player' | 'ai';
  onRestart: () => void;
}

export default function GameOverModal({ winner, onRestart }: GameOverModalProps) {
  const isWin = winner === 'player';
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-cyan-900/40 rounded-2xl p-6 sm:p-8 text-center max-w-md w-full shadow-2xl shadow-black/50">
        <div className="text-5xl sm:text-6xl mb-4">{isWin ? '🎉' : '💀'}</div>
        <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
          {isWin ? 'Victory!' : 'Defeat!'}
        </h2>
        <p className="text-sm sm:text-base text-slate-300 mb-6">
          {isWin
            ? "You've sunk all enemy ships! Admiral-level performance!"
            : 'The AI has sunk your entire fleet. Better luck next time!'}
        </p>
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-cyan-900/30 touch-manipulation"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
