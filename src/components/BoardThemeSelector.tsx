import React from 'react';
import { useBoardTheme, BoardTheme } from '../context/BoardThemeContext';

const BoardThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useBoardTheme();

  const handleThemeChange = (themeId: BoardTheme) => {
    setTheme(themeId);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Board Theme</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {availableThemes.map((theme) => (
          <div
            key={theme.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 flex items-center ${
              currentTheme === theme.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/30'
            }`}
            onClick={() => handleThemeChange(theme.id)}
          >
            <div 
              className={`w-12 h-12 aspect-square flex-shrink-0 mr-3 rounded border border-neutral-400 board-theme-${theme.id}`}
              style={{ position: 'relative' }}
            >
              {/* Small preview stones */}
              <div 
                className={`stone stone-black absolute`} 
                style={{ 
                  width: '35%', 
                  height: '35%', 
                  top: '25%', 
                  left: '25%' 
                }}
              />
              <div 
                className={`stone stone-white absolute`} 
                style={{ 
                  width: '35%', 
                  height: '35%', 
                  top: '45%', 
                  left: '45%' 
                }}
              />
            </div>
            
            <div className="flex-1">
              <div className="font-medium">{theme.name}</div>
              <div className="text-sm text-neutral-600">{theme.description}</div>
            </div>
            
            {currentTheme === theme.id && (
              <span className="text-primary-600 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardThemeSelector; 