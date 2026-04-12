import { create } from 'zustand';

export type SidebarNavItem = {
  id: string;
  label: string;
  active: boolean;
};

export type SidebarTagItem = {
  id: string;
  name: string;
  selected: boolean;
  mediaCount: number;
};

export type MediaItem = {
  id: string;
  path: string;
  thumbnail: string;
  filename: string;
  tags: string[];
  time: string;
  mediaType: string;
  duration: string;
  resolution: string;
  isFavorite: boolean;
  isRecent: boolean;
  recentViewedAt?: number | null;
};

export type DbMediaItem = {
  id: number;
  path: string;
  filename: string;
  type: string;
  isFavorite?: boolean;
  isRecent?: boolean;
  recentViewedAt?: number | null;
  tags?: string[];
};

export type DbTagItem = {
  id: number;
  name: string;
  mediaCount?: number;
};

type AppState = {
  navItems: SidebarNavItem[];
  tags: SidebarTagItem[];
  mediaItems: MediaItem[];
  selectedMediaId: string;
  viewMode: 'grid' | 'list';
  mediaTypeFilter: 'all' | 'image' | 'video';
  // 媒体卡片显示设置
  showMediaName: boolean;
  showMediaTags: boolean;
  clickNav: (navId: string) => void;
  clickTag: (tagId: string) => void;
  clickMedia: (mediaId: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setMediaTypeFilter: (mode: 'all' | 'image' | 'video') => void;
  changeSelectedMediaTag: (tagId: string, action: 'add' | 'remove') => void;
  toggleFavorite: (mediaId: string) => void;
  deleteMedia: (mediaId: string) => void;
  setMediaItemsFromDb: (items: MediaItem[]) => void;
  setTagsFromDb: (items: DbTagItem[]) => void;
  addTagToMediaLocal: (mediaId: string, tagName: string) => void;
  removeTagFromMediaLocal: (mediaId: string, tagName: string) => void;
  markMediaViewedLocal: (mediaId: string, viewedAt: number) => void;
  // 媒体卡片设置
  setShowMediaName: (show: boolean) => void;
  setShowMediaTags: (show: boolean) => void;
};

const initialNavItems: SidebarNavItem[] = [
  { id: 'all-media', label: 'All Media', active: true },
  { id: 'favorites', label: 'Favorites', active: false },
  { id: 'recent', label: 'Recent', active: false }
];

const initialTags: SidebarTagItem[] = [];

const initialMediaItems: MediaItem[] = [];

// 从 localStorage 读取媒体卡片显示设置
const getBooleanFromStorage = (key: string, defaultValue = true): boolean => {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultValue;
    const s = String(val).trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === '') return false;
    try {
      return Boolean(JSON.parse(val as string));
    } catch {
      return defaultValue;
    }
  } catch {
    return defaultValue;
  }
};

const initialShowMediaName = getBooleanFromStorage('showMediaName', true);
const initialShowMediaTags = getBooleanFromStorage('showMediaTags', true);

const makeTagId = (tagName: string) =>
  tagName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');

export const useAppStore = create<AppState>((set) => ({
  navItems: initialNavItems,
  tags: initialTags,
  mediaItems: initialMediaItems,
  selectedMediaId: '',
  viewMode: 'grid',
  mediaTypeFilter: 'all',
  showMediaName: initialShowMediaName,
  showMediaTags: initialShowMediaTags,
  clickNav: (navId) => {
    console.log('nav clicked:', navId);
    set((state) => ({
      navItems: state.navItems.map((item) => ({
        ...item,
        active: item.id === navId
      }))
    }));
  },
  clickTag: (tagId) => {
    console.log('tag clicked:', tagId);
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === tagId
          ? {
            ...tag,
            selected: !tag.selected
          }
          : tag
      )
    }));
  },
  clickMedia: (mediaId) => {
    console.log('media card clicked:', mediaId);
    set({ selectedMediaId: mediaId });
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setMediaTypeFilter: (mode) => set({ mediaTypeFilter: mode }),
  changeSelectedMediaTag: (tagId, action) =>
    set((state) => {
      if (!state.selectedMediaId) {
        return state;
      }

      const normalizedTagName = tagId.trim();
      if (!normalizedTagName) {
        return state;
      }

      const nextMediaItems = state.mediaItems.map((item) => {
        if (item.id !== state.selectedMediaId) {
          return item;
        }

        if (action === 'add') {
          if (item.tags.includes(normalizedTagName)) {
            return item;
          }

          return {
            ...item,
            tags: [...item.tags, normalizedTagName]
          };
        }

        return {
          ...item,
          tags: item.tags.filter((tag) => tag !== normalizedTagName)
        };
      });

      const hasTagInSidebar = state.tags.some((tag) => tag.name === normalizedTagName);

      let nextTags = state.tags;
      if (action === 'add' && !hasTagInSidebar) {
        nextTags = [
          ...state.tags,
          {
            id: makeTagId(normalizedTagName) || `tag-${Date.now()}`,
            name: normalizedTagName,
            selected: false,
            mediaCount: 0
          }
        ];
      }

      // 移除标签时不再自动删除标签，即使该标签下没有媒体了
      // 标签只能通过 Sidebar 中的删除按钮手动删除

      return {
        mediaItems: nextMediaItems,
        tags: nextTags
      };
    }),
  toggleFavorite: (mediaId) =>
    set((state) => ({
      mediaItems: state.mediaItems.map((item) =>
        item.id === mediaId
          ? {
            ...item,
            isFavorite: !item.isFavorite
          }
          : item
      )
    })),
  deleteMedia: (mediaId) =>
    set((state) => {
      const nextMediaItems = state.mediaItems.filter((item) => item.id !== mediaId);
      // 不再自动删除标签，标签只能通过 Sidebar 中的删除按钮手动删除

      return {
        mediaItems: nextMediaItems,
        selectedMediaId: state.selectedMediaId === mediaId ? '' : state.selectedMediaId,
        tags: state.tags
      };
    }),
  setMediaItemsFromDb: (items) =>
    set((state) => {
      const previousById = new Map(state.mediaItems.map((item) => [item.id, item]));
      const merged = items.map((item) => {
        const previous = previousById.get(item.id);
        if (!previous) {
          return item;
        }
        return {
          ...item,
          isRecent: previous.isRecent
        };
      });

      return {
        mediaItems: merged,
        selectedMediaId: merged.some((item) => item.id === state.selectedMediaId) ? state.selectedMediaId : ''
      };
    }),
  setTagsFromDb: (items) =>
    set((state) => {
      const selectedByName = new Set(state.tags.filter((tag) => tag.selected).map((tag) => tag.name));
      return {
        tags: items.map((item) => ({
          id: String(item.id),
          name: item.name,
          selected: selectedByName.has(item.name),
          mediaCount: item.mediaCount ?? 0
        }))
      };
    }),
  addTagToMediaLocal: (mediaId, tagName) =>
    set((state) => {
      const normalized = tagName.trim();
      if (!normalized) {
        return state;
      }

      let shouldIncreaseTagCount = false;
      const nextMediaItems = state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }
        if (item.tags.includes(normalized)) {
          return item;
        }
        shouldIncreaseTagCount = true;
        return {
          ...item,
          tags: [...item.tags, normalized]
        };
      });

      if (!shouldIncreaseTagCount) {
        return state;
      }

      let hasTag = false;
      const nextTags = state.tags.map((tag) => {
        if (tag.name !== normalized) {
          return tag;
        }
        hasTag = true;
        return {
          ...tag,
          mediaCount: (tag.mediaCount ?? 0) + 1
        };
      });

      return {
        mediaItems: nextMediaItems,
        tags: hasTag
          ? nextTags
          : [
            ...nextTags,
            {
              id: makeTagId(normalized) || `tag-${Date.now()}`,
              name: normalized,
              selected: false,
              mediaCount: 1
            }
          ]
      };
    }),
  removeTagFromMediaLocal: (mediaId, tagName) =>
    set((state) => {
      const normalized = tagName.trim();
      if (!normalized) {
        return state;
      }

      let removed = false;
      const nextMediaItems = state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }
        if (!item.tags.includes(normalized)) {
          return item;
        }
        removed = true;
        return {
          ...item,
          tags: item.tags.filter((tag) => tag !== normalized)
        };
      });

      if (!removed) {
        return state;
      }

      const nextTags = state.tags.map((tag) =>
        tag.name === normalized
          ? {
            ...tag,
            mediaCount: Math.max(0, (tag.mediaCount ?? 0) - 1)
          }
          : tag
      );

      return {
        mediaItems: nextMediaItems,
        tags: nextTags
      };
    }),
  markMediaViewedLocal: (mediaId, viewedAt) =>
    set((state) => ({
      mediaItems: state.mediaItems.map((item) =>
        item.id === mediaId
          ? {
            ...item,
            isRecent: true,
            recentViewedAt: viewedAt
          }
          : item
      )
    })),
  setShowMediaName: (show) => {
    localStorage.setItem('showMediaName', show ? 'true' : 'false');
    set({ showMediaName: show });
  },
  setShowMediaTags: (show) => {
    localStorage.setItem('showMediaTags', show ? 'true' : 'false');
    set({ showMediaTags: show });
  }
}));
