import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Sidebar from '../components/Sidebar';
import { DbTagItem, useAppStore } from '../store/useAppStore';

export default function SidebarContainer() {
  const navItems = useAppStore((state) => state.navItems);
  const tags = useAppStore((state) => state.tags);
  const clickNav = useAppStore((state) => state.clickNav);
  const clickTag = useAppStore((state) => state.clickTag);
  const setTagsFromDb = useAppStore((state) => state.setTagsFromDb);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    const loadTags = async () => {
      try {
        const rows = await invoke<DbTagItem[]>('get_all_tags_with_count');
        setTagsFromDb(rows);
      } catch (error) {
        console.error('[sidebar] get_all_tags_with_count failed:', error);
      }
    };

    void loadTags();

    const onTagsUpdated = () => {
      void loadTags();
    };
    window.addEventListener('medex:tags-updated', onTagsUpdated);
    return () => window.removeEventListener('medex:tags-updated', onTagsUpdated);
  }, [setTagsFromDb]);

  const handleCreateTag = async () => {
    const normalized = newTagName.trim();
    if (!normalized) {
      return;
    }

    try {
      await invoke('create_tag', { tagName: normalized });
      setNewTagName('');
      const rows = await invoke<DbTagItem[]>('get_all_tags_with_count');
      setTagsFromDb(rows);
      window.dispatchEvent(new Event('medex:tags-updated'));
    } catch (error) {
      console.error('[sidebar] create_tag failed:', error);
      window.alert(`新增标签失败：${String(error)}`);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await invoke('delete_tag', { tagId: Number(tagId) });
      const rows = await invoke<DbTagItem[]>('get_all_tags_with_count');
      setTagsFromDb(rows);
      window.dispatchEvent(new Event('medex:tags-updated'));
    } catch (error) {
      console.error('[sidebar] delete_tag failed:', error);
      window.alert(`删除标签失败：${String(error)}`);
    }
  };

  return (
    <Sidebar
      navItems={navItems}
      tags={tags}
      newTagName={newTagName}
      onNewTagNameChange={setNewTagName}
      onCreateTag={handleCreateTag}
      onDeleteTag={handleDeleteTag}
      onNavClick={clickNav}
      onTagClick={clickTag}
    />
  );
}
