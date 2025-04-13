export type StoneColor = 'black' | 'white' | null;

export interface Position {
  x: number;
  y: number;
}

export interface Stone {
  position: Position;
  color: StoneColor;
}

export interface Board {
  size: number;
  stones: Stone[];
}

export interface Player {
  id: string;
  username: string;
  color: StoneColor;
}

export interface GameState {
  id: string;
  code: string; // Short, shareable game code
  board: Board;
  players: Player[];
  currentTurn: StoneColor;
  capturedStones: {
    black: number;
    white: number;
  };
  history: GameMove[];
  status: 'waiting' | 'playing' | 'finished' | 'scoring';
  winner: StoneColor | null;
  deadStones?: Position[]; // Stones marked as dead during scoring
  score?: {
    black: number;
    white: number;
  };
  undoRequest?: {
    requestedBy: string; // Player ID who requested undo
    moveIndex: number;   // Index in history to undo to
  };
}

export type GameMove = Position | { pass: true };

export interface GameOptions {
  boardSize: number;
  timeControl: number; // minutes per player
  handicap: number;
} 