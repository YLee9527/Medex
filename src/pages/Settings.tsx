import { useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { ThemeColors } from '../theme/theme';

export default function Settings() {
  const { theme, themeMode, toggleTheme, setTheme } = useThemeContext();
  const [language, setLanguage] = useState('zh-CN');
  const [libraryPath, setLibraryPath] = useState('/Users/terryyoung/Pictures');
  const [autoScan, setAutoScan] = useState(true);

  return (
    <div 
      className="flex flex-col h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: theme.borderLight }}
      >
        <h1 className="text-xl font-semibold">设置</h1>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-6">
          {/* 1. Language Setting */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>语言</div>
            <div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-blue-500"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          {/* 2. Theme Setting */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>主题</div>
            <div className="flex space-x-2">
              <button
                onClick={() => setTheme('dark')}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#3B82F6' : theme.buttonBg,
                  color: themeMode === 'dark' ? '#FFFFFF' : theme.text,
                }}
              >
                深色
              </button>
              <button
                onClick={() => setTheme('light')}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor: themeMode === 'light' ? '#3B82F6' : theme.buttonBg,
                  color: themeMode === 'light' ? '#FFFFFF' : theme.text,
                }}
              >
                浅色
              </button>
              <button
                onClick={() => {
                  // TODO: 实现跟随系统功能
                  console.log('跟随系统');
                }}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor: themeMode === 'system' ? '#3B82F6' : theme.buttonBg,
                  color: themeMode === 'system' ? '#FFFFFF' : theme.text,
                }}
              >
                跟随系统
              </button>
            </div>
          </div>

          {/* 3. Media Library Path */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>媒体库路径</div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={libraryPath}
                onChange={(e) => setLibraryPath(e.target.value)}
                className="w-64 px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-blue-500"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }}
              />
              <button 
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{ 
                  backgroundColor: theme.buttonBg,
                  color: theme.text
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.buttonHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.buttonBg;
                }}
              >
                浏览
              </button>
            </div>
          </div>

          {/* 4. Auto Scan on Startup */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>启动时自动扫描媒体库</div>
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                  className="sr-only"
                />
                <div 
                  className="relative w-10 h-6 rounded-full transition-colors"
                  style={{ 
                    backgroundColor: autoScan ? '#3B82F6' : theme.inputBorder 
                  }}
                >
                  <div 
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"
                    style={{ 
                      transform: autoScan ? 'translateX(16px)' : 'translateX(0)' 
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
