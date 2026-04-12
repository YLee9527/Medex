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
import { ThemeColors } from '../theme/theme';
import { useI18n } from '../contexts/I18nContext';

// inside component, add: const { t } = useI18n();

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
  theme: ThemeColors;
  // 媒体卡片显示设置
  showName?: boolean;
  showTags?: boolean;
  // 重置滚动条的 key（当筛选条件变化时递增）
  resetScrollKey?: number;
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
  theme: ThemeColors;
  showName?: boolean;
  showTags?: boolean;
};

type ListItemData = {
  mediaList: MediaCardProps[];
  selectedIds: Set<string>;
  onCardClick: (e: React.MouseEvent, id: string, index: number) => void;
  onCardDoubleClick: (id: string) => void;
  thumbnails: Record<string, string>;
  theme: ThemeColors;
  showName?: boolean;
  showTags?: boolean;
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
  viewMode,
  theme,
  showName,
  showTags,
  resetScrollKey
}: MediaGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<FixedSizeGrid | null>(null);
  const { t } = useI18n();
  const { width, height } = useElementSize(containerRef);
  const listData = useMemo<ListItemData>(
    () => ({ mediaList, selectedIds, onCardClick, onCardDoubleClick, thumbnails, theme, showName, showTags }),
    [mediaList, selectedIds, onCardClick, onCardDoubleClick, thumbnails, theme, showName, showTags]
  );

  // 当筛选条件变化时（媒体类型或标签），重置滚动条到顶部
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTo({ scrollTop: 0 });
    }
  }, [resetScrollKey]);

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
      columnCount,
      theme,
      showName,
      showTags
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
      columnCount,
      theme,
      showName,
      showTags
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
          <span>{t('grid.header.media')}</span>
          <span>{t('grid.header.name')}</span>
          <span>{t('grid.header.tags')}</span>
          <span>{t('grid.header.time')}</span>
          <span>{t('grid.header.type')}</span>
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
          ref={gridRef}
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
        theme={data.theme}
        showName={data.showName}
        showTags={data.showTags}
      />
    </div>
  );
});

const ListRow = memo(function ListRow({ index, style, data }: ListChildComponentProps<ListItemData & { theme: ThemeColors }>) {
  const item = data.mediaList[index];
  if (!item) {
    return null;
  }
  const videoThumb = item.path ? data.thumbnails[item.path] : '';
  const isSelected = data.selectedIds.has(item.id);
  const showName = data.showName ?? true;
  const showTags = data.showTags ?? true;

  return (
    <div style={style} className="px-0.5 py-1">
      <button
        type="button"
        onClick={(e) => data.onCardClick(e, item.id, index)}
        onDoubleClick={() => data.onCardDoubleClick(item.id)}
        className="grid h-full w-full grid-cols-[90px_2fr_2fr_1fr_80px] items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors"
        style={{
          backgroundColor: isSelected ? data.theme.selected : data.theme.card,
          color: isSelected ? data.theme.text : data.theme.textSecondary,
          outline: isSelected ? `2px solid ${data.theme.highlight}` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = data.theme.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = data.theme.card;
          }
        }}
      >
        <span className="flex items-center">
          <span className="h-6 w-8 overflow-hidden rounded" style={{ backgroundColor: data.theme.overlay }}>
            {item.thumbnail ? (
              item.mediaType === 'video' ? (
                videoThumb ? (
                  <img src={toPreviewSrc(videoThumb)} alt={item.filename} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full animate-pulse items-center justify-center text-[10px]" style={{ color: data.theme.textTertiary }}>...</span>
                )
              ) : (
                <img src={toPreviewSrc(item.thumbnail)} alt={item.filename} className="h-full w-full object-cover" loading="lazy" />
              )
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px]" style={{ color: data.theme.textTertiary }}>MEDIA</span>
            )}
          </span>
        </span>
        {showName && <span className="truncate">{item.filename}</span>}
        {showTags && <span className="truncate text-xs" style={{ color: data.theme.textSecondary }}>{item.tags.map((tag) => `#${tag}`).join(' ')}</span>}
        <span className="text-xs" style={{ color: data.theme.textTertiary }}>{item.time ?? '-'}</span>
        <span className="text-xs uppercase" style={{ color: data.theme.textTertiary }}>{item.mediaType ?? '-'}</span>
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
