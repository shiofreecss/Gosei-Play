import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import BoardDemoPage from './pages/BoardDemoPage';
import MusicPlayer from './components/MusicPlayer';
import { initializeSoundPreferences } from './utils/soundUtils';
import './App.css';

function App() {
  // Initialize sound preferences on app start
  useEffect(() => {
    initializeSoundPreferences();
  }, []);

  return (
    <Router>
      <GameProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/board-demo" element={<BoardDemoPage />} />
        </Routes>
        <MusicPlayer />
      </GameProvider>
    </Router>
  );
}

export default App;
