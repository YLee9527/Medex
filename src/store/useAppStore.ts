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
};

const initialNavItems: SidebarNavItem[] = [
  { id: 'all-media', label: 'All Media', active: true },
  { id: 'favorites', label: 'Favorites', active: false },
  { id: 'recent', label: 'Recent', active: false }
];

const initialTags: SidebarTagItem[] = [
  { id: 'ui', name: 'UI', selected: false, mediaCount: 0 },
  { id: 'assets', name: '素材', selected: false, mediaCount: 0 },
  { id: 'cat', name: '猫', selected: false, mediaCount: 0 },
  { id: 'night', name: '夜晚', selected: false, mediaCount: 0 }
];

const initialMediaItems: MediaItem[] = [
  {
    id: 'media-1',
    path: '/placeholder/media-1.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    filename: 'city-night-clip.mp4',
    tags: ['夜晚', '城市', '素材'],
    time: '2026-03',
    mediaType: 'mp4',
    duration: '00:32',
    resolution: '1920x1080',
    isFavorite: true,
    isRecent: true
  },
  {
    id: 'media-2',
    path: '/placeholder/media-2.jpg',
    thumbnail: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
    filename: 'cat-closeup.jpg',
    tags: ['猫', '宠物', 'UI'],
    time: '2026-03',
    mediaType: 'jpg',
    duration: '00:08',
    resolution: '1920x1080',
    isFavorite: false,
    isRecent: true
  },
  {
    id: 'media-3',
    path: '/placeholder/media-3.png',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    filename: 'dashboard-reference.png',
    tags: ['UI', '设计', '参考'],
    time: '2026-02',
    mediaType: 'png',
    duration: '00:00',
    resolution: '2560x1440',
    isFavorite: true,
    isRecent: false
  },
  {
    id: 'media-4',
    path: '/placeholder/media-4.mov',
    thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    filename: 'forest-atmosphere.mov',
    tags: ['自然', '夜晚', '素材'],
    time: '2026-01',
    mediaType: 'mov',
    duration: '01:12',
    resolution: '3840x2160',
    isFavorite: false,
    isRecent: false
  }
];

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
    }))
}));
