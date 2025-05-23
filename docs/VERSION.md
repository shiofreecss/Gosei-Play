# Gosei Play Version History

## v1.0.6 - Byo-Yomi Timeout Implementation (Current)

### New Features
- **Complete Byo-Yomi System**: Full implementation of Japanese time control
  - Main time countdown with automatic transition to byo-yomi
  - Multiple byo-yomi periods (3, 5, or 7) with individual countdown
  - Period reset when moves/passes are made during byo-yomi
  - Progressive period consumption when time expires
  - Final timeout when all periods are exhausted

### Server Enhancements
- Enhanced timer handling with byo-yomi state tracking
- Real-time period management and countdown
- Proper timeout notifications with game result notation (B+T, W+T)
- Move/pass handling that resets current byo-yomi period
- Automatic game state synchronization for byo-yomi

### Client Improvements
- Updated Player interface with byo-yomi state fields
- Enhanced TimeControl component with byo-yomi indicators
- Real-time byo-yomi period display ("BY 3×0:30" format)
- Audio warnings for byo-yomi time pressure
- Proper event handling for byo-yomi transitions
- Synchronized state management with server

### User Experience
- Visual byo-yomi indicators with period countdown
- Notifications for entering byo-yomi and period usage
- Time pressure animations and audio feedback
- Proper timeout messages with game results

### Technical Details
- Enhanced Player interface with byoYomiPeriodsLeft, byoYomiTimeLeft, isInByoYomi
- New server events: byoYomiStarted, byoYomiPeriodUsed
- Updated timeUpdate events with byo-yomi state
- Comprehensive event cleanup and memory management
- Server-authoritative time control with client synchronization

## v1.0.5 - Time Control Flexibility

### Major Changes
- **Flexible Time Controls**: Users can now set any main time (0+ minutes)
- **Removed Time Restrictions**: No more minimum time requirements based on board size
- **Smart Recommendations**: System shows recommended times but doesn't enforce them
- **Preserved Custom Settings**: User time preferences maintained when changing board sizes

### Implementation Details
- Renamed `getMinimumTimeForBoardSize()` → `getRecommendedTimeForBoardSize()`
- Removed enforcement logic (`Math.max(value, minTime)`)
- Updated validation to allow any positive value (≥0 minutes)
- Enhanced board size logic to preserve custom time settings
- Updated UI text to clarify recommendations vs requirements

### Files Modified
- `src/pages/HomePage.tsx` - Core time control logic changes
- `docs/BOARD_SIZES.md` - Updated to reflect recommendations vs requirements

### User Benefits
- **Bullet Games**: 1-5 minute games for quick practice
- **Blitz Games**: 5-15 minute games for fast-paced play  
- **Custom Timings**: Any time setting for specific needs
- **Teaching Games**: Extended time for learning and discussion
- **Demonstration Games**: 0-minute games for position analysis

## v1.0.4 - Enhanced Game Features

### Features Added
- Advanced scoring systems (Chinese, Japanese, Korean, AGA, Ing)
- Handicap stone placement system
- Color preference selection for game creators
- Improved game state synchronization
- Enhanced mobile responsiveness

### Bug Fixes
- Fixed timer synchronization issues
- Improved socket connection stability
- Better error handling for network issues

## v1.0.3 - Core Gameplay

### Features Added
- Complete Go rules implementation
- Stone capture mechanics
- Ko rule enforcement
- Territory scoring
- Game state persistence

### Technical Improvements
- Optimized board rendering
- Improved move validation
- Enhanced game state management

## v1.0.2 - Multiplayer Foundation

### Features Added
- Real-time multiplayer functionality
- Socket.io integration
- Game room management
- Player synchronization

### Infrastructure
- Server-side game state management
- WebSocket communication
- Session persistence

## v1.0.1 - Basic UI

### Features Added
- Interactive Go board
- Stone placement
- Basic game controls
- Responsive design

### Components
- GoBoard component
- Stone rendering
- Move history
- Game status display

## v1.0.0 - Initial Release

### Core Features
- Basic Go board setup
- Single-player stone placement
- Simple UI framework
- Project structure

### Foundation
- React + TypeScript setup
- Tailwind CSS styling
- Component architecture
- Build system configuration

## Credits
Powered by [Beaver Foundation](https://beaver.foundation) - [ShioDev](https://hello.shiodev.com) 