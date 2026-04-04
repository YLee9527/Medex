import { memo, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import {
  FixedSizeGrid,
  FixedSizeGridProps,
  FixedSizeList,
  GridChildComponentProps,
  ListChildComponentProps
} from 'react-window';
import MediaCard, { MediaCardProps } from './MediaCard';

export interface MediaGridProps {
  mediaList: MediaCardProps[];
  selectedIds: Set<string>;
  onCardClick: (e: React.MouseEvent, id: string, index: number) => void;
  onCardDoubleClick: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTagAdded: (mediaId: string, tagName: string) => void;
  onTagRemoved: (mediaId: string, tagName: string) => void;
  onCardContextMenu?: (e: React.MouseEvent, mediaId: string) => void;
  onBackgroundClick?: () => void;
  thumbnails: Record<string, string>;
  onVisibleRangeChange?: (range: RenderRange) => void;
  viewMode: 'grid' | 'list';
}

export type RenderRange = {
  firstVisibleIndex: number;
  lastVisibleIndex: number;
  firstOverscanIndex: number;
  lastOverscanIndex: number;
  columnCount: number;
};

type GridItemData = {
  mediaList: MediaCardProps[];
  selectedIds: Set<string>;
  onCardClick: (e: React.MouseEvent, id: string, index: number) => void;
  onCardDoubleClick: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTagAdded: (mediaId: string, tagName: string) => void;
  onTagRemoved: (mediaId: string, tagName: string) => void;
  onCardContextMenu?: (e: React.MouseEvent, mediaId: string) => void;
  thumbnails: Record<string, string>;
  columnCount: number;
};

type ListItemData = {
  mediaList: MediaCardProps[];
  selectedIds: Set<string>;
  onCardClick: (e: React.MouseEvent, id: string, index: number) => void;
  onCardDoubleClick: (id: string) => void;
  thumbnails: Record<string, string>;
};

const GRID_CARD_WIDTH = 180;
const GRID_CARD_HEIGHT = 220;
const GRID_GAP = 12;
const GRID_PADDING = 12;
const GRID_CELL_WIDTH = GRID_CARD_WIDTH + GRID_GAP;
const GRID_CELL_HEIGHT = GRID_CARD_HEIGHT + GRID_GAP;

const LIST_ROW_HEIGHT = 48;
const LIST_HEADER_HEIGHT = 36;

export default function MediaGrid({
  mediaList,
  selectedIds,
  onCardClick,
  onCardDoubleClick,
  onToggleFavorite,
  onTagAdded,
  onTagRemoved,
  onCardContextMenu,
  onBackgroundClick,
  thumbnails,
  onVisibleRangeChange,
  viewMode
}: MediaGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width, height } = useElementSize(containerRef);
  const listData = useMemo<ListItemData>(
    () => ({ mediaList, selectedIds, onCardClick, onCardDoubleClick, thumbnails }),
    [mediaList, selectedIds, onCardClick, onCardDoubleClick, thumbnails]
  );

  const availableWidth = Math.max(1, width - GRID_PADDING * 2);
  const rawColumns = Math.floor((availableWidth + GRID_GAP) / GRID_CELL_WIDTH);
  const columnCount = Math.max(1, rawColumns);
  const rowCount = Math.ceil(mediaList.length / columnCount);
  const gridHeight = Math.max(0, height);
  const gridData = useMemo<GridItemData>(
    () => ({
      mediaList,
      selectedIds,
      onCardClick,
      onCardDoubleClick,
      onToggleFavorite,
      onTagAdded,
      onTagRemoved,
      onCardContextMenu,
      thumbnails,
      columnCount
    }),
    [
      mediaList,
      selectedIds,
      onCardClick,
      onCardDoubleClick,
      onToggleFavorite,
      onTagAdded,
      onTagRemoved,
      onCardContextMenu,
      thumbnails,
      columnCount
    ]
  );

  // 点击背景取消选择
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onBackgroundClick?.();
    }
  };

  if (viewMode === 'list') {
    const listHeight = Math.max(0, height - LIST_HEADER_HEIGHT);
    return (
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden pr-1">
        <div className="grid h-[36px] grid-cols-[90px_2fr_2fr_1fr_80px] items-center gap-2 border-b border-white/15 bg-[#101010] px-3 py-2 text-xs text-white/60">
          <span>媒体</span>
          <span>名称</span>
          <span>标签</span>
          <span>时间</span>
          <span>类型</span>
        </div>

        {width > 0 && listHeight > 0 ? (
          <FixedSizeList
            width={width}
            height={listHeight}
            itemCount={mediaList.length}
            itemSize={LIST_ROW_HEIGHT}
            itemData={listData}
            overscanCount={8}
            onItemsRendered={({ overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex }) => {
              onVisibleRangeChange?.({
                firstVisibleIndex: visibleStartIndex,
                lastVisibleIndex: visibleStopIndex,
                firstOverscanIndex: overscanStartIndex,
                lastOverscanIndex: overscanStopIndex,
                columnCount: 1
              });
            }}
          >
            {ListRow}
          </FixedSizeList>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden pr-1">
      {width > 0 && gridHeight > 0 ? (
        <FixedSizeGrid
          width={width}
          height={gridHeight}
          rowCount={Math.max(1, rowCount)}
          columnCount={columnCount}
          rowHeight={GRID_CELL_HEIGHT}
          columnWidth={GRID_CELL_WIDTH}
          itemData={gridData}
          overscanRowCount={3}
          overscanColumnCount={1}
          onItemsRendered={({
            overscanColumnStartIndex,
            overscanColumnStopIndex,
            overscanRowStartIndex,
            overscanRowStopIndex,
            visibleColumnStartIndex,
            visibleColumnStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex
          }) => {
            const firstVisibleIndex = visibleRowStartIndex * columnCount + visibleColumnStartIndex;
            const lastVisibleIndex = visibleRowStopIndex * columnCount + visibleColumnStopIndex;
            const firstOverscanIndex = overscanRowStartIndex * columnCount + overscanColumnStartIndex;
            const lastOverscanIndex = overscanRowStopIndex * columnCount + overscanColumnStopIndex;

            onVisibleRangeChange?.({
              firstVisibleIndex,
              lastVisibleIndex,
              firstOverscanIndex,
              lastOverscanIndex,
              columnCount
            });
          }}
        >
          {GridCell}
        </FixedSizeGrid>
      ) : null}
    </div>
  );
}

const GridCell = memo(function GridCell({ columnIndex, rowIndex, style, data }: GridChildComponentProps<GridItemData>) {
  const index = rowIndex * data.columnCount + columnIndex;
  const item = data.mediaList[index];

  if (!item) {
    return null;
  }

  const isSelected = data.selectedIds.has(item.id);

  return (
    <div style={offsetGridCellStyle(style)}>
      <MediaCard
        {...item}
        selected={isSelected}
        onClick={(e) => data.onCardClick(e, item.id, index)}
        onDoubleClick={data.onCardDoubleClick}
        onToggleFavorite={data.onToggleFavorite}
        onTagRemoved={data.onTagRemoved}
        onContextMenu={data.onCardContextMenu}
        videoThumbnail={item.path ? data.thumbnails[item.path] : undefined}
        className="w-[180px]"
        mode="grid"
      />
    </div>
  );
});

const ListRow = memo(function ListRow({ index, style, data }: ListChildComponentProps<ListItemData>) {
  const item = data.mediaList[index];
  if (!item) {
    return null;
  }
  const videoThumb = item.path ? data.thumbnails[item.path] : '';
  const isSelected = data.selectedIds.has(item.id);

  return (
    <div style={style} className="px-0.5 py-1">
      <button
        type="button"
        onClick={(e) => data.onCardClick(e, item.id, index)}
        onDoubleClick={() => data.onCardDoubleClick(item.id)}
        className={`grid h-full w-full grid-cols-[90px_2fr_2fr_1fr_80px] items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors ${
          isSelected ? 'bg-[#444444] text-white ring-2 ring-blue-500' : 'bg-[#242424] text-white/85 hover:bg-[#555555]'
        }`}
      >
        <span className="flex items-center">
          <span className="h-6 w-8 overflow-hidden rounded bg-black/30">
            {item.thumbnail ? (
              item.mediaType === 'video' ? (
                videoThumb ? (
                  <img src={toPreviewSrc(videoThumb)} alt={item.filename} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full animate-pulse items-center justify-center text-[10px] text-white/70">...</span>
                )
              ) : (
                <img src={toPreviewSrc(item.thumbnail)} alt={item.filename} className="h-full w-full object-cover" loading="lazy" />
              )
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-white/70">MEDIA</span>
            )}
          </span>
        </span>
        <span className="truncate">{item.filename}</span>
        <span className="truncate text-xs text-white/80">{item.tags.map((tag) => `#${tag}`).join(' ')}</span>
        <span className="text-xs text-white/70">{item.time ?? '-'}</span>
        <span className="text-xs uppercase text-white/70">{item.mediaType ?? '-'}</span>
      </button>
    </div>
  );
});

function offsetGridCellStyle(style: GridChildComponentProps<GridItemData>['style']): FixedSizeGridProps['style'] {
  const left = typeof style.left === 'number' ? style.left : Number(style.left ?? 0);
  const top = typeof style.top === 'number' ? style.top : Number(style.top ?? 0);

  return {
    ...style,
    left: left + GRID_PADDING,
    top: top + GRID_PADDING,
    width: GRID_CARD_WIDTH,
    height: GRID_CARD_HEIGHT
  };
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

function useElementSize(ref: RefObject<HTMLDivElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);

      setSize((prev) => {
        if (prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
