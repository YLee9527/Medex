import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Sidebar from '../components/Sidebar';
import { DbTagItem, useAppStore } from '../store/useAppStore';

export default function SidebarContainer() {
  const navItems = useAppStore((state) => state.navItems);
  const tags = useAppStore((state) => state.tags);
  const clickNav = useAppStore((state) => state.clickNav);
  const clickTag = useAppStore((state) => state.clickTag);
  const setTagsFromDb = useAppStore((state) => state.setTagsFromDb);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const rows = await invoke<DbTagItem[]>('get_all_tags');
        setTagsFromDb(rows);
      } catch (error) {
        console.error('[sidebar] get_all_tags failed:', error);
      }
    };

    void loadTags();

    const onTagsUpdated = () => {
      void loadTags();
    };
    window.addEventListener('medex:tags-updated', onTagsUpdated);
    return () => window.removeEventListener('medex:tags-updated', onTagsUpdated);
  }, [setTagsFromDb]);

  return <Sidebar navItems={navItems} tags={tags} onNavClick={clickNav} onTagClick={clickTag} />;
}
