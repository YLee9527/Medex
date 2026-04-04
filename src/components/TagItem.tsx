import { SidebarTagItem } from '../store/useAppStore';

type TagItemProps = {
  tag: SidebarTagItem;
  onTagClick: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;
};

export default function TagItem({ tag, onTagClick, onDeleteTag }: TagItemProps) {
  const canDelete = tag.selected && (tag.mediaCount ?? 0) === 0;

  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onTagClick(tag.id)}
        className={`min-w-0 flex-1 rounded px-3 py-2 text-left text-sm transition-colors ${
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
