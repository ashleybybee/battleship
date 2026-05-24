import { useState, useCallback, useEffect } from 'react';
import type {
  CellState,
  Ship,
  Orientation,
  PlacementPreview,
  GamePhase,
  LogEntry,
  AIState,
  Notification,
} from './types';
import { FLEET, GRID_SIZE, ROW_LABELS } from './types';
import {
  createEmptyGrid,
  canPlaceShip,
  getShipCoords,
  placeShipOnGrid,
  randomPlacement,
  processShot,
  allShipsSunk,
  isValidTarget,
} from './gameLogic';
import { createAIState, aiTurn } from './aiLogic';
import Grid from './components/Grid';
import GameLog from './components/GameLog';
import FleetStatus from './components/FleetStatus';
import GameOverModal from './components/GameOverModal';
import NotificationToast from './components/Notification';

function coordToLabel(row: number, col: number): string {
  return `${ROW_LABELS[row]}${col + 1}`;
}

let notificationId = 0;

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [playerGrid, setPlayerGrid] = useState<CellState[][]>(createEmptyGrid);
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);
  const [aiGrid, setAiGrid] = useState<CellState[][]>(createEmptyGrid);
  const [aiShips, setAiShips] = useState<Ship[]>([]);
  const [aiStateVal, setAiState] = useState<AIState>(createAIState);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [currentShipIdx, setCurrentShipIdx] = useState(0);
  const [preview, setPreview] = useState<PlacementPreview | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    setLogs((prev) => [...prev, { message, type }]);
  }, []);

  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const id = ++notificationId;
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const currentShipDef =
    currentShipIdx < FLEET.length ? FLEET[currentShipIdx] : null;

  // Setup: hover preview
  const handleSetupHover = useCallback(
    (row: number, col: number) => {
      if (!currentShipDef) return;
      const coords = getShipCoords(row, col, currentShipDef.length, orientation);
      const valid = canPlaceShip(playerGrid, row, col, currentShipDef.length, orientation);
      const clampedCoords = coords.filter(
        ([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE
      );
      setPreview({ coords: clampedCoords, valid });
    },
    [currentShipDef, orientation, playerGrid]
  );

  // Setup: place ship
  const handleSetupClick = useCallback(
    (row: number, col: number) => {
      if (!currentShipDef) return;
      if (!canPlaceShip(playerGrid, row, col, currentShipDef.length, orientation))
        return;

      const coords = getShipCoords(row, col, currentShipDef.length, orientation);
      const newGrid = placeShipOnGrid(playerGrid, coords);
      const newShip: Ship = {
        name: currentShipDef.name,
        length: currentShipDef.length,
        coords,
        hits: new Set(),
        sunk: false,
      };

      setPlayerGrid(newGrid);
      setPlayerShips((prev) => [...prev, newShip]);
      setCurrentShipIdx((prev) => prev + 1);
      setPreview(null);

      if (currentShipIdx + 1 >= FLEET.length) {
        addLog('All ships placed! Click "Start Battle" to begin.', 'info');
      } else {
        addLog(
          `${currentShipDef.name} placed. Now place your ${FLEET[currentShipIdx + 1].name}.`,
          'info'
        );
      }
    },
    [currentShipDef, orientation, playerGrid, currentShipIdx, addLog]
  );

  // Randomize player ships
  const handleRandomize = useCallback(() => {
    const { grid, ships } = randomPlacement();
    setPlayerGrid(grid);
    setPlayerShips(ships);
    setCurrentShipIdx(FLEET.length);
    setPreview(null);
    addLog('Fleet randomly deployed! Click "Start Battle" to begin.', 'info');
  }, [addLog]);

  // Reset placement
  const handleResetPlacement = useCallback(() => {
    setPlayerGrid(createEmptyGrid());
    setPlayerShips([]);
    setCurrentShipIdx(0);
    setPreview(null);
    setLogs([]);
  }, []);

  // Start battle
  const handleStartBattle = useCallback(() => {
    const { grid, ships } = randomPlacement();
    setAiGrid(grid);
    setAiShips(ships);
    setAiState(createAIState());
    setPhase('battle');
    setIsPlayerTurn(true);
    addLog('Battle stations! Fire at the enemy grid.', 'info');
  }, [addLog]);

  // Player fires
  const handlePlayerFire = useCallback(
    (row: number, col: number) => {
      if (!isPlayerTurn || phase !== 'battle') return;
      if (!isValidTarget(aiGrid, row, col)) return;

      const result = processShot(aiGrid, aiShips, row, col);
      setAiGrid(result.grid);
      setAiShips(result.ships);

      const label = coordToLabel(row, col);
      if (result.result === 'sunk') {
        addLog(`You fired at ${label} - Hit! You sank the AI's ${result.sunkShipName}!`, 'sunk');
        addNotification(`You sank the AI's ${result.sunkShipName}!`, 'sunk');
      } else if (result.result === 'hit') {
        addLog(`You fired at ${label} - Hit!`, 'hit');
      } else {
        addLog(`You fired at ${label} - Miss.`, 'miss');
      }

      if (allShipsSunk(result.ships)) {
        addLog('All enemy ships destroyed! Victory!', 'win');
        addNotification('Victory! All enemy ships destroyed!', 'win');
        setWinner('player');
        setPhase('gameover');
        return;
      }

      setIsPlayerTurn(false);
    },
    [isPlayerTurn, phase, aiGrid, aiShips, addLog, addNotification]
  );

  // AI turn effect
  useEffect(() => {
    if (isPlayerTurn || phase !== 'battle') return;

    const timer = setTimeout(() => {
      const aiResult = aiTurn(playerGrid, playerShips, aiStateVal);

      const aiLabel = coordToLabel(aiResult.row, aiResult.col);
      if (aiResult.result === 'sunk') {
        addLog(`AI fired at ${aiLabel} - Hit! AI sank your ${aiResult.sunkShipName}!`, 'sunk');
        addNotification(`AI sank your ${aiResult.sunkShipName}!`, 'sunk');
      } else if (aiResult.result === 'hit') {
        addLog(`AI fired at ${aiLabel} - Hit!`, 'hit');
      } else {
        addLog(`AI fired at ${aiLabel} - Miss.`, 'miss');
      }

      if (allShipsSunk(aiResult.ships)) {
        addLog('The AI destroyed your fleet! Defeat!', 'loss');
        addNotification('Defeat! Your fleet has been destroyed!', 'loss');
        setWinner('ai');
        setPhase('gameover');
      }

      setPlayerGrid(aiResult.grid);
      setPlayerShips(aiResult.ships);
      setAiState(aiResult.aiState);
      setIsPlayerTurn(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, phase, playerGrid, playerShips, aiStateVal, addLog, addNotification]);

  // Restart game
  const handleRestart = useCallback(() => {
    setPhase('setup');
    setPlayerGrid(createEmptyGrid());
    setPlayerShips([]);
    setAiGrid(createEmptyGrid());
    setAiShips([]);
    setAiState(createAIState());
    setOrientation('horizontal');
    setCurrentShipIdx(0);
    setPreview(null);
    setLogs([]);
    setWinner(null);
    setIsPlayerTurn(true);
    setNotifications([]);
  }, []);

  const allPlaced = currentShipIdx >= FLEET.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onDismiss={dismissNotification}
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-blue-400">&#x2693;</span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-300">
              Battleship
            </span>
          </h1>
          <div className="flex items-center gap-3">
            {phase === 'battle' && (
              <span
                className={`text-sm font-bold px-4 py-1.5 rounded-full border ${
                  isPlayerTurn
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-600/20 text-red-400 border-red-500/30'
                }`}
              >
                {isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}
              </span>
            )}
            {phase === 'setup' && (
              <span className="text-sm font-bold px-4 py-1.5 rounded-full bg-amber-600/20 text-amber-400 border border-amber-500/30">
                Deploy Fleet
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Setup controls */}
        {phase === 'setup' && (
          <div className="mb-6 flex flex-wrap items-center gap-3 bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
            {!allPlaced && currentShipDef && (
              <>
                <span className="text-sm text-slate-300">
                  Place your{' '}
                  <strong className="text-white">{currentShipDef.name}</strong>{' '}
                  <span className="text-slate-400">({currentShipDef.length} spaces)</span>
                </span>
                <button
                  onClick={() =>
                    setOrientation((o) =>
                      o === 'horizontal' ? 'vertical' : 'horizontal'
                    )
                  }
                  className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-500/50 transition-all hover:scale-105 active:scale-95 font-medium"
                >
                  {orientation === 'horizontal' ? '\u2194 Horizontal' : '\u2195 Vertical'}
                </button>
              </>
            )}
            <button
              onClick={handleRandomize}
              className="px-4 py-2 text-sm bg-purple-700/80 hover:bg-purple-600 rounded-lg transition-all hover:scale-105 active:scale-95 font-medium"
            >
              {"\u{1F3B2}"} Randomize
            </button>
            <button
              onClick={handleResetPlacement}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-500/50 transition-all hover:scale-105 active:scale-95 font-medium"
            >
              {"\u21BA"} Reset
            </button>
            {allPlaced && (
              <button
                onClick={handleStartBattle}
                className="px-5 py-2.5 text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/30"
              >
                {"\u2694"} Start Battle
              </button>
            )}
          </div>
        )}

        {/* Grid area */}
        <div className="flex flex-wrap gap-6 lg:gap-10 justify-center items-start">
          {/* Player grid */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold mb-3 text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              Your Fleet
            </h2>
            <Grid
              grid={playerGrid}
              isEnemy={false}
              preview={phase === 'setup' ? preview : null}
              onCellClick={phase === 'setup' ? handleSetupClick : undefined}
              onCellHover={phase === 'setup' ? handleSetupHover : undefined}
              onMouseLeave={() => setPreview(null)}
              disabled={phase !== 'setup'}
            />
            {playerShips.length > 0 && (
              <div className="mt-3 w-full">
                <FleetStatus ships={playerShips} label="Your Ships" />
              </div>
            )}
          </div>

          {/* Enemy grid (only in battle/gameover) */}
          {(phase === 'battle' || phase === 'gameover') && (
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-bold mb-3 text-red-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full" />
                Enemy Waters
              </h2>
              <Grid
                grid={aiGrid}
                isEnemy={true}
                onCellClick={handlePlayerFire}
                disabled={!isPlayerTurn || phase === 'gameover'}
              />
              <div className="mt-3 w-full">
                <FleetStatus ships={aiShips} label="Enemy Fleet" hideUnsunk />
              </div>
            </div>
          )}
        </div>

        {/* Log panel */}
        <div className="mt-8 max-w-2xl mx-auto">
          <GameLog logs={logs} />
        </div>
      </main>

      {/* Game over modal */}
      {phase === 'gameover' && winner && (
        <GameOverModal winner={winner} onRestart={handleRestart} />
      )}
    </div>
  );
}
