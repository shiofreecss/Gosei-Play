import React, { useState, useEffect } from 'react';
import { getStoneSoundEnabled, toggleStoneSound } from '../utils/soundUtils';

const SoundSettings: React.FC = () => {
  const [stoneSoundEnabled, setStoneSoundEnabled] = useState(getStoneSoundEnabled());

  const handleToggleStoneSound = () => {
    const newState = toggleStoneSound();
    setStoneSoundEnabled(newState);
  };

  return (
    <div className="flex items-center gap-2 mt-4 p-2 border-t border-neutral-200 pt-3">
      <label htmlFor="stone-sound-toggle" className="text-sm font-medium text-neutral-600 cursor-pointer">
        Stone Sound:
      </label>
      <button
        id="stone-sound-toggle"
        onClick={handleToggleStoneSound}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          stoneSoundEnabled ? 'bg-primary-600' : 'bg-neutral-300'
        }`}
        role="switch"
        aria-checked={stoneSoundEnabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            stoneSoundEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default SoundSettings; 