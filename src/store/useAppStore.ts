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
};

export type DbMediaItem = {
  id: number;
  path: string;
  filename: string;
  type: string;
};

export type DbTagItem = {
  id: number;
  name: string;
};

type AppState = {
  navItems: SidebarNavItem[];
  tags: SidebarTagItem[];
  mediaItems: MediaItem[];
  selectedMediaId: string;
  viewMode: 'grid' | 'list';
  clickNav: (navId: string) => void;
  clickTag: (tagId: string) => void;
  clickMedia: (mediaId: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  changeSelectedMediaTag: (tagId: string, action: 'add' | 'remove') => void;
  toggleFavorite: (mediaId: string) => void;
  deleteMedia: (mediaId: string) => void;
  setMediaItemsFromDb: (items: MediaItem[]) => void;
  setTagsFromDb: (items: DbTagItem[]) => void;
};

const initialNavItems: SidebarNavItem[] = [
  { id: 'all-media', label: 'All Media', active: true },
  { id: 'favorites', label: 'Favorites', active: false },
  { id: 'recent', label: 'Recent', active: false }
];

const initialTags: SidebarTagItem[] = [
  { id: 'ui', name: 'UI', selected: false },
  { id: 'assets', name: '素材', selected: false },
  { id: 'cat', name: '猫', selected: false },
  { id: 'night', name: '夜晚', selected: false }
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

      const tagStillUsed = nextMediaItems.some((item) => item.tags.includes(normalizedTagName));
      const hasTagInSidebar = state.tags.some((tag) => tag.name === normalizedTagName);

      let nextTags = state.tags;
      if (action === 'add' && !hasTagInSidebar) {
        nextTags = [
          ...state.tags,
          {
            id: makeTagId(normalizedTagName) || `tag-${Date.now()}`,
            name: normalizedTagName,
            selected: false
          }
        ];
      }

      if (action === 'remove' && !tagStillUsed) {
        nextTags = nextTags.filter((tag) => tag.name !== normalizedTagName);
      }

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
      const usedTagNames = new Set(nextMediaItems.flatMap((item) => item.tags));

      return {
        mediaItems: nextMediaItems,
        selectedMediaId: state.selectedMediaId === mediaId ? '' : state.selectedMediaId,
        tags: state.tags.filter((tag) => usedTagNames.has(tag.name))
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
          isFavorite: previous.isFavorite,
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
          selected: selectedByName.has(item.name)
        }))
      };
    })
}));
