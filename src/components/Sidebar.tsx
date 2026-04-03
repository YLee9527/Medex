import { SidebarNavItem, SidebarTagItem } from '../store/useAppStore';
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
}

export default function Sidebar({
  navItems,
  tags,
  newTagName,
  onNewTagNameChange,
  onCreateTag,
  onDeleteTag,
  onTagClick,
  onNavClick
}: SidebarProps) {
  return (
    <aside className="h-full w-[240px] shrink-0 overflow-y-auto border-r border-white/10 bg-[#1E1E1E] p-4 text-[#EAEAEA]">
      <div className="mb-8 rounded border border-white/10 p-3">
        <h1 className="text-xl font-semibold tracking-wide">Medex</h1>
        <p className="mt-1 text-xs text-white/60">Media Management</p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs uppercase tracking-wider text-white/60">Navigation</h2>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavClick(item.id)}
                className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                  item.active
                    ? 'border-white/20 bg-[#444444] text-[#EAEAEA]'
                    : 'border-white/10 text-white/85 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-white/60">Tags</h2>

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
            className="rounded-md border border-white/15 bg-black/20 px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/40 focus:border-white/30"
          />
          <button
            type="button"
            onClick={onCreateTag}
            className="rounded-md bg-[#444444] px-2 py-1.5 text-xs text-white hover:bg-[#555555]"
          >
            新增
          </button>
        </div>

        <ul className="space-y-2">
          {tags.map((tag) => (
            <TagItem key={tag.id} tag={tag} onTagClick={onTagClick} onDeleteTag={onDeleteTag} />
          ))}
        </ul>
      </section>
    </aside>
  );
}
