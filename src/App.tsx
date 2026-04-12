import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import Main from './components/Main'
import SidebarContainer from './containers/SidebarContainer'
import MediaViewer from './components/MediaViewer'
import { useAppStore } from './store/useAppStore'
import { useThemeContext } from './contexts/ThemeContext'
import { useI18n } from './contexts/I18nContext'

// 全局变量跟踪是否已检查锁屏，避免页面刷新时重复检查
let hasCheckedLockScreen = false

export default function App() {
  const mediaItems = useAppStore((state) => state.mediaItems)
  const navItems = useAppStore((state) => state.navItems)
  const markMediaViewedLocal = useAppStore(
    (state) => state.markMediaViewedLocal,
  )
  const { theme, themeMode } = useThemeContext()
  const { t } = useI18n()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')

  const activeNavId = navItems.find((item) => item.active)?.id ?? 'all-media'
  const viewerMediaList = useMemo(() => {
    return mediaItems.filter((item) => {
      if (activeNavId === 'favorites') {
        return item.isFavorite
      }
      if (activeNavId === 'recent') {
        return item.isRecent
      }
      return true
    })
  }, [activeNavId, mediaItems])

  const handleOpenViewer = (mediaId: string) => {
    const index = viewerMediaList.findIndex((item) => item.id === mediaId)
    if (index < 0) return
    setCurrentIndex(index)
    setViewerOpen(true)
    const viewedAt = Math.floor(Date.now() / 1000)
    markMediaViewedLocal(mediaId, viewedAt)
    void invoke('mark_media_viewed', {
      mediaId: Number(mediaId),
    })
      .then(() => {
        window.dispatchEvent(new Event('medex:media-updated'))
      })
      .catch((error) => {
        console.error('[viewer] mark_media_viewed failed:', error)
      })
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
  }

  const handleOpenSettings = async () => {
    try {
      await invoke('open_settings_window')
    } catch (error) {
      console.error('[app] open_settings_window failed:', error)
    }
  }

  const checkAndLockApp = async () => {
    try {
      const exists = await invoke('app_password_exists')
      if (exists) {
        setIsLocked(true)
      }
    } catch (err) {
      console.warn('[app] failed to check app password exists', err)
    }
  }

  const lockWhenMinimized = async () => {
    try {
      const currentWindow = getCurrentWindow()
      const minimized = await currentWindow.isMinimized()
      if (minimized) {
        const exists = await invoke('app_password_exists')
        if (exists) {
          setIsLocked(true)
        }
      }
    } catch (err) {
      console.warn('[app] failed to check minimized state', err)
    }
  }

  const handleUnlock = async () => {
    try {
      const verified = await invoke('verify_app_password', {
        password: unlockPassword,
      })
      if (verified) {
        setIsLocked(false)
        setUnlockPassword('')
      } else {
        window.alert(t('lockScreen.wrongPassword'))
        setUnlockPassword('')
      }
    } catch (err) {
      console.error('[app] verify_app_password failed:', err)
      window.alert(t('lockScreen.wrongPassword'))
      setUnlockPassword('')
    }
  }

  const handleUnlockKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock()
    }
  }

  // 启动时自动扫描媒体库（如果用户开启了该设置）。使用 sessionStorage 标记避免后端触发的 reload 导致循环执行
  useEffect(() => {
    try {
      const alreadyFired = sessionStorage.getItem('medex:autoScanFired')
      const autoScanSetting = localStorage.getItem('autoScanOnStartup')
      const libraryPath = localStorage.getItem('libraryPath')

      // 辅助：解析字符串布尔
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

      // 仅在当前会话未触发过自动扫描时启动
      if (
        parseBoolean(autoScanSetting, false) &&
        libraryPath &&
        !alreadyFired
      ) {
        sessionStorage.setItem('medex:autoScanFired', String(Date.now()))
        console.log('[app] auto-scan enabled, starting scan for', libraryPath)
        // 通知其他窗口或组件
        window.dispatchEvent(new CustomEvent('medex:scan-started'))
        invoke('scan_and_index', { path: libraryPath })
          .then(() => {
            console.log('[app] auto-scan completed')
            window.dispatchEvent(new CustomEvent('medex:scan-completed'))
            // 触发全局事件用于刷新 UI
            window.dispatchEvent(new Event('medex:media-updated'))
          })
          .catch((err) => {
            console.error('[app] auto-scan failed:', err)
            window.dispatchEvent(
              new CustomEvent('medex:scan-error', { detail: String(err) }),
            )
          })
      }
    } catch (err) {
      console.warn('[app] sessionStorage check failed', err)
    }
  }, [])

  // 监听后端 scan_done 事件，将其转换为 medex:media-updated，供前端容器刷新数据
  useEffect(() => {
    let unlisten: (() => void) | null = null
    void (async () => {
      try {
        const u = await listen('scan_done', () => {
          console.log('[app] received scan_done from backend')
          window.dispatchEvent(new Event('medex:media-updated'))
        })
        unlisten = u
      } catch (err) {
        console.warn('[app] failed to attach scan_done listener', err)
      }
    })()

    return () => {
      if (unlisten) {
        try {
          unlisten()
        } catch {}
      }
    }
  }, [])

  // 监听全局语言变更事件（由设置窗口触发），在多窗口场景下刷新当前窗口以应用新语言
  useEffect(() => {
    let unlistenLang: (() => void) | null = null
    void (async () => {
      try {
        const u = await listen('medex:language-changed', () => {
          console.log(
            '[app] language changed, reloading window to apply new language',
          )
          window.location.reload()
        })
        unlistenLang = u
      } catch (err) {
        console.warn('[app] failed to attach language-changed listener', err)
      }
    })()

    // In addition, listen for same-window customEvent if emitted
    const onLang = () => {
      console.log('[app] received local language-changed, reloading')
      window.location.reload()
    }
    window.addEventListener('medex:language-changed', onLang)

    return () => {
      if (unlistenLang) {
        try {
          unlistenLang()
        } catch {}
      }
      window.removeEventListener('medex:language-changed', onLang)
    }
  }, [])

  useEffect(() => {
    if (import.meta.env.PROD) {
      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault()
      }
      window.addEventListener('contextmenu', handleContextMenu)
      return () => {
        window.removeEventListener('contextmenu', handleContextMenu)
      }
    }
    return undefined
  }, [])

  useEffect(() => {
    if (!viewerOpen) return
    if (viewerMediaList.length === 0) {
      setViewerOpen(false)
      return
    }
    if (currentIndex > viewerMediaList.length - 1) {
      setCurrentIndex(viewerMediaList.length - 1)
    }
  }, [viewerOpen, currentIndex, viewerMediaList.length])

  // 监听窗口焦点变化，当应用收起到 dock 时显示锁屏
  useEffect(() => {
    let unlistenFocus: (() => void) | null = null
    void (async () => {
      try {
        const currentWindow = getCurrentWindow()
        const u = await currentWindow.onFocusChanged(({ payload: focused }) => {
          if (!focused) {
            lockWhenMinimized()
          }
        })
        unlistenFocus = u
      } catch (err) {
        console.warn('[app] failed to attach focus listener', err)
      }
    })()

    return () => {
      if (unlistenFocus) {
        try {
          unlistenFocus()
        } catch {}
      }
    }
  }, [])

  // 应用启动时检查是否需要锁屏，并清理旧版本地密码存储
  useEffect(() => {
    localStorage.removeItem('appPassword')
    
    // 只有在应用首次启动时才检查锁屏，避免页面刷新时重复弹出
    const alreadyCheckedLockScreen = sessionStorage.getItem('medex:lockScreenChecked')
    if (!alreadyCheckedLockScreen) {
      sessionStorage.setItem('medex:lockScreenChecked', 'true')
      void checkAndLockApp()
    }
  }, [])

  return (
    <div className="relative flex h-screen min-w-[1200px] overflow-hidden">
      <SidebarContainer />
      <Main onOpenViewer={handleOpenViewer} />
      <MediaViewer
        open={viewerOpen}
        mediaList={viewerMediaList}
        currentIndex={currentIndex}
        onClose={handleCloseViewer}
        onChangeIndex={setCurrentIndex}
      />
      <button
        type="button"
        onClick={handleOpenSettings}
        title="设置"
        className="absolute left-4 bottom-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border transition-colors duration-150"
        style={{
          backgroundColor: theme.buttonBg,
          borderColor: theme.borderLight,
          color: theme.text,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.buttonHover
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.buttonBg
        }}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9.6 18.9a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 5.1 9.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H20a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* 密码锁屏蒙版 */}
      {isLocked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor:
              themeMode === 'dark'
                ? 'rgba(0, 0, 0, 0.5)'
                : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // Safari support
          }}
        >
          <div
            className="rounded-lg p-6 shadow-lg"
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.borderLight}`,
            }}
          >
            <h2
              className="mb-4 text-center text-lg font-semibold"
              style={{ color: theme.text }}
            >
              {t('lockScreen.title')}
            </h2>
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              onKeyPress={handleUnlockKeyPress}
              placeholder={t('lockScreen.placeholder')}
              className="mb-4 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.text,
              }}
              autoFocus
            />
            <button
              onClick={handleUnlock}
              className="w-full rounded px-4 py-2 transition-colors"
              style={{
                backgroundColor: theme.buttonBg,
                color: theme.text,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.buttonHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.buttonBg
              }}
            >
              {t('lockScreen.unlock')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
