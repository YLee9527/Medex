import { useTagDragStore } from '../store/useTagDragStore';

export default function TagDragOverlay() {
  const draggingTag = useTagDragStore((state) => state.draggingTag);
  const pointerX = useTagDragStore((state) => state.pointerX);
  const pointerY = useTagDragStore((state) => state.pointerY);

  if (!draggingTag) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-[999] rounded-[6px] border border-white/20 bg-[#444444] px-2 py-1 text-xs text-white shadow-lg"
      style={{ left: pointerX + 12, top: pointerY + 12 }}
    >
      #{draggingTag.tagName}
    </div>
  );
}
