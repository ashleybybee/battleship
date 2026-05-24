import type { Ship } from '../types';

interface FleetStatusProps {
  ships: Ship[];
  label: string;
  hideUnsunk?: boolean;
}

export default function FleetStatus({ ships, label, hideUnsunk }: FleetStatusProps) {
  return (
    <div className="bg-slate-800/80 border border-slate-600/40 rounded-lg p-3 backdrop-blur-sm">
      <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
        {label}
      </h3>
      <div className="space-y-1.5">
        {ships.map((ship) => (
          <div key={ship.name} className="flex items-center gap-2 text-sm">
            <span
              className={`font-medium flex-shrink-0 ${
                ship.sunk
                  ? 'text-red-500 line-through'
                  : 'text-slate-200'
              }`}
            >
              {ship.name}
            </span>
            <div className="flex gap-0.5 ml-auto">
              {Array.from({ length: ship.length }, (_, i) => {
                const isHit = i < ship.hits.size;
                if (hideUnsunk && !ship.sunk && !isHit) {
                  return (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm bg-slate-600"
                    />
                  );
                }
                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm transition-colors ${
                      ship.sunk
                        ? 'bg-red-900'
                        : isHit
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
