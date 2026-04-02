import Toolbar from '../components/Toolbar';
import { useAppStore } from '../store/useAppStore';

export default function ToolbarContainer() {
  const tags = useAppStore((state) => state.tags);
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);

  const activeTags = tags.filter((tag) => tag.selected).map((tag) => tag.name);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    console.log('toolbar view mode:', mode);
    setViewMode(mode);
  };

  return <Toolbar activeTags={activeTags} viewMode={viewMode} onViewModeChange={handleViewModeChange} />;
}
