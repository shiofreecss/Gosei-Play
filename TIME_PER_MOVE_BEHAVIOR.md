# Time per Move Automatic Behavior

## Overview
The "Time per Move" setting now automatically adjusts the game type and main time based on its value, creating a seamless experience for different play styles.

## Automatic Adjustments

### When Time per Move = 0
- **Game Type**: Automatically changes to "Even Game"
- **Main Time**: Restores to recommended time based on board size
  - 9×9 board: 10 minutes
  - 13×13 board: 20 minutes
  - 15×15 board: 30 minutes
  - 19×19 board: 45 minutes
  - 21×21 board: 60 minutes

### When Time per Move ≥ 5 seconds
- **Game Type**: Automatically changes to "Blitz Game"
- **Main Time**: Set to 0 minutes (relies entirely on per-move timing)

## User Interface Changes

### Input Field
- **Step**: Set to 5 seconds for easier increment selection
- **Help Text**: Updated to "For Blitz mode: Set to 5+ seconds. Set to 0 for Even Game."

### Behavior Flow
1. User adjusts "Time per Move" value
2. System automatically detects the value change
3. Game type and main time are updated accordingly
4. All settings are synchronized and saved to localStorage

## Implementation Details

The automatic adjustments are implemented in the `updateGameOption` function in `src/pages/HomePage.tsx`:

```typescript
if (key === 'timePerMove' && typeof value === 'number') {
  // ... sync timeControlOptions ...
  
  // Auto-change game type based on Time per Move value
  if (value === 0) {
    // Set to Even Game and restore main time based on board size
    newState.gameType = 'even';
    const recommendedTime = getRecommendedTimeForBoardSize(prev.boardSize);
    newState.timeControl = recommendedTime;
    newState.timeControlOptions = {
      ...newState.timeControlOptions,
      timeControl: recommendedTime
    };
  } else if (value >= 5) {
    // Set to Blitz Game and set main time to 0
    newState.gameType = 'blitz';
    newState.timeControl = 0;
    newState.timeControlOptions = {
      ...newState.timeControlOptions,
      timeControl: 0
    };
  }
}
```

## User Experience

### For Even Games
1. User sets "Time per Move" to 0
2. Game type automatically becomes "Even Game"
3. Main time is restored to appropriate value for board size
4. Traditional Go timing with main time only

### For Blitz Games
1. User sets "Time per Move" to 5+ seconds
2. Game type automatically becomes "Blitz Game"
3. Main time is set to 0
4. Fast-paced Go with per-move time limits

## Benefits

- **Intuitive**: Time per Move value directly correlates with game style
- **Automatic**: No need to manually adjust multiple settings
- **Consistent**: Ensures proper time control combinations
- **User-friendly**: Clear indication of what each setting does 