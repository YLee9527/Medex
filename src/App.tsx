import { useEffect, useMemo, useState } from 'react';
import Main from './components/Main';
import SidebarContainer from './containers/SidebarContainer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TagDragOverlay from './components/TagDragOverlay';
import MediaViewer from './components/MediaViewer';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const navItems = useAppStore((state) => state.navItems);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeNavId = navItems.find((item) => item.active)?.id ?? 'all-media';
  const viewerMediaList = useMemo(() => {
    return mediaItems.filter((item) => {
      if (activeNavId === 'favorites') {
        return item.isFavorite;
      }
      if (activeNavId === 'recent') {
        return item.isRecent;
      }
      return true;
    });
  }, [activeNavId, mediaItems]);

  const handleOpenViewer = (mediaId: string) => {
    const index = viewerMediaList.findIndex((item) => item.id === mediaId);
    if (index < 0) return;
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
  };

  useEffect(() => {
    if (!viewerOpen) return;
    if (viewerMediaList.length === 0) {
      setViewerOpen(false);
      return;
    }
    if (currentIndex > viewerMediaList.length - 1) {
      setCurrentIndex(viewerMediaList.length - 1);
    }
  }, [viewerOpen, currentIndex, viewerMediaList.length]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen min-w-[1200px] overflow-hidden bg-medexMain text-medexText">
        <SidebarContainer />
        <Main onOpenViewer={handleOpenViewer} />
      </div>
      <TagDragOverlay />
      <MediaViewer
        open={viewerOpen}
        mediaList={viewerMediaList}
        currentIndex={currentIndex}
        onClose={handleCloseViewer}
        onChangeIndex={setCurrentIndex}
      />
    </DndProvider>
  );
}
