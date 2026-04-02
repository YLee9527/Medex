export interface MediaCardProps {
  id: string;
  thumbnail: string;
  filename: string;
  tags: string[];
  selected: boolean;
  onClick: (id: string) => void;
}

export default function MediaCard({
  id,
  thumbnail,
  filename,
  tags,
  selected,
  onClick
}: MediaCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`group w-[180px] overflow-hidden rounded-[8px] bg-[#242424] text-left text-[#EAEAEA] transition-colors ${
        selected ? 'border-2 border-blue-500' : 'border border-white/10 hover:border-white/20'
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={filename} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/25 text-xs text-white/60">
            No Preview
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0000004D] opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
              <path d="M8 6.5v11l9-5.5-9-5.5z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p className="max-h-10 overflow-hidden text-[14px] leading-5 text-[#EAEAEA]">{filename}</p>
        <div className="flex max-h-[56px] flex-wrap gap-1 overflow-y-auto">
          {tags.map((tag) => (
            <span key={tag} className="rounded bg-white/10 px-2 py-0.5 text-[12px] leading-4 text-white/80">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
