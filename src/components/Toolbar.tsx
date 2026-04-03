export interface ToolbarProps {
  activeTags: string[];
  resultCount: number;
  mediaType: 'all' | 'image' | 'video';
  onMediaTypeChange: (mode: 'all' | 'image' | 'video') => void;
  onSelectFolder: () => void;
  loading?: boolean;
}

export default function Toolbar({
  activeTags,
  resultCount,
  mediaType,
  onMediaTypeChange,
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
        <span className="ml-2 text-[12px] text-white/60">结果：{resultCount}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-[6px] bg-black/20 p-1">
          {(['all', 'image', 'video'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onMediaTypeChange(mode)}
              className={`rounded-[6px] px-2 py-1 text-xs transition-colors ${
                mediaType === mode ? 'bg-[#444444] text-white' : 'text-white/70 hover:bg-[#555555] hover:text-white'
              }`}
            >
              {mode === 'all' ? 'All' : mode === 'image' ? 'Image' : 'Video'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSelectFolder}
          disabled={loading}
          className="rounded-[6px] bg-[#444444] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#555555] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '扫描中...' : '选择文件夹'}
        </button>
      </div>
    </div>
  );
}
