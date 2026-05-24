import type { CellState, Ship, AIState } from './types';
import { GRID_SIZE } from './types';
import { processShot, isValidTarget } from './gameLogic';

export function createAIState(): AIState {
  return {
    mode: 'hunt',
    targetQueue: [],
    hitStack: [],
  };
}

function getAdjacentCells(row: number, col: number): [number, number][] {
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];
}

/**
 * Uses a checkerboard/parity pattern in hunt mode for more efficient searching.
 * Ships of length >= 2 must occupy at least one cell where (row + col) % 2 === 0.
 */
function getHuntTarget(grid: CellState[][]): [number, number] {
  // Prefer parity cells (checkerboard pattern) first
  const parityCells: [number, number][] = [];
  const otherCells: [number, number][] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (isValidTarget(grid, r, c)) {
        if ((r + c) % 2 === 0) {
          parityCells.push([r, c]);
        } else {
          otherCells.push([r, c]);
        }
      }
    }
  }

  const pool = parityCells.length > 0 ? parityCells : otherCells;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function aiTurn(
  grid: CellState[][],
  ships: Ship[],
  aiState: AIState
): {
  grid: CellState[][];
  ships: Ship[];
  aiState: AIState;
  row: number;
  col: number;
  result: 'hit' | 'miss' | 'sunk';
  sunkShipName?: string;
} {
  const newAIState: AIState = {
    mode: aiState.mode,
    targetQueue: [...aiState.targetQueue],
    hitStack: [...aiState.hitStack],
  };

  let targetRow: number | undefined;
  let targetCol: number | undefined;

  // Try to pick from target queue first
  while (newAIState.targetQueue.length > 0) {
    const next = newAIState.targetQueue.shift()!;
    if (isValidTarget(grid, next[0], next[1])) {
      targetRow = next[0];
      targetCol = next[1];
      break;
    }
  }

  // If no valid target from queue, use hunt mode with parity pattern
  if (targetRow === undefined || targetCol === undefined) {
    newAIState.mode = 'hunt';
    const target = getHuntTarget(grid);
    targetRow = target[0];
    targetCol = target[1];
  }

  const shotResult = processShot(grid, ships, targetRow, targetCol);

  if (shotResult.result === 'hit') {
    newAIState.mode = 'target';
    newAIState.hitStack.push([targetRow, targetCol]);
    const adjacent = getAdjacentCells(targetRow, targetCol);
    for (const [ar, ac] of adjacent) {
      if (
        isValidTarget(shotResult.grid, ar, ac) &&
        !newAIState.targetQueue.some(([qr, qc]) => qr === ar && qc === ac)
      ) {
        newAIState.targetQueue.push([ar, ac]);
      }
    }
  } else if (shotResult.result === 'sunk') {
    // Remove hits belonging to the sunk ship from the stack
    const sunkShip = shotResult.ships.find(
      (s) => s.name === shotResult.sunkShipName
    );
    if (sunkShip) {
      const sunkCoordSet = new Set(
        sunkShip.coords.map(([r, c]) => `${r},${c}`)
      );
      newAIState.hitStack = newAIState.hitStack.filter(
        ([r, c]) => !sunkCoordSet.has(`${r},${c}`)
      );
    }
    if (newAIState.hitStack.length === 0) {
      newAIState.mode = 'hunt';
      newAIState.targetQueue = [];
    } else {
      // Rebuild target queue from remaining unsunk hits
      newAIState.targetQueue = [];
      for (const [hr, hc] of newAIState.hitStack) {
        const adjacent = getAdjacentCells(hr, hc);
        for (const [ar, ac] of adjacent) {
          if (
            isValidTarget(shotResult.grid, ar, ac) &&
            !newAIState.targetQueue.some(([qr, qc]) => qr === ar && qc === ac)
          ) {
            newAIState.targetQueue.push([ar, ac]);
          }
        }
      }
    }
  }

  return {
    grid: shotResult.grid,
    ships: shotResult.ships,
    aiState: newAIState,
    row: targetRow,
    col: targetCol,
    result: shotResult.result,
    sunkShipName: shotResult.sunkShipName,
  };
}
