import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { Theme } from './types';
import { generateTheme } from './themeGenerator';
import { useSettings } from '../store/hooks';

interface ThemeContextType {
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings } = useSettings();

  // Generate theme based on selected theme ID and dark mode setting
  const theme = useMemo(() => {
    return generateTheme(settings.theme, settings.darkMode);
  }, [settings.theme, settings.darkMode]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context.theme;
};

