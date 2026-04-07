import { ThemeColors } from '../theme/theme';
import { useI18n } from '../contexts/I18nContext';

export interface ToolbarProps {
  activeTags: string[];
  resultCount: number;
  mediaType: 'all' | 'image' | 'video';
  onMediaTypeChange: (mode: 'all' | 'image' | 'video') => void;
  loading?: boolean;
  theme: ThemeColors;
}

export default function Toolbar({
  activeTags,
  resultCount,
  mediaType,
  onMediaTypeChange,
  loading = false,
  theme
}: ToolbarProps) {
  const { t } = useI18n();
  return (
    <div 
      className="flex h-[60px] items-center justify-between gap-3 rounded-md px-3 py-2"
      style={{ backgroundColor: theme.toolbar }}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-y-auto">
        {activeTags.length > 0 ? (
          activeTags.map((tag) => (
            <span 
              key={tag} 
              className="rounded-[6px] px-2 py-1 text-[12px] leading-4"
              style={{ backgroundColor: theme.tagBg, color: theme.text }}
            >
              #{tag}
            </span>
          ))
        ) : (
          <span className="text-[12px]" style={{ color: theme.textTertiary }}>{t('toolbar.noTagsSelected')}</span>
        )}
        <span className="ml-2 text-[12px]" style={{ color: theme.textTertiary }}>{t('toolbar.resultsPrefix')}{resultCount}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-[6px] p-1" style={{ backgroundColor: theme.inputBg }}>
          {(['all', 'image', 'video'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onMediaTypeChange(mode)}
              className="rounded-[6px] px-2 py-1 text-xs transition-colors"
              style={{
                backgroundColor: mediaType === mode ? theme.active : 'transparent',
                color: mediaType === mode ? theme.text : theme.textSecondary,
              }}
              onMouseEnter={(e) => {
                if (mediaType !== mode) {
                  e.currentTarget.style.backgroundColor = theme.tagHover;
                  e.currentTarget.style.color = theme.text;
                }
              }}
              onMouseLeave={(e) => {
                if (mediaType !== mode) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.textSecondary;
                }
              }}
            >
              {mode === 'all' ? t('filter.all') : mode === 'image' ? t('filter.image') : t('filter.video')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
