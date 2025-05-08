import React from 'react';
import { GameState, Player, GameMove, Position, StoneColor, Stone, GameType } from '../../types/go';
import TimeControl from '../TimeControl';
import SoundSettings from '../SoundSettings';

// Helper function to check if a move is a pass
function isPassMove(move: GameMove): move is { pass: true, color: StoneColor } {
  return (move as any).pass === true;
}

// Format time remaining in MM:SS format
function formatTime(seconds: number | undefined): string {
  if (seconds === undefined) return '–:––';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface GameInfoProps {
  gameState: GameState;
  currentPlayer?: Player;
  onResign?: () => void;
  onRequestUndo?: () => void;
  onAcceptUndo?: () => void;
  onRejectUndo?: () => void;
  onPassTurn?: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  gameState, 
  currentPlayer,
  onResign,
  onRequestUndo,
  onAcceptUndo,
  onRejectUndo,
  onPassTurn
}) => {
  const { players, currentTurn, status, capturedStones, history, score, deadStones, undoRequest, board } = gameState;
  
  // Find black and white players
  const blackPlayer = players.find(player => player.color === 'black');
  const whitePlayer = players.find(player => player.color === 'white');
  
  // Count dead stones by color for display
  const deadStonesByColor = {
    black: 0,
    white: 0
  };
  
  if (deadStones && deadStones.length > 0 && board) {
    deadStones.forEach(pos => {
      const stone = board.stones.find((s: Stone) => s.position.x === pos.x && s.position.y === pos.y);
      if (stone) {
        if (stone.color === 'black') {
          deadStonesByColor.black++;
        } else {
          deadStonesByColor.white++;
        }
      }
    });
  }
  
  // Check if it's the current player's turn
  const isPlayerTurn = currentPlayer?.color === currentTurn;
  
  // Check for recent passes
  const lastMove = history.length > 0 ? history[history.length - 1] : null;
  const secondLastMove = history.length > 1 ? history[history.length - 2] : null;
  
  const lastMoveWasPass = lastMove && isPassMove(lastMove);
  const consecutivePasses = lastMoveWasPass && secondLastMove && isPassMove(secondLastMove);
  
  // Count total moves excluding passes
  const totalStones = history.filter(move => !isPassMove(move)).length;

  // Get scoring rule display name
  const getScoringRuleName = () => {
    switch (gameState.scoringRule) {
      case 'chinese': return 'Chinese';
      case 'japanese': return 'Japanese';
      case 'korean': return 'Korean';
      case 'aga': return 'AGA';
      case 'ing': return 'Ing';
      default: return 'Japanese';
    }
  };
  
  // Get game type display name
  const getGameTypeName = () => {
    switch (gameState.gameType) {
      case 'even': return 'Even Game';
      case 'handicap': return 'Handicap Game';
      case 'blitz': return 'Blitz Go';
      case 'teaching': 
      case 'rengo': 
        return 'Custom Game'; // Simplify teaching and rengo to just "Custom Game"
      default: return 'Standard Game';
    }
  };

  // Get game type icon based on type
  const getGameTypeIcon = () => {
    switch (gameState.gameType) {
      case 'handicap':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        );
      case 'blitz':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'teaching':
      case 'rengo':
        // Generic icon for custom games
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'even':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Replace inline styles with classes for game type badge
  const getGameTypeBadgeStyle = (gameType: GameType) => {
    let badgeClass = "game-type-badge inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ml-2";
    
    switch (gameType) {
      case 'handicap':
        return `${badgeClass} bg-red-100 text-red-800`;
      case 'blitz':
        return `${badgeClass} bg-amber-100 text-amber-800`;
      case 'teaching':
        return `${badgeClass} bg-blue-100 text-blue-800`;
      case 'rengo':
        return `${badgeClass} bg-purple-100 text-purple-800`;
      case 'even':
      default:
        return `${badgeClass} bg-indigo-100 text-indigo-800`;
    }
  };
  
  // Now returns detailed info for different game types
  const getGameTypeDescription = () => {
    switch (gameState.gameType) {
      case 'handicap':
        const handicapStones = gameState.handicap || board.stones.filter(s => s.color === 'black').length;
        return `${handicapStones} handicap stones`;
      case 'blitz':
        return 'Fast-paced game';
      case 'teaching':
        return 'Teaching game';
      case 'rengo':
        return 'Team game';
      case 'even':
      default:
        return 'Standard rules';
    }
  };
  
  return (
    <div className="game-info p-4 rounded-lg shadow-md">
      <h2 className="flex items-center flex-wrap text-xl font-semibold mb-4">
        Game Info
        <span className={getGameTypeBadgeStyle(gameState.gameType as GameType)}>
          {getGameTypeIcon()}
          {getGameTypeName()}
        </span>
      </h2>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Black Player */}
        <div className={`player-card p-3 border rounded-md ${currentTurn === 'black' ? 'player-card-active' : ''}`}>
          <div className="flex items-center mb-2">
            <div className="w-4 h-4 bg-black rounded-full mr-2"></div>
            <span className="font-medium">{blackPlayer?.username || 'Black'}</span>
          </div>
          <div className="text-sm text-gray-600">
            Captures: {capturedStones?.white || 0}
          </div>
        </div>
        
        {/* White Player */}
        <div className={`player-card p-3 border rounded-md ${currentTurn === 'white' ? 'player-card-active' : ''}`}>
          <div className="flex items-center mb-2">
            <div className="w-4 h-4 bg-white border border-black rounded-full mr-2"></div>
            <span className="font-medium">{whitePlayer?.username || 'White'}</span>
          </div>
          <div className="text-sm text-gray-600">
            Captures: {capturedStones?.black || 0}
          </div>
        </div>
      </div>
      
      {/* Game Status */}
      <div className="border-t pt-4">
        <div className="game-status p-2 rounded-md text-center mb-4">
          {status === 'waiting' && 'Waiting for players...'}
          {status === 'playing' && (
            isPlayerTurn 
              ? <span className="font-medium text-green-600">Your turn</span>
              : <span>Opponent's turn</span>
          )}
          {status === 'scoring' && <span className="text-blue-600">Scoring phase</span>}
          {status === 'finished' && <span className="text-purple-600">Game complete</span>}
        </div>
        
        {/* Game Controls */}
        {status === 'playing' && (
          <div className="flex flex-col gap-2">
            {isPlayerTurn && (
              <button 
                onClick={onPassTurn}
                className="btn btn-secondary"
                disabled={!isPlayerTurn}
              >
                Pass Turn
              </button>
            )}
            
            <button 
              onClick={onRequestUndo}
              className="btn bg-blue-100 text-blue-800 hover:bg-blue-200"
              disabled={!isPlayerTurn || history.length < 2 || !!undoRequest}
            >
              Request Undo
            </button>
            
            <button 
              onClick={onResign}
              className="btn bg-red-100 text-red-800 hover:bg-red-200"
            >
              Resign Game
            </button>
          </div>
        )}
        
        {/* Game Stats */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium mb-2">Game Stats</h3>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt>Moves:</dt>
            <dd>{totalStones}</dd>
            <dt>Board:</dt>
            <dd>{gameState.board.size}×{gameState.board.size}</dd>
            <dt>Komi:</dt>
            <dd>{gameState.komi}</dd>
            <dt>Scoring:</dt>
            <dd>{getScoringRuleName()}</dd>
            <dt>Type:</dt>
            <dd>{getGameTypeDescription()}</dd>
          </dl>
        </div>
        
        {/* Time Control Display */}
        {gameState.timeControl && (
          <div className="time-control mt-4">
            <div className="text-sm font-medium mb-2">Time Control</div>
            <div className="flex justify-between">
              <div className="font-medium">Black: 
                {blackPlayer?.timeRemaining !== undefined ? 
                  formatTime(blackPlayer.timeRemaining) : '--:--'}
              </div>
              <div className="font-medium">White: 
                {whitePlayer?.timeRemaining !== undefined ? 
                  formatTime(whitePlayer.timeRemaining) : '--:--'}
              </div>
            </div>
          </div>
        )}
        
        {/* Final Score Display */}
        {status === 'finished' && score && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <h3 className="font-medium text-center mb-2">Final Score</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded shadow-sm">
                <div className="text-xs">Black</div>
                <div className="text-xl font-bold">{score.black.toFixed(1)}</div>
                {score.blackTerritory && (
                  <div className="text-xs text-gray-500">
                    Territory: {score.blackTerritory}
                    {score.deadWhiteStones ? ` + ${score.deadWhiteStones} captures` : ''}
                  </div>
                )}
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <div className="text-xs">White</div>
                <div className="text-xl font-bold">{score.white.toFixed(1)}</div>
                {score.whiteTerritory && (
                  <div className="text-xs text-gray-500">
                    Territory: {score.whiteTerritory}
                    {score.deadBlackStones ? ` + ${score.deadBlackStones} captures` : ''}
                    {gameState.komi ? ` + ${gameState.komi} komi` : ''}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center mt-2 font-medium">
              {gameState.winner === 'black' && 'Black wins'}
              {gameState.winner === 'white' && 'White wins'}
              {!gameState.winner && 'Draw'}
              {score.black && score.white && (
                <span className="text-sm"> by {Math.abs(score.black - score.white).toFixed(1)} points</span>
              )}
            </div>
          </div>
        )}
        
        {/* Sound Settings */}
        <div className="mt-4 pt-4 border-t">
          <SoundSettings />
        </div>
      </div>
    </div>
  );
};

export default GameInfo; 