import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface Tag {
  id: number;
  name: string;
}

export interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  mediaId: string;
  mediaTags: string[];
  allTags: Tag[];
  onClose: () => void;
  onTagsApplied: (mediaId: string, addedTags: string[], removedTags: string[]) => void;
}

export default function MediaCardContextMenu({
  visible,
  x,
  y,
  mediaId,
  mediaTags,
  allTags,
  onClose,
  onTagsApplied
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  // 初始化选中状态（回显媒体已有标签）
  useEffect(() => {
    if (visible) {
      setSelectedTags([...mediaTags]);
      setSearchQuery('');
    }
  }, [visible, mediaTags]);

  // 边界处理：防止菜单超出屏幕
  useEffect(() => {
    if (!visible) return;

    const menuWidth = 280;
    const menuHeight = Math.min(400, allTags.length * 36 + 120);
    const padding = 16;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - menuHeight - padding;
    }
    if (adjustedX < padding) {
      adjustedX = padding;
    }
    if (adjustedY < padding) {
      adjustedY = padding;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [visible, x, y, allTags.length]);

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // 延迟添加事件监听，避免立即触发关闭
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }, []);

  const applyTags = useCallback(async () => {
    if (!mediaId) return;

    const mediaIdNum = Number(mediaId);
    if (!Number.isFinite(mediaIdNum)) {
      console.error('[context-menu] invalid media id:', mediaId);
      return;
    }

    const addedTags: string[] = [];
    const removedTags: string[] = [];

    try {
      // 添加新选中的标签
      for (const tagName of selectedTags) {
        if (!mediaTags.includes(tagName)) {
          await invoke('add_tag_to_media', {
            mediaId: mediaIdNum,
            tagName
          });
          addedTags.push(tagName);
        }
      }

      // 移除取消选中的标签
      for (const tagName of mediaTags) {
        if (!selectedTags.includes(tagName)) {
          // 需要先获取标签ID
          const dbTags = await invoke<{ id: number; name: string }[]>('get_tags_by_media', {
            mediaId: mediaIdNum
          });
          const matched = dbTags.find((tag) => tag.name === tagName);
          if (matched) {
            await invoke('remove_tag_from_media', {
              mediaId: mediaIdNum,
              tagId: matched.id
            });
            removedTags.push(tagName);
          }
        }
      }

      onTagsApplied(mediaId, addedTags, removedTags);
      onClose();
    } catch (error) {
      console.error('[context-menu] apply tags failed:', error);
      window.alert(`应用标签失败：${String(error)}`);
    }
  }, [mediaId, mediaTags, selectedTags, onTagsApplied, onClose]);

  // 过滤标签（支持搜索）
  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-[280px] rounded-lg border border-white/10 bg-[#1E1E1E] p-3 shadow-2xl"
      style={{ top: adjustedPosition.y, left: adjustedPosition.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 标题 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-white/90">选择标签</span>
        <span className="text-xs text-white/50">{selectedTags.length} 已选</span>
      </div>

      {/* 搜索框 */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="搜索标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-blue-500/50 focus:bg-white/10"
        />
      </div>

      {/* 标签列表 */}
      <div className="max-h-[240px] overflow-y-auto rounded-md border border-white/5 bg-black/20">
        {filteredTags.length > 0 ? (
          filteredTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.name);
            return (
              <label
                key={tag.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTag(tag.name)}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                />
                <span
                  className={`flex-1 text-sm ${
                    isSelected ? 'text-white' : 'text-white/70'
                  }`}
                >
                  {tag.name}
                </span>
                {isSelected && (
                  <svg
                    className="h-4 w-4 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </label>
            );
          })
        ) : (
          <div className="px-3 py-4 text-center text-sm text-white/40">
            {searchQuery ? '未找到匹配的标签' : '暂无标签'}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          取消
        </button>
        <button
          type="button"
          onClick={applyTags}
          disabled={selectedTags.length === 0 && mediaTags.length === 0}
          className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          确认
        </button>
      </div>
    </div>
  );
}
