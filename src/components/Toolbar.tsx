export interface ToolbarProps {
  activeTags: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSelectFolder: () => void;
  loading?: boolean;
}

export default function Toolbar({
  activeTags,
  viewMode,
  onViewModeChange,
  onSelectFolder,
  loading = false
}: ToolbarProps) {
  return (
    <div className="flex h-[60px] items-center justify-between gap-3 rounded-md bg-[#242424] px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-y-auto">
        {activeTags.length > 0 ? (
          activeTags.map((tag) => (
            <span key={tag} className="rounded-[6px] bg-[#444444] px-2 py-1 text-[12px] leading-4 text-white">
              #{tag}
            </span>
          ))
        ) : (
          <span className="text-[12px] text-white/60">未选择标签</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSelectFolder}
          disabled={loading}
          className="rounded-[6px] bg-[#444444] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#555555] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '扫描中...' : '选择文件夹'}
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          className={`flex h-8 w-8 items-center justify-center rounded-[6px] text-white transition-colors ${
            viewMode === 'grid' ? 'bg-[#444444] text-white' : 'bg-transparent text-white/70 hover:bg-[#555555]'
          }`}
          aria-label="Grid View"
          aria-pressed={viewMode === 'grid'}
          title="Grid"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={`flex h-8 w-8 items-center justify-center rounded-[6px] text-white transition-colors ${
            viewMode === 'list' ? 'bg-[#444444] text-white' : 'bg-transparent text-white/70 hover:bg-[#555555]'
          }`}
          aria-label="List View"
          aria-pressed={viewMode === 'list'}
          title="List"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
