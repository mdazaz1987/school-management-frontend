import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'ui.theme.mode';

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

  const effectiveTheme = useMemo<'light' | 'dark'>(() => {
    return theme === 'system' ? getSystemPref() : theme;
  }, [theme]);

  useEffect(() => {
    // Persist preference
    localStorage.setItem(THEME_KEY, theme);
    // Apply to DOM for CSS/Bootstrap support
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-bs-theme', effectiveTheme); // Bootstrap 5.3 color modes
  }, [theme, effectiveTheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
