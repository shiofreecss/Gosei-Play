# Board Sizes and Specifications

This document details the supported board sizes, their star points (hoshi), and time requirements in Gosei Play.

## Board Size Overview

| Board Size | Difficulty Level | Recommended Time | Star Points | Common Usage |
|------------|-----------------|------------------|-------------|--------------|
| 9×9        | Beginner       | 10+ minutes      | 5 points    | Quick games, learning basics |
| 13×13      | Intermediate   | 20+ minutes      | 5 points    | Medium-length games |
| 15×15      | Intermediate+  | 30+ minutes      | 5 points    | Traditional Korean size |
| 19×19      | Advanced       | 45+ minutes      | 9 points    | Standard tournament size |
| 21×21      | Expert         | 60+ minutes      | 9 points    | Extended gameplay |

## Minimum Time Requirements

To ensure quality gameplay, the following minimum time settings are enforced:

- **9×9 Board**: 10 minutes main time per player
- **13×13 Board**: 20 minutes main time per player
- **15×15 Board**: 30 minutes main time per player
- **19×19 Board**: 45 minutes main time per player
- **21×21 Board**: 60 minutes main time per player

## Star Point (Hoshi) Positions

### 9×9 Board
- 5 star points at positions:
  - Corner points: (2,2), (2,6), (6,2), (6,6)
  - Center point: (4,4)

### 13×13 Board
- 5 star points at positions:
  - Corner points: (3,3), (3,9), (9,3), (9,9)
  - Center point: (6,6)

### 15×15 Board
- 5 star points at positions:
  - Corner points: (3,3), (3,11), (11,3), (11,11)
  - Center point: (7,7)

### 19×19 Board
- 9 star points at positions:
  - Corner points: (3,3), (3,15), (15,3), (15,15)
  - Side points: (3,9), (9,3), (9,15), (15,9)
  - Center point: (9,9)

### 21×21 Board
- 9 star points at positions:
  - Corner points: (3,3), (3,17), (17,3), (17,17)
  - Side points: (3,10), (10,3), (10,17), (17,10)
  - Center point: (10,10)

## Handicap Stone Placement

All board sizes support handicap games with 2-9 stones. The handicap stones are placed on the star points in a specific order:

1. First two stones: Opposite corners
2. Next two stones: Remaining corners
3. Fifth stone: Center point
4. Remaining stones: Side points

The exact positions for handicap stones match the star point positions listed above for each board size.

## Technical Implementation

The star points and board sizes are implemented in:
- `src/components/go-board/BoardSizePreview.tsx` - Visual preview component
- `src/components/go-board/GoBoard.tsx` - Main game board component
- `src/utils/handicapUtils.ts` - Handicap stone positions and related utilities

## Recommendations

1. **For Beginners**:
   - Start with 9×9 board to learn basic tactics
   - Progress to 13×13 when comfortable with fundamentals
   - Allow extra time in early games

2. **For Intermediate Players**:
   - 13×13 or 15×15 boards offer good balance
   - Consider shorter time controls for practice
   - Use handicap games for balanced matches

3. **For Advanced Players**:
   - 19×19 is the standard tournament size
   - 21×21 offers extended strategic possibilities
   - Adjust time controls based on opponent strength

## Notes

- Time settings can be adjusted upward from the minimums
- Handicap games automatically adjust komi to 0.5 points
- Board size affects territory calculation and overall strategy
- Larger boards require more time for proper gameplay
- Consider device screen size when selecting board size for optimal display 