import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { emit } from '@tauri-apps/api/event';
import { useThemeContext } from '../contexts/ThemeContext';
import { ThemeColors } from '../theme/theme';

export default function Settings() {
  const { theme, themeMode, toggleTheme, setTheme } = useThemeContext();
  const [language, setLanguage] = useState('zh-CN');
  const [libraryPath, setLibraryPath] = useState<string>('');
  const [autoScan, setAutoScan] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // 初始化时从 localStorage 读取媒体库路径和自动扫描设置
  useEffect(() => {
    const path = localStorage.getItem('libraryPath');
    if (path) {
      setLibraryPath(path);
    }
    
    // 读取自动扫描设置
    const autoScanSetting = localStorage.getItem('autoScanOnStartup');
    if (autoScanSetting !== null) {
      setAutoScan(autoScanSetting === 'true');
    }
  }, []);

  // 当 autoScan 变化时，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('autoScanOnStartup', String(autoScan));
  }, [autoScan]);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false
      });
      if (!selected || Array.isArray(selected)) {
        return;
      }

      // 保存选择的路径到 localStorage
      localStorage.setItem('libraryPath', selected);
      setLibraryPath(selected);

      // 触发扫描和索引
      setIsScanning(true);
      await invoke('scan_and_index', { path: selected });
      
      // 扫描完成后提示用户
      setTimeout(() => {
        setIsScanning(false);
        window.alert('媒体库扫描完成！');
      }, 1000);
    } catch (error) {
      console.error('[ui] scan failed:', error);
      window.alert(`扫描失败：${String(error)}`);
      setIsScanning(false);
    }
  };

  const handleClearLibraryPath = async () => {
    try {
      // 调用后端 API 清理数据库
      await invoke('clear_library_data');
      
      // 清除 localStorage 和状态
      localStorage.removeItem('libraryPath');
      setLibraryPath('');
      
      // 使用 Tauri 全局事件通知所有窗口
      await emit('medex:library-path-cleared');
      
      console.log('[ui] library data cleared successfully');
    } catch (error) {
      console.error('[ui] clear library data failed:', error);
      window.alert(`清除数据失败：${String(error)}`);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen"
      style={{ 
        backgroundColor: theme.background, 
        color: theme.text
      }}
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
                onClick={() => setTheme('system')}
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
              <div 
                className="relative flex w-64 items-center"
              >
                <input
                  type="text"
                  value={libraryPath}
                  readOnly
                  placeholder="未选择媒体库路径"
                  className="w-full px-3 py-1.5 pr-10 border rounded text-sm focus:outline-none cursor-not-allowed"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                    opacity: 0.7
                  }}
                />
                {libraryPath && (
                  <button
                    type="button"
                    onClick={handleClearLibraryPath}
                    className="absolute right-2 flex items-center justify-center rounded p-1 transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: theme.textSecondary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.text;
                      e.currentTarget.style.backgroundColor = theme.tagHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.textSecondary;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="清除路径"
                  >
                    <svg 
                      className="h-4 w-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button 
                onClick={handleSelectFolder}
                disabled={isScanning}
                className="px-3 py-1.5 rounded text-xs transition-colors disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: isScanning ? 'transparent' : theme.buttonBg,
                  color: theme.text,
                  opacity: isScanning ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isScanning) {
                    e.currentTarget.style.backgroundColor = theme.buttonHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isScanning) {
                    e.currentTarget.style.backgroundColor = theme.buttonBg;
                  }
                }}
              >
                {isScanning ? '扫描中...' : '选择'}
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
