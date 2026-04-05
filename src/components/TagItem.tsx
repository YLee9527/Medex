import { SidebarTagItem } from '../store/useAppStore';
import { ThemeColors } from '../theme/theme';

type TagItemProps = {
  tag: SidebarTagItem;
  onTagClick: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;
  theme: ThemeColors;
};

export default function TagItem({ tag, onTagClick, onDeleteTag, theme }: TagItemProps) {
  const canDelete = tag.selected && (tag.mediaCount ?? 0) === 0;

  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onTagClick(tag.id)}
        className="min-w-0 flex-1 rounded px-3 py-2 text-left text-sm transition-colors"
        style={{
          backgroundColor: tag.selected ? theme.selected : 'transparent',
          color: tag.selected ? theme.text : theme.textSecondary,
        }}
        title={`${tag.name}（媒体数：${tag.mediaCount ?? 0}）`}
        onMouseEnter={(e) => {
          if (!tag.selected) {
            e.currentTarget.style.backgroundColor = theme.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!tag.selected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
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
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#FCA5A5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
          }}
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
