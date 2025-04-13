import React from 'react';
import { GameState, Player, GameMove, Position, StoneColor } from '../../types/go';

// Helper function to check if a move is a pass
function isPassMove(move: GameMove): move is { pass: true } {
  return (move as any).pass === true;
}

interface GameInfoProps {
  gameState: GameState;
  currentPlayer?: Player;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState, currentPlayer }) => {
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
              Scoring Mode - Mark dead stones
            </p>
          )}
          {status === 'finished' && (
            <p style={{color: '#7c3aed', fontWeight: '500'}}>
              Game over - {gameState.winner === null ? "Draw" : `${gameState.winner === 'black' ? 'Black' : 'White'} wins`}
            </p>
          )}
        </div>
        
        <div style={gameInfoStyle}>
          <p>Board size: {gameState.board.size}×{gameState.board.size}</p>
          <p>Stones played: {totalStones}</p>
          {status === 'scoring' && deadStones && (
            <p style={{color: '#9333ea', marginTop: '0.25rem'}}>
              Dead stones: {deadStones.length}
            </p>
          )}
          {lastMoveWasPass && (
            <p style={{color: '#db2777', marginTop: '0.25rem'}}>
              {lastMove === secondLastMove ? 'Both players' : currentTurn === 'black' ? 'White' : 'Black'} passed
              {consecutivePasses ? ' - Scoring phase' : ''}
            </p>
          )}
          {undoRequest && (
            <p style={{color: '#2563eb', marginTop: '0.25rem', fontStyle: 'italic'}}>
              Undo request pending
            </p>
          )}
        </div>
      </div>
      
      {/* Detailed score breakdown for finished games */}
      {status === 'finished' && score && (
        <div style={scoreDetailStyle}>
          <div style={scoreHeaderStyle}>
            <span>Score Breakdown</span>
            <span style={scoringRuleStyle}>{getScoringRuleName()} Rules</span>
          </div>

          {/* Black player score details */}
          <div>
            <strong>Black:</strong>
            {score.blackTerritory !== undefined && (
              <div style={scoreRowStyle}>
                <span>Territory:</span>
                <span>{score.blackTerritory}</span>
              </div>
            )}
            {score.blackStones !== undefined && (
              <div style={scoreRowStyle}>
                <span>Stones:</span>
                <span>{score.blackStones}</span>
              </div>
            )}
            {score.blackCaptures !== undefined && (
              <div style={scoreRowStyle}>
                <span>Captures:</span>
                <span>{score.blackCaptures}</span>
              </div>
            )}
            <div style={scoreRowStyle}>
              <strong>Total:</strong>
              <strong>{score.black}</strong>
            </div>
          </div>

          <div style={dividerStyle}></div>

          {/* White player score details */}
          <div>
            <strong>White:</strong>
            {score.whiteTerritory !== undefined && (
              <div style={scoreRowStyle}>
                <span>Territory:</span>
                <span>{score.whiteTerritory}</span>
              </div>
            )}
            {score.whiteStones !== undefined && (
              <div style={scoreRowStyle}>
                <span>Stones:</span>
                <span>{score.whiteStones}</span>
              </div>
            )}
            {score.whiteCaptures !== undefined && (
              <div style={scoreRowStyle}>
                <span>Captures:</span>
                <span>{score.whiteCaptures}</span>
              </div>
            )}
            {score.komi !== undefined && (
              <div style={scoreRowStyle}>
                <span>Komi:</span>
                <span>{score.komi}</span>
              </div>
            )}
            <div style={scoreRowStyle}>
              <strong>Total:</strong>
              <strong>{score.white}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInfo; 