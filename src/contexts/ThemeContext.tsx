import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeMode, themes, ThemeColors } from '../theme/theme';

const THEME_STORAGE_KEY = 'medex-theme-mode';

interface ThemeContextValue {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取主题设置
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored) {
      setThemeMode(stored);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    // 保存主题设置到 localStorage
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    
    // 更新 HTML 的 data-theme 属性
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode, isLoaded]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const value: ThemeContextValue = {
    theme: themes[themeMode],
    themeMode,
    isDark: themeMode === 'dark',
    toggleTheme,
    setTheme,
    isLoaded
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
