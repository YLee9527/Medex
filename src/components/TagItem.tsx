import { SidebarTagItem } from '../store/useAppStore';
import { ThemeColors } from '../theme/theme';
import { useI18n } from '../contexts/I18nContext';

type TagItemProps = {
  tag: SidebarTagItem;
  onTagClick: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;
  theme: ThemeColors;
};

export default function TagItem({ tag, onTagClick, onDeleteTag, theme }: TagItemProps) {
  const { t } = useI18n();
  const canDelete = (tag.mediaCount ?? 0) === 0;

  return (
    <div
      className="group relative inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors"
      style={{
        backgroundColor: tag.selected ? theme.selected : 'transparent',
        color: tag.selected ? theme.text : theme.textSecondary,
      }}
      onClick={() => onTagClick(tag.id)}
      title={`${tag.name} (${t('tag.mediaCount')}: ${tag.mediaCount ?? 0})`}
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
      {/* 标签名称 */}
      <span className="max-w-[150px] truncate">#{tag.name}</span>

      {/* 删除按钮：仅当标签下没有媒体时显示 */}
      {canDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteTag(tag.id);
          }}
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100"
          style={{
            backgroundColor: theme.tagHover,
            color: theme.textSecondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EF4444';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.tagHover;
            e.currentTarget.style.color = theme.textSecondary;
          }}
          aria-label={t('actions.deleteTag')}
          title={t('actions.deleteTag')}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
