import { create } from 'zustand';

export type DraggingTag = {
  tagId: number;
  tagName: string;
};

type TagDragState = {
  draggingTag: DraggingTag | null;
  pointerX: number;
  pointerY: number;
  startDrag: (tag: DraggingTag, x: number, y: number) => void;
  moveDrag: (x: number, y: number) => void;
  endDrag: () => void;
};

export const useTagDragStore = create<TagDragState>((set) => ({
  draggingTag: null,
  pointerX: 0,
  pointerY: 0,
  startDrag: (tag, x, y) =>
    set({
      draggingTag: tag,
      pointerX: x,
      pointerY: y
    }),
  moveDrag: (x, y) =>
    set((state) => {
      if (!state.draggingTag) {
        return state;
      }
      return {
        pointerX: x,
        pointerY: y
      };
    }),
  endDrag: () =>
    set({
      draggingTag: null
    })
}));
