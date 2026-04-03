import { useMemo } from 'react';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import MediaGrid from '../components/MediaGrid';
import { MediaCardProps } from '../components/MediaCard';
import { DbMediaItem, MediaItem, useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';

interface MediaGridContainerProps {
  onOpenViewer: (mediaId: string) => void;
}

export default function MediaGridContainer({ onOpenViewer }: MediaGridContainerProps) {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const navItems = useAppStore((state) => state.navItems);
  const tags = useAppStore((state) => state.tags);
  const selectedMediaId = useAppStore((state) => state.selectedMediaId);
  const clickMedia = useAppStore((state) => state.clickMedia);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addTagToMediaLocal = useAppStore((state) => state.addTagToMediaLocal);
  const removeTagFromMediaLocal = useAppStore((state) => state.removeTagFromMediaLocal);
  const mediaTypeFilter = useAppStore((state) => state.mediaTypeFilter);
  const setMediaItemsFromDb = useAppStore((state) => state.setMediaItemsFromDb);

  const handleToggleFavorite = async (mediaId: string) => {
    const target = mediaItems.find((item) => item.id === mediaId);
    if (!target) {
      return;
    }
    const nextFavorite = !target.isFavorite;
    try {
      await invoke('set_media_favorite', {
        mediaId: Number(mediaId),
        isFavorite: nextFavorite
      });
      toggleFavorite(mediaId);
    } catch (error) {
      console.error('[ui] set_media_favorite failed:', error);
      window.alert(`收藏状态更新失败：${String(error)}`);
    }
  };

  const activeNavId = navItems.find((item) => item.active)?.id ?? 'all-media';
  const selectedTagNames = useMemo(
    () => tags.filter((tag) => tag.selected).map((tag) => tag.name),
    [tags]
  );
  const selectedTagKey = useMemo(() => selectedTagNames.join('|'), [selectedTagNames]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const fetchFilteredMedia = async () => {
        try {
          const rows = await invoke<DbMediaItem[]>('filter_media', {
            tagNames: selectedTagNames,
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
            isRecent: false
          }));
          setMediaItemsFromDb(mapped);
        } catch (error) {
          console.error('[ui] filter media failed:', error);
        }
      };
      void fetchFilteredMedia();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [selectedTagKey, mediaTypeFilter, setMediaItemsFromDb]);

  const mediaList: MediaCardProps[] = useMemo(() => {
    const navFilteredMediaItems = mediaItems.filter((item) => {
      if (activeNavId === 'favorites') {
        return item.isFavorite;
      }
      if (activeNavId === 'recent') {
        return item.isRecent;
      }
      return true;
    });

    return navFilteredMediaItems.map((item) => ({
      ...item,
      selected: item.id === selectedMediaId,
      onClick: () => {}
    }));
  }, [activeNavId, mediaItems, selectedMediaId]);

  return (
    <MediaGrid
      mediaList={mediaList}
      onCardClick={clickMedia}
      onCardDoubleClick={onOpenViewer}
      onToggleFavorite={handleToggleFavorite}
      onTagAdded={addTagToMediaLocal}
      onTagRemoved={removeTagFromMediaLocal}
      viewMode="grid"
    />
  );
}
