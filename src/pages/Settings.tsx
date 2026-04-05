import { useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { ThemeColors } from '../theme/theme';

type TabType = 'general' | 'media' | 'tags';

export default function Settings() {
  const { theme } = useThemeContext();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'general', label: '通用' },
    { id: 'media', label: '媒体' },
    { id: 'tags', label: '标签' },
  ];

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

      {/* Tabs */}
      <div 
        className="flex px-6 pt-4 border-b"
        style={{ borderColor: theme.borderLight }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-sm mr-2 rounded-t transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? theme.buttonBg : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : theme.textSecondary,
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = theme.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'general' && <GeneralSettings theme={theme} />}
        {activeTab === 'media' && <MediaSettings theme={theme} />}
        {activeTab === 'tags' && <TagSettings theme={theme} />}
      </div>
    </div>
  );
}

function GeneralSettings({ theme }: { theme: ThemeColors }) {
  const [language, setLanguage] = useState('zh-CN');
  const { themeMode, toggleTheme } = useThemeContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>语言</h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-500"
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

      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>主题</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              if (themeMode === 'light') {
                toggleTheme();
              }
            }}
            className="px-4 py-2 rounded text-sm transition-colors"
            style={{
              backgroundColor: themeMode === 'dark' ? '#3B82F6' : theme.buttonBg,
              color: themeMode === 'dark' ? '#FFFFFF' : theme.textSecondary,
            }}
          >
            <div className="flex items-center">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              深色
            </div>
          </button>
          <button
            onClick={() => {
              if (themeMode === 'dark') {
                toggleTheme();
              }
            }}
            className="px-4 py-2 rounded text-sm transition-colors"
            style={{
              backgroundColor: themeMode === 'light' ? '#3B82F6' : theme.buttonBg,
              color: themeMode === 'light' ? '#FFFFFF' : theme.textSecondary,
            }}
          >
            <div className="flex items-center">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              浅色
            </div>
          </button>
        </div>
        <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
          当前模式：{themeMode === 'dark' ? '深色主题' : '浅色主题'}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>启动</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 rounded border focus:ring-blue-500"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder
            }}
          />
          <span className="text-sm" style={{ color: theme.textSecondary }}>启动时自动扫描媒体库</span>
        </label>
      </div>
    </div>
  );
}

function MediaSettings({ theme }: { theme: ThemeColors }) {
  const [thumbnailSize, setThumbnailSize] = useState('256');
  const [autoScan, setAutoScan] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>缩略图</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm mb-2 block" style={{ color: theme.textSecondary }}>缩略图尺寸</label>
            <select
              value={thumbnailSize}
              onChange={(e) => setThumbnailSize(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-500"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.text
              }}
            >
              <option value="128">128x128</option>
              <option value="256">256x256</option>
              <option value="512">512x512</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>自动扫描</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoScan}
            onChange={(e) => setAutoScan(e.target.checked)}
            className="w-4 h-4 rounded border focus:ring-blue-500"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder
            }}
          />
          <span className="text-sm" style={{ color: theme.textSecondary }}>定期自动扫描媒体库变化</span>
        </label>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>媒体库路径</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            defaultValue="/Users/terryyoung/Pictures"
            className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-500"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.text
            }}
          />
          <button 
            className="px-4 py-2 rounded text-sm transition-colors"
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
    </div>
  );
}

function TagSettings({ theme }: { theme: ThemeColors }) {
  const [showUnused, setShowUnused] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>标签管理</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showUnused}
            onChange={(e) => setShowUnused(e.target.checked)}
            className="w-4 h-4 rounded border focus:ring-blue-500"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder
            }}
          />
          <span className="text-sm" style={{ color: theme.textSecondary }}>显示未使用的标签</span>
        </label>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>默认标签</h2>
        <div className="flex flex-wrap gap-2">
          <span 
            className="px-3 py-1 rounded-full text-sm flex items-center"
            style={{ backgroundColor: theme.tagBg, color: theme.text }}
          >
            工作
            <button className="ml-2 hover:text-red-400" style={{ color: theme.textTertiary }}>×</button>
          </span>
          <span 
            className="px-3 py-1 rounded-full text-sm flex items-center"
            style={{ backgroundColor: theme.tagBg, color: theme.text }}
          >
            生活
            <button className="ml-2 hover:text-red-400" style={{ color: theme.textTertiary }}>×</button>
          </span>
          <button 
            className="px-3 py-1 rounded-full text-sm transition-colors"
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
            + 添加标签
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.text }}>标签颜色</h2>
        <div className="flex space-x-2">
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded-full border-2 transition-colors hover:border-white"
              style={{ 
                backgroundColor: color,
                borderColor: theme.borderLight
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
