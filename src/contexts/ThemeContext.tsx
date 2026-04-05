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
  const [systemIsDark, setSystemIsDark] = useState(true);

  // 检测系统主题偏好
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // 从 localStorage 读取主题设置
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored) {
      setThemeMode(stored);
    }
    setIsLoaded(true);
  }, []);

  // 根据主题模式决定实际使用的主题
  const effectiveMode = themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    if (!isLoaded) return;
    
    // 保存主题设置到 localStorage
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    
    // 更新 HTML 的 data-theme 属性（使用实际生效的模式）
    document.documentElement.setAttribute('data-theme', effectiveMode);
  }, [themeMode, effectiveMode, isLoaded]);

  // 监听其他窗口的主题变化
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        setThemeMode(event.newValue as ThemeMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const value: ThemeContextValue = {
    theme: themes[effectiveMode],
    themeMode,
    isDark: effectiveMode === 'dark',
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
