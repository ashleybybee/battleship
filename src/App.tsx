import { useState, useCallback } from 'react';
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
  const [, setAiState] = useState<AIState>(createAIState);
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
      // Only include coords within grid bounds for preview
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

      // AI turn after a short delay
      setTimeout(() => {
        setPlayerGrid((prevPlayerGrid) => {
          setPlayerShips((prevPlayerShips) => {
            setAiState((prevAiState) => {
              const aiResult = aiTurn(
                prevPlayerGrid,
                prevPlayerShips,
                prevAiState
              );

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

              if (allShipsSunk(aiResult.ships)) {
                addLog('The AI sank all your ships! Defeat!', 'loss');
                setWinner('ai');
                setPhase('gameover');
              }

              // Use the callback return to update states
              setPlayerGrid(aiResult.grid);
              setPlayerShips(aiResult.ships);
              setAiState(aiResult.aiState);
              setIsPlayerTurn(true);

              return prevAiState; // Return is unused; we set above
            });
            return prevPlayerShips; // Return is unused; we set above
          });
          return prevPlayerGrid; // Return is unused; we set above
        });
      }, 600);
    },
    [isPlayerTurn, phase, aiGrid, aiShips, addLog]
  );

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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-blue-400">⚓</span> Battleship
          </h1>
          <div className="flex items-center gap-3">
            {phase === 'battle' && (
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  isPlayerTurn
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-red-600/20 text-red-400'
                }`}
              >
                {isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}
              </span>
            )}
            {phase === 'setup' && (
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-yellow-600/20 text-yellow-400">
                Setup Phase
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Setup controls */}
        {phase === 'setup' && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {!allPlaced && currentShipDef && (
              <>
                <span className="text-sm text-slate-300">
                  Place your{' '}
                  <strong className="text-white">
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
                  className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md border border-slate-500 transition-colors"
                >
                  {orientation === 'horizontal' ? '↔ Horizontal' : '↕ Vertical'}
                </button>
              </>
            )}
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 text-sm bg-purple-700 hover:bg-purple-600 rounded-md transition-colors"
            >
              🎲 Randomize
            </button>
            <button
              onClick={handleResetPlacement}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md border border-slate-500 transition-colors"
            >
              ↺ Reset
            </button>
            {allPlaced && (
              <button
                onClick={handleStartBattle}
                className="px-4 py-2 text-sm bg-green-700 hover:bg-green-600 rounded-md font-semibold transition-colors"
              >
                ⚔ Start Battle
              </button>
            )}
          </div>
        )}

        {/* Grid area */}
        <div className="flex flex-wrap gap-8 justify-center">
          {/* Player grid */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-blue-400">
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
              <div className="mt-3">
                <FleetStatus ships={playerShips} label="Your Ships" />
              </div>
            )}
          </div>

          {/* Enemy grid (only in battle/gameover) */}
          {(phase === 'battle' || phase === 'gameover') && (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-red-400">
                Enemy Waters
              </h2>
              <Grid
                grid={aiGrid}
                isEnemy={true}
                onCellClick={handlePlayerFire}
                disabled={!isPlayerTurn || phase === 'gameover'}
              />
              {aiShips.length > 0 && (
                <div className="mt-3">
                  <FleetStatus ships={aiShips} label="Enemy Ships" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Log panel */}
        <div className="mt-6 max-w-2xl mx-auto">
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
