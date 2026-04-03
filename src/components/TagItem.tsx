import { useDrag } from 'react-dnd';
import { SidebarTagItem } from '../store/useAppStore';
import { useTagDragStore } from '../store/useTagDragStore';

export const DND_TAG_TYPE = 'TAG';

export type DragTagItem = {
  type: typeof DND_TAG_TYPE;
  tagId: number;
  tagName: string;
};

type TagItemProps = {
  tag: SidebarTagItem;
  onTagClick: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;
};

export default function TagItem({ tag, onTagClick, onDeleteTag }: TagItemProps) {
  const startDrag = useTagDragStore((state) => state.startDrag);
  const moveDrag = useTagDragStore((state) => state.moveDrag);
  const endDrag = useTagDragStore((state) => state.endDrag);
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DND_TAG_TYPE,
    item: {
      type: DND_TAG_TYPE,
      tagId: Number(tag.id) || 0,
      tagName: tag.name
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [tag.id, tag.name]);

  const canDelete = tag.selected && (tag.mediaCount ?? 0) === 0;

  return (
    <li className={`flex items-center gap-2 ${isDragging ? 'opacity-45' : 'opacity-100'}`}>
      <button
        ref={dragRef}
        type="button"
        onMouseDown={(event) => {
          startDrag(
            {
              tagId: Number(tag.id) || 0,
              tagName: tag.name
            },
            event.clientX,
            event.clientY
          );

          const onMove = (moveEvent: MouseEvent) => {
            moveDrag(moveEvent.clientX, moveEvent.clientY);
          };
          const onUp = () => {
            endDrag();
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };

          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
        draggable
        onDragStart={(event) => {
          const payload = JSON.stringify({
            tagId: Number(tag.id) || 0,
            tagName: tag.name
          });
          event.dataTransfer.setData(
            'application/x-medex-tag',
            payload
          );
          event.dataTransfer.setData('text/plain', payload);
          event.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={() => onTagClick(tag.id)}
        className={`min-w-0 flex-1 cursor-grab rounded px-3 py-2 text-left text-sm transition-colors active:cursor-grabbing ${
          tag.selected ? 'bg-[#444444] text-[#EAEAEA]' : 'bg-transparent text-white/80 hover:bg-white/10'
        }`}
        title={`${tag.name}（媒体数：${tag.mediaCount ?? 0}）`}
      >
        <span className="block truncate">#{tag.name}</span>
      </button>

      {canDelete ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteTag(tag.id);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-300"
          aria-label="删除标签"
          title="删除标签"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M7 6l1 14h8l1-14" />
            <path d="M10 10v7M14 10v7" />
          </svg>
        </button>
      ) : null}
    </li>
  );
}
