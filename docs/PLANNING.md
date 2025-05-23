# Go Game Implementation Planning Document

## Current Implementation Status

### 1. Scoring Rules (Fully Implemented)
All scoring rules are implemented in `src/utils/scoringUtils.ts`:

#### Japanese Rules ✓
- Territory scoring implementation
- Captures counted separately
- Default komi: 6.5
- Simple ko rule
- Functions: `calculateJapaneseScore()`

#### Chinese Rules ✓
- Area scoring implementation
- Territory + stones on board
- Default komi: 7.5
- Positional superko
- Functions: `calculateChineseScore()`

#### Korean Rules ✓
- Area scoring similar to Chinese
- Procedural differences handled
- Default komi: 6.5
- Functions: `calculateKoreanScore()`

#### AGA Rules ✓
- Hybrid scoring approach
- Territory + stones + captures
- Default komi: 7.5
- Functions: `calculateAGAScore()`

#### Ing Rules ✓
- Area scoring with special prisoner handling
- Fixed stone count system
- Default komi: 8
- Functions: `calculateIngScore()`

### 2. Game Types (Partially Implemented)

#### Even Game ✓
- Standard game implementation
- Black plays first
- No handicap stones
- Status: Fully implemented

#### Handicap Game (Partial)
Current Implementation:
- UI for handicap selection
- Stone placement patterns defined
- Basic handicap stone generation

Missing Features:
- Proper komi adjustment for handicap
- Integration with game start logic
- Handicap-specific rule variations
- UI feedback for handicap positions

#### Blitz Go (Partial)
Current Implementation:
- Basic time control options
- Simple countdown timer
- Time per move settings

Missing Features:
- Byo-yomi periods
- Fischer time controls
- Time pressure indicators
- Sound notifications
- Specialized UI for fast play

#### Teaching Game (Minimal)
Current Implementation:
- Game type definition
- Basic UI elements

Missing Features:
- Annotation system
- Move variation tracking
- Teaching tools interface
- Comment system
- Branch visualization
- Review mode

#### Rengo (Pair Go) (Minimal)
Current Implementation:
- Game type definition
- Basic UI structure

Missing Features:
- Team management
- Turn alternation logic
- Team communication features
- Partner coordination UI
- Team scoring adjustments

### Board Sizes (Fully Implemented) ✓
Current Implementation:
- Standard board sizes (9×9, 13×13, 19×19)
- Custom board sizes (15×15, 21×21)
- Visual board size preview component
- Accurate star point (hoshi) placement for all sizes
- Estimated game duration indicators
- Responsive grid scaling
- Size preference persistence
- Organized UI with collapsible custom sizes section

Features:
1. Board Size Selection
   - Clear separation of standard and custom sizes
   - Visual previews with grid and star points
   - Descriptive text for each size option
   - Estimated game duration guidance
   - Size-specific star point patterns

2. UI/UX Improvements
   - Collapsible custom sizes section
   - Visual feedback for selected size
   - Tooltips with size descriptions
   - Custom badge for non-standard sizes
   - Responsive design for all screen sizes

3. Technical Implementation
   - BoardSizePreview component for visual representation
   - Dynamic grid generation
   - Star point calculation for each size
   - Size preference storage in localStorage
   - Proper TypeScript typing

4. Integration
   - Seamless integration with game creation flow
   - Consistent styling with application theme
   - Proper scaling with board themes
   - Compatibility with all scoring rules
   - Support for handicap placement

### 3. Time Control Systems (Enhanced Implementation)

#### Current Features
- Flexible main time control (users can set any time they want)
- Recommended time settings based on board size (not enforced)
- Basic time per game and time per move options
- Byo-yomi periods support (3, 5, 7 periods)
- Fischer increment time controls (5s, 10s, 15s)
- Countdown display with visual warnings
- Time timeout handling
- Sound notifications for time pressure
- Smart time setting preservation when changing board sizes

#### Recent Improvements (v1.0.5)
- Removed enforced minimum time requirements
- Users can now create bullet games, blitz games, or any custom timing
- Enhanced UI with clearer messaging about time recommendations
- Improved user experience with flexible time control input

#### Missing Features
1. Advanced Time Systems
   - Canadian byo-yomi
   - Absolute vs. delay time
   - Multiple time control presets

2. Time Management UI
   - Enhanced period indicators
   - Advanced time system selection
   - Custom time settings presets
   - Quick time setting templates

3. Time Control Features
   - Enhanced sound notifications
   - Advanced time pressure indicators
   - Time violation handling improvements
   - Time adjustment tools

## Implementation Priorities

### Phase 1: Core Game Types
1. Complete Handicap Game Implementation
   - Integrate existing handicap stone placement
   - Add proper komi adjustment
   - Implement handicap-specific rules
   - Enhance UI feedback

2. Enhance Blitz Go Features
   - ✅ **COMPLETED**: Basic flexible time controls
   - Implement advanced byo-yomi features
   - Add more Fischer time control options
   - Improve time pressure UI animations
   - Add enhanced sound notifications

### Phase 2: Teaching Tools
1. Teaching Game Implementation
   - Create annotation system
   - Implement variation tracking
   - Add comment functionality
   - Develop branch visualization

2. Analysis Features
   - Move history browser
   - Territory visualization
   - Influence analysis
   - Pattern recognition

### Phase 3: Advanced Features
1. Rengo Implementation
   - Team management system
   - Turn coordination
   - Team communication
   - Partner visualization

2. Advanced Time Control Enhancement
   - Canadian byo-yomi system
   - Comprehensive time UI improvements
   - Time management tools
   - Custom time setting presets

## Technical Considerations

### Code Structure Updates
1. New Components Needed:
   - TeachingTools
   - TimeControl
   - HandicapManager
   - RengoInterface
   - AnalysisBoard

2. Utility Functions:
   - Time calculation helpers
   - Handicap position generators
   - Variation tree management
   - Team coordination helpers

3. State Management:
   - Teaching game state
   - Time control state
   - Team play state
   - Analysis state

### Database Schema Updates
1. Game Records:
   - Teaching comments
   - Move variations
   - Time usage data
   - Team information

2. User Profiles:
   - Teaching history
   - Time preferences
   - Partner associations
   - Analysis history

## Testing Strategy

### Unit Tests
- Scoring calculations
- Time control logic
- Handicap placement
- Teaching tools
- Team play mechanics

### Integration Tests
- Game type interactions
- Time system integration
- Teaching feature workflow
- Team play coordination

### User Testing
- UI/UX feedback
- Time control usability
- Teaching tool effectiveness
- Team play experience

## Documentation Requirements

### User Documentation
- Game type guides
- Time system explanations
- Teaching tool tutorials
- Team play instructions

### Developer Documentation
- API references
- Component documentation
- State management guide
- Testing guidelines

## Future Considerations

### Potential Enhancements
- AI integration for teaching
- Advanced analysis tools
- Tournament support
- Mobile optimization

### Scalability
- Performance optimization
- State management efficiency
- Real-time coordination
- Data persistence

## Timeline Estimates

### Phase 1 (1-2 months)
- Handicap game completion
- Basic time control enhancement
- Initial teaching tools

### Phase 2 (2-3 months)
- Teaching game features
- Analysis tools
- Time system expansion

### Phase 3 (3-4 months)
- Rengo implementation
- Advanced time controls
- Final polish and optimization

## Conclusion
This implementation plan provides a structured approach to expanding the Gosei Play application with additional Go rulesets and game types. By following the order from easiest to most difficult, we can incrementally add features while maintaining a stable application. 