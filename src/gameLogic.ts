import type { CellState, Ship, Orientation } from './types';
import { GRID_SIZE, FLEET } from './types';

export function createEmptyGrid(): CellState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'empty' as CellState)
  );
}

export function canPlaceShip(
  grid: CellState[][],
  row: number,
  col: number,
  length: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < length; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r][c] === 'ship') return false;
  }
  return true;
}

export function getShipCoords(
  row: number,
  col: number,
  length: number,
  orientation: Orientation
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i < length; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    coords.push([r, c]);
  }
  return coords;
}

export function placeShipOnGrid(
  grid: CellState[][],
  coords: [number, number][]
): CellState[][] {
  const newGrid = grid.map((row) => [...row]);
  for (const [r, c] of coords) {
    newGrid[r][c] = 'ship';
  }
  return newGrid;
}

export function randomPlacement(): { grid: CellState[][]; ships: Ship[] } {
  let grid = createEmptyGrid();
  const ships: Ship[] = [];

  for (const def of FLEET) {
    let placed = false;
    while (!placed) {
      const orientation: Orientation =
        Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? GRID_SIZE - def.length : GRID_SIZE - 1;
      const maxCol = orientation === 'horizontal' ? GRID_SIZE - def.length : GRID_SIZE - 1;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      if (canPlaceShip(grid, row, col, def.length, orientation)) {
        const coords = getShipCoords(row, col, def.length, orientation);
        grid = placeShipOnGrid(grid, coords);
        ships.push({
          name: def.name,
          length: def.length,
          coords,
          hits: new Set(),
          sunk: false,
        });
        placed = true;
      }
    }
  }

  return { grid, ships };
}

export function processShot(
  grid: CellState[][],
  ships: Ship[],
  row: number,
  col: number
): {
  grid: CellState[][];
  ships: Ship[];
  result: 'hit' | 'miss' | 'sunk';
  sunkShipName?: string;
} {
  const newGrid = grid.map((r) => [...r]);
  const newShips = ships.map((s) => ({
    ...s,
    hits: new Set(s.hits),
  }));

  if (newGrid[row][col] === 'hit' || newGrid[row][col] === 'miss' || newGrid[row][col] === 'sunk') {
    return { grid: newGrid, ships: newShips, result: 'miss' };
  }

  const key = `${row},${col}`;

  if (newGrid[row][col] === 'ship') {
    newGrid[row][col] = 'hit';
    for (const ship of newShips) {
      const isPartOfShip = ship.coords.some(([r, c]) => r === row && c === col);
      if (isPartOfShip) {
        ship.hits.add(key);
        if (ship.hits.size === ship.length) {
          ship.sunk = true;
          for (const [r, c] of ship.coords) {
            newGrid[r][c] = 'sunk';
          }
          return {
            grid: newGrid,
            ships: newShips,
            result: 'sunk',
            sunkShipName: ship.name,
          };
        }
        break;
      }
    }
    return { grid: newGrid, ships: newShips, result: 'hit' };
  } else {
    newGrid[row][col] = 'miss';
    return { grid: newGrid, ships: newShips, result: 'miss' };
  }
}

export function allShipsSunk(ships: Ship[]): boolean {
  return ships.every((s) => s.sunk);
}

export function isValidTarget(grid: CellState[][], row: number, col: number): boolean {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  const cell = grid[row][col];
  return cell === 'empty' || cell === 'ship';
}
