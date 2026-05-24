interface GameOverModalProps {
  winner: 'player' | 'ai';
  onRestart: () => void;
}

export default function GameOverModal({ winner, onRestart }: GameOverModalProps) {
  const isWin = winner === 'player';
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl p-10 text-center max-w-md mx-4 shadow-2xl shadow-black/50">
        <div className="text-7xl mb-5">
          {isWin ? '\u{1F389}' : '\u{1F480}'}
        </div>
        <h2
          className={`text-4xl font-black mb-3 ${
            isWin
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400'
          }`}
        >
          {isWin ? 'Victory!' : 'Defeat!'}
        </h2>
        <p className="text-slate-300 mb-8 text-lg">
          {isWin
            ? "You've sunk the entire enemy fleet! Admiral-level performance!"
            : 'The AI has sunk your entire fleet. Regroup and try again!'}
        </p>
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-800/50 hover:scale-105 active:scale-95"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
