import { useState } from 'react';
import { MediaCardProps } from './MediaCard';

export interface InspectorProps {
  media: MediaCardProps | null;
  onTagChange: (tagId: string, action: 'add' | 'remove') => void;
}

export default function Inspector({ media, onTagChange }: InspectorProps) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    const tagValue = newTag.trim();
    if (!tagValue) {
      return;
    }

    console.log('inspector tag change:', tagValue, 'add');
    onTagChange(tagValue, 'add');
    setNewTag('');
  };

  const handleRemoveTag = (tagId: string) => {
    console.log('inspector tag change:', tagId, 'remove');
    onTagChange(tagId, 'remove');
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
          </div>

          <div className="mt-auto flex items-center gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag();
                }
              }}
              placeholder="新增标签"
              className="w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/40 focus:border-white/30"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="rounded-md bg-[#444444] px-3 py-2 text-[12px] text-white hover:bg-[#555555]"
            >
              添加
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
