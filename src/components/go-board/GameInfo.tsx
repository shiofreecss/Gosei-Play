import React from 'react';
import { GameState, Player, GameMove, Position, StoneColor } from '../../types/go';

// Helper function to check if a move is a pass
function isPassMove(move: GameMove): move is { pass: true } {
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
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState, currentPlayer }) => {
  const { players, currentTurn, status, capturedStones, history, score, deadStones, undoRequest, timePerMove } = gameState;
  
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
    return gameState.scoringRule === 'chinese' ? 'Chinese' : 'Japanese';
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
  
  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Game Information</h2>
      
      <div style={playerGridStyle}>
        <div style={playerCardStyle(currentTurn === 'black')}>
          <div style={playerNameStyle}>
            <div style={stoneStyle('black')}></div>
            <span style={nameTextStyle}>{blackPlayer?.username || 'Black'}</span>
          </div>
          <div style={capturedStyle}>
            <p>Captured: {capturedStones.black}</p>
            {score && <p style={{ fontWeight: 'bold' }}>Score: {score.black}</p>}
            
            {/* Timer display for black */}
            {timePerMove && timePerMove > 0 && blackPlayer?.timeRemaining !== undefined && (
              <p style={{
                ...timerStyle,
                ...(blackPlayer.timeRemaining < 10 && currentTurn === 'black' ? lowTimeStyle : {}),
              }}>
                Time: {formatTime(blackPlayer.timeRemaining)}
              </p>
            )}
          </div>
        </div>
        
        <div style={playerCardStyle(currentTurn === 'white')}>
          <div style={playerNameStyle}>
            <div style={stoneStyle('white')}></div>
            <span style={nameTextStyle}>{whitePlayer?.username || 'White'}</span>
          </div>
          <div style={capturedStyle}>
            <p>Captured: {capturedStones.white}</p>
            {score && <p style={{ fontWeight: 'bold' }}>Score: {score.white}</p>}
            
            {/* Timer display for white */}
            {timePerMove && timePerMove > 0 && whitePlayer?.timeRemaining !== undefined && (
              <p style={{
                ...timerStyle,
                ...(whitePlayer.timeRemaining < 10 && currentTurn === 'white' ? lowTimeStyle : {}),
              }}>
                Time: {formatTime(whitePlayer.timeRemaining)}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div style={statusContainerStyle}>
        <div style={statusStyle}>
          {status === 'waiting' && (
            <p style={{color: '#d97706'}}>Waiting for opponent to join...</p>
          )}
          {status === 'playing' && (
            <p>
              {isPlayerTurn 
                ? <span style={{color: '#059669', fontWeight: '500'}}>Your turn</span> 
                : <span style={{color: '#2563eb'}}>Opponent's turn</span>}
            </p>
          )}
          {status === 'scoring' && (
            <p style={{color: '#9333ea', fontWeight: '500'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                Scoring Mode - Mark dead stones
              </span>
            </p>
          )}
          {status === 'finished' && (
            <p style={{color: '#7c3aed', fontWeight: '500'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Game over - {gameState.winner === null ? "Draw" : `${gameState.winner === 'black' ? 'Black' : 'White'} wins`}
              </span>
            </p>
          )}
        </div>
        
        {status === 'playing' && undoRequest && (
          <div style={{
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
          }}>
            <p style={{fontWeight: '500'}}>Opponent has requested to undo a move</p>
          </div>
        )}
        
        <div style={gameInfoStyle}>
          <p>Board size: {gameState.board.size}×{gameState.board.size}</p>
          <p>Scoring rule: {getScoringRuleName()}</p>
          <p>Moves played: {totalStones}</p>
          {timePerMove && timePerMove > 0 && (
            <p>Time per move: {timePerMove} seconds</p>
          )}
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
            
            {gameState.scoringRule === 'japanese' && (
              <>
                <div style={scoreRowStyle}>
                  <span>Black captures:</span>
                  <span>{score.blackCaptures || capturedStones.black || 0}</span>
                </div>
                <div style={scoreRowStyle}>
                  <span>White captures:</span>
                  <span>{score.whiteCaptures || capturedStones.white || 0}</span>
                </div>
              </>
            )}
            
            <div style={scoreRowStyle}>
              <span>Komi:</span>
              <span>{score.komi || 6.5}</span>
            </div>
            
            <div style={dividerStyle}></div>
            
            <div style={scoreRowStyle}>
              <span style={{fontWeight: '600'}}>Black total:</span>
              <span style={{fontWeight: '600'}}>{score.black}</span>
            </div>
            
            <div style={scoreRowStyle}>
              <span style={{fontWeight: '600'}}>White total:</span>
              <span style={{fontWeight: '600'}}>{score.white}</span>
            </div>
            
            <div style={{
              marginTop: '0.75rem',
              fontWeight: '600',
              textAlign: 'center' as const,
              color: gameState.winner === 'black' ? '#000' : 
                     gameState.winner === 'white' ? '#4b5563' : '#6b7280'
            }}>
              {gameState.winner === null ? "Draw" : 
                `${gameState.winner === 'black' ? 'Black' : 'White'} wins by ${Math.abs(score.black - score.white)} points`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameInfo; 