import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GameOptions, ColorPreference, ScoringRule, GameType } from '../types/go';
import ConnectionStatus from '../components/ConnectionStatus';

// Define keys for localStorage
const STORAGE_KEYS = {
  USERNAME: 'gosei-player-name',
  BOARD_SIZE: 'gosei-board-size',
  COLOR_PREFERENCE: 'gosei-color-preference',
  TIME_CONTROL: 'gosei-time-control',
  TIME_PER_MOVE: 'gosei-time-per-move',
  HANDICAP: 'gosei-handicap',
  SCORING_RULE: 'gosei-scoring-rule',
  GAME_TYPE: 'gosei-game-type'
};

// Component to display and load saved offline games
interface SavedGamesListProps {
  username: string;
  navigate: any;
}

const SavedGamesList: React.FC<SavedGamesListProps> = ({ username, navigate }) => {
  const [savedGames, setSavedGames] = useState<Array<{
    id: string,
    savedAt: string,
    status: string,
    opponent: string
  }>>([]);

  useEffect(() => {
    // Load saved games from localStorage
    try {
      const offlineGames: any[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gosei-offline-game-')) {
          try {
            const savedData = JSON.parse(localStorage.getItem(key) || '');
            if (savedData && savedData.gameState) {
              const { gameState, savedAt } = savedData;
              
              // Only show games for the current user
              const userInGame = gameState.players.some(
                (p: { username: string }) => p.username === username
              );
              
              if (userInGame) {
                // Find opponent name
                const opponent = gameState.players.find(
                  (p: { username: string }) => p.username !== username
                )?.username || 'Unknown';
                
                offlineGames.push({
                  id: gameState.id,
                  savedAt,
                  status: gameState.status,
                  opponent
                });
              }
            }
          } catch (err) {
            console.error('Error parsing saved game:', err);
          }
        }
      }
      
      // Sort by most recently saved
      offlineGames.sort((a, b) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
      
      setSavedGames(offlineGames);
    } catch (err) {
      console.error('Error loading saved games:', err);
    }
  }, [username]);

  if (savedGames.length === 0) {
    return (
      <div className="bg-neutral-50 rounded-lg p-4 text-center">
        <p className="text-neutral-500">No saved games found</p>
        <p className="text-sm text-neutral-400 mt-1">
          Enable Auto-Save during gameplay to access games offline
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 rounded-lg p-3">
      <div className="space-y-2">
        {savedGames.map(game => (
          <div 
            key={game.id} 
            className="bg-white rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-neutral-100"
            onClick={() => navigate(`/game/${game.id}`)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Game with {game.opponent}</div>
                <div className="text-xs text-neutral-500">
                  Status: <span className="font-medium capitalize">{game.status}</span>
                </div>
              </div>
              <div className="text-xs text-neutral-400">
                {new Date(game.savedAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to safely get items from localStorage
const getStoredValue = (key: string, defaultValue: any): any => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) {
      return defaultValue;
    }
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper function to safely set items in localStorage
const setStoredValue = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { createGame, joinGame, gameState, error } = useGame();
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    boardSize: getStoredValue(STORAGE_KEYS.BOARD_SIZE, 19),
    handicap: getStoredValue(STORAGE_KEYS.HANDICAP, 0),
    scoringRule: getStoredValue(STORAGE_KEYS.SCORING_RULE, 'japanese') as ScoringRule,
    gameType: getStoredValue(STORAGE_KEYS.GAME_TYPE, 'even') as GameType,
    colorPreference: getStoredValue(STORAGE_KEYS.COLOR_PREFERENCE, 'random') as ColorPreference,
    timeControl: getStoredValue(STORAGE_KEYS.TIME_CONTROL, 30),
    timePerMove: getStoredValue(STORAGE_KEYS.TIME_PER_MOVE, 0),
    timeControlOptions: {
      timeControl: getStoredValue(STORAGE_KEYS.TIME_CONTROL, 30),
      timePerMove: getStoredValue(STORAGE_KEYS.TIME_PER_MOVE, 0),
      byoYomiPeriods: getStoredValue((STORAGE_KEYS as any).BYO_YOMI_PERIODS, 0),
      byoYomiTime: getStoredValue((STORAGE_KEYS as any).BYO_YOMI_TIME, 30),
      fischerTime: getStoredValue((STORAGE_KEYS as any).FISCHER_TIME, 0)
    },
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
    const savedName = localStorage.getItem(STORAGE_KEYS.USERNAME);
    if (savedName) {
      setUsername(savedName);
    }
  }, []);

  // Save game options when they change
  useEffect(() => {
    setStoredValue(STORAGE_KEYS.BOARD_SIZE, gameOptions.boardSize);
    setStoredValue(STORAGE_KEYS.COLOR_PREFERENCE, gameOptions.colorPreference);
    setStoredValue(STORAGE_KEYS.TIME_CONTROL, gameOptions.timeControl);
    setStoredValue(STORAGE_KEYS.TIME_PER_MOVE, gameOptions.timePerMove);
    setStoredValue(STORAGE_KEYS.HANDICAP, gameOptions.handicap);
    setStoredValue(STORAGE_KEYS.SCORING_RULE, gameOptions.scoringRule);
    setStoredValue(STORAGE_KEYS.GAME_TYPE, gameOptions.gameType);
    setStoredValue((STORAGE_KEYS as any).BYO_YOMI_PERIODS, gameOptions.timeControlOptions.byoYomiPeriods);
    setStoredValue((STORAGE_KEYS as any).BYO_YOMI_TIME, gameOptions.timeControlOptions.byoYomiTime);
    setStoredValue((STORAGE_KEYS as any).FISCHER_TIME, gameOptions.timeControlOptions.fischerTime);
  }, [gameOptions]);

  // Helper function to update a single game option and save it
  const updateGameOption = <K extends keyof GameOptions>(key: K, value: GameOptions[K]) => {
    setGameOptions(prev => {
      // Create a new state object
      const newState = {
        ...prev,
        [key]: value
      };
      
      // If updating timeControlOptions, sync the direct timeControl and timePerMove properties
      if (key === 'timeControlOptions' && typeof value === 'object') {
        if ('timeControl' in value) {
          newState.timeControl = value.timeControl;
        }
        if ('timePerMove' in value) {
          newState.timePerMove = value.timePerMove;
        }
      }
      
      // If updating direct timeControl or timePerMove, sync the timeControlOptions
      if (key === 'timeControl' && typeof value === 'number') {
        newState.timeControlOptions = {
          ...prev.timeControlOptions,
          timeControl: value
        };
      }
      
      if (key === 'timePerMove' && typeof value === 'number') {
        newState.timeControlOptions = {
          ...prev.timeControlOptions,
          timePerMove: value
        };
      }
      
      return newState;
    });
  };

  const handleCreateGame = () => {
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }

    // Clear any previous errors
    setLocalError(null);

    // Save username for future games
    localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());

    // Update the player's username before creating the game
    const options = {
      ...gameOptions,
      playerName: username,
    };
    
    console.log('Creating game with options:', options);
    
    try {
      // Create game through context
      createGame(options);
      
      // Set a timeout to check if navigation hasn't happened
      setTimeout(() => {
        if (!gameState?.id) {
          console.log('Navigation did not occur through context');
          setLocalError('Could not navigate to the game. Please try again or check your connection.');
        }
      }, 3000); // Wait 3 seconds before showing error
    } catch (err) {
      console.error('Error in game creation:', err);
      setLocalError('Failed to create game. Please try again.');
    }
  };

  const handleJoinGame = async () => {
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
    localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());
    
    // Call the joinGame function from context and let the effect handle the navigation
    try {
      console.log(`Attempting to join game with ID/code: ${gameId.trim()}`);
      await joinGame(gameId.trim(), username.trim());
      
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
        onClick={() => updateGameOption('boardSize', size)}
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
        onClick={() => updateGameOption('colorPreference', color)}
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

  // Ruleset option component
  const RulesetOption = ({ rule, name, description }: { rule: ScoringRule, name: string, description: string }) => {
    return (
      <div 
        className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          gameOptions.scoringRule === rule 
            ? 'border-primary-500 bg-primary-50 shadow-md' 
            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
        }`}
        onClick={() => updateGameOption('scoringRule', rule)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{name}</span>
          {gameOptions.scoringRule === rule && (
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

  // Game type option component
  const GameTypeOption = ({ type, title, description, selected, onClick }: { type: GameType, title: string, description: string, selected: boolean, onClick: () => void }) => {
    return (
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
          selected 
            ? 'border-primary-500 bg-primary-50 shadow-md' 
            : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{title}</span>
          {selected && (
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
          <div className="mt-4 flex justify-center space-x-6">
            <Link to="/board-demo" className="text-primary-600 underline hover:text-primary-800 transition-colors">
              View board size comparison
            </Link>
            <Link to="/board-demo" className="text-primary-600 underline hover:text-primary-800 transition-colors">
              Try board themes
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
                
                {/* Saved Offline Games Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Saved Offline Games</h3>
                  <SavedGamesList username={username} navigate={navigate} />
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
                      Time Control Settings
                    </label>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">
                          Main Time (minutes per player)
                        </label>
                        <select
                          className="form-select text-lg py-3"
                          value={gameOptions.timeControlOptions.timeControl}
                          onChange={(e) => updateGameOption('timeControlOptions', {
                            ...gameOptions.timeControlOptions,
                            timeControl: parseInt(e.target.value)
                          })}
                        >
                          <option value={10}>10 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={0}>No time limit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">
                          Time Per Move (seconds)
                        </label>
                        <select
                          className="form-select text-lg py-3"
                          value={gameOptions.timeControlOptions.timePerMove || 0}
                          onChange={(e) => updateGameOption('timeControlOptions', {
                            ...gameOptions.timeControlOptions,
                            timePerMove: parseInt(e.target.value)
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

                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">
                          Byo-yomi Periods
                        </label>
                        <select
                          className="form-select text-lg py-3"
                          value={gameOptions.timeControlOptions.byoYomiPeriods || 0}
                          onChange={(e) => updateGameOption('timeControlOptions', {
                            ...gameOptions.timeControlOptions,
                            byoYomiPeriods: parseInt(e.target.value)
                          })}
                        >
                          <option value={0}>No byo-yomi</option>
                          <option value={3}>3 periods</option>
                          <option value={5}>5 periods</option>
                          <option value={7}>7 periods</option>
                        </select>
                      </div>

                      {(gameOptions.timeControlOptions.byoYomiPeriods ?? 0) > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-neutral-600 mb-1">
                            Byo-yomi Time (seconds per period)
                          </label>
                          <select
                            className="form-select text-lg py-3"
                            value={gameOptions.timeControlOptions.byoYomiTime || 30}
                            onChange={(e) => updateGameOption('timeControlOptions', {
                              ...gameOptions.timeControlOptions,
                              byoYomiTime: parseInt(e.target.value)
                            })}
                          >
                            <option value={30}>30 seconds</option>
                            <option value={45}>45 seconds</option>
                            <option value={60}>60 seconds</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">
                          Fischer Increment (seconds)
                        </label>
                        <select
                          className="form-select text-lg py-3"
                          value={gameOptions.timeControlOptions.fischerTime || 0}
                          onChange={(e) => updateGameOption('timeControlOptions', {
                            ...gameOptions.timeControlOptions,
                            fischerTime: parseInt(e.target.value)
                          })}
                        >
                          <option value={0}>No increment</option>
                          <option value={5}>5 seconds</option>
                          <option value={10}>10 seconds</option>
                          <option value={15}>15 seconds</option>
                          <option value={30}>30 seconds</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Game Type</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <GameTypeOption
                        type="even"
                        title="Even Game"
                        description="Standard game between evenly matched players"
                        selected={gameOptions.gameType === 'even'}
                        onClick={() => updateGameOption('gameType', 'even')}
                      />
                      <GameTypeOption
                        type="handicap"
                        title="Handicap Game"
                        description="Black receives extra stones to balance different skill levels"
                        selected={gameOptions.gameType === 'handicap'}
                        onClick={() => updateGameOption('gameType', 'handicap')}
                      />
                    </div>
                    
                    <div className="mt-2">
                      <GameTypeOption
                        type="blitz"
                        title="Blitz Go"
                        description="Fast-paced game with shorter time controls"
                        selected={gameOptions.gameType === 'blitz'}
                        onClick={() => updateGameOption('gameType', 'blitz')}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-lg font-medium text-neutral-700 mb-3">
                      Scoring Rules
                    </label>
                    <div className="flex gap-4">
                      <RulesetOption 
                        rule="japanese" 
                        name="Japanese" 
                        description="Territory scoring" 
                      />
                      <RulesetOption 
                        rule="chinese" 
                        name="Chinese" 
                        description="Area scoring" 
                      />
                    </div>
                  </div>

                  {gameOptions.gameType === 'handicap' && (
                    <div className="mb-6">
                      <label className="block text-lg font-medium text-neutral-700 mb-2">
                        Handicap Stones
                      </label>
                      <select
                        className="form-select text-lg py-3"
                        value={gameOptions.handicap}
                        onChange={(e) => updateGameOption('handicap', parseInt(e.target.value))}
                      >
                        <option value={0}>0 (Even game)</option>
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
                  )}
                   
                  <div className="mt-8 grid grid-cols-2 gap-6">
                    <button
                      onClick={() => setIsCreatingGame(false)}
                      className="btn btn-secondary text-lg py-3"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGame}
                      className="btn btn-primary text-lg py-3"
                      disabled={!username.trim()}
                    >
                      Create Game
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