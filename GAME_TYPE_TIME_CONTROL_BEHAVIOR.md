# Game Type Time Control Behavior

## Overview
When selecting specific game types, the time control settings are automatically adjusted to appropriate defaults.

## Automatic Time Control Adjustments

### Even Game, Handicap Game, and Teaching Game
When any of these game types are selected, the following time control settings are automatically set:

- **Time Per Move**: 0 seconds (disabled)
- **Fischer Increment**: 0 seconds (no increment by default)
- **Byo-yomi Periods**: 0 (no byo-yomi by default)

### Other Game Types
- **Blitz Game**: No automatic adjustments (retains current settings)

## Implementation Details

The automatic adjustments are implemented in the `updateGameOption` function in `src/pages/HomePage.tsx`. When the `gameType` option is updated to 'even', 'handicap', or 'teaching', the following properties are automatically set:

```typescript
newState.timePerMove = 0;
newState.timeControlOptions = {
  ...prev.timeControlOptions,
  timePerMove: 0,
  fischerTime: 0,
  byoYomiPeriods: 0
};
```

## User Experience

1. User selects "Even Game", "Handicap Game", or "Teaching Game" from the Game Type dropdown
2. Time control settings are automatically updated to the defaults
3. User can still manually adjust these settings if desired
4. Settings are preserved in localStorage for future sessions

## Testing

To test this functionality:

1. Open the game creation interface
2. Select different game types and observe the time control settings
3. Verify that Even Game, Handicap Game, and Teaching Game all set the time controls to the specified defaults
4. Verify that Blitz Game does not change the time control settings
5. Verify that manual changes to time controls are still possible after automatic adjustment 