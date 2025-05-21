import React from 'react';
import { GameState, Player, GameMove, Position, StoneColor, Stone, GameType } from '../../types/go';
import TimeControl from '../TimeControl';
import SoundSettings from '../SoundSettings';
import PlayerAvatar from '../PlayerAvatar';
import BoardThemeButton from '../BoardThemeButton';

// Helper function to check if a move is a pass
function isPassMove(move: GameMove): move is { pass: true, color: StoneColor } {
  return (move as any).pass === true;
}

// Format time remaining in MM:SS format
function formatTime(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null) return '--:--';
  if (seconds < 0) return '00:00';
  
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.floor(Math.abs(seconds) % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface GameInfoProps {
  gameState: GameState;
  currentPlayer?: Player;
  onResign?: () => void;
  onRequestUndo?: () => void;
  onAcceptUndo?: () => void;
  onRejectUndo?: () => void;
  onPassTurn?: () => void;
  onLeaveGame?: () => void;
  onCopyGameLink?: () => void;
  copied?: boolean;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  onSaveNow?: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  gameState, 
  currentPlayer,
  onResign,
  onRequestUndo,
  onAcceptUndo,
  onRejectUndo,
  onPassTurn,
  onLeaveGame,
  onCopyGameLink,
  copied,
  autoSaveEnabled,
  onToggleAutoSave,
  onSaveNow
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
    <div className="game-info bg-gray-900 text-white p-4 rounded-lg shadow-lg min-w-[480px] border border-gray-800">
      <h2 className="flex items-center justify-between text-xl font-semibold mb-4 text-gray-200">
        <div className="flex items-center gap-2">
          Game Info
          <span className="text-sm bg-gray-700 px-2 py-1 rounded text-gray-300">
            {getGameTypeName()}
          </span>
        </div>
      </h2>
      
      {/* Players Section - Side by Side */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Black Player */}
        <div className={`player-card p-3 rounded-md transition-all duration-200 bg-gray-600`}>
          <div className="flex flex-col items-center">
            {/* Player Avatar */}
            <PlayerAvatar 
              username={blackPlayer?.username || 'shio'} 
              size={40}
            />
            <div className="text-center mt-1">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                <span className="font-medium text-gray-200 text-sm">{blackPlayer?.username || 'shio'}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Captures: {capturedStones?.white || 0}
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-base font-mono font-bold text-center p-1.5 rounded ${
              currentTurn === 'black' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}>
              {formatTime(blackPlayer?.timeRemaining)}
            </div>
          </div>
        </div>
        
        {/* White Player */}
        <div className={`player-card p-3 rounded-md transition-all duration-200 bg-gray-600 ${
          currentTurn === 'white' ? 'ring-1 ring-blue-400' : ''
        }`}>
          <div className="flex flex-col items-center">
            {/* Player Avatar */}
            <PlayerAvatar 
              username={whitePlayer?.username || '123'} 
              size={40}
            />
            <div className="text-center mt-1">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-white rounded-full border border-gray-400"></div>
                <span className="font-medium text-gray-200 text-sm">{whitePlayer?.username || '123'}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Captures: {capturedStones?.black || 0}
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-base font-mono font-bold text-center p-1.5 rounded ${
              currentTurn === 'white' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}>
              {formatTime(whitePlayer?.timeRemaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Current Turn Indicator */}
      <div className="text-center p-2 mb-3 rounded-md bg-indigo-900/60">
        {status === 'playing' ? (
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${currentTurn === 'black' ? 'bg-black' : 'bg-white border border-gray-400'}`}></div>
            <span className="text-indigo-200 text-sm">{isPlayerTurn ? "Your turn" : "Opponent's turn"}</span>
          </div>
        ) : (
          <span className="text-indigo-200 text-sm">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        )}
      </div>

      {/* Game Control Buttons */}
      <div className="space-y-3">
        {/* Primary Game Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRequestUndo}
            disabled={!isPlayerTurn || status !== 'playing'}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Request Undo
          </button>
          
          <button
            onClick={onCopyGameLink}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Secondary Game Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onResign}
            disabled={status !== 'playing'}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Resign Game
          </button>
          
          <button
            onClick={onLeaveGame}
            className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave Game
          </button>
        </div>
      </div>

      {/* Game Stats and Settings */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 bg-gray-800/80 rounded-md">
          <h3 className="text-base font-semibold mb-2 text-gray-200">Game Stats</h3>
          <div className="grid grid-cols-1 gap-1 text-xs text-gray-300">
            <div>Moves: {totalStones}</div>
            <div>Board: {board.size}×{board.size}</div>
            <div>Komi: {gameState.komi}</div>
            <div>Scoring: {getScoringRuleName()}</div>
            <div>Type: {getGameTypeDescription()}</div>
          </div>
        </div>

        {/* Settings */}
        <div className="p-3 bg-gray-800/80 rounded-md">
          <h3 className="text-base font-semibold mb-2 text-gray-200">Settings</h3>
          <div className="space-y-2">
            {/* Stone Sound Setting */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">Stone Sound</span>
              <SoundSettings />
            </div>
            
            {/* Auto Save Setting */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">Auto Save</span>
              <button
                onClick={onToggleAutoSave}
                className={`px-2 py-1 rounded text-xs ${
                  autoSaveEnabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {autoSaveEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {/* Manual Save Button - only show when auto-save is off */}
            {!autoSaveEnabled && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Manual Save</span>
                <button
                  onClick={onSaveNow}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Save Now
                </button>
              </div>
            )}
            
            {/* Board Theme Setting */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">Board Theme</span>
              <BoardThemeButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo; 