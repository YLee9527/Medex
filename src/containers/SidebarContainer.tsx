import { useState } from 'react';
import Sidebar, { SidebarNavItem, SidebarTagItem } from '../components/Sidebar';

const initialNavItems: SidebarNavItem[] = [
  { id: 'all-media', label: 'All Media', active: true },
  { id: 'favorites', label: 'Favorites', active: false },
  { id: 'recent', label: 'Recent', active: false }
];

const initialTags: SidebarTagItem[] = [
  { id: 'ui', name: 'UI', selected: false },
  { id: 'assets', name: '素材', selected: false },
  { id: 'cat', name: '猫', selected: false },
  { id: 'night', name: '夜晚', selected: false }
];

export default function SidebarContainer() {
  const [navItems, setNavItems] = useState<SidebarNavItem[]>(initialNavItems);
  const [tags, setTags] = useState<SidebarTagItem[]>(initialTags);

  const handleNavClick = (navId: string) => {
    console.log('nav clicked:', navId);
    setNavItems((prev) =>
      prev.map((item) => ({
        ...item,
        active: item.id === navId
      }))
    );
  };

  const handleTagClick = (tagId: string) => {
    console.log('tag clicked:', tagId);
    setTags((prev) =>
      prev.map((tag) =>
        tag.id === tagId
          ? {
              ...tag,
              selected: !tag.selected
            }
          : tag
      )
    );
  };

  return <Sidebar navItems={navItems} tags={tags} onNavClick={handleNavClick} onTagClick={handleTagClick} />;
}
