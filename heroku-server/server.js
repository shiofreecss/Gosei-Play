const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create Express app
const app = express();
app.use(cors());

// In-memory storage for game data
const activeGames = new Map();
const socketToGame = new Map();
const DEBUG = true;

// Simple logging function
function log(message) {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    // Allow connections from any origin in development, but restrict in production
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://gosei-play.netlify.app', 'https://*.netlify.app', 'https://svr-01.gosei.xyz', 'https://*.gosei.xyz'] 
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Connection settings to improve reliability
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8
});

// Setup Socket.IO handlers
io.on('connection', (socket) => {
  log(`New client connected: ${socket.id}`);

  // Create a new game
  socket.on('createGame', ({ gameState, playerId }) => {
    log(`Creating game: ${gameState.id}, Code: ${gameState.code}`);
    
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
          // Add new player if not found
          gameState.players.push({
            id: playerId,
            username,
            color: 'white' // Second player is white
          });
          
          // If we now have 2 players, set status to playing
          if (gameState.players.length >= 2) {
            log(`Game ${gameId} now has 2 players, changing status to playing`);
            gameState.status = 'playing';
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
        status: gameState.status
      });
      
      // Send chat history if available
      if (gameState.chatMessages && gameState.chatMessages.length > 0) {
        log(`Sending ${gameState.chatMessages.length} chat messages to player ${playerId}`);
        socket.emit('chatHistory', {
          gameId,
          messages: gameState.chatMessages
        });
      }
      
      log(`Game ${gameId} now has ${gameState.players.length} players, status: ${gameState.status}`);
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
        capturedCount: capturedStones.capturedCount
      });
      log(`Broadcasting move to all clients in room ${gameId}`);
      
      // Also broadcast the full game state after a slight delay
      setTimeout(() => {
        io.to(gameId).emit('gameState', gameState);
        log(`Broadcasting full game state to all clients in room ${gameId}`);
      }, 200);
    }
  });

  // Handle a pass
  socket.on('passTurn', ({ gameId, color, playerId }) => {
    log(`Player ${playerId} passed their turn in game ${gameId}`);
    
    // Update the game state if it exists in memory
    const gameState = activeGames.get(gameId);
    if (gameState) {
      // Update turn
      gameState.currentTurn = color === 'black' ? 'white' : 'black';
      
      // Add pass to history
      gameState.history.push({ pass: true });
      
      // Check if this is the second consecutive pass (game end)
      const lastMove = gameState.history.length >= 2 ? gameState.history[gameState.history.length - 2] : null;
      
      if (lastMove && lastMove.pass) {
        log(`Second consecutive pass detected. Ending game ${gameId}`);
        gameState.status = 'finished';
      }
      
      // Store updated game state
      activeGames.set(gameId, gameState);
      
      // Broadcast updated game state to all clients in the room
      io.to(gameId).emit('gameState', gameState);
      
      // Also emit a specific "player passed" event
      io.to(gameId).emit('playerPassed', {
        gameId,
        playerId,
        color
      });
    }
  });

  // Handle chat messages
  socket.on('chatMessage', ({ gameId, playerId, username, message }) => {
    log(`Chat message from ${username} (${playerId}) in game ${gameId}: ${message}`);
    
    // Validate incoming message data
    if (!gameId || !playerId || !username || !message) {
      log(`Invalid chat message data received from ${socket.id}`);
      socket.emit('error', 'Invalid chat message: Missing required fields');
      return;
    }
    
    // Check if the game exists
    const gameState = activeGames.get(gameId);
    if (!gameState) {
      log(`Chat message for non-existent game ${gameId}`);
      socket.emit('error', `Cannot send chat: Game ${gameId} not found`);
      return;
    }
    
    // Check if user is part of this game
    const isPlayerInGame = gameState.players.some(p => p.id === playerId);
    if (!isPlayerInGame) {
      log(`Unauthorized chat message from ${playerId} who is not in game ${gameId}`);
      socket.emit('error', 'Cannot send chat: You are not a participant in this game');
      return;
    }
    
    // Create message object with timestamp
    const messageData = {
      gameId,
      playerId,
      username,
      message,
      timestamp: Date.now()
    };
    
    // Store chat messages with the game state (optional, limited to recent 50 messages)
    if (!gameState.chatMessages) {
      gameState.chatMessages = [];
    }
    gameState.chatMessages.push(messageData);
    
    // Limit stored chat history to 50 most recent messages
    if (gameState.chatMessages.length > 50) {
      gameState.chatMessages = gameState.chatMessages.slice(-50);
    }
    
    // Save updated game state
    activeGames.set(gameId, gameState);
    
    // Broadcast the message to all clients in the game room
    io.to(gameId).emit('chatMessageReceived', messageData);
    
    // Log success
    log(`Successfully broadcast chat message to all clients in room ${gameId}`);
  });

  // Player disconnection
  socket.on('disconnect', () => {
    log(`Client disconnected: ${socket.id}`);
    
    // Check if the disconnected socket was in a game
    const gameId = socketToGame.get(socket.id);
    if (gameId) {
      log(`Disconnected socket was in game ${gameId}`);
      
      // Clean up socket-to-game mapping
      socketToGame.delete(socket.id);
      
      // Get the game state
      const gameState = activeGames.get(gameId);
      if (gameState) {
        // Check if there are any players left in the game room
        const roomClients = io.sockets.adapter.rooms.get(gameId);
        const clientsCount = roomClients ? roomClients.size : 0;
        
        log(`Game ${gameId} has ${clientsCount} clients remaining`);
        
        if (clientsCount === 0) {
          // If all players have disconnected, keep the game temporarily (for reconnects)
          // We could set a timeout to eventually clean up the game
          setTimeout(() => {
            // Check again if the room is empty after the timeout
            const room = io.sockets.adapter.rooms.get(gameId);
            if (!room || room.size === 0) {
              log(`Game ${gameId} has been inactive for too long, removing it`);
              activeGames.delete(gameId);
            }
          }, 60 * 60 * 1000); // Keep game for 1 hour (adjust as needed)
        } else {
          // Notify remaining clients about the disconnection
          io.to(gameId).emit('playerDisconnected', { 
            gameId, 
            clientsRemaining: clientsCount
          });
        }
      }
    }
  });

  // Get game state
  socket.on('getGameState', ({ gameId }) => {
    log(`Request for game state of game ${gameId}`);
    
    const gameState = activeGames.get(gameId);
    if (gameState) {
      socket.emit('gameState', gameState);
    } else {
      socket.emit('error', `Game ${gameId} not found`);
    }
  });

  // Handle sync requests
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

  // Game ended
  socket.on('gameEnded', ({ gameId, score }) => {
    log(`Game ${gameId} ended with score: ${JSON.stringify(score)}`);
    
    const gameState = activeGames.get(gameId);
    if (gameState) {
      gameState.status = 'finished';
      gameState.score = score;
      
      // Store the final game state
      activeGames.set(gameId, gameState);
      
      // Broadcast to all clients in the room
      io.to(gameId).emit('gameState', gameState);
    }
  });
});

// Define capture functionality (directly copied from your original code)
function captureDeadStones(gameState, updatedStones, latestMove, playerColor) {
  // Get opponent's color
  const opponentColor = playerColor === 'black' ? 'white' : 'black';
  
  // Group opponent stones by connected groups
  const opponentStones = updatedStones.filter(stone => stone.position.x !== latestMove.x || stone.position.y !== latestMove.y)
                                    .filter(stone => stone.color === opponentColor);
  
  // Find all opponent groups with no liberties after this move
  const groupsToCapture = findGroupsWithNoLiberties(gameState, updatedStones, opponentStones);
  
  // Count captured stones for scorekeeping
  const capturedCount = groupsToCapture.flat().length;
  
  if (capturedCount > 0) {
    log(`Captured ${capturedCount} stones`);
  }
  
  // Remove captured stones
  const remainingStones = updatedStones.filter(stone => {
    // Keep the stone if it's not in any captured group
    return !groupsToCapture.some(group => 
      group.some(capturedStone => 
        capturedStone.position.x === stone.position.x && 
        capturedStone.position.y === stone.position.y
      )
    );
  });
  
  return { remainingStones, capturedCount };
}

function findGroupsWithNoLiberties(gameState, allStones, opponentStones) {
  // Find all connected groups of opponent stones
  const groups = findConnectedGroups(opponentStones);
  
  // Check each group for liberties
  const groupsWithNoLiberties = groups.filter(group => !hasLiberties(gameState, allStones, group));
  
  return groupsWithNoLiberties;
}

function findConnectedGroups(stones) {
  const groups = [];
  const visitedStones = new Set();
  
  stones.forEach(stone => {
    // Skip if this stone has already been visited
    const stoneKey = `${stone.position.x},${stone.position.y}`;
    if (visitedStones.has(stoneKey)) return;
    
    // Find all connected stones of the same color
    const group = [];
    const queue = [stone];
    
    while (queue.length > 0) {
      const currentStone = queue.shift();
      const currentKey = `${currentStone.position.x},${currentStone.position.y}`;
      
      // Skip if already processed
      if (visitedStones.has(currentKey)) continue;
      
      // Mark as visited and add to group
      visitedStones.add(currentKey);
      group.push(currentStone);
      
      // Check all 4 directions for adjacent stones of same color
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
      ];
      
      directions.forEach(dir => {
        const adjacentX = currentStone.position.x + dir.x;
        const adjacentY = currentStone.position.y + dir.y;
        
        // Skip if outside board bounds
        if (adjacentX < 0 || adjacentX >= 19 || adjacentY < 0 || adjacentY >= 19) return;
        
        // Find any stone at this position of the same color
        const adjacentStone = stones.find(s => 
          s.position.x === adjacentX && 
          s.position.y === adjacentY && 
          s.color === currentStone.color
        );
        
        if (adjacentStone) {
          queue.push(adjacentStone);
        }
      });
    }
    
    if (group.length > 0) {
      groups.push(group);
    }
  });
  
  return groups;
}

function hasLiberties(gameState, allStones, group) {
  // Check if any stone in the group has a liberty (adjacent empty space)
  for (const stone of group) {
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];
    
    for (const dir of directions) {
      const adjacentX = stone.position.x + dir.x;
      const adjacentY = stone.position.y + dir.y;
      
      // Skip if outside board bounds
      if (adjacentX < 0 || adjacentX >= 19 || adjacentY < 0 || adjacentY >= 19) continue;
      
      // Check if this position is empty (no stone there)
      const hasStoneAtPosition = allStones.some(s => 
        s.position.x === adjacentX && s.position.y === adjacentY
      );
      
      if (!hasStoneAtPosition) {
        // Found a liberty
        return true;
      }
    }
  }
  
  // No liberties found
  return false;
}

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Status information for monitoring
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    activeGames: activeGames.size,
    activeConnections: io.engine.clientsCount,
    uptime: process.uptime()
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 