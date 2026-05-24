export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export interface Ship {
  name: string;
  length: number;
  coords: [number, number][];
  hits: Set<string>;
  sunk: boolean;
}

export type Orientation = 'horizontal' | 'vertical';

export interface PlacementPreview {
  coords: [number, number][];
  valid: boolean;
}

export type GamePhase = 'setup' | 'battle' | 'gameover';

export interface LogEntry {
  message: string;
  type: 'hit' | 'miss' | 'sunk' | 'info' | 'win' | 'loss';
}

export interface AIState {
  mode: 'hunt' | 'target';
  targetQueue: [number, number][];
  hitStack: [number, number][];
}

export const FLEET = [
  { name: 'Carrier', length: 5 },
  { name: 'Battleship', length: 4 },
  { name: 'Destroyer', length: 3 },
  { name: 'Submarine', length: 3 },
  { name: 'Patrol Boat', length: 2 },
] as const;

export const GRID_SIZE = 10;
export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
