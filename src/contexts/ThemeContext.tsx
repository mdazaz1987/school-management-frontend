import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorTheme = 'blue' | 'purple' | 'maroon' | 'green' | 'orange';

interface ThemeContextValue {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  colorTheme: ColorTheme;
  setTheme: (mode: ThemeMode) => void;
  setColorTheme: (color: ColorTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'ui.theme.mode';
const COLOR_THEME_KEY = 'ui.theme.color';

function getSystemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return saved || 'system';
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem(COLOR_THEME_KEY) as ColorTheme | null;
    return saved || 'blue';
  });

  const effectiveTheme = useMemo<'light' | 'dark'>(() => {
    return theme === 'system' ? getSystemPref() : theme;
  }, [theme]);

  useEffect(() => {
    // Persist preference
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(COLOR_THEME_KEY, colorTheme);
    // Apply to DOM for CSS/Bootstrap support
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-bs-theme', effectiveTheme); // Bootstrap 5.3 color modes
    root.setAttribute('data-color-theme', colorTheme);
  }, [theme, effectiveTheme, colorTheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    colorTheme,
    setTheme,
    setColorTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
