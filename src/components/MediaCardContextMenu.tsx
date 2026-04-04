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
  const initialTagsRef = useRef<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });
  const [isClosing, setIsClosing] = useState(false);

  // 初始化选中状态（回显媒体已有标签）
  useEffect(() => {
    if (visible) {
      initialTagsRef.current = [...mediaTags];
      setSelectedTags([...mediaTags]);
      setSearchQuery('');
      setIsClosing(false);
    }
  }, [visible, mediaTags]);

  // 边界处理：防止菜单超出屏幕
  useEffect(() => {
    if (!visible) return;

    const menuWidth = 280;
    const menuHeight = Math.min(320, allTags.length * 36 + 80);
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

  // 关闭时自动提交
  const closeAndSubmit = useCallback(async () => {
    if (isClosing) return;
    setIsClosing(true);

    const added = selectedTags.filter((t) => !initialTagsRef.current.includes(t));
    const removed = initialTagsRef.current.filter((t) => !selectedTags.includes(t));

    if (added.length > 0 || removed.length > 0) {
      await applyTagChanges(added, removed);
    }

    onClose();
  }, [selectedTags, onClose, isClosing]);

  // 应用标签变化
  const applyTagChanges = async (added: string[], removed: string[]) => {
    if (!mediaId) return;

    const mediaIdNum = Number(mediaId);
    if (!Number.isFinite(mediaIdNum)) {
      console.error('[context-menu] invalid media id:', mediaId);
      return;
    }

    try {
      // 添加新选中的标签
      for (const tagName of added) {
        await invoke('add_tag_to_media', {
          mediaId: mediaIdNum,
          tagName
        });
      }

      // 移除取消选中的标签
      for (const tagName of removed) {
        const dbTags = await invoke<{ id: number; name: string }[]>('get_tags_by_media', {
          mediaId: mediaIdNum
        });
        const matched = dbTags.find((tag) => tag.name === tagName);
        if (matched) {
          await invoke('remove_tag_from_media', {
            mediaId: mediaIdNum,
            tagId: matched.id
          });
        }
      }

      onTagsApplied(mediaId, added, removed);
    } catch (error) {
      console.error('[context-menu] apply tags failed:', error);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        void closeAndSubmit();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void closeAndSubmit();
      }
    };

    // 延迟添加事件监听，避免立即触发关闭
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [visible, closeAndSubmit]);

  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  }, []);

  // 过滤标签（支持搜索）
  const filteredTags = allTags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-[280px] rounded-lg border border-white/10 bg-[#1E1E1E] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      style={{ top: adjustedPosition.y, left: adjustedPosition.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 标题 */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-white/50">标签</span>
        <span className="text-xs text-white/40">{selectedTags.length} 已选</span>
      </div>

      {/* 搜索框 */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="搜索标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none transition-all duration-150 focus:border-blue-500/50 focus:bg-white/10"
        />
      </div>

      {/* 标签列表 - Chip 风格 */}
      <div className="max-h-[240px] overflow-y-auto">
        {filteredTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filteredTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`
                    h-7 px-3 text-sm rounded-md cursor-pointer transition-all duration-150
                    active:scale-95
                    ${
                      isSelected
                        ? 'bg-blue-500 text-white hover:bg-blue-400'
                        : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12]'
                    }
                  `}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-white/40">
            {searchQuery ? '未找到匹配的标签' : '暂无标签'}
          </div>
        )}
      </div>
    </div>
  );
}
