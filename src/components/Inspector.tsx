import { MediaCardProps } from './MediaCard';

export interface InspectorProps {
  media: MediaCardProps | null;
  onTagChange: (tagId: string, action: 'add' | 'remove') => void;
  onToggleFavorite: (mediaId: string) => void;
  onDeleteMedia: (mediaId: string) => void;
}

export default function Inspector({ media, onTagChange, onToggleFavorite, onDeleteMedia }: InspectorProps) {
  const handleRemoveTag = (tagId: string) => {
    console.log('inspector tag change:', tagId, 'remove');
    onTagChange(tagId, 'remove');
  };

  const handleAddTag = () => {
    const value = window.prompt('请输入新标签');
    const tagValue = value?.trim();
    if (!tagValue) {
      return;
    }
    console.log('inspector tag change:', tagValue, 'add');
    onTagChange(tagValue, 'add');
  };

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-[#1E1E1E] p-4 text-[#EAEAEA]">
      <h2 className="mb-4 text-base font-medium">Inspector</h2>

      {!media ? (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-white/20 p-4 text-sm text-white/70">
          请选择一个媒体查看详情
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-lg border border-white/10 p-3">
          <div className="group relative aspect-video w-full overflow-hidden rounded-md bg-black/30">
            {media.thumbnail ? (
              <img
                src={media.thumbnail}
                alt={media.filename}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-white/60">No Preview</div>
            )}
          </div>

          <div>
            <p className="text-[14px] leading-5 text-[#EAEAEA]">{media.filename}</p>
          </div>

          <div>
            <p className="mb-2 text-xs text-white/70">标签：</p>
            <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
              {media.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-[6px] bg-[#444444] px-2 py-1 text-[12px] leading-4 text-white hover:bg-[#555555]"
                  title="点击删除标签"
                >
                  #{tag}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddTag}
                className="rounded-[6px] bg-[#444444] px-2 py-1 text-[12px] leading-4 text-white hover:bg-[#555555]"
              >
                + 添加
              </button>
            </div>
          </div>

          <div className="text-xs text-white/70">
            <p className="mb-2">信息：</p>
            <ul className="space-y-1">
              <li>- 时长：{media.duration ?? '--:--'}</li>
              <li>- 分辨率：{media.resolution ?? '未知'}</li>
            </ul>
          </div>

          <div className="mt-auto">
            <p className="mb-2 text-xs text-white/70">操作：</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  console.log('inspector favorite toggle:', media.id);
                  onToggleFavorite(media.id);
                }}
                className="rounded-md bg-[#444444] px-3 py-2 text-left text-sm text-white hover:bg-[#555555]"
              >
                ⭐ 收藏
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('inspector delete media:', media.id);
                  onDeleteMedia(media.id);
                }}
                className="rounded-md bg-red-700/80 px-3 py-2 text-left text-sm text-white hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
