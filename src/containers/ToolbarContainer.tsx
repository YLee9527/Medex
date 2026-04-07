import { useEffect, useRef, useState } from 'react'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import Toolbar from '../components/Toolbar'
import { DbMediaItem, MediaItem, useAppStore } from '../store/useAppStore'
import { useThemeContext } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'

interface ScanProgressPayload {
  current: number
  total: number
  filename: string
}

export default function ToolbarContainer() {
  const tags = useAppStore((state) => state.tags)
  const mediaItems = useAppStore((state) => state.mediaItems)
  const mediaTypeFilter = useAppStore((state) => state.mediaTypeFilter)
  const setMediaTypeFilter = useAppStore((state) => state.setMediaTypeFilter)
  const setMediaItemsFromDb = useAppStore((state) => state.setMediaItemsFromDb)
  const { theme } = useThemeContext()
  const [statusMessage, setStatusMessage] = useState('')
  const scanInFlightRef = useRef(false)
  const doneHandledRef = useRef(false)

  const activeTags = tags.filter((tag) => tag.selected).map((tag) => tag.name)

  const handleMediaTypeChange = (mode: 'all' | 'image' | 'video') => {
    setMediaTypeFilter(mode)
  }

  const loadAllMedia = async () => {
    const rows = await invoke<DbMediaItem[]>('filter_media', {
      tagNames: activeTags,
      mediaType: mediaTypeFilter === 'all' ? null : mediaTypeFilter,
    })
    const mapped: MediaItem[] = rows.map((row) => ({
      id: String(row.id),
      path: row.path,
      thumbnail: row.type === 'image' ? convertFileSrc(row.path) : '',
      filename: row.filename,
      tags: row.tags ?? [],
      time: '',
      mediaType: row.type,
      duration: '--:--',
      resolution: '未知',
      isFavorite: row.isFavorite ?? false,
      isRecent: row.isRecent ?? false,
      recentViewedAt: row.recentViewedAt ?? null,
    }))
    setMediaItemsFromDb(mapped)
    return mapped.length
  }

  useEffect(() => {
    void loadAllMedia()
  }, [])

  useEffect(() => {
    let disposed = false
    let unlisten: (() => void) | null = null
    const setup = async () => {
      const fn = await listen('scan_done', async () => {
        if (!scanInFlightRef.current || doneHandledRef.current) {
          return
        }
        doneHandledRef.current = true
        scanInFlightRef.current = false
        try {
          const count = await loadAllMedia()
          setStatusMessage(`扫描完成，当前共 ${count} 个媒体文件`)
          window.setTimeout(() => setStatusMessage(''), 2800)
        } catch (error) {
          console.error('[ui] refresh after scan failed:', error)
        }
      })
      if (disposed) {
        fn()
        return
      }
      unlisten = fn
    }
    void setup()
    return () => {
      disposed = true
      if (unlisten) unlisten()
    }
  }, [])

  return (
    <>
      <Toolbar
        activeTags={activeTags}
        resultCount={mediaItems.length}
        mediaType={mediaTypeFilter}
        onMediaTypeChange={handleMediaTypeChange}
        theme={theme}
      />
      {statusMessage ? (
        <div
          className="mt-2 rounded-md border px-3 py-2 text-xs"
          style={{
            borderColor: `${theme.highlight}30`,
            backgroundColor: `${theme.highlight}10`,
            color: theme.highlight,
          }}
        >
          {statusMessage}
        </div>
      ) : null}
    </>
  )
}
