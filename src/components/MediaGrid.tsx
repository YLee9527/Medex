import { convertFileSrc } from '@tauri-apps/api/core';
import MediaCard, { MediaCardProps } from './MediaCard';

export interface MediaGridProps {
  mediaList: MediaCardProps[];
  onCardClick: (id: string) => void;
  viewMode: 'grid' | 'list';
}

export default function MediaGrid({ mediaList, onCardClick, viewMode }: MediaGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="sticky top-0 z-10 mb-2 grid grid-cols-[90px_2fr_2fr_1fr_80px] items-center gap-2 border-b border-white/15 bg-[#101010] px-3 py-2 text-xs text-white/60">
          <span>媒体</span>
          <span>名称</span>
          <span>标签</span>
          <span>时间</span>
          <span>类型</span>
        </div>

        <div className="flex flex-col gap-2">
          {mediaList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onCardClick(item.id)}
              className={`grid w-full grid-cols-[90px_2fr_2fr_1fr_80px] items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors ${
                item.selected
                  ? 'bg-[#444444] text-white'
                  : 'bg-[#242424] text-white/85 hover:bg-[#555555]'
              }`}
            >
              <span className="flex items-center">
                <span className="h-6 w-8 overflow-hidden rounded bg-black/30">
                  {item.thumbnail ? (
                    <img src={toPreviewSrc(item.thumbnail)} alt={item.filename} className="h-full w-full object-cover" />
                  ) : null}
                </span>
              </span>
              <span className="truncate">{item.filename}</span>
              <span className="truncate text-xs text-white/80">{item.tags.map((tag) => `#${tag}`).join(' ')}</span>
              <span className="text-xs text-white/70">{item.time ?? '-'}</span>
              <span className="text-xs uppercase text-white/70">{item.mediaType ?? '-'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid min-h-0 flex-1 auto-rows-auto content-start justify-start gap-3 overflow-y-auto overscroll-contain pr-1 sm:gap-4 lg:gap-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 220px))' }}
    >
      {mediaList.map((item) => (
        <div key={item.id} className="flex">
          <MediaCard
            {...item}
            onClick={onCardClick}
            className="w-full"
            mode="grid"
          />
        </div>
      ))}
    </div>
  );
}

function toPreviewSrc(src: string): string {
  if (!src) return '';
  const isRemote = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('asset:');
  const isAbsoluteUnix = src.startsWith('/');
  const isAbsoluteWindows = /^[A-Za-z]:\\/.test(src);

  if (isRemote) return src;
  if (isAbsoluteUnix || isAbsoluteWindows) return convertFileSrc(src, 'asset');
  return src;
}
