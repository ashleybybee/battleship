interface GameOverModalProps {
  winner: 'player' | 'ai';
  onRestart: () => void;
}

export default function GameOverModal({ winner, onRestart }: GameOverModalProps) {
  const isWin = winner === 'player';
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-8 text-center max-w-md mx-4 shadow-2xl">
        <div className="text-6xl mb-4">{isWin ? '🎉' : '💀'}</div>
        <h2 className="text-3xl font-bold mb-2 text-white">
          {isWin ? 'Victory!' : 'Defeat!'}
        </h2>
        <p className="text-slate-300 mb-6">
          {isWin
            ? "You've sunk all enemy ships! Admiral-level performance!"
            : 'The AI has sunk your entire fleet. Better luck next time!'}
        </p>
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
