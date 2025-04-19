import React, { useEffect, useState } from 'react';

const GameSettings: React.FC = () => {
  const [resetCounter, setResetCounter] = useState(0);
  const [showBoardCoordinates, setShowBoardCoordinates] = useState(true);
  const [showMoveNumbers, setShowMoveNumbers] = useState(true);
  const [showTerritory, setShowTerritory] = useState(true);
  const [stoneSoundEnabled, setStoneSoundEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [autoPlayStoneSound, setAutoPlayStoneSound] = useState(true);
  
  const [defaultSettings, setDefaultSettings] = useState({
    showBoardCoordinates: true,
    showMoveNumbers: true,
    showTerritory: true,
    stoneSoundEnabled: true,
    animationsEnabled: true,
    autoPlayStoneSound: true
  });

  useEffect(() => {
    if (resetCounter > 0) {
      // Reset all settings to default
      setShowBoardCoordinates(defaultSettings.showBoardCoordinates);
      setShowMoveNumbers(defaultSettings.showMoveNumbers);
      setShowTerritory(defaultSettings.showTerritory);
      setStoneSoundEnabled(defaultSettings.stoneSoundEnabled);
      setAnimationsEnabled(defaultSettings.animationsEnabled);
      setAutoPlayStoneSound(defaultSettings.autoPlayStoneSound);
      
      // Also update localStorage
      Object.entries(defaultSettings).forEach(([key, value]) => {
        localStorage.setItem(key, String(value));
      });
    }
  }, [resetCounter, defaultSettings, setShowBoardCoordinates, setShowMoveNumbers, 
      setShowTerritory, setStoneSoundEnabled, setAnimationsEnabled, setAutoPlayStoneSound]);

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default GameSettings; 