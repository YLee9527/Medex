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

  // 监听媒体卡片显示设置变更事件（由设置窗口触发），刷新当前窗口以应用新设置
  useEffect(() => {
    let unlistenDisplay: (() => void) | null = null
    void (async () => {
      try {
        const u = await listen('medex:media-display-changed', () => {
          console.log(
            '[app] media display settings changed, reloading window to apply new settings',
          )
          window.location.reload()
        })
        unlistenDisplay = u
      } catch (err) {
        console.warn('[app] failed to attach media-display-changed listener', err)
      }
    })()

    // In addition, listen for same-window customEvent if emitted
    const onDisplay = () => {
      console.log('[app] received local media-display-changed, reloading')
      window.location.reload()
    }
    window.addEventListener('medex:media-display-changed', onDisplay)

    return () => {
      if (unlistenDisplay) {
        try {
          unlistenDisplay()
        } catch {}
      }
      window.removeEventListener('medex:media-display-changed', onDisplay)
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
          className="icon h-6 w-6"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="2632"
          fill={theme.text}
        >
          <path d="M583.68 42.666667a85.333333 85.333333 0 0 1 83.690667 68.586666l16.234667 81.152c3.328 1.813333 6.570667 3.626667 9.792 5.482667l9.536 5.717333 78.421334-26.517333a85.333333 85.333333 0 0 1 98.986666 34.453333l2.261334 3.712 71.68 124.16a85.333333 85.333333 0 0 1-17.557334 106.773334l-62.229333 54.677333L874.666667 512l-0.170667 11.114667 62.229333 54.698666a85.333333 85.333333 0 0 1 19.712 102.826667l-2.133333 3.946667-71.68 124.16a85.333333 85.333333 0 0 1-101.269333 38.186666l-78.421334-26.56-9.536 5.738667-9.792 5.461333-16.234666 81.152a85.333333 85.333333 0 0 1-79.36 68.48L583.68 981.333333h-143.36a85.333333 85.333333 0 0 1-83.690667-68.586666l-16.234667-81.173334a366.293333 366.293333 0 0 1-19.306667-11.178666L242.645333 846.933333a85.333333 85.333333 0 0 1-101.248-38.165333l-71.68-124.16a85.333333 85.333333 0 0 1 17.557334-106.773333l62.208-54.698667L149.333333 512c0-3.712 0.064-7.424 0.170667-11.136L87.253333 446.186667a85.333333 85.333333 0 0 1-17.578666-106.773334l71.68-124.16a85.333333 85.333333 0 0 1 101.248-38.186666l78.442666 26.517333 9.557334-5.696a454.4 454.4 0 0 1 9.770666-5.482667l16.234667-81.130666a85.333333 85.333333 0 0 1 79.36-68.48L440.32 42.666667z m0 85.333333h-143.36l-24.597333 122.901333-19.712 9.109334c-15.466667 7.125333-30.229333 15.68-44.138667 25.514667l-17.728 12.586667-118.848-40.192-71.68 124.16 94.165333 82.794667-1.962666 21.589333a281.386667 281.386667 0 0 0 0 51.072l1.962666 21.589333-94.186666 82.773334 71.68 124.181333 118.869333-40.170667 17.728 12.565334c13.909333 9.834667 28.672 18.389333 44.16 25.514666l19.690667 9.109334L440.32 896h143.36l24.618667-122.922667 19.712-9.088a276.992 276.992 0 0 0 44.138666-25.536l17.728-12.586666 118.826667 40.213333 71.68-124.16-94.165333-82.794667 1.962666-21.589333a281.386667 281.386667 0 0 0 0-51.072l-1.962666-21.589333 94.186666-82.773334-71.68-124.181333-118.826666 40.192-17.749334-12.586667a276.992 276.992 0 0 0-44.16-25.514666l-19.690666-9.088L583.68 128zM512 341.333333a170.666667 170.666667 0 1 1 0 341.333334 170.666667 170.666667 0 0 1 0-341.333334z m0 85.333334a85.333333 85.333333 0 1 0 0 170.666666 85.333333 85.333333 0 0 0 0-170.666666z"
            p-id="2633"
          ></path>
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
