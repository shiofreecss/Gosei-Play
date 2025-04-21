import React from 'react';
import { GameState, Player, GameMove, Position, StoneColor, GameType } from '../../types/go';
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
  const { players, currentTurn, status, capturedStones, history, score, deadStones, undoRequest } = gameState;
  
  // Find black and white players
  const blackPlayer = players.find(player => player.color === 'black');
  const whitePlayer = players.find(player => player.color === 'white');
  
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

  // Get styles for game type badge
  const getGameTypeBadgeStyle = () => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      marginLeft: '0.5rem',
    };

    switch (gameState.gameType) {
      case 'handicap':
        return {
          ...baseStyle,
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
        };
      case 'blitz':
        return {
          ...baseStyle,
          backgroundColor: '#fef3c7',
          color: '#b45309',
        };
      case 'teaching':
        return {
          ...baseStyle,
          backgroundColor: '#dbeafe',
          color: '#1e40af',
        };
      case 'rengo':
        return {
          ...baseStyle,
          backgroundColor: '#f3e8ff',
          color: '#6b21a8',
        };
      case 'even':
      default:
        return {
          ...baseStyle,
          backgroundColor: '#e0e7ff',
          color: '#4338ca',
        };
    }
  };
  
  // Styles for the component
  const containerStyle = {
    background: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '1rem',
  };
  
  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  };
  
  const playerGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '1rem',
  };
  
  const playerCardStyle = (isActive: boolean) => ({
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    padding: '0.75rem',
    background: isActive ? '#f3f4f6' : 'white',
    borderLeft: isActive ? '3px solid #4f46e5' : '1px solid #e5e7eb',
  });
  
  const playerNameStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
  };
  
  const stoneStyle = (color: StoneColor) => ({
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    background: color === 'black' ? '#000' : '#fff',
    border: color === 'white' ? '1px solid #000' : 'none',
    marginRight: '0.5rem',
  });
  
  const nameTextStyle = {
    fontWeight: '500',
  };
  
  const capturedStyle = {
    fontSize: '0.875rem',
    color: '#4b5563',
  };
  
  const statusContainerStyle = {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1rem',
  };
  
  const statusStyle = {
    marginBottom: '1rem',
    padding: '0.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.25rem',
    textAlign: 'center' as const,
  };
  
  const gameInfoStyle = {
    fontSize: '0.875rem',
    color: '#4b5563',
  };

  const scoreDetailStyle = {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
  };

  const scoreRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
  };

  const scoreHeaderStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
  };

  const scoringRuleStyle = {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic',
  };

  const dividerStyle = {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '0.5rem 0',
  };
  
  const timerStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#4f46e5',
    marginTop: '0.25rem',
  };
  
  const lowTimeStyle = {
    color: '#dc2626',
  };

  const gameTypeInfoStyle = {
    borderRadius: '0.375rem',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
  };

  // Get game type info panel style based on type
  const getGameTypeInfoStyle = () => {
    const baseStyle = { ...gameTypeInfoStyle };
    
    switch (gameState.gameType) {
      case 'handicap':
        return {
          ...baseStyle,
          borderColor: '#fecaca',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
        };
      case 'blitz':
        return {
          ...baseStyle,
          borderColor: '#fed7aa',
          backgroundColor: '#fff7ed',
          color: '#9a3412',
        };
      case 'teaching':
      case 'rengo':
        return {
          ...baseStyle,
          borderColor: '#c7d2fe',
          backgroundColor: '#eef2ff',
          color: '#3730a3',
        };
      case 'even':
      default:
        return {
          ...baseStyle,
          borderColor: '#c7d2fe',
          backgroundColor: '#eef2ff',
          color: '#3730a3',
        };
    }
  };
  
  // Get game type description
  const getGameTypeDescription = () => {
    switch (gameState.gameType) {
      case 'handicap':
        return `Handicap game with ${gameState.handicap} stones. Komi is ${gameState.komi} points.`;
      case 'blitz':
        return 'Fast-paced game with shorter time controls. Quick moves are essential!';
      case 'teaching':
        return 'A custom game with special settings.';
      case 'rengo':
        return 'A custom game with special settings.';
      case 'even':
      default:
        return 'Standard game between evenly matched players.';
    }
  };
  
  // Updated player clock style
  const playerClockStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  };

  const playerInfoStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  const stoneAndTimeStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
  };
  
  // Game controls styles
  const gameControlsStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginTop: '1rem',
    marginBottom: '1rem',
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  };
  
  const currentTurnText = {
    fontSize: '0.875rem',
    fontWeight: '500',
    marginTop: '0.5rem',
    color: '#4b5563',
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>
        Game Information
        {gameState.gameType && (
          <span style={getGameTypeBadgeStyle()}>
            {getGameTypeIcon()}
            {getGameTypeName()}
          </span>
        )}
      </h2>
      
      {/* Game Type Info Panel - display only for handicap games */}
      {gameState.gameType === 'handicap' && (
        <div style={getGameTypeInfoStyle()}>
          <div className="flex-1">
            <h3 className="font-medium">Handicap Game</h3>
            <ul className="mt-2 text-sm space-y-1">
              <li>• Black places {gameState.handicap} stones at the start</li>
              <li>• White plays first after handicap stones</li>
              <li>• Komi is reduced to {gameState.komi} points</li>
              <li>• Scoring: {getScoringRuleName()} rules</li>
              <li>• Moves played: {totalStones}</li>
            </ul>
          </div>
        </div>
      )}

      {/* For non-handicap games, add a small info section */}
      {gameState.gameType !== 'handicap' && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          color: '#4b5563',
        }}>
          <span>Scoring: {getScoringRuleName()} • Moves: {totalStones}</span>
        </div>
      )}

      {/* Clock display with player info */}
      <div className="mt-4">
        {/* Black player clock */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.375rem 0.375rem 0 0',
          borderLeft: currentTurn === 'black' ? '3px solid #000' : '3px solid transparent',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              background: '#000',
              marginRight: '0.5rem',
            }}></div>
            <div>
              <div style={{ fontWeight: '500' }}>{blackPlayer?.username || 'Black'}</div>
              <div style={{ fontSize: '0.75rem' }}>Captured: {capturedStones.black}</div>
            </div>
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: currentTurn === 'black' && blackPlayer?.timeRemaining !== undefined && blackPlayer.timeRemaining < 30 ? '#dc2626' : 'inherit'
          }}>
            {blackPlayer?.timeRemaining !== undefined ? formatTime(blackPlayer.timeRemaining) : ''}
          </div>
        </div>
        
        {/* White player clock */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0 0 0.375rem 0.375rem',
          borderLeft: currentTurn === 'white' ? '3px solid #000' : '3px solid transparent'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              background: '#fff',
              border: '1px solid #000',
              marginRight: '0.5rem',
            }}></div>
            <div>
              <div style={{ fontWeight: '500' }}>{whitePlayer?.username || 'White'}</div>
              <div style={{ fontSize: '0.75rem' }}>Captured: {capturedStones.white}</div>
            </div>
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: currentTurn === 'white' && whitePlayer?.timeRemaining !== undefined && whitePlayer.timeRemaining < 30 ? '#dc2626' : 'inherit'
          }}>
            {whitePlayer?.timeRemaining !== undefined ? formatTime(whitePlayer.timeRemaining) : ''}
          </div>
        </div>
      </div>

      {/* Your turn indicator */}
      {status === 'playing' && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          textAlign: 'center',
          backgroundColor: isPlayerTurn ? '#f0fdf4' : '#f9fafb',
          borderRadius: '0.25rem',
          fontWeight: isPlayerTurn ? '600' : '400',
          color: isPlayerTurn ? '#166534' : '#4b5563'
        }}>
          {isPlayerTurn ? 'Your turn' : `Waiting for ${currentTurn === 'black' ? 'Black' : 'White'}`}
        </div>
      )}

      {/* Game status indicator */}
      <div style={statusContainerStyle}>
        <div style={statusStyle}>
          {status === 'waiting' && 'Waiting for players...'}
          {status === 'playing' && !lastMoveWasPass && 'Game in progress'}
          {status === 'playing' && lastMoveWasPass && !consecutivePasses && 'Last move: Pass'}
          {status === 'playing' && consecutivePasses && 'Two consecutive passes - game ending'}
          {status === 'scoring' && 'Scoring phase - mark dead stones'}
          {status === 'finished' && 'Game is finished'}
        </div>
        
        {/* Scoring information when game is in scoring or finished state */}
        {score && (status === 'scoring' || status === 'finished') && (
          <div style={scoreDetailStyle}>
            <div style={scoreHeaderStyle}>
              <span>Score Details</span>
              <span style={scoringRuleStyle}>{getScoringRuleName()} rules</span>
            </div>
            
            <div style={scoreRowStyle}>
              <span>Black territory:</span>
              <span>{score.blackTerritory || 0}</span>
            </div>
            
            <div style={scoreRowStyle}>
              <span>White territory:</span>
              <span>{score.whiteTerritory || 0}</span>
            </div>
            
            {/* Chinese rules scoring display */}
            {gameState.scoringRule === 'chinese' && (
              <>
                <div style={scoreRowStyle}>
                  <span>Black stones:</span>
                  <span>{score.blackStones || 0}</span>
                </div>
                <div style={scoreRowStyle}>
                  <span>White stones:</span>
                  <span>{score.whiteStones || 0}</span>
                </div>
              </>
            )}
            
            {/* Japanese rules scoring display */}
            {gameState.scoringRule === 'japanese' && (
              <>
                <div style={scoreRowStyle}>
                  <span>Black captures:</span>
                  <span>{capturedStones.black || 0}</span>
                </div>
                <div style={scoreRowStyle}>
                  <span>White captures:</span>
                  <span>{capturedStones.white || 0}</span>
                </div>
              </>
            )}
            
            <div style={scoreRowStyle}>
              <span>Komi:</span>
              <span>{gameState.komi}</span>
            </div>
            
            <div style={{ ...scoreRowStyle, fontWeight: '600' }}>
              <span>Final score:</span>
              <span>B {score.black} : W {score.white}</span>
            </div>
            
            <div style={{ ...scoreRowStyle, fontWeight: '600', marginTop: '0.5rem' }}>
              <span>Result:</span>
              <span>
                {gameState.winner === 'black' && `Black wins by ${Math.abs(score.white ? score.black - score.white : 0)} points`}
                {gameState.winner === 'white' && `White wins by ${Math.abs(score.black ? score.white - score.black : 0)} points`}
                {!gameState.winner && 'Draw'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* TimeControl Component - Only shown when not using in-player clocks */}
      {status === 'playing' && gameState.timeControl && (
        <TimeControl
          timeControl={gameState.timeControl.timeControl}
          timePerMove={gameState.timeControl.timePerMove}
          byoYomiPeriods={gameState.timeControl.byoYomiPeriods}
          byoYomiTime={gameState.timeControl.byoYomiTime}
          fischerTime={gameState.timeControl.fischerTime}
          currentTurn={currentTurn}
          onTimeout={(color) => {
            // Handle timeout - this will be handled by the server
            console.log(`Player ${color} has run out of time`);
          }}
          isPlaying={status === 'playing'}
        />
      )}

      {/* Game Controls Section */}
      {status === 'playing' && currentPlayer && (
        <div style={gameControlsStyle}>
          <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Game Controls</div>
          
          {/* Pass Button - only available when it's the player's turn */}
          {currentPlayer.color === currentTurn && (
            <button 
              onClick={onPassTurn}
              style={{
                ...buttonStyle,
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                marginBottom: '0.75rem'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
              </svg>
              Pass Turn
            </button>
          )}
          
          {/* Undo Section */}
          {undoRequest ? (
            // Another player requested undo
            undoRequest.requestedBy !== currentPlayer.id ? (
              <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Undo Request</div>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Your opponent wants to undo the last move. Do you accept?
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={onAcceptUndo} 
                    style={{ ...buttonStyle, backgroundColor: '#d1fae5', color: '#047857', flex: 1 }}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={onRejectUndo} 
                    style={{ ...buttonStyle, backgroundColor: '#fee2e2', color: '#b91c1c', flex: 1 }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              // You requested undo
              <div style={{ padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem' }}>
                  Waiting for opponent to respond to your undo request...
                </div>
              </div>
            )
          ) : (
            // No undo request active
            <button 
              onClick={onRequestUndo}
              style={primaryButtonStyle}
              disabled={history.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
              </svg>
              Request Undo
            </button>
          )}
          
          {/* Resign Button */}
          <button 
            onClick={onResign}
            style={dangerButtonStyle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
            Resign Game
          </button>
        </div>
      )}

      {/* Game Information */}
      <div className="text-sm">
        <div className="flex items-center mb-1">
          <span className="font-medium">Moves:</span>
          <span className="ml-1 text-neutral-600">{totalStones}</span>
        </div>
        
        {history.length > 0 && lastMoveWasPass && (
          <div className="flex items-center mb-1">
            <span className="font-medium">Last Move:</span>
            <span className="ml-1 text-neutral-600">
              {lastMove && isPassMove(lastMove) ? 
                `${lastMove.color === 'black' ? 'Black' : 'White'} passed` : 
                'Unknown'}
            </span>
          </div>
        )}
        
        {consecutivePasses && (
          <div className="text-yellow-600 font-medium mb-1">
            Both players passed. Game is now in scoring phase.
          </div>
        )}
        
        {isPlayerTurn && status === 'playing' && (
          <div className="mt-2 p-2 bg-primary-50 border border-primary-100 rounded text-primary-800 font-medium">
            Your turn to play
          </div>
        )}
        
        {!isPlayerTurn && status === 'playing' && (
          <div className="mt-2 p-2 bg-neutral-50 border border-neutral-200 rounded text-neutral-600">
            Waiting for opponent
          </div>
        )}
      </div>

      {/* Sound Settings */}
      <SoundSettings />
    </div>
  );
};

export default GameInfo; 