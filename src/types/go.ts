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

export type ScoringRule = 'chinese' | 'japanese';

export interface Territory {
  position: Position;
  owner: StoneColor;
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
  territory?: Territory[]; // Territory ownership for scoring
  scoringRule?: ScoringRule; // Selected scoring rule (Chinese or Japanese)
  score?: {
    black: number;
    white: number;
    blackTerritory?: number; // Number of points from territory
    whiteTerritory?: number; // Number of points from territory
    blackStones?: number; // Number of points from stones (Chinese rules)
    whiteStones?: number; // Number of points from stones (Chinese rules)
    blackCaptures?: number; // Number of points from captures (Japanese rules)
    whiteCaptures?: number; // Number of points from captures (Japanese rules)
    komi?: number; // Komi value
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
  scoringRule: ScoringRule; // Scoring rule to use for the game
} 