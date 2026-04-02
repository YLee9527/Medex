import { create } from 'zustand';

type AppState = {
  selectedMedia: Record<string, unknown>;
  setSelectedMedia: (media: Record<string, unknown>) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedMedia: {},
  setSelectedMedia: (media) => set({ selectedMedia: media })
}));
