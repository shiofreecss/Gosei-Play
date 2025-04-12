import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import GoBoard from '../components/go-board/GoBoard';
import GameInfo from '../components/go-board/GameInfo';
import GameError from '../components/GameError';
import { useGame } from '../context/GameContext';
import { Position, GameMove } from '../types/go';

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { gameState, loading, currentPlayer, error, placeStone, passTurn, leaveGame, joinGame, syncGameState } = useGame();
  const [username, setUsername] = useState<string>('');
  const [showJoinForm, setShowJoinForm] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Check if there's a gameId in the URL and try to load that game
  useEffect(() => {
    // If we have a gameId/code from the URL but no gameState, show join form
    if (gameId && !gameState && !showJoinForm && !loading) {
      // Get stored name if available
      const storedName = localStorage.getItem('gosei-player-name');
      if (storedName) {
        setUsername(storedName);
      }
      setShowJoinForm(true);
    }
  }, [gameId, gameState, showJoinForm, loading]);

  const handleStonePlace = (position: Position) => {
    placeStone(position);
  };

  const handlePassTurn = () => {
    passTurn();
  };

  const handleLeaveGame = () => {
    leaveGame();
    navigate('/');
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && gameId) {
      // Save username for future games
      localStorage.setItem('gosei-player-name', username.trim());
      // Join the game using the joinGame function
      joinGame(gameId, username.trim());
      setShowJoinForm(false);
    }
  };

  const copyGameLink = () => {
    const gameLink = window.location.href;
    navigator.clipboard.writeText(gameLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  
  const handleSyncGame = () => {
    setSyncing(true);
    syncGameState();
    setTimeout(() => setSyncing(false), 2000);
  };

  // Helper function to check if a move is a pass
  function isPassMove(move: GameMove): move is { pass: true } {
    return typeof move === 'object' && 'pass' in move;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          <p>Please wait while we set up the game.</p>
        </div>
      </div>
    );
  }

  // Game not found
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4">
        <div className="card max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Join form
  if (showJoinForm && !currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4">
        <div className="card max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Join Game</h2>
          <p className="mb-4">
            You've been invited to play a game of Go. Enter your name to join.
          </p>
          <form onSubmit={handleJoinGame}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 btn btn-primary"
              >
                Join Game
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 btn bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus:ring-neutral-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // No game state at all - should redirect to home
  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
          <p className="mb-4">We couldn't find the requested game.</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Game board and UI
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-primary-700">Gosei Play</h1>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={handleLeaveGame}
              className="btn bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus:ring-neutral-400"
            >
              Leave Game
            </button>
            <button
              onClick={copyGameLink}
              className="btn btn-primary"
            >
              {copied ? 'Copied!' : 'Copy Game Link'}
            </button>
            <button
              onClick={handleSyncGame}
              className="btn bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus:ring-neutral-400"
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync Game'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 flex flex-col items-center">
            <div className="w-full max-w-[90vw] md:max-w-[80vw] xl:max-w-full">
              <GoBoard
                board={gameState.board}
                currentTurn={gameState.currentTurn}
                onPlaceStone={handleStonePlace}
                isPlayerTurn={gameState.status === 'playing' && currentPlayer?.color === gameState.currentTurn}
                lastMove={gameState.history.length > 0 ? 
                  isPassMove(gameState.history[gameState.history.length - 1]) ? 
                    undefined : gameState.history[gameState.history.length - 1] as Position 
                  : undefined}
              />
            </div>
            
            {/* Pass button */}
            {gameState.status === 'playing' && currentPlayer?.color === gameState.currentTurn && (
              <div className="text-center mt-6 w-full">
                <button
                  onClick={handlePassTurn}
                  className="btn bg-neutral-200 text-neutral-800 hover:bg-neutral-300 px-8 py-3 text-lg"
                >
                  Pass Turn
                </button>
                <p className="text-sm text-neutral-500 mt-2">
                  Pass when you have no good moves. Two consecutive passes ends the game.
                </p>
              </div>
            )}
          </div>
          <div className="xl:col-span-1">
            <GameInfo gameState={gameState} currentPlayer={currentPlayer || undefined} />
            
            <div className="card mt-6">
              <h3 className="font-semibold text-xl mb-3">Game Chat</h3>
              <div className="bg-neutral-100 h-60 md:h-80 rounded-lg mb-3 p-3 overflow-y-auto">
                <p className="text-sm text-neutral-500">No messages yet.</p>
              </div>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 form-input rounded-r-none"
                />
                <button className="btn btn-primary rounded-l-none">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Game error messages */}
      <GameError />
    </div>
  );
};

export default GamePage; 