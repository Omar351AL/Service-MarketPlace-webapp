import { useEffect, useMemo, useState } from 'react';

import { ThemeContext } from './context/ThemeContext.js';

const THEME_STORAGE_KEY = 'service-marketplace-theme';
const AVAILABLE_THEMES = ['dark', 'light'];

const readStoredTheme = () => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return AVAILABLE_THEMES.includes(storedTheme) ? storedTheme : 'dark';
  } catch {
    return 'dark';
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => readStoredTheme());

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
