import { SidebarNavItem, SidebarTagItem } from '../store/useAppStore';
import { ThemeColors } from '../theme/theme';
import TagItem from './TagItem';

export interface SidebarProps {
  navItems: SidebarNavItem[];
  tags: SidebarTagItem[];
  newTagName: string;
  onNewTagNameChange: (value: string) => void;
  onCreateTag: () => void;
  onDeleteTag: (tagId: string) => void;
  onTagClick: (tagId: string) => void;
  onNavClick: (navId: string) => void;
  theme: ThemeColors;
}

export default function Sidebar({
  navItems,
  tags,
  newTagName,
  onNewTagNameChange,
  onCreateTag,
  onDeleteTag,
  onTagClick,
  onNavClick,
  theme
}: SidebarProps) {
  return (
    <aside 
      className="h-full w-[240px] shrink-0 overflow-y-auto p-4"
      style={{ 
        backgroundColor: theme.sidebar,
        color: theme.text,
        borderRight: `1px solid ${theme.borderLight}`
      }}
    >
      <div className="mb-8 rounded border p-3" style={{ borderColor: theme.borderLight }}>
        <h1 className="text-xl font-semibold tracking-wide">Medex</h1>
        <p className="mt-1 text-xs" style={{ color: theme.textTertiary }}>Media Management</p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs uppercase tracking-wider" style={{ color: theme.textTertiary }}>Navigation</h2>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavClick(item.id)}
                className="w-full rounded border px-3 py-2 text-left text-sm transition-colors"
                style={{
                  borderColor: item.active ? theme.border : theme.borderLight,
                  backgroundColor: item.active ? theme.active : 'transparent',
                  color: item.active ? theme.text : theme.textSecondary,
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = theme.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider" style={{ color: theme.textTertiary }}>Tags</h2>

        <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => onNewTagNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onCreateTag();
              }
            }}
            placeholder="新增标签"
            className="rounded-md px-2 py-1.5 text-xs outline-none transition-colors"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.text,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.inputFocusBorder;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.inputBorder;
            }}
            onMouseEnter={(e) => {
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.style.backgroundColor = theme.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.style.backgroundColor = theme.inputBg;
              }
            }}
          />
          <button
            type="button"
            onClick={onCreateTag}
            className="rounded-md px-2 py-1.5 text-xs text-white transition-colors"
            style={{
              backgroundColor: theme.buttonBg,
              color: theme.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.buttonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.buttonBg;
            }}
          >
            新增
          </button>
        </div>

        <ul className="space-y-2">
          {tags.map((tag) => (
            <TagItem 
              key={tag.id} 
              tag={tag} 
              onTagClick={onTagClick} 
              onDeleteTag={onDeleteTag}
              theme={theme}
            />
          ))}
        </ul>
      </section>
    </aside>
  );
}
