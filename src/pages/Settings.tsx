import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { emit } from '@tauri-apps/api/event'
import { useThemeContext } from '../contexts/ThemeContext'
import { ThemeColors } from '../theme/theme'
import { useI18n } from '../contexts/I18nContext'

export default function Settings() {
  const { theme, themeMode, toggleTheme, setTheme } = useThemeContext()

  // 辅助：将 localStorage 中的字符串布尔值解析为真正的 boolean
  const parseBoolean = (val: string | null, defaultVal = false) => {
    if (val === null) return defaultVal
    const s = String(val).trim().toLowerCase()
    if (s === 'true' || s === '1' || s === 'yes') return true
    if (s === 'false' || s === '0' || s === '') return false
    try {
      return Boolean(JSON.parse(val as string))
    } catch {
      return defaultVal
    }
  }

  const { t, language, setLanguage } = useI18n()
  const [libraryPath, setLibraryPath] = useState<string>('')
  // 使用懒初始化确保初始值来自 localStorage，避免 mount 时被初始 true 覆盖
  const [autoScan, setAutoScan] = useState<boolean>(() =>
    parseBoolean(localStorage.getItem('autoScanOnStartup'), false),
  )
  const [isScanning, setIsScanning] = useState(false)

  // 初始化时从 localStorage 读取媒体库路径（autoScan 由懒初始化负责）
  useEffect(() => {
    const path = localStorage.getItem('libraryPath')
    if (path) {
      setLibraryPath(path)
    }
  }, [])

  // 当 autoScan 变化时，保存到 localStorage（只有在值不同的情况下写入，避免不必要覆盖）
  useEffect(() => {
    try {
      const current = localStorage.getItem('autoScanOnStartup')
      const normalized = autoScan ? 'true' : 'false'
      if (current !== normalized) {
        localStorage.setItem('autoScanOnStartup', normalized)
      }
    } catch (err) {
      console.warn('[settings] failed to persist autoScan setting', err)
    }
  }, [autoScan])

  // 启动一次扫描并管理状态与事件
  const startScan = async (path: string) => {
    if (!path) {
      window.alert(t('alerts.selectLibraryFirst'))
      return
    }
    try {
      setIsScanning(true)
      window.dispatchEvent(new CustomEvent('medex:scan-started'))
      await invoke('scan_and_index', { path })
      window.dispatchEvent(new CustomEvent('medex:scan-completed'))
      window.alert(t('alerts.scanComplete'))
    } catch (error) {
      console.error('[ui] scan failed:', error)
      window.alert(`${t('alerts.scanFailedPrefix')}${String(error)}`)
    } finally {
      setIsScanning(false)
    }
  }

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      })
      if (!selected || Array.isArray(selected)) {
        return
      }

      // 保存选择的路径到 localStorage
      localStorage.setItem('libraryPath', selected)
      setLibraryPath(selected)

      // 触发扫描和索引（使用统一入口）
      await startScan(selected)
    } catch (error) {
      console.error('[ui] scan failed:', error)
      window.alert(`${t('alerts.scanFailedPrefix')}${String(error)}`)
      setIsScanning(false)
    }
  }

  const handleClearLibraryPath = async () => {
    try {
      // 调用后端 API 清理数据库
      await invoke('clear_library_data')

      // 清除 localStorage 和状态
      localStorage.removeItem('libraryPath')
      setLibraryPath('')

      // 使用 Tauri 全局事件通知所有窗口
      await emit('medex:library-path-cleared')

      console.log('[ui] library data cleared successfully')
    } catch (error) {
      console.error('[ui] clear library data failed:', error)
      window.alert(`${t('alerts.scanFailedPrefix')}${String(error)}`)
    }
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: theme.borderLight }}
      >
        <h1 className="text-xl font-semibold">{t('settings.title')}</h1>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-6">
          {/* 1. Language Setting */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>
              {t('settings.language.label')}
            </div>
            <div>
              <select
                value={language}
                onChange={async (e) => {
                  const newLang = e.target.value
                  setLanguage(newLang)
                  try {
                    await emit('medex:language-changed', { language: newLang })
                  } catch (err) {
                    console.warn('[settings] emit language-changed failed', err)
                  }
                  // Local window event for same-window listeners
                  window.dispatchEvent(
                    new CustomEvent('medex:language-changed', {
                      detail: newLang,
                    }),
                  )
                }}
                className="px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-blue-500"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                }}
              >
                <option value="zh-CN">{t('languages.zh-CN')}</option>
                <option value="en-US">{t('languages.en-US')}</option>
              </select>
            </div>
          </div>

          {/* 2. Theme Setting */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>
              {t('settings.theme.label')}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setTheme('dark')}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor:
                    themeMode === 'dark' ? '#3B82F6' : theme.buttonBg,
                  color: themeMode === 'dark' ? '#FFFFFF' : theme.text,
                }}
              >
                {t('settings.theme.dark')}
              </button>
              <button
                onClick={() => setTheme('light')}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor:
                    themeMode === 'light' ? '#3B82F6' : theme.buttonBg,
                  color: themeMode === 'light' ? '#FFFFFF' : theme.text,
                }}
              >
                {t('settings.theme.light')}
              </button>
              <button
                onClick={() => setTheme('system')}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor:
                    themeMode === 'system' ? '#3B82F6' : theme.buttonBg,
                  color: themeMode === 'system' ? '#FFFFFF' : theme.text,
                }}
              >
                {t('settings.theme.system')}
              </button>
            </div>
          </div>

          {/* 3. Media Library Path */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>
              {t('settings.library.label')}
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative flex w-64 items-center">
                <input
                  type="text"
                  value={libraryPath}
                  readOnly
                  placeholder={t('settings.library.placeholder')}
                  className="w-full px-3 py-1.5 pr-10 border rounded text-sm focus:outline-none cursor-not-allowed"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                    opacity: 0.7,
                  }}
                />
                {libraryPath && (
                  <button
                    type="button"
                    onClick={handleClearLibraryPath}
                    className="absolute right-2 flex items-center justify-center rounded p-1 transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: theme.textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.text
                      e.currentTarget.style.backgroundColor = theme.tagHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.textSecondary
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    title={t('settings.clearPath.title')}
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
                  opacity: isScanning ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isScanning) {
                    e.currentTarget.style.backgroundColor = theme.buttonHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isScanning) {
                    e.currentTarget.style.backgroundColor = theme.buttonBg
                  }
                }}
              >
                {isScanning ? t('settings.scanning') : t('settings.select')}
              </button>
            </div>
          </div>

          {/* 4. Auto Scan on Startup */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: theme.borderLight }}
          >
            <div className="text-sm font-medium" style={{ color: theme.text }}>
              {t('settings.autoScan.label')}
            </div>
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                  className="sr-only"
                  disabled={isScanning}
                />
                <div
                  className="relative w-10 h-6 rounded-full transition-colors"
                  style={{
                    backgroundColor: autoScan ? '#3B82F6' : theme.inputBorder,
                  }}
                >
                  <div
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"
                    style={{
                      transform: autoScan
                        ? 'translateX(16px)'
                        : 'translateX(0)',
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
