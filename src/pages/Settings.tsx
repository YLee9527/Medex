import { useState } from 'react';

type TabType = 'general' | 'media' | 'tags';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'general', label: '通用' },
    { id: 'media', label: '媒体' },
    { id: 'tags', label: '标签' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#e0e0e0]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
        <h1 className="text-xl font-semibold">设置</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-6 pt-4 border-b border-[#333]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm mr-2 rounded-t transition-colors ${
              activeTab === tab.id
                ? 'bg-[#333] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'media' && <MediaSettings />}
        {activeTab === 'tags' && <TagSettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  const [language, setLanguage] = useState('zh-CN');
  const [theme, setTheme] = useState('dark');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">语言</h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full max-w-xs px-3 py-2 bg-[#2a2a2a] border border-[#333] rounded text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">主题</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded text-sm ${
              theme === 'dark'
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
            }`}
          >
            深色
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded text-sm ${
              theme === 'light'
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
            }`}
          >
            浅色
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">启动</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 rounded bg-[#2a2a2a] border-[#333] text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">启动时自动扫描媒体库</span>
        </label>
      </div>
    </div>
  );
}

function MediaSettings() {
  const [thumbnailSize, setThumbnailSize] = useState('256');
  const [autoScan, setAutoScan] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">缩略图</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">缩略图尺寸</label>
            <select
              value={thumbnailSize}
              onChange={(e) => setThumbnailSize(e.target.value)}
              className="w-full max-w-xs px-3 py-2 bg-[#2a2a2a] border border-[#333] rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="128">128x128</option>
              <option value="256">256x256</option>
              <option value="512">512x512</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">自动扫描</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoScan}
            onChange={(e) => setAutoScan(e.target.checked)}
            className="w-4 h-4 rounded bg-[#2a2a2a] border-[#333] text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">定期自动扫描媒体库变化</span>
        </label>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">媒体库路径</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            defaultValue="/Users/terryyoung/Pictures"
            className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-[#333] rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <button className="px-4 py-2 bg-[#333] hover:bg-[#444] rounded text-sm transition-colors">
            浏览
          </button>
        </div>
      </div>
    </div>
  );
}

function TagSettings() {
  const [showUnused, setShowUnused] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">标签管理</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showUnused}
            onChange={(e) => setShowUnused(e.target.checked)}
            className="w-4 h-4 rounded bg-[#2a2a2a] border-[#333] text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">显示未使用的标签</span>
        </label>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">默认标签</h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-[#2a2a2a] rounded-full text-sm flex items-center">
            工作
            <button className="ml-2 text-gray-400 hover:text-red-400">×</button>
          </span>
          <span className="px-3 py-1 bg-[#2a2a2a] rounded-full text-sm flex items-center">
            生活
            <button className="ml-2 text-gray-400 hover:text-red-400">×</button>
          </span>
          <button className="px-3 py-1 bg-[#333] hover:bg-[#444] rounded-full text-sm transition-colors">
            + 添加标签
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">标签颜色</h2>
        <div className="flex space-x-2">
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded-full border-2 border-[#333] hover:border-white transition-colors"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
