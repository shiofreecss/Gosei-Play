# Byo-Yomi Clock Reset Issue

## Problem Description

When a player makes a move within their byo-yomi time, the byo-yomi clock should immediately reset to the full period time (e.g., 30 seconds) before the turn changes to the opponent. However, currently the clock is not properly resetting when a player makes a move during their byo-yomi period.

Example scenario:
1. Player is in byo-yomi mode with 30 seconds per period
2. Player makes a move when 15 seconds remain
3. The clock should reset to 30 seconds before changing to the opponent's turn
4. Currently, the clock is not resetting properly before the turn change

## Technical Analysis

The issue involves several components in both the client and server:

### Server-Side Components:
- In `server.js`, the byo-yomi reset logic is triggered when a move is made
- The server updates the player's byo-yomi time and sends a `timeUpdate` event
- The timing of events may cause the reset to be missed or not properly displayed

### Client-Side Components:
- `GameTimer.js` - Manages timer state and listens for time updates
- `TimeDisplay.js` - Handles the visual display of the timer
- Multiple event handlers may be causing inconsistent timer state updates

### Key Issues Identified:
1. Timing issues between the move event and timer update events
2. Multiple update paths in the client that may lead to inconsistent state
3. Lack of synchronization between server timer state and client display
4. Unclear visual feedback when a byo-yomi period resets

## Proposed Solution

### Server-Side Changes:
1. Add an explicit `byoYomiReset` event when a move is made in byo-yomi time
2. Ensure the `timeUpdate` event is sent before changing the turn
3. Add proper sequencing to guarantee the client receives the reset notification before turn change

```javascript
// In server.js makeMove handler
if (movingPlayer.isInByoYomi && gameState.timeControl && gameState.timeControl.byoYomiPeriods > 0) {
  // Reset current byo-yomi period when move is made
  movingPlayer.byoYomiTimeLeft = gameState.timeControl.byoYomiTime;
  
  // Send explicit byoYomiReset event
  io.to(gameId).emit('byoYomiReset', {
    gameId,
    color: movingPlayer.color,
    byoYomiTimeLeft: movingPlayer.byoYomiTimeLeft,
    byoYomiPeriodsLeft: movingPlayer.byoYomiPeriodsLeft
  });
  
  // Then send time update
  io.to(gameId).emit('timeUpdate', {
    gameId,
    playerId: movingPlayer.id,
    color: movingPlayer.color,
    timeRemaining: movingPlayer.timeRemaining,
    byoYomiPeriodsLeft: movingPlayer.byoYomiPeriodsLeft,
    byoYomiTimeLeft: movingPlayer.byoYomiTimeLeft,
    isInByoYomi: movingPlayer.isInByoYomi
  });
  
  // Small delay before changing turn
  setTimeout(() => {
    // Update turn and broadcast game state
    // ...
  }, 100);
}
```

### Client-Side Changes:
1. Enhance the `GameTimer` component to handle the explicit reset event
2. Improve visual feedback when a byo-yomi period resets
3. Add better debugging and logging to trace time update events

```javascript
// In GameTimer.js
const handleByoYomiReset = (data) => {
  const { color, byoYomiTimeLeft, byoYomiPeriodsLeft } = data;
  console.log(`Byo-yomi reset for ${color}: ${byoYomiTimeLeft}s`);
  
  // Update time display immediately with reset animation
  setPlayerTimes(prev => ({
    ...prev,
    [color]: {
      ...prev[color],
      byoYomiTimeLeft: byoYomiTimeLeft,
      byoYomiPeriodsLeft: byoYomiPeriodsLeft,
      isInByoYomi: true,
      justReset: true // Flag for animation
    }
  }));
  
  // Clear reset animation flag after delay
  setTimeout(() => {
    setPlayerTimes(prev => ({
      ...prev,
      [color]: {
        ...prev[color],
        justReset: false
      }
    }));
  }, 1000);
};
```

### Testing:
1. Test byo-yomi resets at different remaining times
2. Verify the visual feedback is clear to the user
3. Ensure the timer state is consistent between server and client
4. Check that the reset happens before the turn changes

## Implementation Steps

1. Add `byoYomiReset` event in server-side move handler
2. Enhance client-side event handling in `GameTimer.js`
3. Improve visual feedback in `TimeDisplay.js` 
4. Add debugging logs to trace the flow of events
5. Test the changes thoroughly in different scenarios

## Related Files

- `server/server.js` - Server-side move handler and timer logic
- `client/src/components/GameTimer.js` - Main timer component
- `client/src/components/TimeDisplay.js` - Timer display component
- `src/context/GameContext.tsx` - Game state management 