import { useEffect, useRef, useState } from 'react';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import Toolbar from '../components/Toolbar';
import { DbMediaItem, MediaItem, useAppStore } from '../store/useAppStore';
import { useThemeContext } from '../contexts/ThemeContext';

interface ScanProgressPayload {
  current: number;
  total: number;
  filename: string;
}

export default function ToolbarContainer() {
  const tags = useAppStore((state) => state.tags);
  const mediaItems = useAppStore((state) => state.mediaItems);
  const mediaTypeFilter = useAppStore((state) => state.mediaTypeFilter);
  const setMediaTypeFilter = useAppStore((state) => state.setMediaTypeFilter);
  const setMediaItemsFromDb = useAppStore((state) => state.setMediaItemsFromDb);
  const { theme } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [scanProgress, setScanProgress] = useState<ScanProgressPayload>({
    current: 0,
    total: 0,
    filename: ''
  });
  const scanInFlightRef = useRef(false);
  const doneHandledRef = useRef(false);

  const activeTags = tags.filter((tag) => tag.selected).map((tag) => tag.name);

  const handleMediaTypeChange = (mode: 'all' | 'image' | 'video') => {
    setMediaTypeFilter(mode);
  };

  const loadAllMedia = async () => {
    const rows = await invoke<DbMediaItem[]>('filter_media', {
      tagNames: activeTags,
      mediaType: mediaTypeFilter === 'all' ? null : mediaTypeFilter
    });
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
      recentViewedAt: row.recentViewedAt ?? null
    }));
    setMediaItemsFromDb(mapped);
    return mapped.length;
  };

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

      setLoading(true);
      setStatusMessage('');
      scanInFlightRef.current = true;
      doneHandledRef.current = false;
      setScanProgress({ current: 0, total: 0, filename: '' });
      console.log('[ui] selected folder:', selected);
      await invoke('scan_and_index', { path: selected });
    } catch (error) {
      console.error('[ui] scan failed:', error);
      window.alert(`扫描失败：${String(error)}`);
      scanInFlightRef.current = false;
      doneHandledRef.current = true;
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllMedia();
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | null = null;
    const setup = async () => {
      const fn = await listen<ScanProgressPayload>('scan_progress', (event) => {
        setScanProgress(event.payload);
      });
      if (disposed) {
        fn();
        return;
      }
      unlisten = fn;
    };
    void setup();
    return () => {
      disposed = true;
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | null = null;
    const setup = async () => {
      const fn = await listen('scan_done', async () => {
        if (!scanInFlightRef.current || doneHandledRef.current) {
          return;
        }
        doneHandledRef.current = true;
        scanInFlightRef.current = false;
        setLoading(false);
        try {
          const count = await loadAllMedia();
          setStatusMessage(`扫描完成，当前共 ${count} 个媒体文件`);
          window.setTimeout(() => setStatusMessage(''), 2800);
        } catch (error) {
          console.error('[ui] refresh after scan failed:', error);
        }
      });
      if (disposed) {
        fn();
        return;
      }
      unlisten = fn;
    };
    void setup();
    return () => {
      disposed = true;
      if (unlisten) unlisten();
    };
  }, []);

  const progressPercent =
    scanProgress.total > 0
      ? Math.min(100, Math.round((scanProgress.current / scanProgress.total) * 100))
      : 0;

  return (
    <>
      <Toolbar
        activeTags={activeTags}
        resultCount={mediaItems.length}
        mediaType={mediaTypeFilter}
        onMediaTypeChange={handleMediaTypeChange}
        onSelectFolder={handleSelectFolder}
        loading={loading}
        theme={theme}
      />
      {statusMessage ? (
        <div 
          className="mt-2 rounded-md border px-3 py-2 text-xs"
          style={{ 
            borderColor: `${theme.highlight}30`,
            backgroundColor: `${theme.highlight}10`,
            color: theme.highlight
          }}
        >
          {statusMessage}
        </div>
      ) : null}
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: theme.overlay }}>
          <div 
            className="w-[360px] rounded-lg border p-4"
            style={{ 
              backgroundColor: theme.sidebar,
              color: theme.text,
              borderColor: theme.borderLight
            }}
          >
            <p className="mb-3 text-sm">正在扫描媒体文件...</p>
            <div className="mb-3 h-2 w-full overflow-hidden rounded" style={{ backgroundColor: theme.hover }}>
              <div
                className="h-full rounded transition-all duration-200"
                style={{ width: `${progressPercent}%`, backgroundColor: theme.progress }}
              />
            </div>
            <div className="space-y-1 text-xs" style={{ color: theme.textSecondary }}>
              <div className="flex items-center justify-between">
                <span>
                  {scanProgress.current} / {scanProgress.total || 0}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <p className="truncate">{scanProgress.filename || '处理中...'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
