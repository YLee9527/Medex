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
  thumbnail: string;
  filename: string;
  tags: string[];
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
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    filename: 'city-night-clip.mp4',
    tags: ['夜晚', '城市', '素材']
  },
  {
    id: 'media-2',
    thumbnail: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
    filename: 'cat-closeup.jpg',
    tags: ['猫', '宠物', 'UI']
  },
  {
    id: 'media-3',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    filename: 'dashboard-reference.png',
    tags: ['UI', '设计', '参考']
  },
  {
    id: 'media-4',
    thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    filename: 'forest-atmosphere.mov',
    tags: ['自然', '夜晚', '素材']
  }
];

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

      return {
        mediaItems: state.mediaItems.map((item) => {
          if (item.id !== state.selectedMediaId) {
            return item;
          }

          if (action === 'add') {
            if (!tagId || item.tags.includes(tagId)) {
              return item;
            }

            return {
              ...item,
              tags: [...item.tags, tagId]
            };
          }

          return {
            ...item,
            tags: item.tags.filter((tag) => tag !== tagId)
          };
        })
      };
    })
}));
