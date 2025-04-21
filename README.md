# Gosei Play

A modern, responsive real-time Go (Baduk/Weiqi) game application built with React, TypeScript, and Socket.io.

## Current Version
v1.0.3 - See [VERSION.md](VERSION.md) for complete version history and change details.

## Features

- **Real-time multiplayer Go game** with socket-based communication
- **Multiple board sizes** (9×9, 13×13, 19×19) suitable for players of all levels
- **Customizable board themes** including Default, Dark Wood 3D, Light Wood 3D, and Universe themes
- **Authentic stone placement sounds** with toggle option in game settings
- **Zen background music player** with multiple traditional tracks and volume control
- **Real-time in-game chat** for communication between players
- **Responsive design** that works across desktop, tablet, and mobile devices
- **Modern UI** with intuitive controls and visual feedback
- **Game sharing** via shareable game links
- **Multiple scoring rules** including Japanese, Chinese, Korean, AGA, and Ing systems
- **Time control options** to manage game duration
- **Handicap settings** for balanced gameplay between players of different skill levels
- **Game state synchronization** to handle connection issues
- **Clean, organized interface** with game controls in a single location

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

4. **Game controls:**
   - All game controls are located in the Game Information panel
   - Pass turn, request undo, and resign options are available during gameplay
   - Use the chat feature to communicate with your opponent

5. **Game sharing:**
   - Use the "Copy Game Link" button to share the game with your opponent

## Board Sizes

- **9×9**: Great for beginners and quick games (15-30 minutes)
- **13×13**: Good for intermediate players looking for more strategic depth
- **19×19**: Traditional full-size board used in professional play

## Board Themes

- **Default Board**: Standard wooden go board with flat stones
- **Dark Wood 3D**: Realistic dark wooden board with 3D stone rendering
- **Light Wood 3D**: Realistic light wooden board with 3D stone rendering
- **Universe**: Cosmic-themed board with black holes and white holes

Board themes can be changed during gameplay from the Game Information panel. Your theme preference is saved between games.

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
