import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

// List of available music tracks
const musicTracks = [
  {
    name: 'Traditional Go',
    src: '/music/traditional-go.mp3',
  },
  {
    name: 'Zen Music 1',
    src: '/music/zen-music-1.mp3',
  },
  {
    name: 'Zen Music 2',
    src: '/music/zen-music-2.mp3',
  },
];

// Store music state globally to persist between route changes
let globalIsPlaying = false;
let globalTrackIndex = 0;

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(globalIsPlaying);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(globalTrackIndex);
  const [volume, setVolume] = useState(0.3); // Default to 30% volume
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const { gameState } = useGame();
  
  // Only show on active game pages where a game is in progress or finished
  // Don't show on board demo, join page, or during game setup/waiting
  const isActivePage = 
    location.pathname.includes('/game/') && 
    gameState && 
    (gameState.status === 'playing' || gameState.status === 'scoring' || gameState.status === 'finished');
  
  // Initialize audio element
  useEffect(() => {
    // Only initialize audio if we're showing the music player
    if (!isActivePage) return;
    
    audioRef.current = new Audio(musicTracks[currentTrackIndex].src);
    audioRef.current.volume = volume;
    audioRef.current.loop = true;
    
    // Load the user preferences if any
    const savedVolume = localStorage.getItem('musicVolume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
      if (audioRef.current) {
        audioRef.current.volume = parseFloat(savedVolume);
      }
    }
    
    // Resume playback if it was playing before
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(err => console.error('Error playing audio:', err));
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        // Store current playing state when unmounting
        globalIsPlaying = isPlaying;
        globalTrackIndex = currentTrackIndex;
        
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isActivePage]);

  // Handle track change
  useEffect(() => {
    if (!isActivePage) return;
    
    if (audioRef.current) {
      const wasPlaying = isPlaying;
      audioRef.current.pause();
      audioRef.current = new Audio(musicTracks[currentTrackIndex].src);
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
      
      if (wasPlaying) {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
      
      // Update global state
      globalTrackIndex = currentTrackIndex;
    }
  }, [currentTrackIndex, isActivePage, isPlaying, volume]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isActivePage) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActivePage]);
  
  // Don't render if not on an active game page
  if (!isActivePage) return null;

  // Toggle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
      setIsPlaying(!isPlaying);
      globalIsPlaying = !isPlaying;
    }
  };

  // Change track
  const changeTrack = (index: number) => {
    setCurrentTrackIndex(index);
    globalTrackIndex = index;
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    localStorage.setItem('musicVolume', newVolume.toString());
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={menuRef}>
      {/* Music menu */}
      {isMenuOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-4 w-64">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">Music Player</h3>
            
            {/* Volume control */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Volume:</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={handleVolumeChange}
                className="w-full"
              />
            </div>
            
            {/* Track selection */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Tracks:</span>
              {musicTracks.map((track, index) => (
                <button
                  key={index}
                  onClick={() => changeTrack(index)}
                  className={`text-left px-3 py-2 rounded-md text-sm ${
                    currentTrackIndex === index
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-neutral-100'
                  }`}
                >
                  {track.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Floating play button */}
      <div className="flex gap-2">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors"
          title={isPlaying ? 'Pause Music' : 'Play Music'}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-12 h-12 rounded-full bg-secondary-600 text-white flex items-center justify-center shadow-lg hover:bg-secondary-700 transition-colors"
          title="Music Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.109.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer; 