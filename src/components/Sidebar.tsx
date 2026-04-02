const navItems = ['Library', 'Recent', 'Favorites'];
const tags = ['Video', 'Audio', 'Image', 'Document'];

export default function Sidebar() {
  return (
    <aside className="w-[240px] shrink-0 border-r border-white/10 bg-medexSidebar p-4 text-medexText">
      <div className="mb-8 rounded border border-white/10 p-3">
        <h1 className="text-xl font-semibold tracking-wide">Medex</h1>
        <p className="mt-1 text-xs text-white/60">Media Management</p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs uppercase tracking-wider text-white/60">Navigation</h2>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item} className="rounded border border-white/10 px-3 py-2 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-white/60">Tags</h2>
        <ul className="space-y-2">
          {tags.map((tag) => (
            <li key={tag} className="rounded border border-white/10 px-3 py-2 text-sm text-white/80">
              #{tag}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
