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
      return 'text-green-400 font-bold';
    case 'loss':
      return 'text-red-500 font-bold';
    case 'info':
    default:
      return 'text-slate-300';
  }
}

function getLogIcon(type: LogEntry['type']): string {
  switch (type) {
    case 'hit':
      return '\u{1F4A5}';
    case 'miss':
      return '\u{1F30A}';
    case 'sunk':
      return '\u{1F6A2}';
    case 'win':
      return '\u{1F3C6}';
    case 'loss':
      return '\u{1F480}';
    case 'info':
    default:
      return '\u{2139}\u{FE0F}';
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
    <div className="bg-slate-800/80 border border-slate-600/40 rounded-lg backdrop-blur-sm flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Combat Log
        </h3>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 text-sm font-mono min-h-[12rem] max-h-[32rem] scrollbar-thin scrollbar-thumb-slate-600"
      >
        {logs.length === 0 && (
          <p className="text-slate-500 italic text-center py-4">
            No actions yet...
          </p>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            className={`${getLogColor(log.type)} leading-relaxed flex items-start gap-2 py-0.5`}
          >
            <span className="text-xs shrink-0 mt-0.5">{getLogIcon(log.type)}</span>
            <span className="flex-1">
              <span className="text-slate-600 mr-1.5 text-xs">
                {String(i + 1).padStart(2, '0')}
              </span>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
