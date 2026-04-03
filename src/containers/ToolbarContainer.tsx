import { useEffect, useState } from 'react';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import Toolbar from '../components/Toolbar';
import { DbMediaItem, MediaItem, useAppStore } from '../store/useAppStore';

export default function ToolbarContainer() {
  const tags = useAppStore((state) => state.tags);
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const setMediaItemsFromDb = useAppStore((state) => state.setMediaItemsFromDb);
  const [loading, setLoading] = useState(false);

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
      thumbnail: convertFileSrc(row.path, 'asset'),
      filename: row.filename,
      tags: [],
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
      console.log('[ui] selected folder:', selected);

      const scanResult = await invoke<string>('scan_and_index', { path: selected });
      const count = await loadAllMedia();
      console.log('[ui] scan result:', scanResult);
      window.alert(`${scanResult}\n当前共 ${count} 个媒体文件`);
    } catch (error) {
      console.error('[ui] scan failed:', error);
      window.alert(`扫描失败：${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllMedia();
  }, []);

  return (
    <Toolbar
      activeTags={activeTags}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onSelectFolder={handleSelectFolder}
      loading={loading}
    />
  );
}
