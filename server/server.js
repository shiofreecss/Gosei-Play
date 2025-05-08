const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow connections from any origin for development
    methods: ["GET", "POST"]
  },
  // Add these settings to fix disconnection issues
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8
});

// Store active games in memory
const activeGames = new Map();
// Map socket IDs to game IDs for quick lookup
const socketToGame = new Map();
// Debug flag
const DEBUG = true;

// Simple logging function
function log(message) {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

io.on('connection', (socket) => {
  log(`New client connected: ${socket.id}`);

  // Create a new game
  socket.on('createGame', ({ gameState, playerId }) => {
    log(`Creating game: ${gameState.id}, Code: ${gameState.code}`);
    
    // Check for color preference if provided
    if (gameState.colorPreference) {
      log(`Owner requested color preference: ${gameState.colorPreference}`);
      
      // Find the owner player
      const ownerPlayer = gameState.players.find(p => p.id === playerId);
      
      if (ownerPlayer) {
        if (gameState.colorPreference === 'black') {
          ownerPlayer.color = 'black';
        } else if (gameState.colorPreference === 'white') {
          ownerPlayer.color = 'white';
        }
        // If 'random', keep the default assignment
      }
    }
    
    // Initialize move timer if specified
    if (gameState.timePerMove && gameState.timePerMove > 0) {
      gameState.lastMoveTime = Date.now();
      
      // Initialize time remaining for each player
      if (!gameState.players[0].timeRemaining) {
        gameState.players.forEach(player => {
          player.timeRemaining = gameState.timePerMove;
        });
      }
    }
    
    // Store the game state
    activeGames.set(gameState.id, gameState);
    
    // Join the socket to the game's room
    socket.join(gameState.id);
    socketToGame.set(socket.id, gameState.id);
    
    log(`Player ${playerId} created and joined game ${gameState.id}`);
    
    // Send an acknowledgment back to the client
    socket.emit('gameCreated', { success: true, gameId: gameState.id });
  });

  // Join an existing game
  socket.on('joinGame', ({ gameId, playerId, username, isReconnect }) => {
    log(`Player ${playerId} (${username}) joining game ${gameId}`);
    
    // Add socket to the game's room
    socket.join(gameId);
    socketToGame.set(socket.id, gameId);
    
    // Get the current game state
    const gameState = activeGames.get(gameId);
    
    if (gameState) {
      // If this is not a reconnect, update the game state
      if (!isReconnect) {
        // Find the player in the game state
        const playerIndex = gameState.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
          // Determine color for new player
          let newPlayerColor = 'white'; // Default second player is white
          
          // Check if the owner had a color preference
          const ownerPlayer = gameState.players[0];
          if (ownerPlayer && ownerPlayer.color) {
            // Assign opposite color to second player
            newPlayerColor = ownerPlayer.color === 'black' ? 'white' : 'black';
          }
          
          // Add new player with the determined color
          gameState.players.push({
            id: playerId,
            username,
            color: newPlayerColor,
            timeRemaining: gameState.timePerMove || 0, // Initialize time remaining
          });
          
          // If we now have 2 players, set status to playing
          if (gameState.players.length >= 2) {
            log(`Game ${gameId} now has 2 players, changing status to playing`);
            gameState.status = 'playing';
            gameState.lastMoveTime = Date.now(); // Initialize move timer
            
            // Keep the current turn as is for handicap games (should be 'white')
            // Only set to 'black' for non-handicap games
            if (gameState.gameType !== 'handicap') {
              gameState.currentTurn = 'black';
            } else {
              log(`This is a handicap game. Current turn remains: ${gameState.currentTurn}`);
              log(`Handicap stones on board: ${gameState.board.stones.filter(s => s.color === 'black').length}`);
            }
            
            log(`Game's currentTurn is set to: ${gameState.currentTurn}`);
            // Debug log to show which player has which color
            gameState.players.forEach(player => {
              log(`Player ${player.username} is ${player.color}`);
            });
          }
        }
        
        // Update stored game state
        activeGames.set(gameId, gameState);
        
        // Notify other players in the room
        socket.to(gameId).emit('playerJoined', {
          gameId,
          playerId,
          username
        });
        
        // Broadcast updated game state to ALL clients in the room
        io.to(gameId).emit('gameState', gameState);
        log(`Broadcasting updated game state to all clients in room ${gameId}`);
      } else {
        // Just send current game state to the reconnecting client
        socket.emit('gameState', gameState);
        log(`Sending game state to reconnecting player ${playerId}`);
      }
      
      // Send join acknowledgment
      socket.emit('joinedGame', { 
        success: true, 
        gameId, 
        playerId,
        numPlayers: gameState.players.length,
        status: gameState.status,
        currentTurn: gameState.currentTurn // Send current turn info explicitly
      });
      
      log(`Game ${gameId} now has ${gameState.players.length} players, status: ${gameState.status}, currentTurn: ${gameState.currentTurn}`);
    } else {
      log(`Game ${gameId} not found in active games`);
      socket.emit('error', `Game ${gameId} not found`);
    }
  });

  // Handle a move
  socket.on('makeMove', ({ gameId, position, color, playerId }) => {
    log(`Player ${playerId} made move at (${position.x}, ${position.y}) in game ${gameId}`);
    
    // Update the game state if it exists in memory
    const gameState = activeGames.get(gameId);
    if (gameState) {
      // First, check if the move is valid (not occupied)
      const isOccupied = gameState.board.stones.some(
        stone => stone.position.x === position.x && stone.position.y === position.y
      );
      
      if (isOccupied) {
        log(`Invalid move - position already occupied`);
        socket.emit('error', 'Invalid move - position already occupied');
        return;
      }
      
      // Check if the player has timed out (if move timer is enabled)
      if (gameState.timePerMove && gameState.timePerMove > 0 && gameState.lastMoveTime) {
        const currentPlayer = gameState.players.find(p => p.color === color);
        if (currentPlayer && currentPlayer.timeRemaining !== undefined) {
          const elapsedTime = Math.floor((Date.now() - gameState.lastMoveTime) / 1000);
          const remainingTime = Math.max(0, currentPlayer.timeRemaining - elapsedTime);
          
          if (remainingTime <= 0) {
            log(`Player ${playerId} has run out of time`);
            // Handle timeout - opponent wins
            gameState.status = 'finished';
            gameState.winner = color === 'black' ? 'white' : 'black';
            activeGames.set(gameId, gameState);
            
            // Broadcast timeout
            io.to(gameId).emit('playerTimeout', {
              gameId,
              playerId,
              color
            });
            
            // Broadcast updated game state
            io.to(gameId).emit('gameState', gameState);
            return;
          }
          
          // Update remaining time
          currentPlayer.timeRemaining = remainingTime;
        }
      }
      
      // Add the stone
      const updatedStones = [...gameState.board.stones, {
        position,
        color
      }];
      
      // Capture opponent stones that have no liberties
      const capturedStones = captureDeadStones(gameState, updatedStones, position, color);
      
      // Log capture info 
      if (capturedStones.capturedCount > 0) {
        log(`Captured ${capturedStones.capturedCount} stones from ${color === 'black' ? 'white' : 'black'}`);
      }
      
      // Update game state
      gameState.board.stones = capturedStones.remainingStones;
      gameState.currentTurn = color === 'black' ? 'white' : 'black';
      gameState.history.push(position);
      
      // Reset timer for the next move
      gameState.lastMoveTime = Date.now();
      
      // Reset move timer for the player who just made a move
      if (gameState.timePerMove && gameState.timePerMove > 0) {
        const currentPlayer = gameState.players.find(p => p.color === color);
        if (currentPlayer) {
          currentPlayer.timeRemaining = gameState.timePerMove;
        }
      }
      
      // Update captured stones count
      if (!gameState.capturedStones) {
        gameState.capturedStones = { black: 0, white: 0 };
      }
      
      // Capturing player gets the points
      if (capturedStones.capturedCount > 0) {
        gameState.capturedStones[color] += capturedStones.capturedCount;
        log(`Updated captured stones count. ${color} now has ${gameState.capturedStones[color]} captures`);
      }
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast the move to ALL clients in the room IMMEDIATELY
      io.to(gameId).emit('moveMade', {
        gameId,
        position,
        color,
        playerId,
        capturedCount: capturedStones.capturedCount,
        timeRemaining: gameState.players.find(p => p.color === gameState.currentTurn)?.timeRemaining
      });
      log(`Broadcasting move to all clients in room ${gameId}`);
      
      // Also broadcast the full game state after a slight delay
      setTimeout(() => {
        io.to(gameId).emit('gameState', gameState);
        log(`Broadcasting full game state to all clients in room ${gameId}`);
      }, 200);
    }
  });

  // Timer tick event to update remaining time
  socket.on('timerTick', ({ gameId }) => {
    const gameState = activeGames.get(gameId);
    if (gameState && gameState.status === 'playing' && gameState.timePerMove > 0 && gameState.lastMoveTime) {
      const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurn);
      
      if (currentPlayer && currentPlayer.timeRemaining !== undefined) {
        const elapsedTime = Math.floor((Date.now() - gameState.lastMoveTime) / 1000);
        const remainingTime = Math.max(0, currentPlayer.timeRemaining - elapsedTime);
        
        // Update the timeRemaining in the game state to ensure it's accurate
        currentPlayer.timeRemaining = remainingTime;
        
        if (remainingTime <= 0 && currentPlayer.timeRemaining > 0) {
          // Player has just run out of time
          log(`Player ${currentPlayer.id} has run out of time`);
          
          // Handle timeout - opponent wins
          gameState.status = 'finished';
          gameState.winner = gameState.currentTurn === 'black' ? 'white' : 'black';
          activeGames.set(gameId, gameState);
          
          // Broadcast timeout
          io.to(gameId).emit('playerTimeout', {
            gameId,
            playerId: currentPlayer.id,
            color: currentPlayer.color
          });
          
          // Broadcast updated game state
          io.to(gameId).emit('gameState', gameState);
        } else {
          // Always update time for both players for better synchronization
          const blackPlayer = gameState.players.find(p => p.color === 'black');
          const whitePlayer = gameState.players.find(p => p.color === 'white');
          
          // Send time updates for both players
          if (blackPlayer && blackPlayer.timeRemaining !== undefined) {
            io.to(gameId).emit('timeUpdate', {
              gameId,
              playerId: blackPlayer.id,
              color: 'black',
              timeRemaining: blackPlayer.color === gameState.currentTurn ? 
                remainingTime : blackPlayer.timeRemaining
            });
          }
          
          if (whitePlayer && whitePlayer.timeRemaining !== undefined) {
            io.to(gameId).emit('timeUpdate', {
              gameId,
              playerId: whitePlayer.id,
              color: 'white',
              timeRemaining: whitePlayer.color === gameState.currentTurn ? 
                remainingTime : whitePlayer.timeRemaining
            });
          }
          
          // Also send a full game state update periodically (every 5 seconds) to ensure clients are in sync
          const now = Date.now();
          if (!gameState.lastFullStateUpdate || now - gameState.lastFullStateUpdate > 5000) {
            gameState.lastFullStateUpdate = now;
            io.to(gameId).emit('gameState', gameState);
          }
        }
      }
    }
  });

  // Handle a pass
  socket.on('passTurn', ({ gameId, color, playerId, endGame }) => {
    log(`Player ${playerId} passed their turn in game ${gameId}`);
    
    // Update the game state if it exists in memory
    const gameState = activeGames.get(gameId);
    if (gameState) {
      // Update turn
      gameState.currentTurn = color === 'black' ? 'white' : 'black';
      
      // Add pass to history
      gameState.history.push({ pass: true });
      
      // Reset timer for the next move
      gameState.lastMoveTime = Date.now();
      
      // Reset move timer for the player who just passed
      if (gameState.timePerMove && gameState.timePerMove > 0) {
        const currentPlayer = gameState.players.find(p => p.color === color);
        if (currentPlayer) {
          currentPlayer.timeRemaining = gameState.timePerMove;
        }
      }
      
      // Check if this is the second consecutive pass (game end)
      const historyLength = gameState.history.length;
      if (historyLength >= 2) {
        const lastMove = gameState.history[historyLength - 1];
        const secondLastMove = gameState.history[historyLength - 2];
        
        if (lastMove.pass && secondLastMove.pass) {
          // Transition to scoring phase instead of finishing immediately
          gameState.status = 'scoring';
          gameState.deadStones = []; // Initialize empty dead stones array
          
          log(`Game ${gameId} has transitioned to scoring phase after two consecutive passes.`);
        }
      }
      
      // If client explicitly signals this is an end game move, ensure scoring state
      if (endGame) {
        gameState.status = 'scoring';
        gameState.deadStones = gameState.deadStones || []; // Ensure deadStones array exists
        log(`Client signaled end game, ensuring scoring state for game ${gameId}`);
      }
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast the pass to ALL clients in the room
      io.to(gameId).emit('turnPassed', {
        gameId,
        color,
        playerId,
        nextTurn: gameState.currentTurn,
        isEndGame: gameState.status === 'scoring',
        timeRemaining: gameState.players.find(p => p.color === gameState.currentTurn)?.timeRemaining
      });
      log(`Broadcasting pass to all clients in room ${gameId}`);
      
      // Also broadcast the full game state
      io.to(gameId).emit('gameState', gameState);
      log(`Broadcasting updated game state to all clients in room ${gameId}`);
      
      if (gameState.status === 'scoring') {
        log(`Broadcasting scoring phase start to all clients in room ${gameId}`);
        io.to(gameId).emit('scoringPhaseStarted', { gameId });
      }
    }
  });

  // Handle player leaving
  socket.on('leaveGame', ({ gameId, playerId }) => {
    log(`Player ${playerId} leaving game ${gameId}`);
    
    // Leave the socket room
    socket.leave(gameId);
    socketToGame.delete(socket.id);
    
    // Notify other players
    socket.to(gameId).emit('playerLeft', {
      gameId,
      playerId
    });
    
    // Check if there are any players left in the game room
    const room = io.sockets.adapter.rooms.get(gameId);
    const clientsCount = room ? room.size : 0;
    
    log(`Game ${gameId} has ${clientsCount} clients remaining after player left`);
    
    // If no players left in the room, remove the game immediately
    if (!room || clientsCount === 0) {
      log(`No players remaining in game ${gameId}, removing it immediately`);
      activeGames.delete(gameId);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    log(`Client disconnected: ${socket.id}`);
    
    // Check if this socket was in a game
    const gameId = socketToGame.get(socket.id);
    if (gameId) {
      socket.to(gameId).emit('playerDisconnected', {
        gameId,
        socketId: socket.id
      });
      
      // Clean up
      socketToGame.delete(socket.id);
      
      // If no more clients in the game, remove it after a timeout
      setTimeout(() => {
        const room = io.sockets.adapter.rooms.get(gameId);
        if (!room || room.size === 0) {
          log(`Removing inactive game ${gameId}`);
          activeGames.delete(gameId);
        }
      }, 5 * 60 * 1000); // 5 minutes timeout
    }
  });

  // Handle game state sync request
  socket.on('requestSync', ({ gameId, playerId }) => {
    log(`Player ${playerId} requested sync for game ${gameId}`);
    
    const gameState = activeGames.get(gameId);
    if (gameState) {
      log(`Sending sync data for game ${gameId}`);
      socket.emit('syncGameState', gameState);
      
      // Also broadcast to all other clients to ensure everyone is in sync
      socket.to(gameId).emit('syncRequest', { gameId, playerId });
    } else {
      log(`Game ${gameId} not found for sync request`);
      socket.emit('error', `Game ${gameId} not found`);
    }
  });

  // Handle game end after scoring
  socket.on('gameEnded', ({ gameId, score, winner, territory }) => {
    log(`Game ${gameId} has ended. Winner: ${winner}`);
    
    // Update the game state if it exists in memory
    const gameState = activeGames.get(gameId);
    if (gameState) {
      // Update game status to finished
      gameState.status = 'finished';
      gameState.score = score;
      gameState.winner = winner;
      gameState.territory = territory;
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast the game end to ALL clients in the room
      io.to(gameId).emit('gameFinished', {
        gameId,
        score,
        winner,
        territory
      });
      log(`Broadcasting game end to all clients in room ${gameId}`);
      
      // Also broadcast the full game state
      io.to(gameId).emit('gameState', gameState);
      log(`Broadcasting final game state to all clients in room ${gameId}`);
    }
  });

  // Handle cancel scoring phase
  socket.on('cancelScoring', ({ gameId }) => {
    log(`Canceling scoring phase for game ${gameId}`);
    
    // Update the game state if it exists in memory
    const gameState = activeGames.get(gameId);
    if (gameState) {
      // Only allow cancellation if in scoring mode
      if (gameState.status !== 'scoring') {
        log(`Cannot cancel scoring: game ${gameId} not in scoring mode`);
        socket.emit('error', 'Cannot cancel scoring: game not in scoring mode');
        return;
      }
      
      // Return to playing state
      gameState.status = 'playing';
      gameState.deadStones = []; // Clear dead stones
      gameState.territory = undefined; // Clear territory visualization
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast the cancel to ALL clients in the room
      io.to(gameId).emit('scoringCanceled', {
        gameId
      });
      log(`Broadcasting scoring cancellation to all clients in room ${gameId}`);
      
      // Also broadcast the full game state
      io.to(gameId).emit('gameState', gameState);
      log(`Broadcasting updated game state to all clients in room ${gameId}`);
    }
  });

  // Handle player resignation
  socket.on('resignGame', ({ gameId, playerId, color }) => {
    log(`Player ${playerId} (${color}) resigned from game ${gameId}`);
    
    // Update the game state if it exists in memory
    const gameState = activeGames.get(gameId);
    if (gameState) {
      // Set game as finished with the opponent as winner
      gameState.status = 'finished';
      gameState.winner = color === 'black' ? 'white' : 'black';
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast the resignation to ALL clients in the room
      io.to(gameId).emit('playerResigned', {
        gameId,
        playerId,
        color,
        winner: gameState.winner
      });
      log(`Broadcasting resignation to all clients in room ${gameId}`);
      
      // Also broadcast the full game state
      io.to(gameId).emit('gameState', gameState);
      log(`Broadcasting updated game state to all clients in room ${gameId}`);
    }
  });

  // Handle chat messages
  socket.on('chatMessage', ({ gameId, playerId, username, message }) => {
    log(`Chat message from ${username} (${playerId}) in game ${gameId}: ${message}`);
    
    // Get the current game state
    const gameState = activeGames.get(gameId);
    
    if (gameState) {
      // Broadcast the message to all clients in the game room
      io.to(gameId).emit('chatMessage', {
        id: Date.now().toString(),
        playerId,
        username,
        message,
        timestamp: Date.now()
      });
      
      log(`Broadcasting chat message to all clients in room ${gameId}`);
    }
  });

  // Handle undo request
  socket.on('requestUndo', ({ gameId, playerId, moveIndex }) => {
    log(`Player ${playerId} requested undo to move ${moveIndex} in game ${gameId}`);
    
    const gameState = activeGames.get(gameId);
    if (gameState) {
      // Add undo request to game state
      gameState.undoRequest = {
        requestedBy: playerId,
        moveIndex
      };
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast updated game state to all clients in the room
      io.to(gameId).emit('gameState', gameState);
      log(`Broadcasting undo request to all clients in room ${gameId}`);
    }
  });

  // Handle undo response
  socket.on('respondToUndoRequest', ({ gameId, playerId, accepted, moveIndex }) => {
    log(`Player ${playerId} ${accepted ? 'accepted' : 'rejected'} undo request in game ${gameId}`);
    
    const gameState = activeGames.get(gameId);
    if (gameState) {
      if (accepted) {
        // Revert to the requested move index
        const historyToKeep = gameState.history.slice(0, moveIndex);
        
        // Reset board state
        let stones = [];
        
        // Add handicap stones first if any
        if (historyToKeep.length === 0 && gameState.currentTurn === 'white' && 
            gameState.board.stones.some(s => s.color === 'black')) {
          stones = gameState.board.stones.filter(s => s.color === 'black');
        } else {
          // Replay history to create the board state
          let currentTurn = 'black';
          
          historyToKeep.forEach(move => {
            if (!move.pass) {
              stones.push({
                position: move,
                color: currentTurn
              });
              currentTurn = currentTurn === 'black' ? 'white' : 'black';
            } else {
              currentTurn = currentTurn === 'black' ? 'white' : 'black';
            }
          });
        }
        
        // Calculate next turn
        const nextTurn = historyToKeep.length === 0 ? 
          (gameState.board.stones.some(s => s.color === 'black') ? 'white' : 'black') :
          (historyToKeep.length % 2 === 0 ? 'black' : 'white');
        
        // Update game state
        gameState.board.stones = stones;
        gameState.currentTurn = nextTurn;
        gameState.history = historyToKeep;
      }
      
      // Clear the undo request
      gameState.undoRequest = undefined;
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast updated game state to all clients in the room
      io.to(gameId).emit('gameState', gameState);
      log(`Broadcasting updated game state after undo response to all clients in room ${gameId}`);
    }
  });
});

// Route to check server status
app.get('/', (req, res) => {
  res.send('Socket server is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  log(`Socket server listening on port ${PORT}`);
});

// Helper function to get adjacent positions
function getAdjacentPositions(position) {
  return [
    { x: position.x, y: position.y - 1 }, // up
    { x: position.x + 1, y: position.y }, // right
    { x: position.x, y: position.y + 1 }, // down
    { x: position.x - 1, y: position.y }, // left
  ];
}

// Check if a position is within the bounds of the board
function isWithinBounds(position, boardSize) {
  return position.x >= 0 && position.x < boardSize && position.y >= 0 && position.y < boardSize;
}

// Find stone at a position
function findStoneAt(position, stones) {
  return stones.find(
    stone => stone.position.x === position.x && stone.position.y === position.y
  );
}

// Get connected group of stones
function getConnectedGroup(position, stones, boardSize) {
  const stone = findStoneAt(position, stones);
  if (!stone) return [];
  
  const color = stone.color;
  const visited = new Set();
  const group = [];
  
  function visit(pos) {
    const key = `${pos.x},${pos.y}`;
    if (visited.has(key)) return;
    
    visited.add(key);
    
    const stoneAtPos = findStoneAt(pos, stones);
    if (!stoneAtPos || stoneAtPos.color !== color) return;
    
    group.push(pos);
    
    // Visit adjacent positions
    const adjacentPositions = getAdjacentPositions(pos).filter(p => 
      isWithinBounds(p, boardSize)
    );
    
    adjacentPositions.forEach(visit);
  }
  
  visit(position);
  return group;
}

// Check if a position is empty
function isEmpty(position, stones) {
  return !stones.some(
    stone => stone.position.x === position.x && stone.position.y === position.y
  );
}

// Count liberties for a group of stones
function countLiberties(group, stones, boardSize) {
  const liberties = new Set();
  
  group.forEach(position => {
    const adjacentPositions = getAdjacentPositions(position).filter(p => 
      isWithinBounds(p, boardSize)
    );
    
    adjacentPositions.forEach(adjPos => {
      if (isEmpty(adjPos, stones)) {
        liberties.add(`${adjPos.x},${adjPos.y}`);
      }
    });
  });
  
  return liberties.size;
}

// Capture stones that have no liberties after a move
function captureDeadStones(gameState, updatedStones, lastMovePosition, playerColor) {
  const boardSize = gameState.board.size;
  const oppositeColor = playerColor === 'black' ? 'white' : 'black';
  
  // Check all adjacent positions for opponent stones
  const adjacentPositions = getAdjacentPositions(lastMovePosition).filter(p => 
    isWithinBounds(p, boardSize)
  );
  
  let capturedCount = 0;
  let remainingStones = [...updatedStones];
  
  // Check each adjacent position for enemy groups that might be captured
  adjacentPositions.forEach(adjPos => {
    const stoneAtPos = findStoneAt(adjPos, remainingStones);
    
    // If there's an opponent's stone at this position
    if (stoneAtPos && stoneAtPos.color === oppositeColor) {
      // Get the entire connected group
      const group = getConnectedGroup(adjPos, remainingStones, boardSize);
      
      // Check if this group has any liberties
      const liberties = countLiberties(group, remainingStones, boardSize);
      
      // If the group has no liberties, remove all stones in the group
      if (liberties === 0) {
        // Remove captured stones
        remainingStones = remainingStones.filter(stone => 
          !group.some(pos => pos.x === stone.position.x && pos.y === stone.position.y)
        );
        
        capturedCount += group.length;
        log(`Captured ${group.length} ${oppositeColor} stones`);
      }
    }
  });
  
  // Also check if the placed stone's group has liberties
  const newStoneGroup = getConnectedGroup(lastMovePosition, remainingStones, boardSize);
  const newStoneLiberties = countLiberties(newStoneGroup, remainingStones, boardSize);
  
  if (newStoneLiberties === 0) {
    log(`Suicide move detected!`);
    // In the server, we'll still allow the move even if it's suicide
    // Client-side validation should prevent this
  }
  
  return { remainingStones, capturedCount };
} 