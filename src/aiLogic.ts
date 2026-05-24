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

  // Try to pick from target queue (hunt mode after a hit)
  while (newAIState.targetQueue.length > 0) {
    const [r, c] = newAIState.targetQueue.shift()!;
    if (isValidTarget(grid, r, c)) {
      targetRow = r;
      targetCol = c;
      break;
    }
  }

  // If no valid target from queue, pick randomly
  if (targetRow === undefined || targetCol === undefined) {
    newAIState.mode = 'hunt';
    const available: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (isValidTarget(grid, r, c)) {
          available.push([r, c]);
        }
      }
    }
    const idx = Math.floor(Math.random() * available.length);
    [targetRow, targetCol] = available[idx];
  }

  const shotResult = processShot(grid, ships, targetRow!, targetCol!);

  if (shotResult.result === 'hit') {
    newAIState.mode = 'target';
    newAIState.hitStack.push([targetRow!, targetCol!]);
    const adjacent = getAdjacentCells(targetRow!, targetCol!);
    for (const [ar, ac] of adjacent) {
      if (
        isValidTarget(shotResult.grid, ar, ac) &&
        !newAIState.targetQueue.some(([qr, qc]) => qr === ar && qc === ac)
      ) {
        newAIState.targetQueue.push([ar, ac]);
      }
    }
  } else if (shotResult.result === 'sunk') {
    // Remove targets related to the sunk ship
    const sunkShip = shotResult.ships.find((s) => s.name === shotResult.sunkShipName);
    if (sunkShip) {
      const sunkCoordSet = new Set(sunkShip.coords.map(([r, c]) => `${r},${c}`));
      newAIState.hitStack = newAIState.hitStack.filter(
        ([r, c]) => !sunkCoordSet.has(`${r},${c}`)
      );
    }
    if (newAIState.hitStack.length === 0) {
      newAIState.mode = 'hunt';
      newAIState.targetQueue = [];
    } else {
      // Rebuild target queue from remaining hits
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
    row: targetRow!,
    col: targetCol!,
    result: shotResult.result,
    sunkShipName: shotResult.sunkShipName,
  };
}
