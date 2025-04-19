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
  timeRemaining?: number; // Time remaining in seconds
}

// Update ScoringRule to include new rule types
export type ScoringRule = 'chinese' | 'japanese' | 'korean' | 'aga' | 'ing';

// Add GameType for different game modes
export type GameType = 'even' | 'handicap' | 'blitz' | 'teaching' | 'rengo';

export interface Territory {
  position: Position;
  owner: StoneColor;
}

// Add new type for color preference
export type ColorPreference = 'black' | 'white' | 'random';

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
  scoringRule: ScoringRule; // Selected scoring rule (Chinese or Japanese)
  gameType?: GameType; // Type of game being played
  timePerMove?: number; // Time per move in seconds
  lastMoveTime?: number; // Timestamp of last move
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
  komi: number;
  handicap: number;
}

export type GameMove = Position | { pass: true };

export interface GameOptions {
  boardSize: number;
  timeControl: number; // minutes per player
  timePerMove?: number; // seconds per move
  handicap: number;
  scoringRule: ScoringRule; // Scoring rule to use for the game
  gameType?: GameType; // Type of game to be played
  colorPreference?: ColorPreference; // Owner's preferred color
  // Additional options for specific game types
  isTeachingMode?: boolean; // For teaching games - allows comments and variations
  teamPlayers?: string[]; // For Rengo games - list of team member IDs
} 