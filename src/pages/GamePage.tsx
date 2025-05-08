import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GoBoard from '../components/go-board/GoBoard';
import GameInfo from '../components/go-board/GameInfo';
import GameError from '../components/GameError';
import BoardThemeButton from '../components/BoardThemeButton';
import AppThemeSelector from '../components/AppThemeSelector';
import ConnectionStatus from '../components/ConnectionStatus';
import { useGame } from '../context/GameContext';
import { Position, GameMove, GameState } from '../types/go';
import ChatBox from '../components/ChatBox';
import FloatingChatBubble from '../components/FloatingChatBubble';

// Helper function to check game status safely
const hasStatus = (gameState: GameState, status: 'waiting' | 'playing' | 'finished' | 'scoring'): boolean => {
  return gameState.status === status;
};

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { 
    gameState, 
    loading, 
    currentPlayer, 
    error, 
    placeStone, 
    passTurn, 
    leaveGame, 
    joinGame, 
    syncGameState, 
    resignGame,
    toggleDeadStone,
    confirmScore,
    requestUndo,
    respondToUndoRequest,
    cancelScoring,
    resetGame,
    syncDeadStones
  } = useGame();
  const [username, setUsername] = useState<string>(() => localStorage.getItem('gosei-player-name') || '');
  const [showJoinForm, setShowJoinForm] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    playerId: string;
    username: string;
    message: string;
    timestamp: number;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const savedPref = localStorage.getItem('gosei-auto-save-enabled');
    return savedPref ? JSON.parse(savedPref) : false;
  });
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [confirmingScore, setConfirmingScore] = useState<boolean>(false);

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

  // Set up or clear autosave interval based on autoSaveEnabled state
  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('gosei-auto-save-enabled', JSON.stringify(autoSaveEnabled));

    // Clear any existing interval
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
    }

    // Set up new interval if enabled
    if (autoSaveEnabled && gameState && gameState.id) {
      const interval = setInterval(() => {
        // Save current game state to localStorage with a custom key
        try {
          localStorage.setItem(`gosei-offline-game-${gameState.id}`, JSON.stringify({
            gameState,
            savedAt: new Date().toISOString(),
            currentPlayer
          }));
          console.log('Game auto-saved to local storage');
        } catch (error) {
          console.error('Failed to auto-save game:', error);
          // If storage is full, disable auto-save
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            setAutoSaveEnabled(false);
            alert('Auto-save has been disabled because your device storage is full.');
          }
        }
      }, 30000); // Save every 30 seconds
      
      setAutoSaveInterval(interval);
    }

    // Clean up interval on component unmount
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [autoSaveEnabled, gameState, currentPlayer]);

  // Effect to set up keyboard shortcut for developer tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle dev tools with Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDevTools(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add chat-related effects
  useEffect(() => {
    const socket = gameState?.socket;
    if (!socket) {
      setConnectionStatus('disconnected');
      return;
    }

    // Update connection status when socket state changes
    if (socket.connected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('connecting');
    }

    socket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('Socket reconnected, rejoining chat room...');
      if (gameState?.id && currentPlayer) {
        socket.emit('joinGame', {
          gameId: gameState.id,
          playerId: currentPlayer.id,
          username: currentPlayer.username,
          isReconnect: true
        });
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('Socket disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
      console.log('Socket connection error');
    });

    // Listen for chat messages
    socket.on('chatMessageReceived', (data) => {
      console.log('Received chat message:', data);
      setChatMessages(prev => [...prev, {
        id: data.id,
        playerId: data.playerId,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp
      }]);
    });

    // Listen for chat history when joining a game
    socket.on('chatHistory', (data) => {
      console.log('Received chat history:', data);
      if (data.messages && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
      }
    });

    // Setup error handler for chat
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.includes('chat')) {
        alert('Chat error: ' + error);
      }
    });

    return () => {
      socket.off('chatMessageReceived');
      socket.off('chatHistory');
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [gameState?.socket, gameState?.id, currentPlayer]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const toggleAutoSave = () => {
    setAutoSaveEnabled(prev => !prev);
  };

  const saveGameNow = () => {
    if (gameState && gameState.id) {
      try {
        localStorage.setItem(`gosei-offline-game-${gameState.id}`, JSON.stringify({
          gameState,
          savedAt: new Date().toISOString(),
          currentPlayer
        }));
        alert('Game saved successfully for offline access!');
      } catch (error) {
        console.error('Failed to save game:', error);
        alert('Failed to save game. Your device storage might be full.');
      }
    }
  };

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

  const handleResignGame = () => {
    if (window.confirm('Are you sure you want to resign this game?')) {
      resignGame();
    }
  };

  const handleToggleDeadStone = (position: Position) => {
    toggleDeadStone(position);
  };

  const handleConfirmScore = () => {
    // First, count dead stones by color for the confirmation message
    if (!gameState) return;
    
    const deadBlackStones = gameState.board.stones.filter(stone => 
      stone.color === 'black' && 
      gameState.deadStones?.some(dead => 
        dead.x === stone.position.x && dead.y === stone.position.y
      )
    ).length;
    
    const deadWhiteStones = gameState.board.stones.filter(stone => 
      stone.color === 'white' && 
      gameState.deadStones?.some(dead => 
        dead.x === stone.position.x && dead.y === stone.position.y
      )
    ).length;
    
    // Set confirming score state
    setConfirmingScore(true);
    
    // Show confirmation toast or alert
    const totalDeadStones = deadBlackStones + deadWhiteStones;
    alert(`Score confirmed with ${totalDeadStones} dead stones (${deadBlackStones} black, ${deadWhiteStones} white)`);
    
    // Call the confirmScore function from context
    confirmScore();
    
    // Reset confirming state after a delay
    setTimeout(() => {
      setConfirmingScore(false);
    }, 3000);
  };

  const handleCancelScoring = () => {
    cancelScoring();
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
    console.log('Manually syncing game state and dead stones');
    setSyncing(true);
    
    // Call both sync functions to ensure complete synchronization
    syncGameState();
    
    if (gameState && hasStatus(gameState, 'scoring')) {
      syncDeadStones();
    }
    
    // Show a visual feedback that sync was attempted
    setTimeout(() => setSyncing(false), 1000);
  };

  const handleRequestUndo = () => {
    requestUndo();
  };

  const handleAcceptUndo = () => {
    respondToUndoRequest(true);
  };

  const handleRejectUndo = () => {
    respondToUndoRequest(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim() || !gameState?.socket || !currentPlayer) {
      // Show feedback if there's an issue
      if (!gameState?.socket) {
        alert('Cannot send message: You are disconnected from the game server.');
        handleSyncGame(); // Try to reconnect
        return;
      }
      if (!chatInput.trim()) {
        return; // Just silently return if message is empty
      }
      return;
    }

    // Add message locally first for immediate feedback
    const messageData = {
      id: Date.now().toString(),
      playerId: currentPlayer.id,
      username: currentPlayer.username,
      message: chatInput.trim(),
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, messageData]);
    setChatInput('');

    try {
      // Then send to server
      console.log('Sending chat message to server:', messageData);
      gameState.socket.emit('chatMessage', {
        gameId: gameState.id,
        playerId: currentPlayer.id,
        username: currentPlayer.username,
        message: chatInput.trim()
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Helper function to check if a move is a pass
  function isPassMove(move: GameMove): move is { pass: true } {
    return typeof move === 'object' && 'pass' in move;
  }

  // Add this to handle sending chat messages to the server
  const handleChatMessage = (gameId: string, playerId: string, username: string, message: string) => {
    if (gameState && gameState.socket) {
      gameState.socket.emit('chatMessage', {
        gameId,
        playerId,
        username,
        message
      });
      
      // Also update the local chat messages state if needed
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          playerId,
          username,
          message,
          timestamp: Date.now()
        }
      ]);
    }
  };

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
          <div className="flex items-center space-x-4">
            <AppThemeSelector />
          </div>
        </div>
        
        {/* Add a small indicator when dev tools are enabled */}
        {showDevTools && (
          <div className="text-xs text-neutral-500 text-center mb-2">
            Developer Tools Enabled (Ctrl+Shift+D to toggle)
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 flex flex-col items-center">
            <div className="w-full max-w-[90vw] md:max-w-[80vw] xl:max-w-full">
              <GoBoard
                board={gameState.board}
                currentTurn={gameState.currentTurn}
                onPlaceStone={(position) => {
                  // Add debug for handicap games
                  if (gameState.gameType === 'handicap') {
                    console.log('Handicap game detected');
                    console.log(`Current turn: ${gameState.currentTurn}, Player color: ${currentPlayer?.color}`);
                    console.log(`Handicap stones on board: ${gameState.board.stones.filter(s => s.color === 'black').length}`);
                  }
                  handleStonePlace(position);
                }}
                isPlayerTurn={gameState.status === 'playing' && currentPlayer?.color === gameState.currentTurn}
                lastMove={gameState.history.length > 0 ? 
                  isPassMove(gameState.history[gameState.history.length - 1]) ? 
                    undefined : gameState.history[gameState.history.length - 1] as Position 
                  : undefined}
                isScoring={gameState.status === 'scoring'}
                deadStones={gameState.deadStones}
                onToggleDeadStone={handleToggleDeadStone}
                territory={gameState.territory}
                showTerritory={gameState.status === 'finished' || gameState.status === 'scoring'}
              />
            </div>
            
            {/* Game controls moved below the board */}
            <div className="flex gap-2 flex-wrap justify-center mt-4 mb-4">
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
              {/* Only show Sync Game button when developer tools are enabled */}
              {showDevTools && (
                <button
                  onClick={handleSyncGame}
                  className="btn bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus:ring-neutral-400"
                  disabled={syncing}
                >
                  {syncing ? 'Syncing...' : 'Sync Game'}
                </button>
              )}
              <button
                onClick={toggleAutoSave}
                className={`btn ${autoSaveEnabled ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'} focus:ring-neutral-400`}
              >
                {autoSaveEnabled ? 'Auto-Save: ON' : 'Auto-Save: OFF'}
              </button>
              {!autoSaveEnabled && (
                <button
                  onClick={saveGameNow}
                  className="btn bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-400"
                >
                  Save Now
                </button>
              )}
              {/* Board theme selector button */}
              <div className="board-theme-container">
                <BoardThemeButton />
              </div>
            </div>
            
            {/* Undo Request Notification */}
            {gameState.status === 'playing' && gameState.undoRequest && currentPlayer && gameState.undoRequest.requestedBy !== currentPlayer.id && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center w-full max-w-md">
                <p className="text-blue-800 font-medium mb-2">
                  Your opponent has requested to undo to a previous position.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleAcceptUndo}
                    className="btn bg-green-600 text-white hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleRejectUndo}
                    className="btn bg-red-100 text-red-800 hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
            
            {/* Undo Request Pending */}
            {gameState.status === 'playing' && gameState.undoRequest && currentPlayer && gameState.undoRequest.requestedBy === currentPlayer.id && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center w-full max-w-md">
                <p className="text-yellow-800">
                  Undo request sent. Waiting for opponent's response...
                </p>
              </div>
            )}
            
            {/* Keep Scoring Controls */}
            {gameState.status === 'scoring' && (
              <div className="text-center mt-6 w-full bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-md">
                <h3 className="text-xl font-semibold text-yellow-800 mb-3">Scoring Phase</h3>
                <div className="text-sm text-yellow-700 mb-4 max-w-2xl mx-auto">
                  <p className="mb-2">
                    The game has ended. Now it's time to determine the score:
                  </p>
                  <ol className="list-decimal text-left pl-8 space-y-1">
                    <li>Click on stones that are considered dead (surrounded with no chance of living)</li>
                    <li>These stones will be removed from the board during scoring</li>
                    <li>When both players agree on dead stones, click "Confirm Score" to end the game</li>
                  </ol>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-4">
                  <button
                    onClick={handleConfirmScore}
                    className="btn bg-green-600 text-white hover:bg-green-700 px-6 py-2 text-base font-medium flex items-center gap-2"
                    disabled={confirmingScore}
                  >
                    {confirmingScore ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Confirming...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Confirm Score
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleCancelScoring}
                    className="btn bg-red-100 text-red-800 hover:bg-red-200 px-6 py-2 text-base font-medium flex items-center gap-2"
                    disabled={confirmingScore}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Cancel Scoring
                  </button>
                  
                  <button
                    onClick={handleSyncGame}
                    className="btn bg-blue-100 text-blue-800 hover:bg-blue-200 px-6 py-2 text-base font-medium flex items-center gap-2"
                    title="Sync dead stones with other players"
                    disabled={syncing}
                  >
                    {syncing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Sync Dead Stones
                      </>
                    )}
                  </button>
                </div>
                
                {/* Territory visualization key */}
                <div className="flex items-center justify-center gap-6 mt-6 p-2 bg-white rounded-lg border border-yellow-100 max-w-md mx-auto">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-black opacity-30 rounded-full mr-2"></div>
                    <span className="text-sm">Black Territory</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-white border border-gray-500 opacity-30 rounded-full mr-2"></div>
                    <span className="text-sm">White Territory</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-400 opacity-30 rounded-full mr-2"></div>
                    <span className="text-sm">Dead Stones</span>
                  </div>
                </div>

                {/* Dead Stones Counter Card */}
                <div className="mt-4 bg-white rounded-lg border border-red-200 shadow-sm max-w-md mx-auto p-4">
                  <h4 className="text-red-800 font-semibold text-center mb-2">
                    Dead Stones Summary
                    {confirmingScore && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Confirming...
                      </span>
                    )}
                    {hasStatus(gameState, 'finished') && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Confirmed
                      </span>
                    )}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-black rounded-full"></div>
                        <span className="text-sm font-medium">Black</span>
                      </div>
                      <span className="text-2xl font-bold text-red-800">
                        {hasStatus(gameState, 'finished') && gameState.score?.deadBlackStones !== undefined
                          ? gameState.score.deadBlackStones
                          : gameState.board.stones.filter(stone => 
                              stone.color === 'black' && 
                              gameState.deadStones?.some(dead => 
                                dead.x === stone.position.x && dead.y === stone.position.y
                              )
                            ).length}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 bg-white border border-gray-300 rounded-full"></div>
                        <span className="text-sm font-medium">White</span>
                      </div>
                      <span className="text-2xl font-bold text-red-800">
                        {hasStatus(gameState, 'finished') && gameState.score?.deadWhiteStones !== undefined
                          ? gameState.score.deadWhiteStones
                          : gameState.board.stones.filter(stone => 
                              stone.color === 'white' && 
                              gameState.deadStones?.some(dead => 
                                dead.x === stone.position.x && dead.y === stone.position.y
                              )
                            ).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center mt-3 text-sm text-gray-600">
                    {/* Consider memoizing this for efficiency */}
                    Total: <span className="font-bold">{gameState.deadStones?.length || 0}</span> stones marked
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right sidebar - Game Info */}
          <div className="xl:col-span-1">
            <GameInfo 
              gameState={gameState}
              currentPlayer={currentPlayer || undefined}
              onResign={handleResignGame}
              onRequestUndo={handleRequestUndo}
              onAcceptUndo={handleAcceptUndo}
              onRejectUndo={handleRejectUndo}
              onPassTurn={handlePassTurn}
            />
          </div>
        </div>
      </div>
      
      {/* Game error messages */}
      <GameError />

      {gameState.status === 'finished' && (
        <div className="text-center mt-6 w-full bg-indigo-50 p-6 rounded-lg border border-indigo-200 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 mb-3">Game Complete</h3>
          
          <div className="flex justify-center items-center mb-4">
            <div className={`text-center p-4 ${gameState.winner === 'black' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-900'} rounded-lg shadow-md w-60`}>
              <div className="text-sm font-medium mb-1">
                {gameState.winner === 'black' ? 'Black Wins!' : gameState.winner === 'white' ? 'White Wins!' : 'Draw!'}
              </div>
              {gameState.score && (
                <div className="flex justify-center items-center gap-4">
                  <div>
                    <div className="text-xs opacity-80">Black</div>
                    <div className="text-xl font-bold">{gameState.score.black.toFixed(1)}</div>
                  </div>
                  <div className="text-sm">vs</div>
                  <div>
                    <div className="text-xs opacity-80">White</div>
                    <div className="text-xl font-bold">{gameState.score.white.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => navigate('/')}
              className="btn bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2"
            >
              Return to Home
            </button>
            <button
              onClick={() => {
                // Reset game state and start a new game
                resetGame();
                navigate('/');
              }}
              className="btn bg-green-600 text-white hover:bg-green-700 px-6 py-2"
            >
              Play Again
            </button>
          </div>
          
          <p className="text-sm text-indigo-600 mt-4">
            See the detailed score breakdown in the game info panel.
          </p>
        </div>
      )}
      
      {/* Add connection status component */}
      <ConnectionStatus />
      
      {/* Floating Chat Bubble */}
      {currentPlayer && (
        <FloatingChatBubble
          gameId={gameState.id}
          currentPlayerId={currentPlayer.id}
          currentPlayerUsername={currentPlayer.username}
          socket={gameState.socket}
          messages={chatMessages}
        />
      )}
    </div>
  );
};

export default GamePage; 