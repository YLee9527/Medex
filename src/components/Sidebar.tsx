import { SidebarNavItem, SidebarTagItem } from '../store/useAppStore';

export interface SidebarProps {
  navItems: SidebarNavItem[];
  tags: SidebarTagItem[];
  onTagClick: (tagId: string) => void;
  onNavClick: (navId: string) => void;
}

export default function Sidebar({
  navItems,
  tags,
  onTagClick,
  onNavClick
}: SidebarProps) {
  return (
    <aside className="h-[calc(100vh-24px)] w-[240px] shrink-0 border-r border-white/10 bg-[#1E1E1E] p-4 text-[#EAEAEA]">
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
        <ul className="space-y-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => onTagClick(tag.id)}
                className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                  tag.selected
                    ? 'bg-[#444444] text-[#EAEAEA]'
                    : 'bg-transparent text-white/80 hover:bg-white/10'
                }`}
              >
                #{tag.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
