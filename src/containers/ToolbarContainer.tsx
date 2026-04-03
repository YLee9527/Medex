import { useEffect, useRef, useState } from 'react';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import Toolbar from '../components/Toolbar';
import { DbMediaItem, MediaItem, useAppStore } from '../store/useAppStore';

interface ScanProgressPayload {
  current: number;
  total: number;
  filename: string;
}

export default function ToolbarContainer() {
  const tags = useAppStore((state) => state.tags);
  const mediaItems = useAppStore((state) => state.mediaItems);
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const setMediaItemsFromDb = useAppStore((state) => state.setMediaItemsFromDb);
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

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    console.log('toolbar view mode:', mode);
    setViewMode(mode);
  };

  const loadAllMedia = async () => {
    const rows = await invoke<DbMediaItem[]>('get_all_media');
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
      isFavorite: false,
      isRecent: false
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
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onSelectFolder={handleSelectFolder}
        loading={loading}
      />
      {statusMessage ? (
        <div className="mt-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {statusMessage}
        </div>
      ) : null}
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className="w-[360px] rounded-lg border border-white/10 bg-[#1E1E1E] p-4 text-[#EAEAEA]">
            <p className="mb-3 text-sm">正在扫描媒体文件...</p>
            <div className="mb-3 h-2 w-full overflow-hidden rounded bg-white/10">
              <div
                className="h-full rounded bg-[#4A90E2] transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="space-y-1 text-xs text-white/70">
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
