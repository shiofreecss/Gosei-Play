import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the available app themes
export type AppTheme = 'modern' | 'traditional';

// Theme context interface
interface AppThemeContextType {
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  availableThemes: { id: AppTheme; name: string; description: string }[];
}

// Create the context with default values
const AppThemeContext = createContext<AppThemeContextType>({
  currentTheme: 'modern',
  setTheme: () => {},
  availableThemes: [
    { id: 'modern', name: 'Modern', description: 'Clean modern interface with light colors' },
    { id: 'traditional', name: 'Traditional', description: 'Classic East Asian style inspired by traditional Go paintings' },
  ],
});

// Provider component
export const AppThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or use default
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const savedTheme = localStorage.getItem('gosei-app-theme');
    // Handle case where saved theme might be 'minimalist' (now removed)
    if (savedTheme === 'minimalist') {
      return 'modern';
    }
    return (savedTheme as AppTheme) || 'modern';
  });

  // Available themes definition
  const availableThemes = [
    { id: 'modern' as AppTheme, name: 'Modern', description: 'Clean modern interface with light colors' },
    { id: 'traditional' as AppTheme, name: 'Traditional', description: 'Classic East Asian style inspired by traditional Go paintings' },
  ];

  // Update theme and save to localStorage
  const setTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('gosei-app-theme', theme);
    
    // Apply theme-specific class to body
    document.body.classList.remove('theme-modern', 'theme-traditional', 'theme-minimalist');
    document.body.classList.add(`theme-${theme}`);
  };

  // Apply theme class on initial load and theme changes
  useEffect(() => {
    document.body.classList.remove('theme-modern', 'theme-traditional', 'theme-minimalist');
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  return (
    <AppThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        availableThemes,
      }}
    >
      {children}
    </AppThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useAppTheme = () => useContext(AppThemeContext); 