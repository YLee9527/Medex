import { memo, useEffect, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { invoke } from '@tauri-apps/api/core';
import { ThemeColors } from '../theme/theme';

export interface MediaCardProps {
  id: string;
  path?: string;
  thumbnail: string;
  filename: string;
  tags: string[];
  time?: string;
  mediaType?: string;
  duration?: string;
  resolution?: string;
  isFavorite?: boolean;
  selected: boolean;
  onClick: (e: React.MouseEvent, id: string) => void;
  onDoubleClick?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onTagRemoved?: (mediaId: string, tagName: string) => void;
  onContextMenu?: (e: React.MouseEvent, mediaId: string) => void;
  videoThumbnail?: string;
  className?: string;
  mode?: 'grid' | 'list';
  theme: ThemeColors;
}

type DbTag = {
  id: number;
  name: string;
};

function MediaCard({
  id,
  path,
  thumbnail,
  filename,
  tags,
  mediaType,
  isFavorite = false,
  selected,
  onClick,
  onDoubleClick,
  onToggleFavorite,
  onTagRemoved,
  onContextMenu,
  videoThumbnail,
  className,
  mode = 'grid',
  theme
}: MediaCardProps) {
  const widthClass = className ?? 'w-[180px]';
  const isGrid = mode === 'grid';
  const previewSrc = toPreviewSrc(thumbnail);
  const resolvedVideoThumbnail = videoThumbnail ? toPreviewSrc(videoThumbnail) : '';
  const [imageFailed, setImageFailed] = useState(false);
  const [videoThumbLoaded, setVideoThumbLoaded] = useState(false);
  const showImage = mediaType !== 'video' && previewSrc && !imageFailed;

  useEffect(() => {
    setVideoThumbLoaded(false);
  }, [resolvedVideoThumbnail]);

  const handleRemoveTag = async (tagName: string) => {
    const mediaIdNum = Number(id);
    if (!Number.isFinite(mediaIdNum)) {
      return;
    }
    try {
      const dbTags = await invoke<DbTag[]>('get_tags_by_media', { mediaId: mediaIdNum });
      const matched = dbTags.find((tag) => tag.name === tagName);
      if (!matched) {
        return;
      }
      await invoke('remove_tag_from_media', { mediaId: mediaIdNum, tagId: matched.id });
      onTagRemoved?.(id, tagName);
      window.dispatchEvent(new Event('medex:tags-updated'));
      window.dispatchEvent(new Event('medex:media-tags-updated'));
    } catch (error) {
      console.error('[media-card] remove_tag_from_media failed:', error);
      window.alert(`移除标签失败：${String(error)}`);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => onClick(e, id)}
      onDoubleClick={() => onDoubleClick?.(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, id);
      }}
      className={`group overflow-hidden rounded-[8px] text-left transition-colors ${
        selected 
          ? 'ring-2 ring-[var(--medex-highlight)]' 
          : 'border border-[var(--medex-border-light)] hover:border-[var(--medex-border)]'
      } ${widthClass} ${isGrid ? 'h-[220px]' : 'h-auto'}`}
      style={{
        backgroundColor: selected ? theme.selected : theme.card,
        color: theme.text
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = theme.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = theme.card;
        }
      }}
    >
      {/* 选中遮罩 */}
      {selected && (
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: theme.selectionOverlay }} />
      )}
      
      <div className={`relative w-full overflow-hidden ${isGrid ? 'h-[150px] shrink-0' : 'aspect-video'}`}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite?.(id);
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: theme.overlay }}
          aria-label={isFavorite ? '取消收藏' : '收藏'}
          title={isFavorite ? '取消收藏' : '收藏'}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.overlay;
          }}
        >
          {isFavorite ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ color: theme.favorite }} fill="currentColor" aria-hidden="true">
              <path
                d="M12 17.3 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ color: theme.textSecondary }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path
                d="M12 17.3 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
          )}
        </button>

        {mediaType === 'video' ? (
          resolvedVideoThumbnail ? (
            <img
              src={resolvedVideoThumbnail}
              alt={filename}
              className={`h-full w-full object-cover transition-opacity duration-200 ${
                videoThumbLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              decoding="async"
              onLoad={() => setVideoThumbLoaded(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px]" style={{ backgroundColor: theme.overlay, color: theme.textTertiary }}>
              <div className="h-full w-full animate-pulse" style={{ backgroundColor: theme.hover }} />
              <span className="absolute">生成缩略图...</span>
            </div>
          )
        ) : showImage ? (
          <img
            src={previewSrc}
            alt={filename}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs" style={{ backgroundColor: theme.overlay, color: theme.textTertiary }}>
            No Preview
          </div>
        )}

        {mediaType === 'video' ? (
          <div 
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
                <path d="M8 6.5v11l9-5.5-9-5.5z" />
              </svg>
            </span>
          </div>
        ) : null}
      </div>

      <div className={`flex flex-col gap-2 p-3 ${isGrid ? 'h-[70px] overflow-hidden' : ''}`}>
        <p className={`text-[14px] leading-5 ${isGrid ? 'truncate' : 'overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'}`} style={{ color: theme.text }}>
          {filename}
        </p>
        {isGrid ? (
          <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemoveTag(tag);
                  }}
                  className="max-w-full truncate rounded px-2 py-0.5 text-[12px] leading-4 transition-colors"
                  style={{ backgroundColor: theme.tagBg, color: theme.textSecondary }}
                  title={`点击删除 #${tag}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.tagHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.tagBg;
                  }}
                >
                  #{tag}
                </button>
              ))
            ) : (
              <span className="truncate text-[12px] leading-4" style={{ color: theme.textTertiary }}>暂无标签</span>
            )}
          </div>
        ) : (
          <div className="flex max-h-[56px] flex-wrap gap-1 overflow-y-auto">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemoveTag(tag);
                  }}
                  className="rounded px-2 py-0.5 text-[12px] leading-4 transition-colors"
                  style={{ backgroundColor: theme.tagBg, color: theme.textSecondary }}
                  title={`点击删除 #${tag}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.tagHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.tagBg;
                  }}
                >
                  #{tag}
                </button>
              ))
            ) : (
              <span className="text-[12px] leading-4" style={{ color: theme.textTertiary }}>暂无标签</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function toPreviewSrc(src: string): string {
  if (!src) return '';
  const isRemote = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('asset:');
  const isAbsoluteUnix = src.startsWith('/');
  const isAbsoluteWindows = /^[A-Za-z]:\\/.test(src);

  if (isRemote) return src;
  if (isAbsoluteUnix || isAbsoluteWindows) return convertFileSrc(src);
  return src;
}

function areMediaCardPropsEqual(prev: Readonly<MediaCardProps>, next: Readonly<MediaCardProps>) {
  if (
    prev.id !== next.id ||
    prev.path !== next.path ||
    prev.thumbnail !== next.thumbnail ||
    prev.filename !== next.filename ||
    prev.mediaType !== next.mediaType ||
    prev.videoThumbnail !== next.videoThumbnail ||
    prev.selected !== next.selected ||
    prev.className !== next.className ||
    prev.mode !== next.mode ||
    prev.time !== next.time ||
    prev.duration !== next.duration ||
    prev.resolution !== next.resolution ||
    prev.isFavorite !== next.isFavorite
  ) {
    return false;
  }

  if (prev.onDoubleClick !== next.onDoubleClick) {
    return false;
  }

  if (prev.tags.length !== next.tags.length) {
    return false;
  }
  for (let i = 0; i < prev.tags.length; i += 1) {
    if (prev.tags[i] !== next.tags[i]) {
      return false;
    }
  }

  // 检查 theme 是否变化
  if (prev.theme !== next.theme) {
    return false;
  }

  return true;
}

export default memo(MediaCard, areMediaCardPropsEqual);
