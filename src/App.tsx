import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import Main from './components/Main'
import SidebarContainer from './containers/SidebarContainer'
import MediaViewer from './components/MediaViewer'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const mediaItems = useAppStore((state) => state.mediaItems)
  const navItems = useAppStore((state) => state.navItems)
  const markMediaViewedLocal = useAppStore(
    (state) => state.markMediaViewedLocal,
  )
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

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
      if (parseBoolean(autoScanSetting, false) && libraryPath && !alreadyFired) {
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

  return (
    <div className="flex h-screen min-w-[1200px] overflow-hidden">
      <SidebarContainer />
      <Main onOpenViewer={handleOpenViewer} />
      <MediaViewer
        open={viewerOpen}
        mediaList={viewerMediaList}
        currentIndex={currentIndex}
        onClose={handleCloseViewer}
        onChangeIndex={setCurrentIndex}
      />
    </div>
  )
}
