import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GameOptions, ColorPreference } from '../types/go';
import ConnectionStatus from '../components/ConnectionStatus';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { createGame, joinGame, gameState, error } = useGame();
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    boardSize: 19,
    timeControl: 30,
    timePerMove: 30, // Default 30 seconds per move
    handicap: 0,
    scoringRule: 'japanese',
    colorPreference: 'random', // Default to random
  });

  // Effect to navigate to game after creation or joining
  useEffect(() => {
    if (gameState?.id) {
      console.log('Game state updated with ID, navigating to:', gameState.id);
      navigate(`/game/${gameState.id}`);
    }
  }, [gameState, navigate]);

  // Load saved username if available
  useEffect(() => {
    const savedName = localStorage.getItem('gosei-player-name');
    if (savedName) {
      setUsername(savedName);
    }
  }, []);

  const handleCreateGame = () => {
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }

    // Clear any previous errors
    setLocalError(null);

    // Save username for future games
    localStorage.setItem('gosei-player-name', username.trim());

    // Update the player's username before creating the game
    const options = {
      ...gameOptions,
      playerName: username,
    };
    
    console.log('Creating game with options:', options);
    
    try {
      // Create game and attempt manual navigation if context doesn't trigger it
      createGame(options);
      
      // Set a timeout to check if navigation hasn't happened
      setTimeout(() => {
        if (!gameState?.id) {
          console.log('Navigation did not occur through context, checking localStorage...');
          
          // Try to find the game in localStorage
          const allKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('gosei-game-')) {
              try {
                const gameData = JSON.parse(localStorage.getItem(key) || '');
                if (gameData && gameData.players && 
                    gameData.players.some((p: { username: string }) => p.username === username.trim())) {
                  console.log('Found matching game in localStorage:', gameData.id);
                  navigate(`/game/${gameData.id}`);
                  return;
                }
                allKeys.push(key);
              } catch (e) {
                console.error('Error parsing localStorage game data:', e);
              }
            }
          }
          
          console.log('Available game keys in localStorage:', allKeys);
          setLocalError('Could not navigate to the game. Please try again or check your connection.');
        }
      }, 3000); // Wait 3 seconds before trying manual navigation
    } catch (err) {
      console.error('Error in game creation:', err);
      setLocalError('Failed to create game. Please try again.');
    }
  };

  const handleJoinGame = () => {
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }
    
    if (!gameId.trim()) {
      alert('Please enter a game ID or code');
      return;
    }

    // Clear any previous errors
    setLocalError(null);

    // Save username for future games
    localStorage.setItem('gosei-player-name', username.trim());
    
    // Call the joinGame function from context and let the effect handle the navigation
    try {
      console.log(`Attempting to join game with ID/code: ${gameId.trim()}`);
      joinGame(gameId.trim(), username.trim());
      
      // Set a timeout to check if navigation hasn't happened
      setTimeout(() => {
        if (!gameState?.id) {
          setLocalError('Could not join the game. Please check the game ID and try again.');
        }
      }, 3000);
    } catch (error) {
      console.error('Error joining game:', error);
      setLocalError('There was a problem joining the game. Please try again.');
    }
  };

  // Board size option component
  const BoardSizeOption = ({ size, description }: { size: number, description: string }) => {
    return (
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          gameOptions.boardSize === size 
            ? 'border-primary-500 bg-primary-50 shadow-md' 
            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
        }`}
        onClick={() => setGameOptions({...gameOptions, boardSize: size})}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{size}×{size}</span>
          {gameOptions.boardSize === size && (
            <span className="text-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
    );
  };

  // Color preference option component
  const ColorOption = ({ color, description }: { color: ColorPreference, description: string }) => {
    return (
      <div 
        className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          gameOptions.colorPreference === color 
            ? 'border-primary-500 bg-primary-50 shadow-md' 
            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
        }`}
        onClick={() => setGameOptions({...gameOptions, colorPreference: color})}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg capitalize">{color}</span>
          {gameOptions.colorPreference === color && (
            <span className="text-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">Gosei Play</h1>
          <p className="text-xl text-neutral-600">
            Play Go online with friends around the world
          </p>
          <div className="mt-4">
            <Link to="/board-demo" className="text-primary-600 underline hover:text-primary-800 transition-colors">
              View board size comparison
            </Link>
          </div>
        </header>

        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-card overflow-hidden">
          <div className="lg:flex">
            {/* Left panel */}
            <div className="lg:w-1/2 p-6 md:p-10">
              <h2 className="text-3xl font-bold mb-8">Play Go</h2>
              
              {(error || localError) && (
                <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
                  <p>{error || localError}</p>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="username" className="block text-lg font-medium text-neutral-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-input text-lg py-3"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 mt-10">
                <button
                  onClick={() => setIsCreatingGame(true)}
                  className="btn btn-primary text-lg py-4"
                >
                  Create New Game
                </button>
                
                <div>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 form-input rounded-r-none text-lg py-3"
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value)}
                      placeholder="Enter game link or ID"
                      aria-label="Game link or ID"
                    />
                    <button
                      onClick={handleJoinGame}
                      className="btn btn-success rounded-l-none text-lg py-3 px-6"
                      disabled={!username.trim() || !gameId.trim()}
                    >
                      Join Game
                    </button>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Join a game by entering a game link shared by your friend
                  </p>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:w-1/2 bg-primary-50 p-6 md:p-10">
              {isCreatingGame ? (
                <div>
                  <h2 className="text-3xl font-bold mb-8">Game Options</h2>
                  
                  <div className="mb-8">
                    <label className="block text-lg font-medium text-neutral-700 mb-3">
                      Board Size
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      <BoardSizeOption 
                        size={19} 
                        description="Standard size (19×19). Traditional board with complex gameplay." 
                      />
                      <BoardSizeOption 
                        size={13} 
                        description="Medium size (13×13). Good for intermediate players." 
                      />
                      <BoardSizeOption 
                        size={9} 
                        description="Small size (9×9). Great for beginners and quick games." 
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-lg font-medium text-neutral-700 mb-3">
                      Your Preferred Color
                    </label>
                    <div className="flex gap-4">
                      <ColorOption 
                        color="black" 
                        description="Play as black (goes first)" 
                      />
                      <ColorOption 
                        color="white" 
                        description="Play as white (goes second)" 
                      />
                      <ColorOption 
                        color="random" 
                        description="Randomly assigned" 
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-lg font-medium text-neutral-700 mb-2">
                      Time Control (minutes per player)
                    </label>
                    <select
                      className="form-select text-lg py-3"
                      value={gameOptions.timeControl}
                      onChange={(e) => setGameOptions({
                        ...gameOptions,
                        timeControl: parseInt(e.target.value),
                      })}
                    >
                      <option value={10}>10 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={0}>No time limit</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-lg font-medium text-neutral-700 mb-2">
                      Time Per Move (seconds)
                    </label>
                    <select
                      className="form-select text-lg py-3"
                      value={gameOptions.timePerMove}
                      onChange={(e) => setGameOptions({
                        ...gameOptions,
                        timePerMove: parseInt(e.target.value),
                      })}
                    >
                      <option value={0}>No limit per move</option>
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-lg font-medium text-neutral-700 mb-2">
                      Handicap (stones)
                    </label>
                    <select
                      className="form-select text-lg py-3"
                      value={gameOptions.handicap}
                      onChange={(e) => setGameOptions({
                        ...gameOptions,
                        handicap: parseInt(e.target.value),
                      })}
                    >
                      <option value={0}>No handicap</option>
                      <option value={2}>2 stones</option>
                      <option value={3}>3 stones</option>
                      <option value={4}>4 stones</option>
                      <option value={5}>5 stones</option>
                      <option value={6}>6 stones</option>
                      <option value={7}>7 stones</option>
                      <option value={8}>8 stones</option>
                      <option value={9}>9 stones</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-lg font-medium text-neutral-700 mb-2">
                      Scoring Rules
                    </label>
                    <div className="flex gap-4">
                      <div
                        className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          gameOptions.scoringRule === 'japanese' 
                            ? 'border-primary-500 bg-primary-50 shadow-md' 
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
                        }`}
                        onClick={() => setGameOptions({...gameOptions, scoringRule: 'japanese'})}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg">Japanese</span>
                          {gameOptions.scoringRule === 'japanese' && (
                            <span className="text-primary-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">Territory + captured stones + komi</p>
                      </div>
                      <div
                        className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          gameOptions.scoringRule === 'chinese' 
                            ? 'border-primary-500 bg-primary-50 shadow-md' 
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
                        }`}
                        onClick={() => setGameOptions({...gameOptions, scoringRule: 'chinese'})}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg">Chinese</span>
                          {gameOptions.scoringRule === 'chinese' && (
                            <span className="text-primary-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">Territory + stones on board + komi</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 mt-10">
                    <button
                      onClick={handleCreateGame}
                      className="flex-1 btn btn-primary text-lg py-4"
                    >
                      Start Game
                    </button>
                    <button
                      onClick={() => setIsCreatingGame(false)}
                      className="flex-1 btn bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus:ring-neutral-400 text-lg py-4"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold mb-6">About Go</h2>
                  <p className="mb-4 text-lg">
                    Go is an ancient board game that originated in China more than 2,500 years ago. 
                    The game is played by two players who take turns placing black and white stones 
                    on the intersections of a grid.
                  </p>
                  <p className="mb-4 text-lg">
                    The objective is to control more territory than your opponent by surrounding 
                    empty areas with your stones. Stones that are completely surrounded by the 
                    opponent's stones are captured and removed from the board.
                  </p>
                  <p className="mb-4 text-lg font-semibold">
                    Common board sizes:
                  </p>
                  <ul className="list-disc pl-8 mb-6 space-y-2 text-lg">
                    <li><span className="font-medium">19×19</span> - Standard size, used in professional play</li>
                    <li><span className="font-medium">13×13</span> - Medium size, good for intermediate players</li>
                    <li><span className="font-medium">9×9</span> - Small size, great for beginners and quick games</li>
                  </ul>
                  <p className="text-lg">
                    Go is considered one of the oldest board games continuously played today, 
                    and one of the most complex and elegant games ever devised.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add connection status component */}
      <ConnectionStatus />
    </div>
  );
};

export default HomePage; 