import { memo, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

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
  onClick: (id: string) => void;
  className?: string;
  mode?: 'grid' | 'list';
}

function MediaCard({
  id,
  path,
  thumbnail,
  filename,
  tags,
  mediaType,
  selected,
  onClick,
  className,
  mode = 'grid'
}: MediaCardProps) {
  const widthClass = className ?? 'w-[180px]';
  const isGrid = mode === 'grid';
  const previewSrc = toPreviewSrc(thumbnail);
  const videoSrc = toPreviewSrc(path || thumbnail);
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const showImage = mediaType !== 'video' && previewSrc && !imageFailed;
  const shouldShowVideo = mediaType === 'video' && !!videoSrc && !videoFailed;

  return (
      <button
        type="button"
        onClick={() => onClick(id)}
        className={`group overflow-hidden rounded-[8px] bg-[#242424] text-left text-[#EAEAEA] transition-colors ${
        selected ? 'border-2 border-blue-500' : 'border border-white/10 hover:border-white/20'
      } ${widthClass} ${isGrid ? 'h-[220px]' : 'h-auto'}`}
    >
      <div className={`relative w-full overflow-hidden ${isGrid ? 'h-[150px] shrink-0' : 'aspect-video'}`}>
        {shouldShowVideo ? (
          <video
            src={videoSrc}
            className="h-full w-full object-cover"
            preload="metadata"
            muted
            playsInline
            onLoadedData={(e) => {
              const el = e.currentTarget;
              el.currentTime = 0.001;
              el.pause();
            }}
            onError={() => {
              setVideoFailed(true);
              console.error('[media-card] video preview failed:', videoSrc);
            }}
          />
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
          <div className="flex h-full w-full items-center justify-center bg-black/25 text-xs text-white/60">
            No Preview
          </div>
        )}

        {mediaType === 'video' ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0000004D] opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
                <path d="M8 6.5v11l9-5.5-9-5.5z" />
              </svg>
            </span>
          </div>
        ) : null}
      </div>

      <div className={`flex flex-col gap-2 p-3 ${isGrid ? 'h-[70px] overflow-hidden' : ''}`}>
        <p className="overflow-hidden text-[14px] leading-5 text-[#EAEAEA] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {filename}
        </p>
        <div className={`flex flex-wrap gap-1 ${isGrid ? 'max-h-6 overflow-hidden' : 'max-h-[56px] overflow-y-auto'}`}>
          {tags.map((tag) => (
            <span key={tag} className="rounded bg-white/10 px-2 py-0.5 text-[12px] leading-4 text-white/80">
              #{tag}
            </span>
          ))}
        </div>
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

MediaCard.displayName = 'MediaCard';

function areMediaCardPropsEqual(prev: Readonly<MediaCardProps>, next: Readonly<MediaCardProps>) {
  if (
    prev.id !== next.id ||
    prev.path !== next.path ||
    prev.thumbnail !== next.thumbnail ||
    prev.filename !== next.filename ||
    prev.mediaType !== next.mediaType ||
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

  if (prev.tags.length !== next.tags.length) {
    return false;
  }
  for (let i = 0; i < prev.tags.length; i += 1) {
    if (prev.tags[i] !== next.tags[i]) {
      return false;
    }
  }

  return true;
}

export default memo(MediaCard, areMediaCardPropsEqual);
