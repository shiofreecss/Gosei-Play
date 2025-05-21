import React from 'react';
import { useBoardTheme, BoardTheme } from '../context/BoardThemeContext';

const BoardThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useBoardTheme();

  const handleThemeChange = (themeId: BoardTheme) => {
    setTheme(themeId);
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {availableThemes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => handleThemeChange(theme.id)}
          className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors ${
            currentTheme === theme.id
              ? 'bg-primary-50 text-primary-800 selected border-2 border-primary-500'
              : 'hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <div 
            className={`w-14 h-14 aspect-square flex-shrink-0 mr-3 rounded-lg border-2 border-neutral-400 board-theme-${theme.id} shadow-md`}
            style={{ position: 'relative' }}
          >
            {/* Preview stones */}
            <div 
              className={`stone stone-black absolute shadow-lg`} 
              style={{ 
                width: '35%', 
                height: '35%', 
                top: '25%', 
                left: '25%' 
              }}
            />
            <div 
              className={`stone stone-white absolute shadow-lg`} 
              style={{ 
                width: '35%', 
                height: '35%', 
                top: '45%', 
                left: '45%' 
              }}
            />
          </div>
          
          <div className="flex-grow">
            <div className="font-semibold text-lg">{theme.name}</div>
            <div className="text-sm text-neutral-600">{theme.description}</div>
          </div>
          
          {currentTheme === theme.id && (
            <span className="text-primary-600 ml-4 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default BoardThemeSelector; 