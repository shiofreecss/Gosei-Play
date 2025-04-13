import { Board, Position, Stone, StoneColor, GameState, GameMove } from '../types/go';

// Check if a position is within the board boundaries
export const isWithinBounds = (position: Position, boardSize: number): boolean => {
  const { x, y } = position;
  return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
};

// Get adjacent positions (up, right, down, left)
export const getAdjacentPositions = (position: Position): Position[] => {
  const { x, y } = position;
  return [
    { x, y: y - 1 }, // up
    { x: x + 1, y }, // right
    { x, y: y + 1 }, // down
    { x: x - 1, y }, // left
  ];
};

// Get a stone at a specific position on the board
export const getStoneAt = (board: Board, position: Position): Stone | null => {
  return (
    board.stones.find(
      (stone) => stone.position.x === position.x && stone.position.y === position.y
    ) || null
  );
};

// Check if a group of stones has any liberties (empty adjacent intersections)
export const hasLiberties = (
  board: Board,
  position: Position,
  checkedPositions: Set<string> = new Set()
): boolean => {
  if (!isWithinBounds(position, board.size)) return false;
  
  const posKey = `${position.x},${position.y}`;
  if (checkedPositions.has(posKey)) return false;
  
  checkedPositions.add(posKey);
  
  const stone = getStoneAt(board, position);
  if (!stone) return true; // Empty intersection = liberty
  
  // Check adjacent positions
  const adjacentPositions = getAdjacentPositions(position);
  
  for (const adjPos of adjacentPositions) {
    if (!isWithinBounds(adjPos, board.size)) continue;
    
    const adjStone = getStoneAt(board, adjPos);
    
    // Empty adjacent position = liberty
    if (!adjStone) return true;
    
    // Adjacent stone is same color, check if that group has liberties
    if (adjStone.color === stone.color) {
      const adjPosKey = `${adjPos.x},${adjPos.y}`;
      if (!checkedPositions.has(adjPosKey)) {
        if (hasLiberties(board, adjPos, checkedPositions)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Find all stones in a group connected to the stone at the given position
export const findConnectedGroup = (
  board: Board,
  position: Position,
  color: StoneColor,
  group: Position[] = [],
  visited: Set<string> = new Set()
): Position[] => {
  if (!isWithinBounds(position, board.size)) return group;
  
  const posKey = `${position.x},${position.y}`;
  if (visited.has(posKey)) return group;
  
  visited.add(posKey);
  
  const stone = getStoneAt(board, position);
  if (!stone || stone.color !== color) return group;
  
  group.push(position);
  
  // Check adjacent positions
  const adjacentPositions = getAdjacentPositions(position);
  
  for (const adjPos of adjacentPositions) {
    findConnectedGroup(board, adjPos, color, group, visited);
  }
  
  return group;
};

// Find stones that would be captured by a move
export const findCapturedStones = (
  board: Board,
  position: Position,
  color: StoneColor
): Position[] => {
  const oppositeColor: StoneColor = color === 'black' ? 'white' : 'black';
  const capturedStones: Position[] = [];
  
  // Check adjacent positions for opponent stones
  const adjacentPositions = getAdjacentPositions(position);
  
  for (const adjPos of adjacentPositions) {
    if (!isWithinBounds(adjPos, board.size)) continue;
    
    const adjStone = getStoneAt(board, adjPos);
    if (!adjStone || adjStone.color !== oppositeColor) continue;
    
    // Find group connected to this stone
    const group = findConnectedGroup(board, adjPos, oppositeColor);
    
    // Check if this group has liberties other than the position we're placing
    const hasOtherLiberties = group.some(groupPos => {
      const adjacentToGroupPos = getAdjacentPositions(groupPos);
      return adjacentToGroupPos.some(p => {
        if (p.x === position.x && p.y === position.y) return false;
        if (!isWithinBounds(p, board.size)) return false;
        return !getStoneAt(board, p);
      });
    });
    
    if (!hasOtherLiberties) {
      capturedStones.push(...group);
    }
  }
  
  return capturedStones;
};

// Check if a move would be suicidal (self-capture without capturing opponent stones)
export const isSuicidalMove = (
  board: Board,
  position: Position,
  color: StoneColor
): boolean => {
  // If we capture opponent stones, it's not suicidal
  const capturedStones = findCapturedStones(board, position, color);
  if (capturedStones.length > 0) return false;
  
  // Create a temporary board with the new stone added
  const tempBoard: Board = {
    ...board,
    stones: [
      ...board.stones,
      { position, color },
    ],
  };
  
  // Check if the group containing our new stone has liberties
  return !hasLiberties(tempBoard, position);
};

// Check if a position has a stone of a specific color
export const hasStoneOfColor = (position: Position, stones: Stone[], color: StoneColor): boolean => {
  return stones.some(
    stone => stone.position.x === position.x && stone.position.y === position.y && stone.color === color
  );
};

// Check if a position is empty (no stone)
export const isEmpty = (position: Position, stones: Stone[]): boolean => {
  return !stones.some(
    stone => stone.position.x === position.x && stone.position.y === position.y
  );
};

// Find a stone at a position, if any
export const findStoneAt = (position: Position, stones: Stone[]): Stone | undefined => {
  return stones.find(
    stone => stone.position.x === position.x && stone.position.y === position.y
  );
};

// Get positions of all stones in a group connected to the stone at the given position
export const getConnectedGroup = (position: Position, stones: Stone[], boardSize: number): Position[] => {
  const stone = findStoneAt(position, stones);
  if (!stone) return [];
  
  const color = stone.color;
  const visited = new Set<string>();
  const group: Position[] = [];
  
  const visit = (pos: Position) => {
    const key = `${pos.x},${pos.y}`;
    if (visited.has(key)) return;
    
    visited.add(key);
    
    const stoneAtPos = findStoneAt(pos, stones);
    if (!stoneAtPos || stoneAtPos.color !== color) return;
    
    group.push(pos);
    
    // Visit adjacent positions
    const adjacentPositions = getAdjacentPositions(pos).filter(p => isWithinBounds(p, boardSize));
    adjacentPositions.forEach(visit);
  };
  
  visit(position);
  return group;
};

// Count liberties (empty adjacent points) for a group of stones
export const countLiberties = (group: Position[], stones: Stone[], boardSize: number): number => {
  const liberties = new Set<string>();
  
  group.forEach(position => {
    const adjacentPositions = getAdjacentPositions(position).filter(p => isWithinBounds(p, boardSize));
    
    adjacentPositions.forEach(adjPos => {
      if (isEmpty(adjPos, stones)) {
        liberties.add(`${adjPos.x},${adjPos.y}`);
      }
    });
  });
  
  return liberties.size;
};

// Check if a move would be suicidal
export const isSuicideMove = (position: Position, color: StoneColor, gameState: GameState): boolean => {
  const { board } = gameState;
  const { stones, size } = board;
  
  // Temporarily add the stone
  const updatedStones = [...stones, { position, color }];
  
  // Get the group of the newly placed stone
  const group = getConnectedGroup(position, updatedStones, size);
  
  // Check liberties for the newly formed group
  const liberties = countLiberties(group, updatedStones, size);
  
  // If this move has no liberties, check if it captures any opponent groups
  if (liberties === 0) {
    const oppositeColor = color === 'black' ? 'white' : 'black';
    
    // Check if any adjacent enemy stones would be captured
    const adjacentPositions = getAdjacentPositions(position).filter(p => isWithinBounds(p, size));
    
    for (const adjPos of adjacentPositions) {
      const stoneAtPos = findStoneAt(adjPos, stones);
      if (stoneAtPos && stoneAtPos.color === oppositeColor) {
        const enemyGroup = getConnectedGroup(adjPos, updatedStones, size);
        const enemyLiberties = countLiberties(enemyGroup, updatedStones, size);
        
        // If placing this stone would capture an enemy group, it's not a suicide move
        if (enemyLiberties === 0) {
          return false;
        }
      }
    }
    
    // The move has no liberties and doesn't capture any enemy stones, so it's a suicide move
    return true;
  }
  
  // The move has liberties, so it's not a suicide move
  return false;
};

// Check for ko rule violation
export const isKoViolation = (position: Position, color: StoneColor, gameState: GameState): boolean => {
  // Ko rule applies when capturing exactly one stone that just captured exactly one stone
  
  // If the move history is empty or has only one move, ko rule cannot be violated
  if (gameState.history.length < 2) return false;
  
  // Get the most recent move
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastMove = gameState.history[gameState.history.length - 1];
  
  // Check if the current move is at the same position as the second-to-last move
  // This is a simplification of the ko rule check
  if (gameState.history.length >= 3) {
    const twoMovesAgo = gameState.history[gameState.history.length - 3];
    
    // Check if twoMovesAgo is a position (not a pass)
    if (!isPassMove(twoMovesAgo) && 'x' in twoMovesAgo && 'y' in twoMovesAgo) {
      if (position.x === twoMovesAgo.x && position.y === twoMovesAgo.y) {
        // Check if the last move captured exactly one stone
        // For a complete implementation, we would need to track captured stones per move
        const captureCount = 1; // Would need proper implementation
        if (captureCount === 1) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Capture stones that have no liberties after a move
export const captureDeadStones = (gameState: GameState, lastMovePosition: Position): { 
  updatedStones: Stone[], 
  capturedCount: number 
} => {
  const { board } = gameState;
  const { stones, size } = board;
  
  // Find the stone just placed
  const lastStone = findStoneAt(lastMovePosition, stones);
  if (!lastStone) {
    console.log("No stone found at the last move position");
    return { updatedStones: stones, capturedCount: 0 };
  }
  
  const oppositeColor = lastStone.color === 'black' ? 'white' : 'black';
  
  // Check all adjacent positions for opponent stones
  const adjacentPositions = getAdjacentPositions(lastMovePosition).filter(p => isWithinBounds(p, size));
  console.log(`Checking ${adjacentPositions.length} adjacent positions for captures`);
  
  let capturedCount = 0;
  let remainingStones = [...stones];
  let capturedPositions: Position[] = [];
  
  // Check each adjacent position for enemy groups that might be captured
  adjacentPositions.forEach(adjPos => {
    const stoneAtPos = findStoneAt(adjPos, remainingStones);
    
    // If there's an opponent's stone at this position
    if (stoneAtPos && stoneAtPos.color === oppositeColor) {
      console.log(`Found opponent ${oppositeColor} stone at (${adjPos.x}, ${adjPos.y})`);
      
      // Get the entire connected group
      const group = getConnectedGroup(adjPos, remainingStones, size);
      console.log(`Group has ${group.length} stones`);
      
      // Check if this group has any liberties
      const liberties = countLiberties(group, remainingStones, size);
      console.log(`Group has ${liberties} liberties`);
      
      // If the group has no liberties, remove all stones in the group
      if (liberties === 0) {
        console.log(`Capturing group of ${group.length} ${oppositeColor} stones`);
        
        // Store the captured positions for later rendering
        capturedPositions = [...capturedPositions, ...group];
        
        // Remove captured stones
        const beforeCount = remainingStones.length;
        remainingStones = remainingStones.filter(stone => 
          !group.some(pos => pos.x === stone.position.x && pos.y === stone.position.y)
        );
        const afterCount = remainingStones.length;
        console.log(`Removed ${beforeCount - afterCount} stones from board`);
        
        capturedCount += group.length;
      }
    }
  });
  
  console.log(`Total captured: ${capturedCount} ${oppositeColor} stones at positions:`, capturedPositions);
  
  return { updatedStones: remainingStones, capturedCount };
};

// Helper function to check if a move is a pass
function isPassMove(move: GameMove): move is { pass: true } {
  return typeof move === 'object' && 'pass' in move;
}

// Apply all Go rules to validate and process a move
export const applyGoRules = (
  position: Position, 
  color: StoneColor, 
  gameState: GameState
): { 
  valid: boolean, 
  updatedGameState?: GameState,
  error?: string
} => {
  // Check basic move validity
  if (!isWithinBounds(position, gameState.board.size)) {
    return { valid: false, error: 'Position is outside the board' };
  }
  
  // Check if position is already occupied
  if (!isEmpty(position, gameState.board.stones)) {
    return { valid: false, error: 'Position is already occupied' };
  }
  
  // Check for ko rule violation
  if (isKoViolation(position, color, gameState)) {
    return { valid: false, error: 'Ko rule violation' };
  }
  
  // Check for suicide move
  if (isSuicideMove(position, color, gameState)) {
    return { valid: false, error: 'Suicide move is not allowed' };
  }
  
  // Add the new stone
  const updatedStones = [...gameState.board.stones, { position, color }];
  
  // Capture any dead stones
  const { updatedStones: afterCaptureStones, capturedCount } = 
    captureDeadStones({ ...gameState, board: { ...gameState.board, stones: updatedStones } }, position);
  
  // Update captured stones count
  const updatedCapturedStones = { ...gameState.capturedStones };
  if (color === 'black' || color === 'white') {
    updatedCapturedStones[color] += capturedCount;
  }
  
  // Update the game state
  const updatedGameState: GameState = {
    ...gameState,
    board: {
      ...gameState.board,
      stones: afterCaptureStones
    },
    capturedStones: updatedCapturedStones,
    currentTurn: color === 'black' ? 'white' : 'black',
    history: [...gameState.history, position],
  };
  
  return { valid: true, updatedGameState };
}; 