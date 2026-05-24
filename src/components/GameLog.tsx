import { useRef, useEffect } from 'react';
import type { LogEntry } from '../types';

interface GameLogProps {
  logs: LogEntry[];
}

function getLogColor(type: LogEntry['type']): string {
  switch (type) {
    case 'hit':
      return 'text-red-400';
    case 'miss':
      return 'text-slate-400';
    case 'sunk':
      return 'text-orange-400 font-semibold';
    case 'win':
      return 'text-emerald-400 font-bold';
    case 'loss':
      return 'text-red-500 font-bold';
    case 'info':
    default:
      return 'text-slate-300';
  }
}

export default function GameLog({ logs }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-800/50 border border-cyan-900/30 rounded-xl p-3 w-full">
      <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
        Battle Log
      </h3>
      <div
        ref={scrollRef}
        className="h-52 overflow-y-auto space-y-1 text-xs font-mono scrollbar-thin"
      >
        {logs.length === 0 && (
          <p className="text-slate-500 italic">No actions yet...</p>
        )}
        {logs.map((log, i) => (
          <p key={i} className={getLogColor(log.type)}>
            {log.message}
          </p>
        ))}
      </div>
    </div>
  );
}
