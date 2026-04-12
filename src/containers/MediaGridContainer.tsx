import { useCallback, useMemo, useRef, useState } from 'react';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import MediaGrid, { RenderRange } from '../components/MediaGrid';
import { MediaCardProps } from '../components/MediaCard';
import MediaCardContextMenu from '../components/MediaCardContextMenu';
import { DbMediaItem, MediaItem, useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

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
  const showMediaName = useAppStore((state) => state.showMediaName);
  const showMediaTags = useAppStore((state) => state.showMediaTags);
  const { theme } = useThemeContext();
  const { t } = useI18n();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [libraryPath, setLibraryPath] = useState<string | null>(null);
  const thumbnailMapRef = useRef<Record<string, string>>({});
  const requestingSet = useRef<Set<string>>(new Set());
  const queuedSet = useRef<Set<string>>(new Set());
  const taskQueue = useRef<ThumbnailTask[]>([]);

  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedIndex = useRef<number | null>(null);

  // Context Menu 状态
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuMediaId, setContextMenuMediaId] = useState<string>('');

  // 处理卡片点击（支持多选）
  const handleCardClick = useCallback(
    (e: React.MouseEvent, mediaId: string, index: number) => {
      // 查找当前媒体在列表中的索引
      if (e.metaKey || e.ctrlKey) {
        // Ctrl/Cmd + 点击：多选切换
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(mediaId)) {
            next.delete(mediaId);
          } else {
            next.add(mediaId);
          }
          return next;
        });
        lastSelectedIndex.current = index;
      } else if (e.shiftKey && lastSelectedIndex.current !== null) {
        // Shift + 点击：连续选择
        const start = lastSelectedIndex.current;
        const end = index;
        const [min, max] = [start, end].sort((a, b) => a - b);
        // 使用 mediaItems 获取当前显示的媒体列表
        const ids = mediaItems.slice(min, max + 1).map((m) => m.id);
        setSelectedIds(new Set(ids));
        lastSelectedIndex.current = index;
      } else {
        // 单击：单选
        setSelectedIds(new Set([mediaId]));
        lastSelectedIndex.current = index;
        clickMedia(mediaId);
      }
    },
    [mediaItems, clickMedia]
  );

  // 点击背景取消选择
  const handleBackgroundClick = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedIndex.current = null;
  }, []);

  // ESC 清空选择
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        lastSelectedIndex.current = null;
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, mediaId: string) => {
      e.preventDefault();
      // 如果右键点击的媒体未被选中，先选中它（单选）
      if (!selectedIds.has(mediaId)) {
        setSelectedIds(new Set([mediaId]));
      }
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuMediaId(mediaId);
      setContextMenuVisible(true);
    },
    [selectedIds]
  );

  const handleContextMenuClose = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuMediaId('');
  }, []);

  // 获取选中的媒体列表
  const selectedMediaList = useMemo(() => {
    return mediaItems.filter((item) => selectedIds.has(item.id));
  }, [mediaItems, selectedIds]);

  // 计算共有标签（交集）
  const commonTags = useMemo(() => {
    if (selectedMediaList.length === 0) return [];
    const firstTags = new Set(selectedMediaList[0].tags);
    return selectedMediaList.slice(1).reduce((acc, item) => {
      return acc.filter((tag) => item.tags.includes(tag));
    }, Array.from(firstTags));
  }, [selectedMediaList]);

  // 批量应用标签
  const handleTagsApplied = useCallback(
    async (mediaId: string, addedTags: string[], removedTags: string[]) => {
      // 获取所有选中的媒体 ID（批量操作）
      const idsToProcess = selectedIds.size > 0 ? Array.from(selectedIds) : [mediaId];

      try {
        // 批量添加标签
        for (const id of idsToProcess) {
          for (const tagName of addedTags) {
            await invoke('add_tag_to_media', { mediaId: Number(id), tagName });
            addTagToMediaLocal(id, tagName);
          }
          for (const tagName of removedTags) {
            await invoke('remove_tag_from_media', { mediaId: Number(id), tagName });
            removeTagFromMediaLocal(id, tagName);
          }
        }
        // 触发全局事件更新
        window.dispatchEvent(new Event('medex:tags-updated'));
        window.dispatchEvent(new Event('medex:media-tags-updated'));
        
        // 清空选中状态
        setSelectedIds(new Set());
        lastSelectedIndex.current = null;
      } catch (error) {
        console.error('[ui] batch tags operation failed:', error);
        window.alert(`批量标签操作失败：${String(error)}`);
      }
    },
    [selectedIds, addTagToMediaLocal, removeTagFromMediaLocal, invoke]
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
        resolution: t('unknown'),
        isFavorite: row.isFavorite ?? false,
        isRecent: row.isRecent ?? false,
        recentViewedAt: row.recentViewedAt ?? null
      }));
      setMediaItemsFromDb(mapped);
      
      // 筛选条件变化时，清空请求状态，让 visibleRangeChange 重新触发缩略图请求
      // 保留已有的缩略图缓存，避免重复加载
      requestingSet.current.clear();
      queuedSet.current.clear();
      taskQueue.current = [];
    } catch (error) {
      console.error('[ui] filter media failed:', error);
    }
  }, [selectedTagNames, mediaTypeFilter, setMediaItemsFromDb, t]);

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
      selected: selectedIds.has(item.id),
      onClick: () => {},
      theme
    }));
  }, [mediaItems, selectedIds, activeNavId, theme]);

  // 检查 libraryPath 是否存在，当变化时刷新媒体列表
  useEffect(() => {
    const checkLibraryPath = () => {
      const path = localStorage.getItem('libraryPath');
      console.log('[MediaGrid] checkLibraryPath:', path);
      // 当 libraryPath 发生变化时，刷新媒体列表
      if (libraryPath !== path) {
        setLibraryPath(path);
        // 重新加载媒体数据
        void fetchFilteredMedia();
      }
    };
    checkLibraryPath();
    
    // 定期检查 libraryPath（确保同步）
    const interval = setInterval(() => {
      checkLibraryPath();
    }, 500);
    
    return () => {
      clearInterval(interval);
    };
  }, [libraryPath]);

  // 监听 libraryPath 清除事件（跨窗口，使用 Tauri 事件）
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const setup = async () => {
      unlisten = await listen('medex:library-path-cleared', () => {
        console.log('[MediaGrid] received library-path-cleared event via Tauri');
        // 立即检查并更新
        const path = localStorage.getItem('libraryPath');
        setLibraryPath(path);
      });
    };
    void setup();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // 处理选择文件夹
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
      setLibraryPath(selected);

      // 触发扫描和索引
      await invoke('scan_and_index', { path: selected });
    } catch (error) {
      console.error('[ui] scan failed:', error);
      window.alert(`扫描失败：${String(error)}`);
    }
  };

  // 显示状态：没有媒体数据时
  const shouldShowEmptyState = mediaItems.length === 0;
  const shouldShowAddLibrary = !libraryPath;
  
  // 调试用：输出 libraryPath 状态
  useEffect(() => {
    console.log('[MediaGrid] libraryPath:', libraryPath, 'shouldShowAddLibrary:', shouldShowAddLibrary);
  }, [libraryPath, shouldShowAddLibrary]);

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
      {shouldShowEmptyState ? (
        <div className="flex h-full w-full items-center justify-center">
          <div 
            className="flex flex-col items-center justify-center gap-4 rounded-lg border p-8"
            style={{ 
              backgroundColor: theme.sidebar,
              borderColor: theme.borderLight
            }}
          >
            {shouldShowAddLibrary ? (
              <>
                <div 
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.inputBg }}
                >
                  <svg 
                    className="h-8 w-8" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    style={{ color: theme.textSecondary }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="mb-2 text-sm font-medium" style={{ color: theme.text }}>
                    暂无媒体库
                  </p>
                  <p className="mb-4 text-xs" style={{ color: theme.textTertiary }}>
                    请选择包含媒体文件的文件夹
                  </p>
                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    className="rounded-[6px] px-4 py-2 text-xs transition-colors"
                    style={{
                      backgroundColor: theme.buttonBg,
                      color: theme.text
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.buttonHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.buttonBg;
                    }}
                  >
                    添加媒体库
                  </button>
                </div>
              </>
            ) : (
              <>
                <div 
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.inputBg }}
                >
                  <svg 
                    className="h-8 w-8" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    style={{ color: theme.textSecondary }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="mb-2 text-sm font-medium" style={{ color: theme.text }}>
                    暂无数据
                  </p>
                  <p className="text-xs" style={{ color: theme.textTertiary }}>
                    当前媒体库中没有媒体文件
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <MediaGrid
            mediaList={mediaList}
            selectedIds={selectedIds}
            onCardClick={handleCardClick}
            onCardDoubleClick={onOpenViewer}
            onToggleFavorite={handleToggleFavorite}
            onTagAdded={addTagToMediaLocal}
            onTagRemoved={removeTagFromMediaLocal}
            onCardContextMenu={handleContextMenu}
            onBackgroundClick={handleBackgroundClick}
            thumbnails={thumbnails}
            onVisibleRangeChange={handleVisibleRangeChange}
            viewMode="grid"
            theme={theme}
            showName={showMediaName}
            showTags={showMediaTags}
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
      )}
    </>
  );
}
