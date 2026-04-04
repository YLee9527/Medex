import { useCallback, useMemo, useRef, useState } from 'react';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import MediaGrid, { RenderRange } from '../components/MediaGrid';
import { MediaCardProps } from '../components/MediaCard';
import MediaCardContextMenu from '../components/MediaCardContextMenu';
import { DbMediaItem, MediaItem, useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';

interface MediaGridContainerProps {
  onOpenViewer: (mediaId: string) => void;
}

type ThumbnailReadyPayload = {
  video_path: string;
  thumbnail_path: string;
};

type ThumbnailTask = {
  path: string;
  priority: number;
  index: number;
};

const MAX_CONCURRENT = 5;
const MAX_QUEUE_SIZE = 400;

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
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const thumbnailMapRef = useRef<Record<string, string>>({});
  const requestingSet = useRef<Set<string>>(new Set());
  const queuedSet = useRef<Set<string>>(new Set());
  const taskQueue = useRef<ThumbnailTask[]>([]);

  // Context Menu 状态
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuMediaId, setContextMenuMediaId] = useState<string>('');

  const handleContextMenu = useCallback((e: React.MouseEvent, mediaId: string) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuMediaId(mediaId);
    setContextMenuVisible(true);
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuMediaId('');
  }, []);

  const handleTagsApplied = useCallback(
    (mediaId: string, addedTags: string[], removedTags: string[]) => {
      // 更新本地状态
      addedTags.forEach((tagName) => {
        addTagToMediaLocal(mediaId, tagName);
      });
      removedTags.forEach((tagName) => {
        removeTagFromMediaLocal(mediaId, tagName);
      });
      // 触发全局事件更新
      window.dispatchEvent(new Event('medex:tags-updated'));
      window.dispatchEvent(new Event('medex:media-tags-updated'));
    },
    [addTagToMediaLocal, removeTagFromMediaLocal]
  );

  const contextMenuMedia = useMemo(() => {
    return mediaItems.find((item) => item.id === contextMenuMediaId);
  }, [mediaItems, contextMenuMediaId]);

  const allTagsForMenu = useMemo(() => {
    return tags.map((tag) => ({ id: Number(tag.id), name: tag.name }));
  }, [tags]);

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

  const fetchFilteredMedia = useCallback(async () => {
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
        isRecent: row.isRecent ?? false,
        recentViewedAt: row.recentViewedAt ?? null
      }));
      setMediaItemsFromDb(mapped);
    } catch (error) {
      console.error('[ui] filter media failed:', error);
    }
  }, [selectedTagNames, mediaTypeFilter, setMediaItemsFromDb]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchFilteredMedia();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [selectedTagKey, mediaTypeFilter, fetchFilteredMedia]);

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

    const sortedItems =
      activeNavId === 'recent'
        ? [...navFilteredMediaItems].sort((a, b) => (b.recentViewedAt ?? 0) - (a.recentViewedAt ?? 0))
        : navFilteredMediaItems;

    return sortedItems.map((item) => ({
      ...item,
      selected: item.id === selectedMediaId,
      onClick: () => {}
    }));
  }, [activeNavId, mediaItems, selectedMediaId]);

  useEffect(() => {
    thumbnailMapRef.current = thumbnails;
  }, [thumbnails]);

  useEffect(() => {
    taskQueue.current = [];
    queuedSet.current.clear();
    requestingSet.current.clear();
  }, [mediaList]);

  const drainQueue = useCallback(() => {
    while (requestingSet.current.size < MAX_CONCURRENT && taskQueue.current.length > 0) {
      const task = taskQueue.current.shift();
      if (!task) {
        break;
      }

      queuedSet.current.delete(task.path);
      if (thumbnailMapRef.current[task.path] || requestingSet.current.has(task.path)) {
        continue;
      }

      requestingSet.current.add(task.path);
      void invoke<string>('request_thumbnail', { path: task.path })
        .then((result) => {
          if (result && result !== '__PENDING__') {
            const preview = convertFileSrc(result);
            setThumbnails((prev) => {
              if (prev[task.path] === preview) {
                return prev;
              }
              return {
                ...prev,
                [task.path]: preview
              };
            });
            requestingSet.current.delete(task.path);
            drainQueue();
          }
        })
        .catch((error) => {
          console.error('[thumbnail] request_thumbnail failed:', error);
          requestingSet.current.delete(task.path);
          drainQueue();
        });
    }
  }, []);

  const enqueueThumbnailTask = useCallback(
    (path: string, priority: number, index: number) => {
      if (!path) return;
      if (thumbnailMapRef.current[path]) return;
      if (requestingSet.current.has(path)) return;
      if (queuedSet.current.has(path)) return;
      if (taskQueue.current.length >= MAX_QUEUE_SIZE) return;

      const task: ThumbnailTask = { path, priority, index };
      const queue = taskQueue.current;
      let insertAt = queue.length;
      for (let i = 0; i < queue.length; i += 1) {
        const queued = queue[i];
        if (
          queued.priority > task.priority ||
          (queued.priority === task.priority && queued.index > task.index)
        ) {
          insertAt = i;
          break;
        }
      }
      queue.splice(insertAt, 0, task);
      queuedSet.current.add(path);
    },
    []
  );

  const handleVisibleRangeChange = useCallback(
    (range: RenderRange) => {
      if (!mediaList.length) return;

      const len = mediaList.length;
      const firstVisible = Math.max(0, Math.min(range.firstVisibleIndex, len - 1));
      const lastVisible = Math.max(firstVisible, Math.min(range.lastVisibleIndex, len - 1));
      const visibleCount = Math.max(1, lastVisible - firstVisible + 1);

      const nextStart = lastVisible + 1;
      const nextEnd = Math.min(len - 1, nextStart + visibleCount - 1);
      const overscanStart = Math.max(0, Math.min(range.firstOverscanIndex, len - 1));
      const overscanEnd = Math.max(overscanStart, Math.min(range.lastOverscanIndex, len - 1));

      for (let i = firstVisible; i <= lastVisible; i += 1) {
        const media = mediaList[i];
        if (!media || media.mediaType !== 'video' || !media.path) continue;
        enqueueThumbnailTask(media.path, 0, i);
      }
      for (let i = nextStart; i <= nextEnd; i += 1) {
        const media = mediaList[i];
        if (!media || media.mediaType !== 'video' || !media.path) continue;
        enqueueThumbnailTask(media.path, 1, i);
      }
      for (let i = overscanStart; i <= overscanEnd; i += 1) {
        if (i >= firstVisible && i <= nextEnd) continue;
        const media = mediaList[i];
        if (!media || media.mediaType !== 'video' || !media.path) continue;
        enqueueThumbnailTask(media.path, 2, i);
      }

      drainQueue();
    },
    [mediaList, enqueueThumbnailTask, drainQueue]
  );

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | null = null;
    const setup = async () => {
      const fn = await listen<ThumbnailReadyPayload>('thumbnail_ready', (event) => {
        const payload = event.payload;
        const thumbPath = payload.thumbnail_path ? convertFileSrc(payload.thumbnail_path) : '';
        if (!payload.video_path || !thumbPath) {
          return;
        }
        setThumbnails((prev) => {
          if (prev[payload.video_path] === thumbPath) {
            return prev;
          }
          return {
            ...prev,
            [payload.video_path]: thumbPath
          };
        });
        requestingSet.current.delete(payload.video_path);
        drainQueue();
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
  }, [drainQueue]);

  useEffect(() => {
    const onMediaUpdated = () => {
      void fetchFilteredMedia();
    };
    window.addEventListener('medex:media-updated', onMediaUpdated);
    return () => window.removeEventListener('medex:media-updated', onMediaUpdated);
  }, [fetchFilteredMedia]);

  return (
    <>
      <MediaGrid
        mediaList={mediaList}
        onCardClick={clickMedia}
        onCardDoubleClick={onOpenViewer}
        onToggleFavorite={handleToggleFavorite}
        onTagAdded={addTagToMediaLocal}
        onTagRemoved={removeTagFromMediaLocal}
        onCardContextMenu={handleContextMenu}
        thumbnails={thumbnails}
        onVisibleRangeChange={handleVisibleRangeChange}
        viewMode="grid"
      />
      <MediaCardContextMenu
        visible={contextMenuVisible}
        x={contextMenuPosition.x}
        y={contextMenuPosition.y}
        mediaId={contextMenuMediaId}
        mediaTags={contextMenuMedia?.tags ?? []}
        allTags={allTagsForMenu}
        onClose={handleContextMenuClose}
        onTagsApplied={handleTagsApplied}
      />
    </>
  );
}
