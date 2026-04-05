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
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
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
  theme,
  themeMode,
  onToggleTheme
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

      {/* 主题切换按钮 */}
      <section className="mt-8 border-t pt-4" style={{ borderColor: theme.borderLight }}>
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex w-full items-center justify-center rounded-md px-3 py-2 text-xs transition-colors"
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
          {themeMode === 'dark' ? (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              浅色主题
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              深色主题
            </>
          )}
        </button>
      </section>
    </aside>
  );
}
