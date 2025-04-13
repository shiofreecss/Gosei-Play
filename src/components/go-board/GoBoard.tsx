import React, { useState } from 'react';
import { Board, Position, Stone, StoneColor } from '../../types/go';

interface GoBoardProps {
  board: Board;
  currentTurn: StoneColor;
  onPlaceStone: (position: Position) => void;
  isPlayerTurn: boolean;
  lastMove?: Position;
  isScoring?: boolean;
  deadStones?: Position[];
  onToggleDeadStone?: (position: Position) => void;
}

const GoBoard: React.FC<GoBoardProps> = ({
  board,
  currentTurn,
  onPlaceStone,
  isPlayerTurn,
  lastMove,
  isScoring = false,
  deadStones = [],
  onToggleDeadStone,
}) => {
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null);

  // Get star point positions based on board size
  const getStarPoints = (size: number): Position[] => {
    const points: Position[] = [];
    
    if (size === 9) {
      // 9x9 board has 5 star points
      points.push({ x: 2, y: 2 });
      points.push({ x: 2, y: 6 });
      points.push({ x: 4, y: 4 }); // center
      points.push({ x: 6, y: 2 });
      points.push({ x: 6, y: 6 });
    } else if (size === 13) {
      // 13x13 board has 5 star points
      points.push({ x: 3, y: 3 });
      points.push({ x: 3, y: 9 });
      points.push({ x: 6, y: 6 }); // center
      points.push({ x: 9, y: 3 });
      points.push({ x: 9, y: 9 });
    } else if (size === 19) {
      // 19x19 board has 9 star points
      points.push({ x: 3, y: 3 });
      points.push({ x: 3, y: 9 });
      points.push({ x: 3, y: 15 });
      points.push({ x: 9, y: 3 });
      points.push({ x: 9, y: 9 }); // center
      points.push({ x: 9, y: 15 });
      points.push({ x: 15, y: 3 });
      points.push({ x: 15, y: 9 });
      points.push({ x: 15, y: 15 });
    }
    
    return points;
  };

  // Helper to get stone at position
  const getStoneAtPosition = (x: number, y: number): Stone | undefined => {
    return board.stones.find(
      (stone) => stone.position.x === x && stone.position.y === y
    );
  };

  // Check if position is valid for placement
  const isValidPlacement = (x: number, y: number): boolean => {
    return !getStoneAtPosition(x, y);
  };

  // Check if a stone is marked as dead during scoring
  const isDeadStone = (x: number, y: number): boolean => {
    return deadStones.some(stone => stone.x === x && stone.y === y);
  };

  // Handle click on board intersection
  const handleIntersectionClick = (x: number, y: number) => {
    if (isScoring) {
      // In scoring mode, clicking toggles whether a stone is marked as dead
      const stone = getStoneAtPosition(x, y);
      if (stone && onToggleDeadStone) {
        onToggleDeadStone({ x, y });
      }
    } else if (isPlayerTurn && isValidPlacement(x, y)) {
      onPlaceStone({ x, y });
    }
  };

  // Handle mouse over board intersection
  const handleMouseOver = (x: number, y: number) => {
    if (isPlayerTurn && isValidPlacement(x, y)) {
      setHoverPosition({ x, y });
    }
  };

  // Handle mouse leave from board
  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  // Get stone size based on board size (larger stones for smaller boards)
  const getStoneSize = () => {
    if (board.size === 9) return '90%';
    if (board.size === 13) return '85%';
    return '80%'; // 19x19
  };

  // Get star point class based on board size
  const getStarPointClass = () => {
    if (board.size === 9) return 'star-point-9';
    if (board.size === 13) return 'star-point-13';
    return 'star-point-19'; // 19x19
  };

  // Get all star points for the current board size
  const starPoints = getStarPoints(board.size);

  // Check if a position is a star point
  const isStarPoint = (x: number, y: number): boolean => {
    return starPoints.some(point => point.x === x && point.y === y);
  };

  return (
    <div className="board-bg">
      <div 
        className="board-grid" 
        style={{ 
          gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${board.size}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: board.size * board.size }).map((_, index) => {
          const x = index % board.size;
          const y = Math.floor(index / board.size);
          const stone = getStoneAtPosition(x, y);
          const isHovered = hoverPosition?.x === x && hoverPosition?.y === y;
          const isLastMove = lastMove?.x === x && lastMove?.y === y;
          const stoneSize = getStoneSize();
          const isDead = isDeadStone(x, y);

          // Determine edge classes
          let edgeClasses = '';
          if (x === 0) edgeClasses += ' board-edge-left';
          if (x === board.size - 1) edgeClasses += ' board-edge-right';
          if (y === 0) edgeClasses += ' board-edge-top';
          if (y === board.size - 1) edgeClasses += ' board-edge-bottom';

          return (
            <div
              key={`${x}-${y}`}
              className={`board-intersection${edgeClasses}${isScoring && stone ? ' cursor-pointer' : ''}`}
              onClick={() => handleIntersectionClick(x, y)}
              onMouseOver={() => handleMouseOver(x, y)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Star point markers */}
              {isStarPoint(x, y) && (
                <div className={`star-point ${getStarPointClass()}`} />
              )}

              {/* Placed stones */}
              {stone && (
                <div
                  className={`stone ${stone.color === 'black' ? 'stone-black' : 'stone-white'}
                   ${isLastMove ? 'last-move' : ''} ${isDead ? 'dead-stone' : ''}`}
                  style={{ 
                    width: stoneSize, 
                    height: stoneSize,
                    opacity: isDead ? 0.5 : 1 
                  }}
                ></div>
              )}

              {/* Hover indicator */}
              {isHovered && !stone && !isScoring && (
                <div
                  className={`stone ${currentTurn === 'black' ? 'stone-black' : 'stone-white'} stone-hover`}
                  style={{ width: stoneSize, height: stoneSize }}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Board size indicator */}
      <div className="board-size-indicator">
        {board.size}×{board.size}
      </div>
      
      {/* Scoring mode indicator */}
      {isScoring && (
        <div className="absolute top-0 left-0 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-br-lg text-sm font-medium">
          Scoring Mode: Click stones to mark as dead
        </div>
      )}
    </div>
  );
};

export default GoBoard; 