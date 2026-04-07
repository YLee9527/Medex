import { useEffect, useMemo, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { MediaItem } from '../store/useAppStore';
import { useThemeContext } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

export interface MediaViewerProps {
  open: boolean;
  mediaList: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}

export default function MediaViewer({
  open,
  mediaList,
  currentIndex,
  onClose,
  onChangeIndex
}: MediaViewerProps) {
  const { theme } = useThemeContext();
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const safeIndex = useMemo(() => {
    if (mediaList.length === 0) {
      return 0;
    }
    return Math.min(Math.max(currentIndex, 0), mediaList.length - 1);
  }, [currentIndex, mediaList.length]);
  const media = mediaList[safeIndex] ?? null;

  const handlePrev = () => {
    onChangeIndex(Math.max(safeIndex - 1, 0));
  };

  const handleNext = () => {
    onChangeIndex(Math.min(safeIndex + 1, mediaList.length - 1));
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowLeft') {
        handlePrev();
      }
      if (event.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, safeIndex, mediaList.length]);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [safeIndex, open]);

  if (!open || !media) {
    return null;
  }

  const src = toViewerSrc(media.path || media.thumbnail);

  return (
    <div 
      className="fixed inset-0 z-[1200] transition-opacity duration-200"
      style={{ backgroundColor: theme.overlay }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        style={{ backgroundColor: theme.hover, color: theme.textSecondary }}
        aria-label="Close Viewer"
        title="关闭"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.hover;
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handlePrev}
        disabled={safeIndex <= 0}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full p-3 transition-colors disabled:cursor-not-allowed"
        style={{ 
          backgroundColor: theme.hover,
          color: theme.textSecondary,
          opacity: safeIndex <= 0 ? 0.35 : 1
        }}
        aria-label="Previous Media"
        onMouseEnter={(e) => {
          if (safeIndex > 0) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.hover;
        }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleNext}
        disabled={safeIndex >= mediaList.length - 1}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full p-3 transition-colors disabled:cursor-not-allowed"
        style={{ 
          backgroundColor: theme.hover,
          color: theme.textSecondary,
          opacity: safeIndex >= mediaList.length - 1 ? 0.35 : 1
        }}
        aria-label="Next Media"
        onMouseEnter={(e) => {
          if (safeIndex < mediaList.length - 1) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.hover;
        }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 z-0 cursor-default"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-16 py-12">
        {media.mediaType === 'video' ? (
          <video
            ref={videoRef}
            key={media.id}
            src={src}
            controls
            autoPlay
            className="max-h-full max-w-full"
          />
        ) : (
          <img
            key={media.id}
            src={src}
            alt={media.filename}
            loading="lazy"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>
    </div>
  );
}

function toViewerSrc(src: string): string {
  if (!src) return '';
  const isRemote = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('asset:');
  const isAbsoluteUnix = src.startsWith('/');
  const isAbsoluteWindows = /^[A-Za-z]:\\/.test(src);

  if (isRemote) return src;
  if (isAbsoluteUnix || isAbsoluteWindows) return convertFileSrc(src);
  return src;
}
