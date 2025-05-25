# Gosei Play

A modern, responsive real-time Go (Baduk/Weiqi) game application built with React, TypeScript, and Socket.io.

## Current Version
v1.0.7 - Move-Based Time Tracking System - See [VERSION.md](VERSION.md) for complete version history and change details.

## Features

- **Real-time multiplayer Go game** with socket-based communication
- **Multiple board sizes** (9×9, 13×13, 15×15, 19×19, 21×21) suitable for players of all levels
- **Complete KO rule enforcement** to prevent infinite capture loops - see [KO_RULE.md](KO_RULE.md)
- **Customizable board themes** including Default, Dark Wood 3D, Light Wood 3D, and Universe themes
- **Interactive game completion** with detailed score popup and personalized win/loss messages
- **Authentic stone placement sounds** with toggle option in game settings
- **Zen background music player** with multiple traditional tracks and volume control
- **Real-time in-game chat** for communication between players
- **Responsive design** that works across desktop, tablet, and mobile devices
- **Modern UI** with intuitive controls and visual feedback
- **Game sharing** via shareable game links
- **Multiple scoring rules** including Japanese, Chinese, Korean, AGA, and Ing systems
- **Advanced time tracking system** with move-based time deduction and accurate timing (see [BYO_YOMI_CLOCK_RESET_ISSUE.md](BYO_YOMI_CLOCK_RESET_ISSUE.md))
- **Time control options** to manage game duration (fully customizable - see [TIME_CONTROL_FLEXIBILITY.md](TIME_CONTROL_FLEXIBILITY.md))
- **Handicap settings** for balanced gameplay between players of different skill levels
- **Game state synchronization** to handle connection issues
- **Clean, organized interface** with game controls in a single location

For detailed information about mobile responsiveness improvements, please see [MOBILE_RESPONSIVENESS.md](MOBILE_RESPONSIVENESS.md).

## Audio Features

### Stone Sounds
- Authentic stone placement sounds play when placing stones on the board
- Sound toggle available in the game controls panel
- Sound preferences are saved between sessions

### Background Music
- Floating music player appears during active gameplay
- Three traditional tracks available:
  - Traditional Go
  - Zen Music 1
  - Zen Music 2
- Controls include play/pause and track selection
- Volume control with preference saving
- Music state persists when navigating between game screens

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn

## Installation and Setup

### Quick Start

For convenience, we provide scripts to start both client and server:

**Windows:**
```
start.bat
```

**Mac/Linux:**
```
./start.sh
```

### Manual Setup

#### Client

1. Navigate to the project root directory:

```bash
cd gosei-play
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The client will be available at http://localhost:3000

#### Socket Server (for real-time functionality)

1. Navigate to the server directory:

```bash
cd gosei-play/server
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

The socket server will run on http://localhost:3001

## How to Play

1. **Start a game:**
   - Enter your name
   - Click "Create New Game" to start a new game as the host
   - Configure your game settings (board size, time control, handicap)
   - Click "Start Game"

2. **Join a game:**
   - Enter your name
   - Paste a game link or ID shared by another player into the input field
   - Click "Join Game"

3. **During gameplay:**
   - Black plays first (unless handicap is set)
   - Click on an intersection to place a stone during your turn
   - Use the "Pass Turn" button in the Game Controls section when you have no good moves
   - The game ends after both players pass consecutively
   - Territory is counted manually at the end of the game
   - When the game completes, a popup shows the final score with personalized win/loss messages
   - Convenient "Return Home" and "Play Again" buttons appear below the board after game completion

4. **Game controls:**
   - All game controls are located in the Game Information panel
   - Pass turn, request undo, and resign options are available during gameplay
   - Use the chat feature to communicate with your opponent

5. **Game sharing:**
   - Use the "Copy Game Link" button to share the game with your opponent

## Board Sizes

For detailed information about board sizes, star points, time recommendations, and game settings, please see [BOARD_SIZES.md](BOARD_SIZES.md).

For information about timeout and resignation notifications, see [TIMEOUT_NOTIFICATIONS.md](TIMEOUT_NOTIFICATIONS.md).

### Standard Sizes
- **9×9**: Perfect for beginners, ideal for quick games (recommended: 10+ minutes per player)
- **13×13**: Intermediate play, good balance of complexity and duration (recommended: 20+ minutes per player)
- **19×19**: Standard tournament size, full strategic depth (recommended: 45+ minutes per player)

### Custom Sizes
- **15×15**: Traditional Korean size, medium-length games (recommended: 30+ minutes per player)
- **21×21**: Extended board size for unique gameplay experiences (recommended: 60+ minutes per player)

Each board size features:
- Visual preview showing the actual grid and star points
- Accurate star point (hoshi) placement
- Recommended time settings (fully customizable by users)
- Responsive grid scaling for all screen sizes

Board size selection is available during game creation, with standard sizes always visible and custom sizes in a collapsible section. Your selected board size preference is saved between games.

## Board Themes

- **Default Board**: Standard wooden go board with flat stones
- **Dark Wood 3D**: Realistic dark wooden board with 3D stone rendering
- **Light Wood 3D**: Realistic light wooden board with 3D stone rendering
- **Universe**: Cosmic-themed board with black holes and white holes

Board themes can be changed during gameplay from the Game Information panel. Your theme preference is saved between games.

## Time Tracking System

Gosei Play features an advanced move-based time tracking system that provides accurate timing for competitive play:

### Key Features
- **Move-Based Deduction**: Time is only deducted when actual moves or passes are made
- **Precise Timing**: Each move records the exact time spent thinking
- **Automatic Transitions**: Seamless progression from main time to byo-yomi periods
- **Real-Time Updates**: All players receive immediate time updates after each move

### How It Works
1. **Turn Start**: Timer begins when it becomes your turn
2. **Move Made**: System calculates time spent = current time - turn start time
3. **Time Deduction**: Spent time is deducted from your remaining time
4. **State Update**: All players see updated time displays immediately

### Byo-Yomi Support
- **Main Time**: Standard countdown from your allocated time
- **Byo-Yomi Periods**: Additional time periods when main time expires
- **Period Management**: Automatic progression through available periods
- **Visual Indicators**: Clear display of current time state and periods remaining

### Benefits
- **Accuracy**: Time tracking matches actual thinking time
- **Fairness**: No timer drift or synchronization issues
- **Performance**: Reduced server load and better scalability
- **Transparency**: Clear logging of time spent on each move

For detailed technical information, see [TIME_TRACKING_SYSTEM.md](TIME_TRACKING_SYSTEM.md) and [BYO_YOMI_CLOCK_RESET_ISSUE.md](BYO_YOMI_CLOCK_RESET_ISSUE.md).

## Technology Stack

- **Frontend:**
  - React 19
  - TypeScript
  - Tailwind CSS
  - React Router

- **Backend:**
  - Node.js
  - Express
  - Socket.io

## Browser Compatibility

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Development

### Project Structure

```
gosei-play/
├── public/               # Static files
├── server/               # Socket.io server
├── src/
│   ├── components/       # React components
│   │   ├── go-board/     # Go board related components
│   │   └── ...           # Other UI components
│   ├── context/          # React context for state management
│   ├── pages/            # Page components
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── package.json
└── README.md
```

### Available Scripts

- `npm start`: Starts the development server
- `npm build`: Builds the app for production
- `npm test`: Runs tests
- `npm eject`: Ejects from Create React App

## Documentation

### Core Features
- **[KO_RULE.md](KO_RULE.md)** - Complete KO rule implementation documentation
- **[KO_RULE_QUICK_REFERENCE.md](KO_RULE_QUICK_REFERENCE.md)** - Quick reference for developers
- **[BOARD_SIZES.md](BOARD_SIZES.md)** - Board size specifications and features
- **[TIME_TRACKING_SYSTEM.md](TIME_TRACKING_SYSTEM.md)** - Advanced move-based time tracking system
- **[TIME_CONTROL_FLEXIBILITY.md](TIME_CONTROL_FLEXIBILITY.md)** - Time control system documentation
- **[MOBILE_RESPONSIVENESS.md](MOBILE_RESPONSIVENESS.md)** - Mobile optimization details

### Technical Documentation
- **[PLANNING.md](PLANNING.md)** - Implementation roadmap and status
- **[VERSION.md](VERSION.md)** - Version history and changes
- **[SECURITY.md](SECURITY.md)** - Security considerations
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

### Deployment Guides
- **[VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md)** - VPS deployment instructions
- **[HEROKU_SETUP.md](HEROKU_SETUP.md)** - Heroku deployment guide
- **[NETLIFY_SETUP.md](NETLIFY_SETUP.md)** - Netlify deployment instructions

### Specialized Features
- **[TIMEOUT_NOTIFICATIONS.md](TIMEOUT_NOTIFICATIONS.md)** - Timeout and notification systems
- **[BYO_YOMI_TIMEOUT.md](BYO_YOMI_TIMEOUT.md)** - Byo-yomi time control details
- **[NETLIFY_AUDIO_SETUP.md](NETLIFY_AUDIO_SETUP.md)** - Audio configuration for Netlify

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to all contributors and the Go community
- UI design inspired by modern web applications and traditional Go aesthetics
- Powered by [Beaver Foundation](https://beaver.foundation) - [ShioDev](https://hello.shiodev.com)
