import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Position, Player, StoneColor, GameMove, GameOptions, Stone } from '../types/go';
import { isWithinBounds, applyGoRules } from '../utils/goGameLogic';
import { SOCKET_URL } from '../config';

// Helper function to check if a move is a pass
function isPassMove(move: GameMove): move is { pass: true } {
  return typeof move === 'object' && 'pass' in move;
}

// Helper function to create a pass move
function createPassMove(): { pass: true } {
  return { pass: true };
}

// Define the context shape
interface GameContextType {
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  moveError: string | null;
  currentPlayer: Player | null;
  createGame: (options: GameOptions & { playerName?: string }) => void;
  joinGame: (gameId: string, username: string) => void;
  placeStone: (position: Position) => void;
  passTurn: () => void;
  leaveGame: () => void;
  resetGame: () => void;
  syncGameState: () => void;
  clearMoveError: () => void;
}

// Create context with default values
const GameContext = createContext<GameContextType>({
  gameState: null,
  loading: false,
  error: null,
  moveError: null,
  currentPlayer: null,
  createGame: () => {},
  joinGame: () => {},
  placeStone: () => {},
  passTurn: () => {},
  leaveGame: () => {},
  resetGame: () => {},
  syncGameState: () => {},
  clearMoveError: () => {},
});

// Action types
type GameAction =
  | { type: 'CREATE_GAME_START' }
  | { type: 'CREATE_GAME_SUCCESS'; payload: { gameState: GameState; player: Player } }
  | { type: 'JOIN_GAME_START' }
  | { type: 'JOIN_GAME_SUCCESS'; payload: { gameState: GameState; player: Player } }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'GAME_ERROR'; payload: string }
  | { type: 'MOVE_ERROR'; payload: string }
  | { type: 'CLEAR_MOVE_ERROR' }
  | { type: 'RESET_GAME' }
  | { type: 'LEAVE_GAME' }
  | { type: 'SET_SOCKET'; payload: Socket | null };

// Reducer function
const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'CREATE_GAME_START':
    case 'JOIN_GAME_START':
      return { ...state, loading: true, error: null, moveError: null };
      
    case 'CREATE_GAME_SUCCESS':
    case 'JOIN_GAME_SUCCESS':
      return {
        ...state,
        gameState: action.payload.gameState,
        currentPlayer: action.payload.player,
        loading: false,
        error: null,
        moveError: null,
      };
      
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
        loading: false,
        error: null,
      };
      
    case 'GAME_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    
    case 'MOVE_ERROR':
      return {
        ...state,
        moveError: action.payload,
      };
    
    case 'CLEAR_MOVE_ERROR':
      return {
        ...state,
        moveError: null,
      };
      
    case 'RESET_GAME':
      return initialState;
      
    case 'LEAVE_GAME':
      return {
        ...initialState,
        socket: state.socket,
      };
      
    case 'SET_SOCKET':
      return {
        ...state,
        socket: action.payload,
      };
      
    default:
      return state;
  }
};

// Initial state
interface GameContextState {
  gameState: GameState | null;
  currentPlayer: Player | null;
  loading: boolean;
  error: string | null;
  moveError: string | null;
  socket: Socket | null;
}

const initialState: GameContextState = {
  gameState: null,
  currentPlayer: null,
  loading: false,
  error: null,
  moveError: null,
  socket: null,
};

// Provider component
interface GameProviderProps {
  children: ReactNode;
  socketUrl?: string;
}

export const GameProvider: React.FC<GameProviderProps> = ({ 
  children, 
  socketUrl = SOCKET_URL 
}) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Socket connection
  useEffect(() => {
    // Create socket connection
    const socket = io(socketUrl);
    
    socket.on('connect', () => {
      console.log('Connected to server');
      
      // If we have a game state already, request a sync to ensure we're up to date
      if (state.gameState && state.currentPlayer) {
        console.log('Requesting game state sync after connection');
        socket.emit('requestSync', {
          gameId: state.gameState.id,
          playerId: state.currentPlayer.id
        });
      }
    });
    
    socket.on('gameState', (gameState: GameState) => {
      console.log('Received updated game state from server:', gameState);
      
      // Update our state if it's different from what we have
      if (!state.gameState || 
          state.gameState.board.stones.length !== gameState.board.stones.length ||
          state.gameState.status !== gameState.status ||
          state.gameState.currentTurn !== gameState.currentTurn) {
        console.log('Updating game state from server data');
        
        // Save to localStorage as backup
        try {
          safelySetItem(`gosei-game-${gameState.code}`, JSON.stringify(gameState));
        } catch (e) {
          console.error('Error saving game state to localStorage:', e);
        }
        
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
      }
    });
    
    socket.on('moveMade', (data: { 
      gameId: string, 
      position: Position, 
      color: StoneColor, 
      playerId: string,
      capturedCount?: number
    }) => {
      console.log('Received move from server:', data);
      
      // Skip updating if this is our own move (we already updated locally)
      if (state.currentPlayer && data.playerId === state.currentPlayer.id) {
        console.log('Skipping our own move broadcast');
        return;
      }
      
      if (state.gameState && state.gameState.id === data.gameId) {
        // Check if we already have this stone
        const stoneExists = state.gameState.board.stones.some(
          stone => 
            stone.position.x === data.position.x && 
            stone.position.y === data.position.y
        );
        
        if (stoneExists) {
          console.log('Stone already exists, skipping update');
          return;
        }
        
        // Update captured stones count if any
        const updatedCapturedStones = { ...state.gameState.capturedStones };
        if (data.capturedCount && data.capturedCount > 0 && data.color) {
          if (data.color === 'black' || data.color === 'white') {
            console.log(`Opponent captured ${data.capturedCount} stones`);
            updatedCapturedStones[data.color] += data.capturedCount;
          }
        }
        
        // Update local game state when a move is made by another player
        const updatedGameState: GameState = {
          ...state.gameState,
          board: {
            ...state.gameState.board,
            stones: [
              ...state.gameState.board.stones,
              { position: data.position, color: data.color }
            ]
          },
          currentTurn: data.color === 'black' ? 'white' : 'black',
          history: [...state.gameState.history, data.position],
          capturedStones: updatedCapturedStones
        };
        
        // Save to localStorage as backup
        try {
          safelySetItem(`gosei-game-${updatedGameState.code}`, JSON.stringify(updatedGameState));
          console.log('Updated game state saved to localStorage after opponent move');
        } catch (e) {
          console.error('Error saving received move to localStorage:', e);
        }
        
        // Dispatch the update to re-render the board
        dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedGameState });
      }
    });
    
    socket.on('syncRequest', (data: { gameId: string, playerId: string }) => {
      // Another player requested a sync, let's make sure we're in sync too
      if (state.gameState && state.gameState.id === data.gameId) {
        console.log('Another player requested sync, syncing our game state too');
        socket.emit('requestSync', {
          gameId: state.gameState.id,
          playerId: state.currentPlayer?.id || 'unknown'
        });
      }
    });
    
    socket.on('playerJoined', (data: { gameId: string, playerId: string, username: string }) => {
      console.log(`Player ${data.username} joined the game`);
      
      // If we have this game open, update to show the player joined
      if (state.gameState && state.gameState.id === data.gameId) {
        // We'll get a full gameState update from the server, so no need to update here
        console.log('Will receive updated game state with the new player');
      }
    });
    
    socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      dispatch({ type: 'GAME_ERROR', payload: error });
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    socket.on('reconnect', () => {
      console.log('Reconnected to server');
      
      // Request a sync after reconnection to ensure we have the latest state
      if (state.gameState && state.currentPlayer) {
        console.log('Requesting game state sync after reconnection');
        socket.emit('requestSync', {
          gameId: state.gameState.id,
          playerId: state.currentPlayer.id
        });
      }
    });
    
    // Add socket event handlers for data sync issues
    socket.on('syncGameState', (gameState: GameState) => {
      console.log('Received sync game state from server');
      
      // Always update when we get a sync response
      try {
        safelySetItem(`gosei-game-${gameState.code}`, JSON.stringify(gameState));
      } catch (e) {
        console.error('Error saving synced game state to localStorage:', e);
      }
      
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
    });
    
    // Handle pass turn event
    socket.on('turnPassed', (data: { gameId: string, color: StoneColor, playerId: string, nextTurn: StoneColor }) => {
      console.log('Received pass from server:', data);
      
      // Skip updating if this is our own pass (we already updated locally)
      if (state.currentPlayer && data.playerId === state.currentPlayer.id) {
        console.log('Skipping our own pass broadcast');
        return;
      }
      
      if (state.gameState && state.gameState.id === data.gameId) {
        // Update local game state when a pass is made by another player
        const updatedGameState: GameState = {
          ...state.gameState,
          currentTurn: data.nextTurn,
          history: [...state.gameState.history, createPassMove()],
        };
        
        // If there are two consecutive passes, the game ends
        const historyLength = updatedGameState.history.length;
        if (historyLength >= 2) {
          const lastMove = updatedGameState.history[historyLength - 1];
          const secondLastMove = updatedGameState.history[historyLength - 2];
          
          if (isPassMove(lastMove) && isPassMove(secondLastMove)) {
            // Game ends after two consecutive passes - server will send the final state
            console.log('Game ending after two consecutive passes');
          }
        }
        
        // Save to localStorage as backup
        try {
          safelySetItem(`gosei-game-${updatedGameState.code}`, JSON.stringify(updatedGameState));
          console.log('Updated game state saved to localStorage after opponent pass');
        } catch (e) {
          console.error('Error saving received pass to localStorage:', e);
        }
        
        // Dispatch the update to re-render the board
        dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedGameState });
      }
    });
    
    // Store socket in state
    dispatch({ type: 'SET_SOCKET', payload: socket });
    
    return () => {
      socket.disconnect();
    };
  }, [socketUrl]);

  // Generate handicap stones based on board size and handicap count
  const getHandicapStones = (boardSize: number, handicap: number): Stone[] => {
    if (handicap < 2) return [];
    
    console.log(`Creating ${handicap} handicap stones for board size ${boardSize}`);
    const stones: Stone[] = [];
    
    // Standard handicap positions for different board sizes
    const positions: Record<number, Position[]> = {
      19: [
        { x: 3, y: 3 },    // bottom left
        { x: 15, y: 15 },  // top right
        { x: 15, y: 3 },   // bottom right
        { x: 3, y: 15 },   // top left
        { x: 9, y: 9 },    // center
        { x: 9, y: 3 },    // bottom center
        { x: 9, y: 15 },   // top center
        { x: 3, y: 9 },    // left center
        { x: 15, y: 9 },   // right center
      ],
      13: [
        { x: 3, y: 3 },    // bottom left
        { x: 9, y: 9 },    // top right
        { x: 9, y: 3 },    // bottom right
        { x: 3, y: 9 },    // top left
        { x: 6, y: 6 },    // center
        { x: 6, y: 3 },    // bottom center
        { x: 6, y: 9 },    // top center
        { x: 3, y: 6 },    // left center
        { x: 9, y: 6 },    // right center
      ],
      9: [
        { x: 2, y: 2 },    // bottom left
        { x: 6, y: 6 },    // top right
        { x: 6, y: 2 },    // bottom right
        { x: 2, y: 6 },    // top left
        { x: 4, y: 4 },    // center
        { x: 4, y: 2 },    // bottom center
        { x: 4, y: 6 },    // top center
        { x: 2, y: 4 },    // left center
        { x: 6, y: 4 },    // right center
      ],
    };
    
    // Ensure we have positions for this board size
    if (!positions[boardSize]) {
      console.log(`No predefined handicap positions for board size ${boardSize}`);
      return [];
    }
    
    // Get the handicap positions (limit to 9)
    const handicapPositions = positions[boardSize].slice(0, Math.min(handicap, 9));
    
    // Create stones for each position
    handicapPositions.forEach(position => {
      console.log(`Adding handicap stone at (${position.x}, ${position.y})`);
      stones.push({
        position,
        color: 'black',
      });
    });
    
    console.log(`Created ${stones.length} handicap stones`);
    return stones;
  };
  
  // Helper to generate a short, readable game code
  const generateGameCode = (): string => {
    // Create a short, readable code (e.g., "BLUE-STONE-42")
    const adjectives = ['BLACK', 'WHITE', 'QUICK', 'WISE', 'SMART', 'GRAND', 'CALM', 'BOLD', 'BRAVE'];
    const nouns = ['STONE', 'BOARD', 'MOVE', 'PLAY', 'STAR', 'POINT', 'GAME', 'MATCH', 'PATH'];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 100);
    
    return `${randomAdjective}-${randomNoun}-${randomNumber}`;
  };
  
  // Helper functions for localStorage
  const safelyGetItem = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error(`Error retrieving item from localStorage with key ${key}:`, e);
      return null;
    }
  };
  
  const safelySetItem = (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`Error setting item in localStorage with key ${key}:`, e);
      return false;
    }
  };

  // Add a function to find a game by code
  const findGameByCode = (code: string): GameState | null => {
    try {
      // Try to find exact match first with the key pattern
      const gameData = safelyGetItem(`gosei-game-${code}`);
      if (gameData) {
        const game = JSON.parse(gameData);
        return game;
      }
      
      // Try direct ID match
      let allKeys: string[] = [];
      try {
        allKeys = Object.keys(localStorage);
      } catch (e) {
        console.error('Error accessing localStorage keys:', e);
        return null;
      }
      
      for (const key of allKeys) {
        if (key.startsWith('gosei-game-')) {
          try {
            const gameData = safelyGetItem(key);
            if (!gameData) continue;
            
            const game = JSON.parse(gameData);
            
            // Check if the game ID matches
            if (game.id === code) {
              return game;
            }
            
            // Check if the code matches case-insensitive
            if (typeof game.code === 'string' && 
                game.code.toLowerCase() === code.toLowerCase()) {
              return game;
            }
          } catch (e) {
            console.error('Error parsing game data:', e);
          }
        }
      }
      
      return null;
    } catch (e) {
      console.error('Error in findGameByCode:', e);
      return null;
    }
  };

  // Create a new game
  const createGame = (options: GameOptions & { playerName?: string }) => {
    dispatch({ type: 'CREATE_GAME_START' });
    
    // For demo purposes, we'll create a local game
    // In a real app, this would connect to a server
    const playerId = uuidv4();
    const gameId = uuidv4();
    const gameCode = generateGameCode();
    
    const player: Player = {
      id: playerId,
      username: options.playerName || 'Player 1',
      color: 'black',
    };
    
    // Generate handicap stones if needed
    const handicapStones = getHandicapStones(options.boardSize, options.handicap);
    
    const initialGameState: GameState = {
      id: gameId,
      code: gameCode,
      board: {
        size: options.boardSize,
        stones: handicapStones,
      },
      players: [player],
      currentTurn: options.handicap > 0 ? 'white' : 'black', // White goes first if there are handicap stones
      capturedStones: {
        black: 0,
        white: 0,
      },
      history: [],
      status: 'waiting',
      winner: null,
    };
    
    // Store the game in localStorage for retrieval by code
    const stored = safelySetItem(`gosei-game-${gameCode}`, JSON.stringify(initialGameState));
    if (!stored) {
      dispatch({ type: 'GAME_ERROR', payload: 'Failed to save the game. Please try again.' });
      return;
    }
    
    // If socket is connected, emit createGame event to server
    if (state.socket && state.socket.connected) {
      console.log(`Emitting createGame event for game ${gameId}`);
      state.socket.emit('createGame', {
        gameState: initialGameState,
        playerId: player.id
      });
    } else {
      console.warn('Socket not connected, game state will only be synchronized locally');
    }
    
    dispatch({
      type: 'CREATE_GAME_SUCCESS',
      payload: { gameState: initialGameState, player },
    });
  };
  
  // Join an existing game
  const joinGame = (gameIdOrCode: string, username: string) => {
    if (!gameIdOrCode || !username) {
      dispatch({ type: 'GAME_ERROR', payload: 'Game ID/link and username are required.' });
      return;
    }
    
    dispatch({ type: 'JOIN_GAME_START' });
    
    try {
      console.log(`Trying to join game with input: ${gameIdOrCode}`);
      
      // Extract gameId from link if user pasted a URL
      let gameId = gameIdOrCode;
      if (gameIdOrCode.includes('/game/')) {
        const urlParts = gameIdOrCode.split('/game/');
        if (urlParts.length > 1) {
          gameId = urlParts[1].split('?')[0]; // Remove any query parameters
          console.log(`Extracted game ID from link: ${gameId}`);
        }
      }
      
      // Try to find the game by ID or code
      let foundGame = findGameByCode(gameId);
      
      // If not found by code or ID, check if it's the current game's ID
      if (!foundGame && state.gameState?.id === gameId) {
        foundGame = state.gameState;
      }
      
      if (!foundGame) {
        console.log(`Game with ID/code ${gameId} not found`);
        dispatch({ type: 'GAME_ERROR', payload: 'Game not found. Check the link and try again.' });
        return;
      }
      
      console.log(`Found game: ${foundGame.code}, players: ${foundGame.players.length}, status: ${foundGame.status}`);
      
      // Check if game already has two players and is in progress
      if (foundGame.players.length >= 2) {
        // If the player is trying to rejoin (e.g., after refresh)
        const existingPlayer = foundGame.players.find(p => 
          p.username.toLowerCase() === username.toLowerCase());
        
        if (existingPlayer) {
          console.log(`Found existing player with username: ${username}`);
          // Allow rejoining - player is already part of this game
          
          // If we have a socket connection, join the socket room
          if (state.socket && state.socket.connected) {
            state.socket.emit('joinGame', {
              gameId: foundGame.id,
              playerId: existingPlayer.id,
              username: existingPlayer.username,
              isReconnect: true
            });
          }
          
          dispatch({
            type: 'JOIN_GAME_SUCCESS',
            payload: { 
              gameState: foundGame, 
              player: existingPlayer 
            },
          });
          return;
        }
        
        console.log(`Game already has ${foundGame.players.length} players and username doesn't match any existing player`);
        dispatch({ type: 'GAME_ERROR', payload: 'This game already has two players.' });
        return;
      }
      
      // Create a new player or reuse existing if they're rejoining
      let player: Player;
      let updatedPlayers = [...foundGame.players];
      
      // Check if player with this username already exists
      const existingPlayer = foundGame.players.find(p => 
        p.username.toLowerCase() === username.toLowerCase());
      
      if (existingPlayer) {
        // Returning player
        console.log(`Player ${username} is rejoining the game`);
        player = existingPlayer;
      } else {
        // New player joins
        console.log(`Creating new player with username: ${username}`);
        const playerId = uuidv4();
        player = {
          id: playerId,
          username,
          color: 'white', // Second player is white
        };
        updatedPlayers.push(player);
      }
      
      // Update game status to playing if we now have 2 players
      const newStatus = updatedPlayers.length >= 2 ? 'playing' : 'waiting';
      
      const updatedGameState: GameState = {
        ...foundGame,
        players: updatedPlayers,
        status: newStatus
      };
      
      // Update the game in localStorage
      try {
        const stored = safelySetItem(`gosei-game-${updatedGameState.code}`, JSON.stringify(updatedGameState));
        if (!stored) {
          throw new Error('Failed to save game state');
        }
        console.log(`Game ${updatedGameState.code} updated in localStorage`);
      } catch (e) {
        console.error('Error saving game to localStorage:', e);
        dispatch({ type: 'GAME_ERROR', payload: 'Failed to update the game. Please try again.' });
        return;
      }
      
      // If we have a socket connection, join the socket room
      if (state.socket && state.socket.connected) {
        console.log(`Emitting joinGame event for game ${updatedGameState.id}`);
        state.socket.emit('joinGame', {
          gameId: updatedGameState.id,
          playerId: player.id,
          username: player.username,
          isReconnect: !!existingPlayer
        });
        
        // If game status changed to playing, notify all players
        if (newStatus === 'playing') {
          state.socket.emit('gameStatusChanged', {
            gameId: updatedGameState.id,
            status: 'playing'
          });
        }
      } else {
        console.warn('Socket not connected, game state will only be synchronized locally');
      }
      
      dispatch({
        type: 'JOIN_GAME_SUCCESS',
        payload: { gameState: updatedGameState, player },
      });
    } catch (e) {
      console.error('Error joining game:', e);
      dispatch({ type: 'GAME_ERROR', payload: 'An error occurred while joining the game.' });
    }
  };
  
  // Place a stone on the board
  const placeStone = (position: Position) => {
    if (!state.gameState || !state.currentPlayer) {
      console.log("Cannot place stone: no game state or current player");
      dispatch({ type: 'MOVE_ERROR', payload: 'Game not started properly' });
      return;
    }
    
    const { gameState, currentPlayer } = state;
    
    // Prevent playing if game status is not 'playing' (still waiting for opponent)
    if (gameState.status !== 'playing') {
      console.log("Cannot play - waiting for opponent to join");
      dispatch({ type: 'MOVE_ERROR', payload: 'Waiting for opponent to join' });
      return;
    }
    
    // Check if it's the player's turn
    if (currentPlayer.color !== gameState.currentTurn) {
      console.log("Not your turn");
      dispatch({ type: 'MOVE_ERROR', payload: `Not your turn - waiting for ${gameState.currentTurn} to play` });
      return;
    }
    
    // Apply Go rules to validate and process the move
    const result = applyGoRules(position, currentPlayer.color, gameState);
    
    if (!result.valid || !result.updatedGameState) {
      console.log(`Invalid move: ${result.error}`);
      dispatch({ type: 'MOVE_ERROR', payload: result.error || 'Invalid move' });
      return;
    }
    
    // Clear any previous move errors
    dispatch({ type: 'CLEAR_MOVE_ERROR' });
    
    const updatedGameState = result.updatedGameState;
    
    // Update local state immediately for responsive UI
    dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedGameState });
    
    // Emit move to server if socket is available
    if (state.socket && state.socket.connected) {
      const moveData = {
        gameId: gameState.id,
        position,
        color: currentPlayer.color,
        playerId: currentPlayer.id
      };
      
      console.log('Emitting move to server:', moveData);
      
      state.socket.emit('makeMove', moveData);
    } else {
      console.warn('Socket not connected, updating state locally only');
      
      // Try to reconnect
      if (state.socket) {
        console.log('Attempting to reconnect...');
        state.socket.connect();
      }
    }
    
    // Update the game in localStorage as backup
    try {
      const stored = safelySetItem(`gosei-game-${updatedGameState.code}`, JSON.stringify(updatedGameState));
      if (!stored) {
        console.error('Failed to save game state after placing stone');
      }
    } catch (e) {
      console.error('Error saving game state after placing stone:', e);
    }
  };
  
  // Pass the current turn (allow player to skip their move)
  const passTurn = () => {
    if (!state.gameState || !state.currentPlayer) {
      console.log("Cannot pass turn: no game state or current player");
      dispatch({ type: 'MOVE_ERROR', payload: 'Game not started properly' });
      return;
    }
    
    const { gameState, currentPlayer } = state;
    
    // Prevent playing if game status is not 'playing' (still waiting for opponent)
    if (gameState.status !== 'playing') {
      console.log("Cannot pass - waiting for opponent to join");
      dispatch({ type: 'MOVE_ERROR', payload: 'Waiting for opponent to join' });
      return;
    }
    
    // Check if it's the player's turn
    if (currentPlayer.color !== gameState.currentTurn) {
      console.log("Not your turn");
      dispatch({ type: 'MOVE_ERROR', payload: `Not your turn - waiting for ${gameState.currentTurn} to play` });
      return;
    }
    
    // Clear any previous move errors
    dispatch({ type: 'CLEAR_MOVE_ERROR' });
    
    // Update the game state for the pass move
    const updatedGameState: GameState = {
      ...gameState,
      currentTurn: gameState.currentTurn === 'black' ? 'white' : 'black',
      history: [...gameState.history, createPassMove()],
    };
    
    // If there are two consecutive passes, the game ends
    const historyLength = updatedGameState.history.length;
    if (historyLength >= 2) {
      const lastMove = updatedGameState.history[historyLength - 1];
      const secondLastMove = updatedGameState.history[historyLength - 2];
      
      if (isPassMove(lastMove) && isPassMove(secondLastMove)) {
        // Game ends after two consecutive passes
        updatedGameState.status = 'finished';
        
        // Default winner based on score (in a real implementation, calculate territory)
        const blackScore = updatedGameState.capturedStones.black;
        const whiteScore = updatedGameState.capturedStones.white + 6.5; // 6.5 komi for white
        updatedGameState.winner = whiteScore > blackScore ? 'white' : 'black';
      }
    }
    
    // Update local state immediately for responsive UI
    dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedGameState });
    
    // Emit move to server if socket is available
    if (state.socket && state.socket.connected) {
      const passData = {
        gameId: gameState.id,
        pass: true,
        color: currentPlayer.color,
        playerId: currentPlayer.id
      };
      
      console.log('Emitting pass to server:', passData);
      state.socket.emit('passTurn', passData);
    } else {
      console.warn('Socket not connected, updating state locally only');
      
      // Try to reconnect
      if (state.socket) {
        console.log('Attempting to reconnect...');
        state.socket.connect();
      }
    }
    
    // Update the game in localStorage as backup
    try {
      const stored = safelySetItem(`gosei-game-${updatedGameState.code}`, JSON.stringify(updatedGameState));
      if (!stored) {
        console.error('Failed to save game state after passing turn');
      }
    } catch (e) {
      console.error('Error saving game state after passing turn:', e);
    }
  };
  
  // Leave the current game
  const leaveGame = () => {
    // Notify server if socket is connected
    if (state.socket && state.socket.connected && state.gameState && state.currentPlayer) {
      console.log(`Emitting leaveGame event for game ${state.gameState.id}`);
      state.socket.emit('leaveGame', {
        gameId: state.gameState.id,
        playerId: state.currentPlayer.id
      });
    }
    
    dispatch({ type: 'LEAVE_GAME' });
  };
  
  // Reset the game state
  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };
  
  // Function to manually sync game state with server
  const syncGameState = () => {
    if (!state.gameState || !state.currentPlayer || !state.socket) {
      console.log('Cannot sync game state: missing required data');
      return;
    }
    
    console.log('Manually triggering game state sync');
    state.socket.emit('requestSync', {
      gameId: state.gameState.id,
      playerId: state.currentPlayer.id
    });
  };

  // Clear move error
  const clearMoveError = () => {
    dispatch({ type: 'CLEAR_MOVE_ERROR' });
  };

  return (
    <GameContext.Provider
      value={{
        gameState: state.gameState,
        loading: state.loading,
        error: state.error,
        moveError: state.moveError,
        currentPlayer: state.currentPlayer,
        createGame,
        joinGame,
        placeStone,
        passTurn,
        leaveGame,
        resetGame,
        syncGameState,
        clearMoveError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for using the game context
export const useGame = () => useContext(GameContext);

export default GameContext; 