import React from 'react';
import { GameState, Player, GameMove, Position } from '../../types/go';

interface GameInfoProps {
  gameState: GameState;
  currentPlayer?: Player;
}

// Helper function to check if a move is a pass
function isPassMove(move: GameMove): move is { pass: true } {
  return typeof move === 'object' && 'pass' in move;
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
  
  const stoneStyle = (color: 'black' | 'white') => ({
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    background: color === 'black' ? '#000' : '#fff',
    border: '1px solid #e5e7eb',
    marginRight: '0.5rem',
  });
  
  const nameTextStyle = {
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
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
    marginBottom: '0.5rem',
  };
  
  const gameInfoStyle = {
    fontSize: '0.875rem',
    color: '#4b5563',
  };
  
  const moveHistoryStyle = {
    marginTop: '1rem',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1rem',
  };
  
  const moveHistoryItemStyle = {
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
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
            {score && <p style={{ fontWeight: 'bold' }}>Score: {score.white} (incl. komi)</p>}
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
      
      {/* Hide recent moves section in scoring or finished status */}
      {history.length > 0 && status !== 'scoring' && status !== 'finished' && (
        <div style={moveHistoryStyle}>
          <h3 style={{fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem'}}>Recent Moves</h3>
          <div>
            {history.slice(-5).reverse().map((move, idx) => (
              <div key={idx} style={moveHistoryItemStyle}>
                {isPassMove(move) 
                  ? `${history.length - idx}. ${(history.length - idx) % 2 === 0 ? 'White' : 'Black'} passed` 
                  : `${history.length - idx}. ${(history.length - idx) % 2 === 0 ? 'White' : 'Black'} at (${(move as Position).x}, ${(move as Position).y})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInfo; 