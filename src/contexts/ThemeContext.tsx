import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

export type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (value: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyThemeClass = (theme: ThemeMode) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { profile, updateProfile } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('discipline_theme') as ThemeMode | null;
    if (saved) {
      setThemeState(saved);
      applyThemeClass(saved);
    }
  }, []);

  useEffect(() => {
    if (profile?.theme && (profile.theme === 'dark' || profile.theme === 'light')) {
      setThemeState(profile.theme);
      applyThemeClass(profile.theme);
    }
  }, [profile?.theme]);

  const setTheme = useCallback(
    (value: ThemeMode) => {
      setThemeState(value);
      localStorage.setItem('discipline_theme', value);
      applyThemeClass(value);
      if (profile?.id) {
        updateProfile({ theme: value }).catch(() => undefined);
      }
    },
    [profile?.id, updateProfile]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }
  return context;
};
