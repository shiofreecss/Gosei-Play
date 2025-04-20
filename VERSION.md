# Gosei Play Version History

## v1.0.2 (2025-04-19)

### Features
- Improved UI layout and controls organization
- Added chat functionality for in-game communication
- Enhanced game control panel with integrated Pass, Resign, and Undo buttons
- Streamlined interface with cleaner board view
- Added authentic stone placement sounds with toggle option in game controls
- Added zen background music player with multiple tracks and volume control
  - Music player appears only during active gameplay
  - Features three background music tracks (Traditional Go, Zen Music 1, Zen Music 2)
  - Includes volume control and track selection
  - Persists playback state between game screens

### Improvements
- Moved game controls to a dedicated section in the Game Information panel
- Reorganized game information display for better readability
- Added responsive layout for chat panel on different screen sizes
- Improved visual feedback for game actions
- Added sound settings in the game controls
- Sound preferences are saved between sessions
- Music player automatically hides during game setup and join screens

### Bug Fixes
- Fixed synchronization issues in time control display
- Fixed timer discrepancies between players in Blitz Go games

## v1.0.1 build2 (2025-04-19)

### Bug Fixes
- Fixed critical issue with handicap game turn order
  - White now correctly plays first after black's handicap stones are placed
  - Fixed turn handling in game creation and joining logic
  - Corrected turn alternation in move handling

### Known Issues
- None reported

## v1.0.1 build1 (2025-04-18)

### Features
- Initial implementation of handicap games
- Support for multiple board sizes (9x9, 13x13, 19x19)
- Basic scoring rules implemented (Japanese, Chinese, Korean, AGA, Ing)
- Real-time multiplayer functionality
- Game state persistence
- Move validation and capture logic

### Known Issues
- Handicap games incorrectly started with black's turn instead of white's turn (Fixed in build2)

## v1.0.1 (Current)
### Features
- Multiple scoring rule implementations:
  - Japanese rules (territory + captured stones + komi)
  - Chinese rules (territory + stones on board + komi)
  - Korean rules (area scoring with procedural differences)
  - AGA rules (American Go Association hybrid approach)
  - Ing rules (SST scoring system)
- Enhanced game type options:
  - Even Game (standard play)
  - Handicap Game (2-9 stones)
  - Blitz Go (fast time controls)
  - Teaching Game (with instruction tools)
  - Rengo (Pair Go)
- Advanced territory calculation with flood-fill algorithm
- Dead stone marking and scoring
- Multiple time control options:
  - No time limit
  - Time per game (10min, 30min, 1hr)
  - Time per move (15s, 30s, 1min, 2min, 5min)
- Game state persistence and offline access
- Responsive board sizes (9×9, 13×13, 19×19)
- Star points visualization based on board size
- Real-time multiplayer synchronization

### Bug Fixes
- Fixed issue where creating a new game would incorrectly redirect to an old game URL
- Fixed "Copy Game Link" button to always copy the current game's URL
- Fixed territory calculation in corner positions
- Fixed stone capture counting in Japanese rules
- Fixed ko rule validation
- Fixed game state synchronization after reconnection

## v1.0.0 (Initial)
### Features
- Initial release with core Go game functionality
- Real-time multiplayer with Socket.io
- Basic game board implementation
- Move validation and stone capture
- Basic scoring system
- Game sharing via links
- Player turn management
- Basic time controls
- Game state persistence

### Bug Fixes
- Initial release - no recorded fixes 