# Blitz Game Byo-yomi Behavior

## Overview
In Blitz games, Byo-yomi periods are automatically disabled and the controls are made unavailable since Blitz games rely entirely on per-move timing rather than traditional Byo-yomi periods.

## Automatic Behavior

### When Game Type is "Blitz Game"
- **Byo-yomi Periods**: Automatically set to "No byo-yomi" (0 periods)
- **Byo-yomi Periods Dropdown**: Disabled and grayed out
- **Byo-yomi Time Dropdown**: Disabled and grayed out
- **Help Text**: Updated to explain why Byo-yomi is not available

### When Switching Away from Blitz Game
- **Byo-yomi Controls**: Re-enabled and available for selection
- **Previous Settings**: Can be restored or set to new values

## Implementation Details

### Game Type Change Handler
When switching to Blitz game type, the system automatically disables Byo-yomi:

```typescript
} else if (gameType === 'blitz') {
  // Set defaults for Blitz Game - disable byo-yomi
  newState.timeControlOptions = {
    ...prev.timeControlOptions,
    byoYomiPeriods: 0
  };
}
```

### UI Disabled State
Both Byo-yomi dropdowns are disabled when game type is "blitz":

```typescript
// Byo-yomi Periods dropdown
disabled={gameOptions.gameType === 'blitz'}

// Byo-yomi Time dropdown  
disabled={!gameOptions.timeControlOptions?.byoYomiPeriods || gameOptions.gameType === 'blitz'}
```

### Dynamic Help Text
Help text changes based on game type:

```typescript
// Byo-yomi Periods help text
{gameOptions.gameType === 'blitz' 
  ? 'Not available in Blitz games (uses per-move timing)'
  : 'Number of extra time periods after main time'
}

// Byo-yomi Time help text
{gameOptions.gameType === 'blitz' 
  ? 'Not available in Blitz games'
  : 'Time per byo-yomi period (auto-set to 30s when periods selected)'
}
```

## User Experience

### Visual Indicators
- **Disabled Dropdowns**: Grayed out and non-interactive
- **Clear Help Text**: Explains why Byo-yomi is not available
- **Consistent State**: Both period and time controls disabled together

### Behavior Flow
1. User selects "Blitz Game" from Game Type dropdown
2. System automatically sets Byo-yomi periods to 0
3. Both Byo-yomi dropdowns become disabled
4. Help text updates to explain the restriction
5. User can still adjust Time per Move for Blitz timing

### Switching Game Types
1. User switches from Blitz to another game type
2. Byo-yomi controls become enabled again
3. User can select desired Byo-yomi settings
4. Help text returns to normal explanations

## Rationale

### Why Disable Byo-yomi in Blitz Games?
- **Timing Conflict**: Blitz games use per-move timing, which conflicts with Byo-yomi periods
- **Simplicity**: Reduces confusion about which timing system is active
- **Standard Practice**: Follows conventional Go timing rules
- **User Clarity**: Makes it clear that Blitz = per-move timing only

### Benefits
- **Prevents Confusion**: Users can't accidentally set conflicting timing systems
- **Clear Intent**: Makes it obvious that Blitz games work differently
- **Simplified UI**: Reduces cognitive load when setting up Blitz games
- **Consistent Behavior**: Ensures proper time control combinations

## Technical Notes

- The disabled state is applied immediately when game type changes
- Settings are preserved when switching away from Blitz and back
- All changes are synchronized with the timeControlOptions object
- Visual feedback clearly indicates disabled state 