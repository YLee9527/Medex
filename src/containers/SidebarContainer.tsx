import Sidebar from '../components/Sidebar';
import { useAppStore } from '../store/useAppStore';

export default function SidebarContainer() {
  const navItems = useAppStore((state) => state.navItems);
  const tags = useAppStore((state) => state.tags);
  const clickNav = useAppStore((state) => state.clickNav);
  const clickTag = useAppStore((state) => state.clickTag);

  return <Sidebar navItems={navItems} tags={tags} onNavClick={clickNav} onTagClick={clickTag} />;
}
