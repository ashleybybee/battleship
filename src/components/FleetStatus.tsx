import type { Ship } from '../types';

interface FleetStatusProps {
  ships: Ship[];
  label: string;
}

export default function FleetStatus({ ships, label }: FleetStatusProps) {
  return (
    <div className="bg-slate-800/50 border border-cyan-900/30 rounded-xl p-3">
      <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
        {label}
      </h3>
      <div className="space-y-1.5">
        {ships.map((ship) => (
          <div key={ship.name} className="flex items-center gap-2 text-sm">
            <span
              className={`font-medium ${ship.sunk ? 'text-red-500 line-through' : 'text-slate-200'}`}
            >
              {ship.name}
            </span>
            <div className="flex gap-0.5 ml-auto">
              {Array.from({ length: ship.length }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    ship.sunk
                      ? 'bg-red-900/80'
                      : i < ship.hits.size
                        ? 'bg-red-500'
                        : 'bg-blue-500/80'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
