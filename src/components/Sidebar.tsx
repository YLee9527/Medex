import { SidebarNavItem, SidebarTagItem } from '../store/useAppStore';

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
          {tags.map((tag) => {
            const canDelete = tag.selected && (tag.mediaCount ?? 0) === 0;
            return (
              <li key={tag.id} className="flex items-center gap-2">
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
                    onClick={() => onDeleteTag(tag.id)}
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
          })}
        </ul>
      </section>
    </aside>
  );
}
