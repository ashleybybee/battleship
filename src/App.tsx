import { useState, useCallback, useEffect } from 'react';
import type {
  CellState,
  Ship,
  Orientation,
  PlacementPreview,
  GamePhase,
  LogEntry,
  AIState,
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

function coordToLabel(row: number, col: number): string {
  return `${ROW_LABELS[row]}${col + 1}`;
}

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

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    setLogs((prev) => [...prev, { message, type }]);
  }, []);

  const currentShipDef =
    currentShipIdx < FLEET.length ? FLEET[currentShipIdx] : null;

  // Setup: hover preview
  const handleSetupHover = useCallback(
    (row: number, col: number) => {
      if (!currentShipDef) return;
      const coords = getShipCoords(
        row,
        col,
        currentShipDef.length,
        orientation
      );
      const valid = canPlaceShip(
        playerGrid,
        row,
        col,
        currentShipDef.length,
        orientation
      );
      const clampedCoords = coords.filter(
        ([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE
      );
      setPreview({ coords: clampedCoords, valid });
    },
    [currentShipDef, orientation, playerGrid]
  );

  // Setup: place ship (click-to-select, click-to-place)
  const handleSetupClick = useCallback(
    (row: number, col: number) => {
      if (!currentShipDef) return;
      if (
        !canPlaceShip(
          playerGrid,
          row,
          col,
          currentShipDef.length,
          orientation
        )
      )
        return;

      const coords = getShipCoords(
        row,
        col,
        currentShipDef.length,
        orientation
      );
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
    addLog('Fleet randomly placed! Click "Start Battle" to begin.', 'info');
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
    addLog('Battle begins! Fire at the enemy grid.', 'info');
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
        addLog(`You fired at ${label} - Hit! You sank the ${result.sunkShipName}!`, 'sunk');
      } else if (result.result === 'hit') {
        addLog(`You fired at ${label} - Hit!`, 'hit');
      } else {
        addLog(`You fired at ${label} - Miss!`, 'miss');
      }

      if (allShipsSunk(result.ships)) {
        addLog('You sank all enemy ships! Victory!', 'win');
        setWinner('player');
        setPhase('gameover');
        return;
      }

      setIsPlayerTurn(false);
    },
    [isPlayerTurn, phase, aiGrid, aiShips, addLog]
  );

  // AI turn effect
  useEffect(() => {
    if (isPlayerTurn || phase !== 'battle') return;

    const timer = setTimeout(() => {
      const aiResult = aiTurn(playerGrid, playerShips, aiStateVal);

      const aiLabel = coordToLabel(aiResult.row, aiResult.col);
      if (aiResult.result === 'sunk') {
        addLog(
          `AI fired at ${aiLabel} - Hit! AI sank your ${aiResult.sunkShipName}!`,
          'sunk'
        );
      } else if (aiResult.result === 'hit') {
        addLog(`AI fired at ${aiLabel} - Hit!`, 'hit');
      } else {
        addLog(`AI fired at ${aiLabel} - Miss!`, 'miss');
      }

      setPlayerGrid(aiResult.grid);
      setPlayerShips(aiResult.ships);
      setAiState(aiResult.aiState);

      if (allShipsSunk(aiResult.ships)) {
        addLog('The AI sank all your ships! Defeat!', 'loss');
        setWinner('ai');
        setPhase('gameover');
        return;
      }

      setIsPlayerTurn(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, phase, playerGrid, playerShips, aiStateVal, addLog]);

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
  }, []);

  const allPlaced = currentShipIdx >= FLEET.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-cyan-900/30 py-3 sm:py-4">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-cyan-400">⚓</span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Battleship
            </span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            {phase === 'battle' && (
              <span
                className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border ${
                  isPlayerTurn
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                }`}
              >
                {isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}
              </span>
            )}
            {phase === 'setup' && (
              <span className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Setup Phase
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Setup controls */}
        {phase === 'setup' && (
          <div className="mb-4 sm:mb-6 bg-slate-800/50 border border-cyan-900/30 rounded-xl p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
            {!allPlaced && currentShipDef && (
              <>
                <span className="text-xs sm:text-sm text-slate-300 w-full sm:w-auto">
                  Place your{' '}
                  <strong className="text-cyan-300">
                    {currentShipDef.name}
                  </strong>{' '}
                  ({currentShipDef.length} spaces)
                </span>
                <button
                  onClick={() =>
                    setOrientation((o) =>
                      o === 'horizontal' ? 'vertical' : 'horizontal'
                    )
                  }
                  className="px-3 py-1.5 text-xs sm:text-sm bg-slate-700/80 hover:bg-slate-600 active:bg-slate-500 rounded-lg border border-slate-500/50 transition-colors touch-manipulation"
                >
                  {orientation === 'horizontal' ? '↔ Horizontal' : '↕ Vertical'}
                </button>
              </>
            )}
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 text-xs sm:text-sm bg-purple-600/80 hover:bg-purple-500 active:bg-purple-400 rounded-lg transition-colors touch-manipulation"
            >
              🎲 Randomize
            </button>
            <button
              onClick={handleResetPlacement}
              className="px-3 py-1.5 text-xs sm:text-sm bg-slate-700/80 hover:bg-slate-600 active:bg-slate-500 rounded-lg border border-slate-500/50 transition-colors touch-manipulation"
            >
              ↺ Reset
            </button>
            {allPlaced && (
              <button
                onClick={handleStartBattle}
                className="px-4 sm:px-5 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-900/30 touch-manipulation"
              >
                ⚔ Start Battle
              </button>
            )}
          </div>
        )}

        {/* Dashboard layout: column on mobile, row on lg */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
          {/* Grids: stack on mobile, side-by-side on md */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full lg:flex-1 lg:min-w-0">
            {/* Player grid */}
            <div className="flex flex-col items-center">
              <div className="bg-slate-800/40 border border-cyan-900/30 rounded-xl p-3 sm:p-4 w-full max-w-[430px]">
                <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
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
              </div>
            </div>

            {/* Enemy grid */}
            {(phase === 'battle' || phase === 'gameover') && (
              <div className="flex flex-col items-center">
                <div className="bg-slate-800/40 border border-red-900/20 rounded-xl p-3 sm:p-4 w-full max-w-[430px]">
                  <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Enemy Waters
                  </h2>
                  <Grid
                    grid={aiGrid}
                    isEnemy={true}
                    onCellClick={handlePlayerFire}
                    disabled={!isPlayerTurn || phase === 'gameover'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Side panel: full-width on mobile, fixed-width on lg */}
          <div className="w-full lg:w-72 lg:shrink-0 space-y-4">
            {/* Fleet status: row on mobile, column on lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {playerShips.length > 0 && (
                <FleetStatus ships={playerShips} label="Your Ships" />
              )}
              {aiShips.length > 0 && (
                <FleetStatus ships={aiShips} label="Enemy Ships" isEnemy />
              )}
            </div>

            {/* Legend */}
            <div className="bg-slate-800/50 border border-cyan-900/30 rounded-xl p-3">
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Legend
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 shrink-0 rounded bg-slate-800/80 border border-cyan-900/40" />
                  <span className="text-slate-400">Ocean</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 shrink-0 rounded bg-blue-600/70 border border-blue-500/50" />
                  <span className="text-slate-400">Ship</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 shrink-0 rounded bg-red-600/80 border border-red-500/50 flex items-center justify-center text-[8px]">🔥</span>
                  <span className="text-slate-400">Hit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 shrink-0 rounded bg-slate-500/50 border border-slate-400/30 flex items-center justify-center text-[8px] text-slate-300">•</span>
                  <span className="text-slate-400">Miss</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 shrink-0 rounded bg-red-900/80 border border-red-700/50 flex items-center justify-center text-[8px] text-red-300">✕</span>
                  <span className="text-slate-400">Sunk</span>
                </div>
              </div>
            </div>

            {/* Battle log */}
            <GameLog logs={logs} />
          </div>
        </div>
      </main>

      {/* Game over modal */}
      {phase === 'gameover' && winner && (
        <GameOverModal winner={winner} onRestart={handleRestart} />
      )}
    </div>
  );
}
